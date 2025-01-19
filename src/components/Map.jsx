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

  const calculateAreaCenter = (sightings) => {
    if (sightings.length === 0) return null;

    const lats = sightings.map((s) => s.lat);
    const lngs = sightings.map((s) => s.lng);

    const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
    const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;

    return [centerLat, centerLng];
  };

  const createAreaPolygon = (sightings) => {
    if (sightings.length < 3) return null;

    const center = calculateAreaCenter(sightings);

    // Calculate the maximum distance from center to any sighting
    const radius = Math.max(
      ...sightings.map((s) =>
        L.latLng(center).distanceTo(L.latLng(s.lat, s.lng))
      )
    );

    return L.circle(center, {
      radius: radius * 1.2, // Add 20% buffer
      color: "#4a80f5",
      fillColor: "#4a80f5",
      fillOpacity: 0.2,
      weight: 2,
    });
  };

  const handleDialogSubmit = ({ info, markerType, sightings }) => {
    if (addingAnimal && sightings?.length >= 3) {
      const center = calculateAreaCenter(sightings);
      if (center) {
        // Create area
        const areaLayer = createAreaPolygon(sightings);
        if (areaLayer) {
          featureGroupRef.current.addLayer(areaLayer);
        }

        // Create marker
        const marker = L.marker(center, {
          icon: customMarkerIcons[markerType],
        });
        marker.info = info;
        bindPopupToLayer(marker, info);
        featureGroupRef.current.addLayer(marker);

        setMapLayers((prevLayers) => [...prevLayers, marker, areaLayer]);
      }
      setShowDialog(false);
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
    if (map && addingAnimal) {
      const handleMapClick = (e) => {
        const newSighting = {
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          date: new Date().toISOString().split("T")[0],
        };
        setTemporarySightings((prev) => [...prev, newSighting]);
      };

      map.on("click", handleMapClick);
      return () => map.off("click", handleMapClick);
    }
  }, [map, addingAnimal]);

  return (
    <div className="map-wrapper">
      <button
        className="add-animal-btn"
        onClick={() => {
          setAddingAnimal(true);
          setShowDialog(true);
        }}
      >
        Add Animal
      </button>
      <SearchBox onLocationSelect={handleLocationSelect} />
      <MapContainer
        center={[51.505, -0.09]}
        zoom={13}
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
            />
          ))}
          {temporarySightings.length >= 3 && (
            <Circle
              center={calculateAreaCenter(temporarySightings)}
              radius={
                Math.max(
                  ...temporarySightings.map((s) =>
                    L.latLng(
                      calculateAreaCenter(temporarySightings)
                    ).distanceTo(L.latLng(s.lat, s.lng))
                  )
                ) * 1.2
              }
              pathOptions={{
                color: "#4a80f5",
                fillColor: "#4a80f5",
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
          onClose={() => {
            setShowDialog(false);
            setIsEdit(false);
            setAddingAnimal(false);
            setTemporarySightings([]);
          }}
          initialInfo={activeLayer?.info || ""}
          isEdit={isEdit}
          sightings={temporarySightings}
        />
      )}
    </div>
  );
}

export default Map;
