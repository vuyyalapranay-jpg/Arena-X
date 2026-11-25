// src/game/ui/VirtualJoystick.tsx
// Modern Floating / Invisible Virtual Joystick for Fighting Games (Mobile Touch)

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { FighterInputs, PlayerId } from '../../types';

interface VirtualJoystickProps {
  player: PlayerId;
  onTouchInput: (player: PlayerId, action: keyof FighterInputs, active: boolean) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ player, onTouchInput }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [touchId, setTouchId] = useState<number | null>(null);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [basePos, setBasePos] = useState<{ x: number; y: number }>({ x: 90, y: 90 });
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Currently active direction states to avoid redundant calls
  const activeDirections = useRef<{
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
  }>({ left: false, right: false, up: false, down: false });

  const releaseAll = useCallback(() => {
    if (activeDirections.current.left) {
      onTouchInput(player, 'moveLeft', false);
      activeDirections.current.left = false;
    }
    if (activeDirections.current.right) {
      onTouchInput(player, 'moveRight', false);
      activeDirections.current.right = false;
    }
    if (activeDirections.current.up) {
      onTouchInput(player, 'jump', false);
      activeDirections.current.up = false;
    }
    if (activeDirections.current.down) {
      onTouchInput(player, 'crouch', false);
      activeDirections.current.down = false;
    }
    setKnobPos({ x: 0, y: 0 });
    setIsActive(false);
    setTouchId(null);
  }, [player, onTouchInput]);

  const updateDirectionInputs = useCallback(
    (dx: number, dy: number) => {
      const deadzone = 14;
      const needLeft = dx < -deadzone;
      const needRight = dx > deadzone;
      const needUp = dy < -deadzone;
      const needDown = dy > deadzone;

      if (needLeft !== activeDirections.current.left) {
        onTouchInput(player, 'moveLeft', needLeft);
        activeDirections.current.left = needLeft;
      }
      if (needRight !== activeDirections.current.right) {
        onTouchInput(player, 'moveRight', needRight);
        activeDirections.current.right = needRight;
      }
      if (needUp !== activeDirections.current.up) {
        onTouchInput(player, 'jump', needUp);
        activeDirections.current.up = needUp;
      }
      if (needDown !== activeDirections.current.down) {
        onTouchInput(player, 'crouch', needDown);
        activeDirections.current.down = needDown;
      }
    },
    [player, onTouchInput]
  );

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchId !== null) return;
    const touch = e.changedTouches[0];
    if (!touch || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const localX = touch.clientX - rect.left;
    const localY = touch.clientY - rect.top;

    setTouchId(touch.identifier);
    setBasePos({ x: localX, y: localY });
    setKnobPos({ x: 0, y: 0 });
    setIsActive(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchId === null || !containerRef.current) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchId) {
        const rect = containerRef.current.getBoundingClientRect();
        const currentX = touch.clientX - rect.left;
        const currentY = touch.clientY - rect.top;

        const rawDx = currentX - basePos.x;
        const rawDy = currentY - basePos.y;

        const maxRadius = 48;
        const distance = Math.hypot(rawDx, rawDy);
        const clampedDist = Math.min(distance, maxRadius);
        const angle = Math.atan2(rawDy, rawDx);

        const clampedX = Math.cos(angle) * clampedDist;
        const clampedY = Math.sin(angle) * clampedDist;

        setKnobPos({ x: clampedX, y: clampedY });
        updateDirectionInputs(rawDx, rawDy);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchId) {
        releaseAll();
        break;
      }
    }
  };

  // Mouse emulation for desktop testing
  const [isMouseDown, setIsMouseDown] = useState(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;
    setBasePos({ x: localX, y: localY });
    setKnobPos({ x: 0, y: 0 });
    setIsActive(true);
    setIsMouseDown(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDown || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    const rawDx = currentX - basePos.x;
    const rawDy = currentY - basePos.y;

    const maxRadius = 48;
    const distance = Math.hypot(rawDx, rawDy);
    const clampedDist = Math.min(distance, maxRadius);
    const angle = Math.atan2(rawDy, rawDx);

    const clampedX = Math.cos(angle) * clampedDist;
    const clampedY = Math.sin(angle) * clampedDist;

    setKnobPos({ x: clampedX, y: clampedY });
    updateDirectionInputs(rawDx, rawDy);
  };

  const handleMouseUp = () => {
    if (isMouseDown) {
      setIsMouseDown(false);
      releaseAll();
    }
  };

  useEffect(() => {
    return () => {
      releaseAll();
    };
  }, [releaseAll]);

  return (
    <div
      ref={containerRef}
      className={`virtual-joystick-touchzone ${isActive ? 'joystick-active' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      aria-label="Directional Joystick Touch Zone"
    >
      {/* Floating Joystick Base & Knob */}
      <div
        className="joystick-base"
        style={{
          left: `${basePos.x}px`,
          top: `${basePos.y}px`,
          opacity: isActive ? 0.85 : 0.25,
        }}
      >
        <div className="joystick-ring-crosshair horizontal" />
        <div className="joystick-ring-crosshair vertical" />
        <div
          className="joystick-knob"
          style={{
            transform: `translate(calc(-50% + ${knobPos.x}px), calc(-50% + ${knobPos.y}px))`,
          }}
        >
          <div className="knob-core-indicator" />
        </div>
      </div>
    </div>
  );
};
