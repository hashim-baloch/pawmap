import { useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, FeatureGroup } from "react-leaflet";
import L from "leaflet";
import DrawControls from "./DrawControls";
import MapControls from "./MapControls";
import Dialog from "./Dialog";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icon issue
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

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

  const handleLayerCreated = useCallback((layer) => {
    if (featureGroupRef.current) {
      featureGroupRef.current.addLayer(layer);
      setActiveLayer(layer);
      setShowDialog(true);
      setMapLayers((prevLayers) => [...prevLayers, layer]);
    }
  }, []);

  const handleDialogSubmit = (info) => {
    if (activeLayer) {
      const label = createLabel(activeLayer, info);
      activeLayer.label = label;
      featureGroupRef.current.addLayer(label);
    }
  };

  const handleLayersDeleted = useCallback(() => {
    if (featureGroupRef.current) {
      const layers = featureGroupRef.current.getLayers();
      // Remove associated labels when shapes are deleted
      layers.forEach((layer) => {
        if (layer.label) {
          featureGroupRef.current.removeLayer(layer.label);
        }
      });
      setMapLayers(Array.from(layers));
    }
  }, []);

  const saveMap = useCallback(() => {
    const data = mapLayers.map((layer) => {
      const geoJSON = layer.toGeoJSON();
      if (layer instanceof L.Circle) {
        geoJSON.properties = {
          ...geoJSON.properties,
          radius: layer.getRadius(),
          type: "circle",
        };
      }
      if (layer.label) {
        geoJSON.properties = {
          ...geoJSON.properties,
          labelContent: layer.label.getIcon().options.html,
        };
      }
      return geoJSON;
    });
    localStorage.setItem("mapData", JSON.stringify(data));
    alert("Map data saved successfully!");
  }, [mapLayers]);

  const loadMap = useCallback(() => {
    try {
      const savedData = localStorage.getItem("mapData");
      if (!savedData) {
        alert("No saved map data found");
        return;
      }

      const data = JSON.parse(savedData);
      if (featureGroupRef.current) {
        featureGroupRef.current.clearLayers();

        data.forEach((item) => {
          let layer;
          if (item.properties && item.properties.type === "circle") {
            const coords = item.geometry.coordinates;
            layer = L.circle([coords[1], coords[0]], {
              radius: item.properties.radius,
            });
          } else {
            layer = L.geoJSON(item);
            layer = layer.getLayers()[0];
          }

          featureGroupRef.current.addLayer(layer);

          if (item.properties && item.properties.labelContent) {
            const label = createLabel(layer, item.properties.labelContent);
            layer.label = label;
            featureGroupRef.current.addLayer(label);
          }
        });

        setMapLayers(featureGroupRef.current.getLayers());
        alert("Map data loaded successfully!");
      }
    } catch (error) {
      console.error("Error loading map data:", error);
      alert("Error loading map data");
    }
  }, []);

  return (
    <div className="map-wrapper">
      <MapControls onSave={saveMap} onLoad={loadMap} />
      <MapContainer
        center={[51.505, -0.09]}
        zoom={13}
        style={{ height: "600px", width: "100%" }}
        ref={setMap}
      >
        <TileLayer
          url="https://tile.openstreetmap.de/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <FeatureGroup ref={featureGroupRef}>
          {map && (
            <DrawControls
              map={map}
              featureGroupRef={featureGroupRef}
              onLayerCreated={handleLayerCreated}
              onLayersDeleted={handleLayersDeleted}
            />
          )}
        </FeatureGroup>
      </MapContainer>
      {showDialog && (
        <Dialog
          onSubmit={handleDialogSubmit}
          onClose={() => setShowDialog(false)}
        />
      )}
    </div>
  );
}

export default Map;
