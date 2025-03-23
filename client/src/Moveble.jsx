import React, { useState, useRef, useEffect } from 'react';
import Moveable from 'react-moveable';
import PulsingDot from './PulsingDot';

const MyDraggableComponent = ({ sensorNumber, containerSize, status }) => {
  const [position, setPosition] = useState({ x: 350, y: -400 });
  const moveableRef = useRef(null);
  const draggableRef = useRef(null);
  const initialPositionRef = useRef({ x: 0, y: 0 });

  // Add container size boundaries
  const elementSize = 30; // Since your element is 30x30
  const maxX = containerSize?.width ? containerSize.width - elementSize : 0;
  const minY = containerSize?.height ? -containerSize.height + elementSize : -30;


  useEffect(() => {
    if (draggableRef.current) {
      moveableRef.current.target = draggableRef.current;
    }
  }, []);

  const handleDragStart = () => {
    initialPositionRef.current = position;
  };

  const handleDrag = ({ beforeTranslate }) => {
    // Calculate new position with container boundaries
    const newX = Math.max(Math.min(beforeTranslate[0], maxX - 1), 0);
    const newY = Math.min(Math.max(beforeTranslate[1], minY - 30), -30);
    
    
    setPosition({ x: newX, y: newY });
  };

  return (
    <div className='absolute w-full'>
      <Moveable
        ref={moveableRef}
        target={draggableRef.current}
        draggable={true}
        onDragStart={handleDragStart}
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
        <PulsingDot status={status}/>
        <div className="mt-1 text-lg font-semibold text-center bg-black">{sensorNumber}</div>
        
      </div>
    </div>
  );
};

export default MyDraggableComponent;