'use client';
import { useRef, type ReactNode, type MouseEvent } from 'react';

/**
 * Card with a mouse-tracked radial glow (Aceternity "card spotlight").
 * The glow itself is painted by the `.spotlight-card::before` CSS layer;
 * this component only feeds it the cursor position via CSS variables, so
 * there are zero re-renders on mouse move.
 */
export default function SpotlightCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    el.style.setProperty('--my', `${e.clientY - rect.top}px`);
  }

  return (
    <div ref={ref} onMouseMove={handleMouseMove} className={`spotlight-card ${className}`}>
      {children}
    </div>
  );
}
