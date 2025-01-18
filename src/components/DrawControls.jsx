import { useEffect } from "react";
import PropTypes from "prop-types";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";

// Initialize area measurement functionality
L.GeometryUtil = {
  ...L.GeometryUtil,
  readableArea: function (area, isMetric) {
    const areaStr = L.GeometryUtil.formattedNumber(area, 2);
    return isMetric
      ? `${areaStr} m²`
      : `${L.GeometryUtil.formattedNumber(area * 3.28084, 2)} ft²`;
  },
  formattedNumber: function (num, precision) {
    return Number(num.toFixed(precision));
  },
};

// Initialize complete Leaflet Draw localization
L.drawLocal = {
  draw: {
    toolbar: {
      actions: {
        title: "Cancel drawing",
        text: "Cancel",
      },
      finish: {
        title: "Finish drawing",
        text: "Finish",
      },
      undo: {
        title: "Delete last point drawn",
        text: "Delete last point",
      },
      buttons: {
        polyline: "Draw a polyline",
        polygon: "Draw a polygon",
        rectangle: "Draw a rectangle",
        circle: "Draw a circle",
        marker: "Draw a marker",
        circlemarker: "Draw a circlemarker",
      },
    },
    handlers: {
      circle: {
        tooltip: {
          start: "Click and drag to draw circle.",
          end: "Release mouse to finish drawing.",
        },
        radius: "Radius",
      },
      circlemarker: {
        tooltip: {
          start: "Click map to place circle marker.",
        },
      },
      marker: {
        tooltip: {
          start: "Click map to place marker.",
        },
      },
      polygon: {
        tooltip: {
          start: "Click to start drawing shape.",
          cont: "Click to continue drawing shape.",
          end: "Click first point to close this shape.",
        },
      },
      polyline: {
        error: "<strong>Error:</strong> shape edges cannot cross!",
        tooltip: {
          start: "Click to start drawing line.",
          cont: "Click to continue drawing line.",
          end: "Click last point to finish line.",
        },
      },
      rectangle: {
        tooltip: {
          start: "Click and drag to draw rectangle.",
        },
      },
      simpleshape: {
        tooltip: {
          end: "Release mouse to finish drawing.",
        },
      },
    },
  },
  edit: {
    toolbar: {
      actions: {
        save: {
          title: "Save changes",
          text: "Save",
        },
        cancel: {
          title: "Cancel editing, discards all changes",
          text: "Cancel",
        },
        clearAll: {
          title: "Clear all layers",
          text: "Clear All",
        },
      },
      buttons: {
        edit: "Edit layers",
        editDisabled: "No layers to edit",
        remove: "Delete layers",
        removeDisabled: "No layers to delete",
      },
    },
    handlers: {
      edit: {
        tooltip: {
          text: "Drag handles or markers to edit features.",
          subtext: "Click cancel to undo changes.",
        },
      },
      remove: {
        tooltip: {
          text: "Click on a feature to remove.",
        },
      },
    },
  },
};

function DrawControls({
  map,
  featureGroupRef,
  onLayerCreated,
  onLayersDeleted,
}) {
  useEffect(() => {
    if (!map || !featureGroupRef.current) return;

    const drawOptions = {
      position: "topright",
      draw: {
        polyline: {
          shapeOptions: {
            color: "#f357a1",
            weight: 3,
          },
          metric: true,
          showLength: true,
          feet: false,
        },
        polygon: {
          allowIntersection: false,
          drawError: {
            color: "#e1e100",
            message: "<strong>Error:</strong> shape edges cannot cross!",
          },
          shapeOptions: {
            color: "#bada55",
          },
          metric: true,
          showArea: true,
          feet: false,
        },
        circle: {
          shapeOptions: {
            color: "#662d91",
          },
          metric: true,
          feet: false,
          showRadius: true,
        },
        marker: {
          repeatMode: false,
        },
        rectangle: {
          shapeOptions: {
            color: "#4a80f5",
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.3,
          },
          metric: true,
          feet: false,
          showArea: true,
          repeatMode: false,
        },
        circlemarker: false,
      },
      edit: {
        featureGroup: featureGroupRef.current,
        remove: true,
        edit: {
          selectedPathOptions: {
            maintainColor: true,
            dashArray: "10, 10",
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
  }, [map, featureGroupRef, onLayerCreated, onLayersDeleted]);

  return null;
}
DrawControls.propTypes = {
  map: PropTypes.object.isRequired,
  featureGroupRef: PropTypes.shape({
    current: PropTypes.object,
  }).isRequired,
  onLayerCreated: PropTypes.func.isRequired,
  onLayersDeleted: PropTypes.func.isRequired,
};

export default DrawControls;
