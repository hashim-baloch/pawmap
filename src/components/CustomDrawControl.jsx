import { useEffect } from "react";
import L from "leaflet";
import PropTypes from "prop-types";
import "./CustomDrawControl.css";
import "./NavBar.css";
import "./NavBar.jsx";

// Custom Control Class
const CustomDrawControl = L.Control.extend({
  options: {
    position: "topleft",
  },

  onAdd: function (map) {
    const container = L.DomUtil.create(
      "div",
      "leaflet-bar leaflet-control custom-draw-control"
    );

    // Create custom buttons
    this._createButton(
      "🖊️ Draw Line",
      "Start drawing a line",
      container,
      () => {
        new L.Draw.Polyline(map, this.options.drawOptions.polyline).enable();
      }
    );

    this._createButton(
      "⬡ Draw Polygon",
      "Start drawing a polygon",
      container,
      () => {
        new L.Draw.Polygon(map, this.options.drawOptions.polygon).enable();
      }
    );

    this._createButton(
      "⬚ Draw Rectangle",
      "Start drawing a rectangle",
      container,
      () => {
        new L.Draw.Rectangle(map, this.options.drawOptions.rectangle).enable();
      }
    );

    this._createButton(
      "◯ Draw Circle",
      "Start drawing a circle",
      container,
      () => {
        new L.Draw.Circle(map, this.options.drawOptions.circle).enable();
      }
    );

    this._createButton("📍 Add Marker", "Add a marker", container, () => {
      new L.Draw.Marker(map, this.options.drawOptions.marker).enable();
    });

    return container;
  },

  _createButton: function (html, title, container, fn) {
    const button = L.DomUtil.create("button", "custom-draw-button", container);
    button.innerHTML = html;
    button.title = title;

    L.DomEvent.on(button, "click", L.DomEvent.stopPropagation)
      .on(button, "click", L.DomEvent.preventDefault)
      .on(button, "click", fn);

    return button;
  },
});

function CustomDrawControls({ map, position = "topleft" }) {
  useEffect(() => {
    if (!map) return;

    const drawOptions = {
      polyline: {
        shapeOptions: {
          color: "#2196F3",
          weight: 4,
          opacity: 0.7,
          lineCap: "round",
          lineJoin: "round",
        },
      },
      polygon: {
        shapeOptions: {
          color: "#4CAF50",
          fillColor: "#4CAF50",
          fillOpacity: 0.3,
          weight: 3,
        },
        allowIntersection: false,
      },
      rectangle: {
        shapeOptions: {
          color: "#FF9800",
          fillColor: "#FF9800",
          fillOpacity: 0.3,
          weight: 3,
        },
      },
      circle: {
        shapeOptions: {
          color: "#9C27B0",
          fillColor: "#9C27B0",
          fillOpacity: 0.3,
          weight: 3,
        },
      },
      marker: {
        icon: new L.Icon({
          iconUrl:
            "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
          shadowSize: [41, 41],
        }),
      },
    };

    const customControl = new CustomDrawControl({ position, drawOptions });
    map.addControl(customControl);

    return () => {
      map.removeControl(customControl);
    };
  }, [map, position]);

  return null;
}

CustomDrawControls.propTypes = {
  map: PropTypes.object.isRequired,
  position: PropTypes.oneOf([
    "topleft",
    "topright",
    "bottomleft",
    "bottomright",
  ]),
};

export default CustomDrawControls;
