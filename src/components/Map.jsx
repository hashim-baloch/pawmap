import { useRef, useState, useCallback, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  FeatureGroup,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import CustomDrawControls from "./CustomDrawControl";
import Dialog from "./Dialog";
import "./Map.css";

function Map() {
  const [map, setMap] = useState(null);
  const [mapLayers, setMapLayers] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [activeLayer, setActiveLayer] = useState(null);
  const featureGroupRef = useRef(null);

  const getLayerCenter = (layer) => {
    if (layer instanceof L.Circle) {
      return layer.getLatLng();
    } else if (layer instanceof L.Marker) {
      return layer.getLatLng();
    } else {
      return layer.getBounds().getCenter();
    }
  };

  const createLabel = (layer, info) => {
    const center = getLayerCenter(layer);
    const label = L.divIcon({
      className: "leaflet-label",
      html: info || "Click to add information",
    });

    const labelMarker = L.marker(center, {
      icon: label,
      interactive: true,
    });

    labelMarker.on("click", () => {
      setActiveLayer(layer);
      setShowDialog(true);
    });

    return labelMarker;
  };

  useEffect(() => {
    if (map && featureGroupRef.current) {
      const handleDrawCreated = (e) => {
        const layer = e.layer;
        featureGroupRef.current.addLayer(layer);
        setActiveLayer(layer);
        setShowDialog(true);
        setMapLayers((prevLayers) => [...prevLayers, layer]);
      };

      const handleDrawDeleted = () => {
        const layers = featureGroupRef.current.getLayers();
        layers.forEach((layer) => {
          if (layer.label) {
            featureGroupRef.current.removeLayer(layer.label);
          }
        });
        setMapLayers(Array.from(layers));
      };

      map.on("draw:created", handleDrawCreated);
      map.on("draw:deleted", handleDrawDeleted);

      return () => {
        map.off("draw:created", handleDrawCreated);
        map.off("draw:deleted", handleDrawDeleted);
      };
    }
  }, [map]);

  return (
    <div className="map-wrapper">
      <MapContainer
        center={[51.505, -0.09]}
        zoom={2}
        minZoom={2}
        style={{ height: "100vh", width: "100vw" }}
        ref={setMap}
        maxBounds={[
          [-90, -180],
          [90, 180],
        ]}
        zoomControl={false}
      >
        <TileLayer
          url="https://tile.openstreetmap.de/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <ZoomControl position="bottomright" />
        <FeatureGroup ref={featureGroupRef} />
        {map && <CustomDrawControls map={map} position="topleft" />}
      </MapContainer>
      {showDialog && (
        <Dialog
          onSubmit={(info) => {
            if (activeLayer) {
              const label = createLabel(activeLayer, info);
              activeLayer.label = label;
              featureGroupRef.current.addLayer(label);
            }
            setShowDialog(false);
          }}
          onClose={() => setShowDialog(false)}
        />
      )}
    </div>
  );
}

export default Map;
