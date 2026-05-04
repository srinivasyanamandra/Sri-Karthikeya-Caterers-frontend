import React from 'react';
import useScrollReveal from '../../hooks/useScrollReveal';

/**
 * Reveal — wraps children in an element that fades + lifts in when scrolled into view.
 * Polymorphic via `as` prop (defaults to <div>).
 *
 * Usage:
 *   <Reveal>...</Reveal>
 *   <Reveal as="section" delay={2} className="my-class">...</Reveal>
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {0|1|2|3|4|5} [props.delay=0] - Stagger index; maps to `.reveal-delay-N` class.
 * @param {React.ElementType} [props.as='div'] - Element tag to render.
 * @param {string} [props.className]
 */
const Reveal = ({ children, delay = 0, as: Tag = 'div', className = '', ...rest }) => {
  const [ref, visible] = useScrollReveal();
  const delayClass = delay ? ` reveal-delay-${delay}` : '';
  const visibleClass = visible ? ' is-visible' : '';
  const composed = `reveal${visibleClass}${delayClass}${className ? ` ${className}` : ''}`;

  return (
    <Tag ref={ref} className={composed} {...rest}>
      {children}
    </Tag>
  );
};

export default Reveal;
