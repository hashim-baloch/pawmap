import { useRef, useState, useCallback, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  FeatureGroup,
  ZoomControl,
  Marker,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import Dialog from "./Dialog";
import SearchBox from "./SearchBox";
import {
  filterSightingsWithinRange,
  calculateCenter,
  calculateAdjustedRadius,
  calculateDistance,
  MAX_ROAMING_RANGES,
} from "../utils/animalRangeUtils";
import { useAnimals } from "./AnimalContext";
import "./Map.css";

const customMarkerIcons = {
  default: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    shadowSize: [41, 41],
  }),
  warning: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    shadowSize: [41, 41],
  }),
  info: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    shadowSize: [41, 41],
  }),
  danger: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    shadowSize: [41, 41],
  }),
  temporary: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    shadowSize: [41, 41],
  }),
  dog: new L.Icon({
    iconUrl: "https://cloud-qrwl9nfph-hack-club-bot.vercel.app/0dog__1_.svg",
    iconSize: [34, 30], // Icon width and height
    iconAnchor: [17, 30], // Center the anchor at the bottom of the icon
    popupAnchor: [0, -25], // Position popup above the icon
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    shadowSize: [36, 30], // Shadow matches icon size proportionally
    shadowAnchor: [15, 30], // Align shadow with the base of the icon
  }),

  cat: new L.Icon({
    iconUrl: "https://cloud-qrwl9nfph-hack-club-bot.vercel.app/1cat__1_.svg",
    iconSize: [39, 30], // Icon width and height
    iconAnchor: [19, 30], // Center the anchor at the bottom of the icon
    popupAnchor: [0, -25], // Position popup above the icon
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    shadowSize: [41, 31], // Shadow matches icon size proportionally
    shadowAnchor: [18, 30], // Align shadow with the base of the icon
  }),

  other: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    shadowSize: [41, 41],
  }),
};

// Function to generate a random color in HEX format
const getRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

function Map() {
  const [map, setMap] = useState(null);
  const { animals, createAnimal, updateAnimal } = useAnimals();

  // eslint-disable-next-line no-unused-vars
  const [mapLayers, setMapLayers] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [activeLayer, setActiveLayer] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [addingAnimal, setAddingAnimal] = useState(false);
  const [temporarySightings, setTemporarySightings] = useState([]);
  const [editingSighting, setEditingSighting] = useState(null);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const featureGroupRef = useRef(null);

  const handleLayerClick = useCallback((layer) => {
    setActiveLayer(layer);
    setIsEdit(true);
    setShowDialog(true);
  }, []);

  const handleLocationSelect = useCallback(
    ({ lat, lng, zoom }) => {
      if (map) {
        map.setView([lat, lng], zoom);
      }
    },
    [map]
  );

  const createSightingPopupContent = (index) => {
    return `
      <div class="popup-content">
        <h4>Sighting #${index + 1}</h4>
        <div class="sighting-controls">
          <button class="edit-sighting-btn">Edit Location</button>
          <button class="delete-sighting-btn">Delete</button>
        </div>
      </div>
    `;
  };

  const handleSightingEdit = (index) => {
    setEditingSighting(index);
    map.closePopup();
  };

  const handleSightingDelete = (index) => {
    setTemporarySightings((prev) => prev.filter((_, i) => i !== index));
    map.closePopup();
  };

  const bindSightingPopup = (marker, index) => {
    const popupContent = createSightingPopupContent(index);
    marker.bindPopup(popupContent);

    marker.on("popupopen", () => {
      const editBtn = document.querySelector(".edit-sighting-btn");
      const deleteBtn = document.querySelector(".delete-sighting-btn");

      if (editBtn) {
        editBtn.addEventListener("click", () => handleSightingEdit(index));
      }
      if (deleteBtn) {
        deleteBtn.addEventListener("click", () => handleSightingDelete(index));
      }
    });
  };

  const createPopupContent = (animalInfo) => {
    try {
      const info = JSON.parse(animalInfo);
      return `
      <div class="popup-content">
      <div class="carousel">
      <div class="carousel-slide">
      <img src="${
        info.coverImage || info.images[0]
      }" alt="Cover Image" class="carousel-image"/>
      <h4>${info.type.charAt(0).toUpperCase() + info.type.slice(1)} - ${
        info.breed
      }</h4>
      <button class="edit-button">Edit</button>
            </div>
            <div class="carousel-slide">
              <p><strong>Color:</strong> ${info.color}</p>
              <p><strong>Size:</strong> ${info.size}</p>
              <p><strong>Health Status:</strong> ${info.healthStatus}</p>
              <p><strong>Last Seen:</strong> ${new Date(
                info.lastSeen
              ).toLocaleDateString()}</p>
              ${
                info.incidents
                  ? `<p><strong>Notes:</strong> ${info.incidents}</p>`
                  : ""
              }
            </div>
            <div class="carousel-slide">
              ${
                info.images && info.images.length > 1
                  ? `<div class="additional-images">
                    ${info.images
                      .slice(1)
                      .map(
                        (img) =>
                          `<img src="${img}" alt="Additional Image" class="popup-image"/>`
                      )
                      .join("")}
                  </div>`
                  : ""
              }
              ${
                info.videos && info.videos.length > 0
                  ? `<div class="media-section">
                    <h5>Videos:</h5>
                    ${info.videos
                      .map(
                        (vid) =>
                          `<video controls class="popup-video">
                            <source src="${vid}" type="video/mp4">
                            Your browser does not support the video tag.
                          </video>`
                      )
                      .join("")}
                  </div>`
                  : ""
              }
            </div>
            <div class="carousel-navigation">
              <button class="prev-btn">&#10094;</button>
              <button class="next-btn">&#10095;</button>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error("Error parsing animal info:", error);
      return `
        <div class="popup-content">
          <p>${animalInfo}</p>
          <button class="edit-button">Edit</button>
        </div>
      `;
    }
  };
  const bindPopupToLayer = useCallback(
    (layer, info) => {
      const popupContent = createPopupContent(info);
      layer.bindPopup(popupContent);

      layer.on("popupopen", () => {
        const editButton = document.querySelector(".edit-button");
        if (editButton) {
          editButton.addEventListener("click", () => handleLayerClick(layer));
        }

        // Initialize Carousel
        const slides = document.querySelectorAll(".carousel-slide");
        const prevBtn = document.querySelector(".prev-btn");
        const nextBtn = document.querySelector(".next-btn");
        let currentSlide = 0;
        if (slides.length > 0) {
          slides.forEach((slide, index) => {
            slide.classList.remove("active");
            if (index === 0) {
              slide.classList.add("active");
            }
          });
        }
        const showSlide = (index) => {
          slides.forEach((slide) => slide.classList.remove("active"));
          if (slides[index]) {
            slides[index].classList.add("active");
          }
        };
        const showNextSlide = () => {
          currentSlide = (currentSlide + 1) % slides.length;
          showSlide(currentSlide);
        };
        const showPrevSlide = () => {
          currentSlide = (currentSlide - 1 + slides.length) % slides.length;
          showSlide(currentSlide);
        };
        if (nextBtn && slides.length > 1) {
          nextBtn.addEventListener("click", showNextSlide);
        }
        if (prevBtn && slides.length > 1) {
          prevBtn.addEventListener("click", showPrevSlide);
        }
        // Center the popup on the screen
        const popup = layer.getPopup();
        if (popup) {
          popup.once("open", () => {
            const popupContainer = document.querySelector(
              ".leaflet-popup-content-wrapper"
            );
            if (popupContainer) {
              popupContainer.style.display = "flex";
              popupContainer.style.justifyContent = "center";
              popupContainer.style.alignItems = "center";
            }
          });
        }

        // Ensure to remove event listeners when popup closes to prevent memory leaks
        layer.on("popupclose", () => {
          if (prevBtn) {
            prevBtn.removeEventListener("click", showPrevSlide);
          }
          if (nextBtn) {
            nextBtn.removeEventListener("click", showNextSlide);
          }
        });
      });
    },
    [handleLayerClick]
  );

  // Add fetchExistingData function
  const fetchExistingData = useCallback(async () => {
    try {
      const response = await fetch(
        "https://localhost:5003/api/animals/get/all"
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const animals = await response.json();
      animals.forEach((animal) => {
        const marker = L.marker([animal.latitude, animal.longitude], {
          icon: customMarkerIcons[animal.type] || customMarkerIcons.default,
        });
        marker.info = JSON.stringify(animal);
        bindPopupToLayer(marker, marker.info);
        featureGroupRef.current.addLayer(marker);

        const areaLayer = L.circle([animal.latitude, animal.longitude], {
          radius: animal.radius,
          color: animal.color,
          fillColor: animal.color,
          fillOpacity: 0.2,
          weight: 2,
        });
        featureGroupRef.current.addLayer(areaLayer);
        setMapLayers((prev) => [...prev, marker, areaLayer]);
      });
    } catch (error) {
      console.error("Error fetching existing data:", error);
    }
  }, [bindPopupToLayer, featureGroupRef, setMapLayers]);

  // Call fetchExistingData in useEffect
  useEffect(() => {
    if (map) {
      fetchExistingData();
    }
  }, [map, fetchExistingData]);

  // Modify handleDialogSubmit to include POST request
  // const handleDialogSubmit = async ({
  //   info,
  //   markerType,
  //   sightings,
  //   images,
  //   videos,
  // }) => {
  //   if (addingAnimal && sightings?.length >= 3) {
  //     try {
  //       const animalData = JSON.parse(info);
  //       animalData.images = images;
  //       animalData.videos = videos;
  //       const validSightings = filterSightingsWithinRange(
  //         sightings,
  //         animalData.type
  //       );

  //       if (validSightings.length < 3) {
  //         alert(
  //           "Some sightings were too far apart for this type of animal. Please add sightings closer together."
  //         );
  //         return;
  //       }

  //       const centerPoint = calculateCenter(validSightings);
  //       if (centerPoint) {
  //         const circleColor = getRandomColor();
  //         const areaLayer = L.circle([centerPoint.lat, centerPoint.lng], {
  //           radius: calculateAdjustedRadius(validSightings, animalData.type),
  //           fillColor: circleColor,
  //           fillOpacity: 0.2,
  //           weight: 2,
  //         });
  //         featureGroupRef.current.addLayer(areaLayer);

  //         let animalMarkerIcon = customMarkerIcons.default;
  //         switch (animalData.type) {
  //           case "dog":
  //             animalMarkerIcon = customMarkerIcons.dog;
  //             break;
  //           case "cat":
  //             animalMarkerIcon = customMarkerIcons.cat;
  //             break;
  //           case "other":
  //           default:
  //             animalMarkerIcon = customMarkerIcons.other;
  //             break;
  //         }

  //         const marker = L.marker([centerPoint.lat, centerPoint.lng], {
  //           icon: animalMarkerIcon,
  //         });
  //         marker.info = JSON.stringify(animalData);
  //         bindPopupToLayer(marker, marker.info);
  //         featureGroupRef.current.addLayer(marker);

  //         setMapLayers((prevLayers) => [...prevLayers, marker, areaLayer]);
  //         // Send POST request to server
  //         try {
  //           const response = await fetch(
  //             "https://your-server.com/api/animals",
  //             {
  //               method: "POST",
  //               headers: {
  //                 "Content-Type": "application/json",
  //               },
  //               body: JSON.stringify({
  //                 latitude: centerPoint.lat,
  //                 longitude: centerPoint.lng,
  //                 type: animalData.type,
  //                 breed: animalData.breed,
  //                 size: animalData.size,
  //                 healthStatus: animalData.healthStatus,
  //                 incidents: animalData.incidents,
  //                 lastSeen: animalData.lastSeen,
  //                 images: animalData.images,
  //                 videos: animalData.videos,
  //                 radius: calculateAdjustedRadius(
  //                   validSightings,
  //                   animalData.type
  //                 ),
  //                 color: circleColor,
  //               }),
  //             }
  //           );
  //           if (!response.ok) {
  //             throw new Error("Failed to save animal data");
  //           }

  //           const savedAnimal = await response.json();
  //           console.log("Animal data saved:", savedAnimal);
  //         } catch (postError) {
  //           console.error("Error saving animal data:", postError);
  //         }
  //       }
  //       setShowDialog(false);
  //     } catch (error) {
  //       console.error("Error processing animal data:", error);
  //       alert(
  //         "There was an error processing the animal data. Please try again."
  //       );
  //     }
  //   } else if (activeLayer) {
  //     if (activeLayer instanceof L.Marker && !isEdit) {
  //       activeLayer.setIcon(customMarkerIcons[markerType]);
  //     }
  //     activeLayer.info = info;
  //     bindPopupToLayer(activeLayer, info);
  //     if (!isEdit) {
  //       setMapLayers((prevLayers) => [...prevLayers, activeLayer]);
  //     }
  //     try {
  //       const response = await fetch(
  //         `https://your-server.com/api/animals/${activeLayer.id}`,
  //         {
  //           method: "PUT",
  //           headers: {
  //             "Content-Type": "application/json",
  //           },
  //           body: info,
  //         }
  //       );

  //       if (!response.ok) {
  //         throw new Error("Failed to update animal data");
  //       }

  //       const updatedAnimal = await response.json();
  //       console.log("Animal data updated:", updatedAnimal);
  //     } catch (updateError) {
  //       console.error("Error updating animal data:", updateError);
  //     }
  //     setShowDialog(false);
  //   }
  //   setAddingAnimal(false);
  //   setTemporarySightings([]);
  // };
  const handleDialogSubmit = async ({
    info,
    markerType,
    sightings,
    images,
    videos,
  }) => {
    if (addingAnimal && sightings?.length >= 3) {
      try {
        const animalData = JSON.parse(info);
        animalData.images = images;
        animalData.videos = videos;
        const validSightings = filterSightingsWithinRange(
          sightings,
          animalData.type
        );

        if (validSightings.length < 3) {
          alert(
            "Some sightings were too far apart for this type of animal. Please add sightings closer together."
          );
          return;
        }

        const centerPoint = calculateCenter(validSightings);
        if (centerPoint) {
          // const circleColor = getRandomColor();
          // const radius = calculateAdjustedRadius(
          //   validSightings,
          //   animalData.type
          // );
          const postData = {
            animalName: animalData.breed || "Unknown", // Map breed to animalName
            animalType: animalData.type || "other",
            incident: animalData.incidents || "No Incident!",
            healthStatus: animalData.healthStatus || "Unknown",
            latitude: centerPoint.lat,
            longitude: centerPoint.lng,
            // Add any other required fields from your sample
          };
          const newAnimal = await createAnimal(postData);
          console.log("New animal data:", newAnimal);
          // const newAnimal = await createAnimal({
          //   latitude: centerPoint.lat,
          //   longitude: centerPoint.lng,
          //   type: animalData.type,
          //   breed: animalData.breed,
          //   size: animalData.size,
          //   healthStatus: animalData.healthStatus,
          //   incidents: animalData.incidents,
          //   lastSeen: animalData.lastSeen,
          //   images: animalData.images,
          //   videos: animalData.videos,
          //   radius: radius,
          //   color: circleColor,
          // });

          const animalMarkerIcon =
            customMarkerIcons[newAnimal.type] || customMarkerIcons.default;
          const marker = L.marker([newAnimal.latitude, newAnimal.longitude], {
            icon: animalMarkerIcon,
          });
          marker.info = JSON.stringify(newAnimal);
          bindPopupToLayer(marker, marker.info);
          featureGroupRef.current.addLayer(marker);

          const areaLayer = L.circle(
            [newAnimal.latitude, newAnimal.longitude],
            {
              radius: newAnimal.radius,
              color: newAnimal.color,
              fillColor: newAnimal.color,
              fillOpacity: 0.2,
              weight: 2,
            }
          );
          featureGroupRef.current.addLayer(areaLayer);
        }
        setShowDialog(false);
      } catch (error) {
        console.error("Error processing animal data:", error);
        alert(
          "There was an error processing the animal data. Please try again."
        );
      }
    } else if (activeLayer) {
      if (activeLayer instanceof L.Marker && !isEdit) {
        activeLayer.setIcon(customMarkerIcons[markerType]);
      }
      activeLayer.info = info;
      bindPopupToLayer(activeLayer, info);
      if (!isEdit) {
        const updatedData = JSON.parse(info);
        await updateAnimal(activeLayer.id, updatedData);
      }
      setShowDialog(false);
    }
    setAddingAnimal(false);
    setTemporarySightings([]);
  };
  useEffect(() => {
    if (map && addingAnimal && !editingSighting) {
      const handleMapClick = (e) => {
        const newSighting = {
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          date: new Date().toISOString().split("T")[0],
        };

        // Get the current animal type from the dialog
        const currentAnimalType = JSON.parse(
          activeLayer?.info || '{"type":"other"}'
        ).type;

        // Check if the new sighting is within range of existing sightings
        if (
          temporarySightings.length > 0 &&
          !isWithinRange(newSighting, temporarySightings, currentAnimalType)
        ) {
          const maxRange =
            MAX_ROAMING_RANGES[currentAnimalType] || MAX_ROAMING_RANGES.other;
          alert(
            `This location is too far from other sightings. Maximum range for ${currentAnimalType} is ${
              maxRange / 1000
            } km.`
          );
          return;
        }

        setTemporarySightings((prev) => [...prev, newSighting]);
      };

      map.on("click", handleMapClick);
      return () => map.off("click", handleMapClick);
    }
  }, [map, addingAnimal, temporarySightings, activeLayer, editingSighting]);

  useEffect(() => {
    if (map && editingSighting !== null) {
      const handleMapClick = (e) => {
        const updatedSighting = {
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          date: temporarySightings[editingSighting].date,
        };

        const currentAnimalType = JSON.parse(
          activeLayer?.info || '{"type":"other"}'
        ).type;

        const otherSightings = temporarySightings.filter(
          (_, i) => i !== editingSighting
        );

        if (
          otherSightings.length > 0 &&
          !isWithinRange(updatedSighting, otherSightings, currentAnimalType)
        ) {
          const maxRange =
            MAX_ROAMING_RANGES[currentAnimalType] || MAX_ROAMING_RANGES.other;
          alert(
            `This location is too far from other sightings. Maximum range for ${currentAnimalType} is ${
              maxRange / 1000
            } km.`
          );
          return;
        }

        setTemporarySightings((prev) =>
          prev.map((sight, i) =>
            i === editingSighting ? updatedSighting : sight
          )
        );
        setEditingSighting(null);
      };

      map.on("click", handleMapClick);
      return () => map.off("click", handleMapClick);
    }
  }, [map, editingSighting, temporarySightings, activeLayer]);

  const isWithinRange = (newSighting, existingSightings, animalType) => {
    if (existingSightings.length === 0) return true;

    const maxRange = MAX_ROAMING_RANGES[animalType] || MAX_ROAMING_RANGES.other;
    const center =
      existingSightings.length > 0
        ? calculateCenter(existingSightings)
        : existingSightings[0];

    const distance = calculateDistance(center, newSighting);
    return distance <= maxRange;
  };
  // Modify the animal mapping in the useEffect
  useEffect(() => {
    if (!map || !featureGroupRef.current) return;

    featureGroupRef.current.clearLayers();

    animals.forEach((animal) => {
      // Add validation for radius
      const validRadius = Number.isFinite(animal.radius) ? animal.radius : 1000; // Default 1000 meters

      const marker = L.marker([animal.latitude, animal.longitude], {
        icon: customMarkerIcons[animal.type] || customMarkerIcons.default,
      });

      const areaLayer = L.circle([animal.latitude, animal.longitude], {
        radius: validRadius, // Use validated radius
        color: animal.color,
        fillColor: animal.color,
        fillOpacity: 0.2,
        weight: 2,
      });

      featureGroupRef.current.addLayer(marker);
      featureGroupRef.current.addLayer(areaLayer);
    });
  }, [animals, map, bindPopupToLayer]);
  // Update the geolocation useEffect to handle permissions better
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLatitude(latitude);
          setLongitude(longitude);
        },
        (error) => {
          console.error("Error getting geolocation:", error);
          // Set default coordinates to a valid location (e.g., New York)
          setLatitude(40.7128);
          setLongitude(-74.006);
        }
      );
    } else {
      // Fallback for unsupported browsers
      setLatitude(40.7128);
      setLongitude(-74.006);
    }
  }, []);
  const handleStepChange = (step) => {
    if (step === 3) {
      setAddingAnimal(true);
    } else {
      setAddingAnimal(false);
    }
  };

  const handleDialogClose = () => {
    setShowDialog(false);
    setIsEdit(false);
    setAddingAnimal(false);
    setTemporarySightings([]);
    setEditingSighting(null);
  };

  if (latitude === null || longitude === null) {
    return <div>Loading map...</div>;
  }

  return (
    <div className="map-wrapper">
      <button
        className="add-animal-btn"
        onClick={() => {
          setShowDialog(true);
        }}
      >
        Add Animal
      </button>
      {editingSighting !== null && (
        <div className="editing-notice">
          Click on the map to move sighting #{editingSighting + 1}
          <button
            onClick={() => setEditingSighting(null)}
            className="cancel-edit-btn"
          >
            Cancel
          </button>
        </div>
      )}
      <SearchBox onLocationSelect={handleLocationSelect} />
      <MapContainer
        center={[latitude, longitude]}
        maxBounds={[
          [-90, -180], // Southwest corner of the bounding box
          [90, 180], // Northeast corner of the bounding box
        ]}
        zoom={15}
        minZoom={2}
        style={{ height: "100vh", width: "100vw" }}
        ref={setMap}
        zoomControl={false}
      >
        <TileLayer
          url="https://tile.openstreetmap.de/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <ZoomControl position="bottomright" />
        <FeatureGroup ref={featureGroupRef}>
          {temporarySightings.map((sight, index) => (
            <Marker
              key={index}
              position={[sight.lat, sight.lng]}
              icon={customMarkerIcons.temporary}
              ref={(markerRef) => {
                if (markerRef) {
                  bindSightingPopup(markerRef, index);
                }
              }}
            />
          ))}
          {temporarySightings.length >= 3 && (
            <Circle
              center={calculateCenter(temporarySightings)}
              radius={calculateAdjustedRadius(
                temporarySightings,
                JSON.parse(activeLayer?.info || '{"type":"other"}').type
              )}
              pathOptions={{
                fillColor: getRandomColor(),
                fillOpacity: 0.2,
                weight: 2,
              }}
            />
          )}
        </FeatureGroup>
      </MapContainer>
      {showDialog && (
        <Dialog
          onSubmit={handleDialogSubmit}
          onClose={handleDialogClose}
          initialInfo={activeLayer?.info || ""}
          isEdit={isEdit}
          sightings={temporarySightings}
          onStepChange={handleStepChange} // Added this line
        />
      )}
    </div>
  );
}

export default Map;
