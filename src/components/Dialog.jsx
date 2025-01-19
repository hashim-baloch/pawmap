import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "./Dialog.css";

function Dialog({ onSubmit, onClose, initialInfo = "", sightings = [] }) {
  const [step, setStep] = useState(1);
  const [animalInfo, setAnimalInfo] = useState({
    type: "",
    breed: "",
    color: "",
    size: "medium",
    healthStatus: "healthy",
    sightings: [],
    incidents: "",
    lastSeen: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (initialInfo) {
      try {
        const parsedInfo = JSON.parse(initialInfo);
        setAnimalInfo(parsedInfo);
      } catch (e) {
        console.error("Error parsing animal info:", e);
      }
    }
  }, [initialInfo]);

  useEffect(() => {
    setAnimalInfo((prev) => ({
      ...prev,
      sightings: sightings,
    }));
  }, [sightings]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      const info = JSON.stringify(animalInfo);
      onSubmit({
        info,
        markerType: getMarkerType(animalInfo.healthStatus),
        sightings: animalInfo.sightings,
      });
    }
  };

  const getMarkerType = (status) => {
    switch (status) {
      case "injured":
      case "critical":
        return "danger";
      case "needs-attention":
        return "warning";
      default:
        return "info";
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <h3>Animal Information</h3>
            <div className="form-group">
              <label>Animal Type:</label>
              <select
                value={animalInfo.type}
                onChange={(e) =>
                  setAnimalInfo((prev) => ({ ...prev, type: e.target.value }))
                }
                required
              >
                <option value="">Select Type</option>
                <option value="dog">Dog</option>
                <option value="cat">Cat</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Breed/Description:</label>
              <input
                type="text"
                value={animalInfo.breed}
                onChange={(e) =>
                  setAnimalInfo((prev) => ({ ...prev, breed: e.target.value }))
                }
                placeholder="E.g., Mixed breed, Tabby cat"
              />
            </div>
            <div className="form-group">
              <label>Color:</label>
              <input
                type="text"
                value={animalInfo.color}
                onChange={(e) =>
                  setAnimalInfo((prev) => ({ ...prev, color: e.target.value }))
                }
                placeholder="E.g., Brown and white"
              />
            </div>
            <div className="form-group">
              <label>Size:</label>
              <select
                value={animalInfo.size}
                onChange={(e) =>
                  setAnimalInfo((prev) => ({ ...prev, size: e.target.value }))
                }
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <h3>Health & Status</h3>
            <div className="form-group">
              <label>Health Status:</label>
              <select
                value={animalInfo.healthStatus}
                onChange={(e) =>
                  setAnimalInfo((prev) => ({
                    ...prev,
                    healthStatus: e.target.value,
                  }))
                }
              >
                <option value="healthy">Healthy</option>
                <option value="needs-attention">Needs Attention</option>
                <option value="injured">Injured</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="form-group">
              <label>Incidents/Notes:</label>
              <textarea
                value={animalInfo.incidents}
                onChange={(e) =>
                  setAnimalInfo((prev) => ({
                    ...prev,
                    incidents: e.target.value,
                  }))
                }
                placeholder="Any notable incidents or behavior..."
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Last Seen:</label>
              <input
                type="date"
                value={animalInfo.lastSeen}
                onChange={(e) =>
                  setAnimalInfo((prev) => ({
                    ...prev,
                    lastSeen: e.target.value,
                  }))
                }
              />
            </div>
          </>
        );
      case 3:
        return (
          <>
            <h3>Location Information</h3>
            <div className="location-instructions">
              <h4>How to Add Locations</h4>
              <p>
                Click on the map to mark locations where you&apos;ve seen this
                animal. Add at least 3 points to create an area.
              </p>
            </div>
            <div className="sightings-list">
              <div className="sightings-count">
                Sightings added: {animalInfo.sightings.length}
              </div>
              {animalInfo.sightings.map((sight, index) => (
                <div key={index} className="sighting-item">
                  <span>Sighting {index + 1}: </span>
                  <span>{new Date(sight.date).toLocaleDateString()}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAnimalInfo((prev) => ({
                        ...prev,
                        sightings: prev.sightings.filter((_, i) => i !== index),
                      }));
                    }}
                    className="remove-sighting"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </>
        );
    }
  };

  return (
    <div className="dialog-overlay">
      <div className={`dialog ${step === 3 ? "location-step" : ""}`}>
        <form onSubmit={handleSubmit}>
          {renderStep()}
          <div className="dialog-buttons">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="secondary"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={step === 3 && animalInfo.sightings.length < 3}
            >
              {step === 3 ? "Finish" : "Next"}
            </button>
            <button type="button" onClick={onClose} className="secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

Dialog.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  initialInfo: PropTypes.string,
  isEdit: PropTypes.bool,
  sightings: PropTypes.array,
};

export default Dialog;
