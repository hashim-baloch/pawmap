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
          <h4>${info.type.charAt(0).toUpperCase() + info.type.slice(1)}</h4>
          <p><strong>Breed:</strong> ${info.breed}</p>
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
          ${
            info.images && info.images.length > 0
              ? `<div class="media-section">
                  <h5>Images:</h5>
                  ${info.images
                    .map(
                      (img) =>
                        `<img src="${img}" alt="Animal Image" class="popup-image"/>`
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
          <button class="edit-button">Edit</button>
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
      });
    },
    [handleLayerClick]
  );

  const handleDialogSubmit = ({
    info,
    markerType,
    sightings,
    images,
    videos,
  }) => {
    if (addingAnimal && sightings?.length >= 3) {
      try {
        const animalData = JSON.parse(info);
        animalData.images = images; // Add this line
        animalData.videos = videos; // Add this line
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
          // Generate a random color for the circle
          const circleColor = getRandomColor();

          // Create area with adjusted radius and random color
          const areaLayer = L.circle([centerPoint.lat, centerPoint.lng], {
            radius: calculateAdjustedRadius(validSightings, animalData.type),
            color: circleColor,
            fillColor: circleColor,
            fillOpacity: 0.2,
            weight: 2,
          });
          featureGroupRef.current.addLayer(areaLayer);

          // Determine marker icon based on animal type
          let animalMarkerIcon = customMarkerIcons.default; // Fallback
          switch (animalData.type) {
            case "dog":
              animalMarkerIcon = customMarkerIcons.dog;
              break;
            case "cat":
              animalMarkerIcon = customMarkerIcons.cat;
              break;
            case "other":
            default:
              animalMarkerIcon = customMarkerIcons.other;
              break;
          }

          // Create marker at center with specific icon
          const marker = L.marker([centerPoint.lat, centerPoint.lng], {
            icon: animalMarkerIcon,
          });
          marker.info = JSON.stringify(animalData); // Update this line
          bindPopupToLayer(marker, marker.info);
          featureGroupRef.current.addLayer(marker);

          setMapLayers((prevLayers) => [...prevLayers, marker, areaLayer]);
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
        setMapLayers((prevLayers) => [...prevLayers, activeLayer]);
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
          // Set default coordinates if needed
          setLatitude(0);
          setLongitude(0);
        }
      );
    } else {
      // Geolocation not supported, set default coordinates
      setLatitude(0);
      setLongitude(0);
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
                color: getRandomColor(), // Assign random color
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
