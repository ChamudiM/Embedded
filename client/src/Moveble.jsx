import React, { useState, useRef, useEffect } from "react";
import Moveable from "react-moveable";
import PulsingDot from "./PulsingDot";

const MyDraggableComponent = ({ sensorNumber, containerSize, status }) => {
  const storageKey = `device_position_${sensorNumber}`;
  const [position, setPosition] = useState({ x: 350, y: -400 });
  const moveableRef = useRef(null);
  const draggableRef = useRef(null);

  const elementSize = 30; // Element is 30x30
  const maxX = containerSize?.width ? containerSize.width - elementSize : 0;
  const minY = containerSize?.height ? -containerSize.height + elementSize : -30;

  // Load position from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem(storageKey);
    if (savedPosition) {
      setPosition(JSON.parse(savedPosition));
    }
  }, []);

  const handleDrag = ({ beforeTranslate }) => {
    const newX = Math.max(Math.min(beforeTranslate[0], maxX - 1), 0);
    const newY = Math.min(Math.max(beforeTranslate[1], minY - 30), -30);

    setPosition({ x: newX, y: newY });

    // Save new position in localStorage
    localStorage.setItem(storageKey, JSON.stringify({ x: newX, y: newY }));
  };

  return (
    <div className="absolute w-full">
      <Moveable
        ref={moveableRef}
        target={draggableRef.current}
        draggable={true}
        onDrag={handleDrag}
        hideDefaultLines={true}
      />
      <div
        ref={draggableRef}
        className="draggable text-white text-center w-max h-max relative cursor-grab"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
        }}
      >
        <PulsingDot status={status} />
        <div className="mt-1 text-lg font-semibold text-center bg-black">
          {sensorNumber}
        </div>
      </div>
    </div>
  );
};

export default MyDraggableComponent;
