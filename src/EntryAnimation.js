import React, { useState, useEffect } from 'react';
import './EntryAnimation.css';

const EntryAnimation = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 600);
    }, 2800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className="entry-animation">
      <img src="/entry-image.png" alt="Damru" className="damru" />
      <div className="sacred-text">
        Namah Parvati Pataye<br />&nbsp;&nbsp;Har Har Mahadev
      </div>
    </div>
  );
};

export default EntryAnimation;
