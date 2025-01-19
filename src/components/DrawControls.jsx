import { useEffect } from "react";
import PropTypes from "prop-types";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import "./DrawControls.css";

// Extend Leaflet with measurement utilities
L.Measure = {
  // Geodesic area calculation
  geodesicArea: function (latLngs) {
    let area = 0;
    if (latLngs.length > 2) {
      for (let i = 0; i < latLngs.length; i++) {
        const p1 = latLngs[i];
        const p2 = latLngs[(i + 1) % latLngs.length];
        area +=
          (((p2.lng - p1.lng) * Math.PI) / 180) *
          (2 +
            Math.sin((p1.lat * Math.PI) / 180) +
            Math.sin((p2.lat * Math.PI) / 180));
      }
      area = Math.abs((area * 6378137 * 6378137) / 2);
    }
    return area;
  },
};

// Extend Draw handlers
L.Draw.Polygon.include({
  _getTooltipText: function () {
    var text, subtext;
    if (!this._poly) {
      text = L.drawLocal.draw.handlers.polygon.tooltip.start;
    } else {
      if (this._poly.getLatLngs().length === 0) {
        text = L.drawLocal.draw.handlers.polygon.tooltip.start;
      } else {
        text = L.drawLocal.draw.handlers.polygon.tooltip.cont;
        var area = L.Measure.geodesicArea(this._poly.getLatLngs()[0]);
        if (area > 10000) {
          subtext = (area / 10000).toFixed(2) + " ha";
        } else {
          subtext = area.toFixed(2) + " m²";
        }
      }
    }
    return {
      text: text,
      subtext: subtext,
    };
  },
});

L.Draw.Rectangle.include({
  _getTooltipText: function () {
    var text, subtext;
    if (!this._shape) {
      text = L.drawLocal.draw.handlers.rectangle.tooltip.start;
    } else {
      text = L.drawLocal.draw.handlers.rectangle.tooltip.cont;
      var area = L.Measure.geodesicArea(this._shape.getLatLngs()[0]);
      if (area > 10000) {
        subtext = (area / 10000).toFixed(2) + " ha";
      } else {
        subtext = area.toFixed(2) + " m²";
      }
    }
    return {
      text: text,
      subtext: subtext,
    };
  },
});

function DrawControls({
  map,
  featureGroupRef,
  onLayerCreated,
  onLayersDeleted,
  position = "topleft",
}) {
  useEffect(() => {
    if (!map || !featureGroupRef.current) return;

    const drawOptions = {
      position: position,
      draw: {
        polyline: {
          shapeOptions: {
            color: "#2196F3",
            weight: 4,
            opacity: 0.7,
            lineCap: "round",
            lineJoin: "round",
          },
          metric: true,
          showLength: true,
          feet: false,
          repeatMode: false,
        },
        polygon: {
          allowIntersection: false,
          drawError: {
            color: "#FE5F55",
            message: "<strong>Error:</strong> shape edges cannot cross!",
          },
          shapeOptions: {
            color: "#4CAF50",
            fillColor: "#4CAF50",
            fillOpacity: 0.3,
            weight: 3,
          },
          showArea: true,
          metric: true,
          feet: false,
          repeatMode: false,
        },
        circle: {
          shapeOptions: {
            color: "#9C27B0",
            fillColor: "#9C27B0",
            fillOpacity: 0.3,
            weight: 3,
          },
          showRadius: true,
          metric: true,
          feet: false,
          repeatMode: false,
        },
        marker: {
          icon: new L.Icon({
            iconUrl:
              "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowUrl:
              "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            shadowSize: [41, 41],
          }),
          repeatMode: false,
        },
        rectangle: {
          shapeOptions: {
            color: "#FF9800",
            fillColor: "#FF9800",
            fillOpacity: 0.3,
            weight: 3,
          },
          showArea: true,
          metric: true,
          feet: false,
          repeatMode: false,
        },
        circlemarker: false,
      },
      edit: {
        featureGroup: featureGroupRef.current,
        remove: true,
        edit: {
          selectedPathOptions: {
            color: "#FFC107",
            fillColor: "#FFC107",
            fillOpacity: 0.3,
            dashArray: "10, 10",
            weight: 3,
          },
        },
      },
    };

    const drawControl = new L.Control.Draw(drawOptions);
    map.addControl(drawControl);

    const handleDrawCreated = (e) => {
      const layer = e.layer;
      if (layer) {
        onLayerCreated(layer);
      }
    };

    const handleDrawDeleted = () => {
      onLayersDeleted();
    };

    map.on(L.Draw.Event.CREATED, handleDrawCreated);
    map.on(L.Draw.Event.DELETED, handleDrawDeleted);

    return () => {
      map.removeControl(drawControl);
      map.off(L.Draw.Event.CREATED, handleDrawCreated);
      map.off(L.Draw.Event.DELETED, handleDrawDeleted);
    };
  }, [map, featureGroupRef, onLayerCreated, onLayersDeleted, position]);

  return null;
}

DrawControls.propTypes = {
  map: PropTypes.object.isRequired,
  featureGroupRef: PropTypes.shape({
    current: PropTypes.object,
  }).isRequired,
  onLayerCreated: PropTypes.func.isRequired,
  onLayersDeleted: PropTypes.func.isRequired,
  position: PropTypes.oneOf([
    "topleft",
    "topright",
    "bottomleft",
    "bottomright",
  ]),
};

export default DrawControls;
