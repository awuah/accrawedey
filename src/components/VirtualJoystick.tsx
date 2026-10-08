import React, { useRef, useState, useEffect } from 'react';

interface VirtualJoystickProps {
  onMove: (vector: { x: number; y: number }) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);
  const centerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const radius = 45;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (active) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      centerRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }
    setActive(true);
    handleTouchMove(e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        const dx = touch.clientX - centerRef.current.x;
        const dy = touch.clientY - centerRef.current.y;
        const dist = Math.hypot(dx, dy);
        const clampedDist = Math.min(dist, radius);
        const angle = Math.atan2(dy, dx);

        const kx = Math.cos(angle) * clampedDist;
        const ky = Math.sin(angle) * clampedDist;

        setKnobPos({ x: kx, y: ky });
        onMove({
          x: kx / radius,
          y: ky / radius,
        });
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setActive(false);
        setKnobPos({ x: 0, y: 0 });
        onMove({ x: 0, y: 0 });
        break;
      }
    }
  };

  useEffect(() => {
    return () => {
      onMove({ x: 0, y: 0 });
    };
  }, [onMove]);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="relative w-28 h-28 rounded-full border-2 border-[#E8DFCF] bg-[#FBF9F5]/70 backdrop-blur-md flex items-center justify-center select-none touch-none shadow-lg"
      style={{ touchAction: 'none' }}
    >
      {/* Direction Crosshair Guides */}
      <div className="absolute w-full h-[1px] bg-[#E8DFCF]/60 pointer-events-none" />
      <div className="absolute h-full w-[1px] bg-[#E8DFCF]/60 pointer-events-none" />

      {/* Movable Knob */}
      <div
        className="w-12 h-12 rounded-full border-2 border-[#292524] shadow-md transition-transform duration-75 flex items-center justify-center bg-[#EAB308]"
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
        }}
      >
        <div className="w-3 h-3 rounded-full bg-[#292524]" />
      </div>
    </div>
  );
};
