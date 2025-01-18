import React from 'react';

function MapControls({ onSave, onLoad }) {
  return (
    <div className="map-controls" style={{ marginBottom: '1rem' }}>
      <button 
        onClick={onSave}
        style={{ marginRight: '1rem' }}
      >
        Save Map
      </button>
      <button onClick={onLoad}>
        Load Map
      </button>
    </div>
  );
}

export default MapControls;