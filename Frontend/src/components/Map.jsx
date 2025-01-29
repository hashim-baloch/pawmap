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
import {
  getAllAnimals,
  addAnimal,
  updateAnimal,
  deleteAnimal,
  uploadImage,
} from "../services/api";

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
            <div class="carousel-slide active">
              <h4>${info.animal_type} - ${info.animal_name}</h4>
              <p><strong>Health Status:</strong> ${info.health_status}</p>
              <p><strong>Incident:</strong> ${
                info.incident || "None reported"
              }</p>
              <p><strong>Location:</strong> ${info.latitude}, ${
        info.longitude
      }</p>
              <div class="popup-actions">
                <button class="edit-button">Edit</button>
                <button class="delete-button" data-id="${
                  info.id
                }">Delete</button>
              </div>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error("Error parsing animal info:", error);
      return `
        <div class="popup-content">
          <p>Error displaying animal information</p>
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
        const deleteButton = document.querySelector(".delete-button");

        if (editButton) {
          editButton.addEventListener("click", () => handleLayerClick(layer));
        }

        if (deleteButton) {
          const animalId = deleteButton.getAttribute("data-id");
          deleteButton.addEventListener("click", () =>
            handleDeleteAnimal(animalId)
          );
        }
      });
    },
    [handleLayerClick, handleDeleteAnimal]
  );

  const fetchExistingData = async () => {
    try {
      const response = await getAllAnimals();
      const animals = response.data;

      animals.forEach((animal) => {
        // Create marker
        const marker = L.marker(
          [parseFloat(animal.latitude), parseFloat(animal.longitude)],
          {
            icon:
              customMarkerIcons[animal.animal_type?.toLowerCase()] ||
              customMarkerIcons.default,
          }
        );

        // Create info object that matches the expected structure
        const markerInfo = {
          id: animal.id,
          animal_type: animal.animal_type,
          animal_name: animal.animal_name,
          incident: animal.incident,
          health_status: animal.health_status,
          latitude: animal.latitude,
          longitude: animal.longitude,
        };

        marker.info = JSON.stringify(markerInfo);
        bindPopupToLayer(marker, marker.info);
        featureGroupRef.current.addLayer(marker);

        // Create circle with default radius if not provided
        const areaLayer = L.circle(
          [parseFloat(animal.latitude), parseFloat(animal.longitude)],
          {
            radius: animal.radius || 500, // Default radius of 500m if not provided
            color: animal.color || getRandomColor(),
            fillColor: animal.color || getRandomColor(),
            fillOpacity: 0.2,
            weight: 2,
          }
        );

        featureGroupRef.current.addLayer(areaLayer);
        setMapLayers((prev) => [...prev, marker, areaLayer]);
      });
    } catch (error) {
      console.error("Error fetching existing data:", error);
    }
  };

  useEffect(() => {
    if (map) {
      fetchExistingData();
    }
  }, [map]);

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
          const radius = calculateAdjustedRadius(
            validSightings,
            animalData.type
          );

          const newAnimalData = {
            animalName: animalData.breed,
            animalType: animalData.type,
            incident: animalData.incidents,
            healthStatus: animalData.healthStatus,
            latitude: centerPoint.lat,
            longitude: centerPoint.lng,
          };

          const response = await addAnimal(newAnimalData);
          const savedAnimal = response.data.results[0];

          if (images && images.length > 0) {
            for (const image of images) {
              const formData = new FormData();
              formData.append("image", image);
              await uploadImage(savedAnimal.id, formData);
            }
          }

          const marker = L.marker([centerPoint.lat, centerPoint.lng], {
            icon:
              customMarkerIcons[animalData.type] || customMarkerIcons.default,
          });
          marker.info = JSON.stringify({ ...savedAnimal, ...animalData });
          bindPopupToLayer(marker, marker.info);
          featureGroupRef.current.addLayer(marker);

          const areaLayer = L.circle([centerPoint.lat, centerPoint.lng], {
            radius,
            color: circleColor,
            fillColor: circleColor,
            fillOpacity: 0.2,
            weight: 2,
          });
          featureGroupRef.current.addLayer(areaLayer);

          setMapLayers((prevLayers) => [...prevLayers, marker, areaLayer]);
        }
      } catch (error) {
        console.error("Error saving animal:", error);
        alert("There was an error saving the animal. Please try again.");
      }
    } else if (activeLayer) {
      try {
        const animalData = JSON.parse(info);
        await updateAnimal(animalData.id, animalData);

        if (activeLayer instanceof L.Marker && !isEdit) {
          activeLayer.setIcon(customMarkerIcons[markerType]);
        }
        activeLayer.info = info;
        bindPopupToLayer(activeLayer, info);

        if (!isEdit) {
          setMapLayers((prevLayers) => [...prevLayers, activeLayer]);
        }
      } catch (error) {
        console.error("Error updating animal:", error);
        alert("There was an error updating the animal. Please try again.");
      }
    }

    setShowDialog(false);
    setAddingAnimal(false);
    setTemporarySightings([]);
  };

  const handleDeleteAnimal = async (animalId) => {
    try {
      await deleteAnimal(animalId);
      const layersToRemove = mapLayers.filter(
        (layer) => layer.info && JSON.parse(layer.info).id === animalId
      );
      layersToRemove.forEach((layer) => {
        featureGroupRef.current.removeLayer(layer);
      });
      setMapLayers((prev) =>
        prev.filter((layer) => !layersToRemove.includes(layer))
      );
    } catch (error) {
      console.error("Error deleting animal:", error);
      alert("There was an error deleting the animal. Please try again.");
    }
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
          setLatitude(0);
          setLongitude(0);
        }
      );
    } else {
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
                color: getRandomColor(),
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
