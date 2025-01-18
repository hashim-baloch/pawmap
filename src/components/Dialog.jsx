import React, { useState } from "react";

function Dialog({ onSubmit, onClose }) {
  const [info, setInfo] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(info);
    onClose();
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <h3>Enter Shape Information</h3>
        <form onSubmit={handleSubmit}>
          <textarea
            value={info}
            onChange={(e) => setInfo(e.target.value)}
            placeholder="Enter information about this shape..."
            rows="4"
            className="dialog-textarea"
          />
          <div className="dialog-buttons">
            <button type="submit">Save</button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Dialog;
