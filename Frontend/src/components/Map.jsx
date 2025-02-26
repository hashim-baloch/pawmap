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
    iconSize: [34, 30],
    iconAnchor: [17, 30],
    popupAnchor: [0, -25],
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    shadowSize: [36, 30],
    shadowAnchor: [15, 30],
  }),
  cat: new L.Icon({
    iconUrl: "https://cloud-qrwl9nfph-hack-club-bot.vercel.app/1cat__1_.svg",
    iconSize: [39, 30],
    iconAnchor: [19, 30],
    popupAnchor: [0, -25],
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    shadowSize: [41, 31],
    shadowAnchor: [18, 30],
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
      const placeholderImage = `
        <div class="popup-image-placeholder">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
      `;

      return `
        <div class="popup-content">
          <div class="carousel">
            <div class="carousel-slide">
              ${
                info.coverImage || info.images[0]
                  ? `<img src="${
                      info.coverImage || info.images[0]
                    }" alt="Cover Image" class="carousel-image"/>`
                  : placeholderImage
              }
              <h4>${info.type.charAt(0).toUpperCase() + info.type.slice(1)} - ${
        info.animalName
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
                  : placeholderImage
              }
              ${
                info.videos && info.videos.length > 0
                  ? `<div class="media-section">
                    <h5>Videos:</h5>
                    ${info.videos
                      .map(
                        (vid) => `
                        <video controls class="popup-video">
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
      const popup = L.popup({
        autoPan: true,
        autoPanPadding: [50, 50],
        keepInView: true,
        offset: [0, -10],
      });

      popup.setContent(popupContent);
      layer.bindPopup(popup);

      layer.on("popupopen", () => {
        const editButton = document.querySelector(".edit-button");
        if (editButton) {
          editButton.addEventListener("click", () => handleLayerClick(layer));
        }

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

  useEffect(() => {
    if (!map || !featureGroupRef.current) return;

    featureGroupRef.current.clearLayers();

    animals.forEach((animal) => {
      // Parse all numeric values
      const lat = parseFloat(animal.latitude);
      const lng = parseFloat(animal.longitude);
      const radius = parseFloat(animal.radius);

      // Validate coordinates and radius
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        console.error("Invalid coordinates for animal:", animal);
        return;
      }

      const validRadius = Number.isFinite(radius)
        ? radius
        : MAX_ROAMING_RANGES[animal.animal_type] || MAX_ROAMING_RANGES.other;

      const position = [lat, lng];
      const frontendAnimalData = {
        id: animal.id,
        type: animal.animal_type,
        animalName: animal.animal_name,
        color: animal.color,
        size: animal.size,
        healthStatus: animal.health_status,
        incidents: animal.incident,
        lastSeen: animal.last_seen,
        images: [],
        videos: [],
      };

      const marker = L.marker(position, {
        icon:
          customMarkerIcons[animal.animal_type] || customMarkerIcons.default,
      });

      marker.id = animal.id;
      marker.info = JSON.stringify(frontendAnimalData);
      bindPopupToLayer(marker, marker.info);
      featureGroupRef.current.addLayer(marker);

      const areaLayer = L.circle(position, {
        radius: validRadius,
        color: animal.color_code || getRandomColor(),
        fillColor: animal.color_code || getRandomColor(),
        fillOpacity: 0.2,
        weight: 2,
      });
      featureGroupRef.current.addLayer(areaLayer);
    });
  }, [animals, map, bindPopupToLayer]);

  const handleDialogSubmit = async ({
    info,

    sightings,
    images,
    videos,
  }) => {
    if (addingAnimal && sightings?.length >= 3) {
      try {
        const animalData = JSON.parse(info);
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
          const circleColor = getRandomColor();
          // Calculate radius based on actual sightings
          const calculatedRadius = calculateAdjustedRadius(
            validSightings,
            animalData.type
          );

          const postData = {
            animalName: animalData.animalName, // Updated from breed
            animalType: animalData.type,
            color: animalData.color,
            size: animalData.size,
            healthStatus: animalData.healthStatus,
            incident: animalData.incidents || "",
            lastSeen: animalData.lastSeen,
            latitude: centerPoint.lat.toString(),
            longitude: centerPoint.lng.toString(),
            radius: calculatedRadius.toString(), // Convert to string for database
            colorCode: circleColor,
          };

          const newAnimal = await createAnimal(postData);

          // Parse coordinates and radius to numbers
          const lat = parseFloat(newAnimal.latitude);
          const lng = parseFloat(newAnimal.longitude);
          const radius = parseFloat(newAnimal.radius);

          if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            console.error("Invalid coordinates for new animal:", newAnimal);
            return;
          }

          const validRadius = Number.isFinite(radius)
            ? radius
            : calculatedRadius;
          const position = [lat, lng];

          const marker = L.marker(position, {
            icon:
              customMarkerIcons[newAnimal.animal_type] ||
              customMarkerIcons.default,
          });

          const frontendAnimalData = {
            id: newAnimal.id,
            type: newAnimal.animal_type,
            animalName: newAnimal.animal_name,
            color: newAnimal.color,
            size: newAnimal.size,
            healthStatus: newAnimal.health_status,
            incidents: newAnimal.incident,
            lastSeen: newAnimal.last_seen,
            images: images || [],
            videos: videos || [],
          };

          marker.id = newAnimal.id;
          marker.info = JSON.stringify(frontendAnimalData);
          bindPopupToLayer(marker, marker.info);
          featureGroupRef.current.addLayer(marker);

          const areaLayer = L.circle(position, {
            radius: validRadius,
            color: newAnimal.color_code,
            fillColor: newAnimal.color_code,
            fillOpacity: 0.2,
            weight: 2,
          });
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
      try {
        const updatedData = JSON.parse(info);
        const updatePayload = {
          animalType: updatedData.type,
          animalName: updatedData.animalName,
          color: updatedData.color,
          size: updatedData.size,
          healthStatus: updatedData.healthStatus,
          incident: updatedData.incidents,
          lastSeen: updatedData.lastSeen,
        };

        await updateAnimal(activeLayer.id, updatePayload);

        if (activeLayer instanceof L.Marker) {
          activeLayer.setIcon(
            customMarkerIcons[updatedData.type] || customMarkerIcons.default
          );
        }
        activeLayer.info = info;
        bindPopupToLayer(activeLayer, info);
      } catch (error) {
        console.error("Error updating animal:", error);
        alert("Failed to update animal information. Please try again.");
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

        const currentAnimalType = JSON.parse(
          activeLayer?.info || '{"type":"other"}'
        ).type;

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
          setLatitude(40.7128);
          setLongitude(-74.006);
        }
      );
    } else {
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
          [-90, -180],
          [90, 180],
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
          onStepChange={handleStepChange}
        />
      )}
    </div>
  );
}

export default Map;
