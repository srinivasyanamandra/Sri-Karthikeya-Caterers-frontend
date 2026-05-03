import React, { useEffect, useRef, useState } from 'react';
import './EntryAnimation.css';
import { CONTACT } from './constants/contact';

/* Timing — coordinated between JS state and CSS animations.
   Compressed from 3,100 ms total → 2,000 ms (35 % faster) while preserving
   the layered cascade. CSS keyframe durations in EntryAnimation.css were
   tightened in lockstep so each element still arrives cleanly before exit. */
const ENTRY_HOLD = 1500;     // mantra finishes ~1500ms; no extra dwell
const EXIT_DURATION = 500;   // CSS exit animation length

/**
 * EntryAnimation — opening splash.
 *
 * Composition is intentionally one centred column:
 *   glow → symbol → brand → divider → mantra
 * Each element arrives in sequence (cascading reveal), then exits in reverse
 * order with a layered fade so the user perceives one orchestrated motion.
 *
 * The latest onComplete is captured via ref so parent re-renders during the
 * splash do not restart the timers.
 */
const EntryAnimation = ({ onComplete }) => {
  const [exiting, setExiting] = useState(false);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    const exitTimer = window.setTimeout(() => setExiting(true), ENTRY_HOLD);
    const completeTimer = window.setTimeout(() => {
      onCompleteRef.current?.();
    }, ENTRY_HOLD + EXIT_DURATION);
    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(completeTimer);
    };
  }, []);

  return (
    <div
      className={`entry-animation${exiting ? ' is-exiting' : ''}`}
      role="presentation"
      aria-hidden="true"
    >
      <div className="entry-stage">
        <span className="entry-glow" aria-hidden="true" />
        <img src="/entry-image.png" alt="" className="entry-symbol" />
        <span className="entry-brand">{CONTACT.brand}</span>
        <span className="entry-divider" aria-hidden="true">
          <span className="entry-divider-rule" />
          <span className="entry-divider-mark">◆</span>
          <span className="entry-divider-rule entry-divider-rule-right" />
        </span>
        <span className="entry-mantra">
          Namah Parvati Pataye<br />Har Har Mahadev
        </span>
      </div>
    </div>
  );
};

export default EntryAnimation;
