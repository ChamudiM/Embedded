import React from 'react';

const PulsingDot = ({status}) => {
    let pulseColor, pulseSize;

    switch (status) {
      case 'active':
        pulseColor = "#39FF14"; // Green for active
        pulseSize = "25px";
        break;
      case 'triger':
        pulseColor = "#FF3A2F"; // Red for triger
        pulseSize = "30px";
        break;
      case 'lost':
        pulseColor = "#FFC300"; // Yellow for lost
        pulseSize = "25px";
        break;
      default:
        pulseColor = "#FFC300"; // Yellow for ldefault
        pulseSize = "25px";
    }
  return (
    <div className="center">
      <div 
        className="pulse" 
        style={{
          '--pulseSize': pulseSize, 
          '--blue': pulseColor, 
          '--transparentBlue': `${pulseColor}00`,
        }}
      ></div>
    </div>
  );
};

export default PulsingDot;
