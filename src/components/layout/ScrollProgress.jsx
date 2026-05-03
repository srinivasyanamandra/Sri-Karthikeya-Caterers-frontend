import React from 'react';
import useScrollProgress from '../../hooks/useScrollProgress';

/** Top-of-page progress bar driven by `--scroll` CSS variable on <html>. */
const ScrollProgress = () => {
  useScrollProgress();
  return <div className="scroll-progress" aria-hidden="true" />;
};

export default React.memo(ScrollProgress);
