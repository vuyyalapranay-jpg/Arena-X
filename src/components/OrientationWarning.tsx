// src/components/OrientationWarning.tsx
import React, { useState, useEffect } from 'react';
import { Smartphone, RotateCw } from 'lucide-react';

export const OrientationWarning: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Check if mobile device and window height > window width
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || 
        (window.matchMedia && window.matchMedia('(max-width: 900px)').matches);
      
      const portrait = window.innerHeight > window.innerWidth && isMobile;
      setIsPortrait(portrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortrait) return null;

  return (
    <div className="orientation-warning-overlay">
      <div className="orientation-warning-card">
        <div className="device-rotate-animation">
          <Smartphone size={56} className="phone-icon" />
          <RotateCw size={28} className="rotate-arrow" />
        </div>
        <h2 className="warning-title">ROTATE DEVICE</h2>
        <p className="warning-text">
          <strong>Arena X</strong> is optimized for landscape combat. Please rotate your device sideways for the best fighting game experience.
        </p>
        <div className="warning-pill">LANDSCAPE MODE REQUIRED</div>
      </div>
    </div>
  );
};
