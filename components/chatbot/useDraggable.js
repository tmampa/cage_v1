'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Drag-handle hook for the desktop chatbot window.
 *
 * Returns refs and handlers the consumer wires up to the draggable element.
 * Constrains motion to the viewport based on `width`/`height` overrides.
 */
export function useDraggable({ initialPosition, onPositionChange, width = 380, height = 600 }) {
  const widgetRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentPosition, setCurrentPosition] = useState(initialPosition);

  // Sync external position changes back into local state (e.g. window resize).
  useEffect(() => {
    setCurrentPosition(initialPosition);
  }, [initialPosition]);

  const handleDragStart = (e) => {
    if (!e.target.closest('.drag-handle')) return;

    setIsDragging(true);
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

    const rect = widgetRef.current.getBoundingClientRect();
    setDragOffset({
      x: clientX - rect.left,
      y: clientY - rect.top,
    });
  };

  // Window-level move/end listeners are attached only while dragging
  // to avoid spamming the event loop when the widget is idle.
  useEffect(() => {
    if (!isDragging) return undefined;

    const move = (e) => {
      e.preventDefault();
      const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
      const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

      let newX = clientX - dragOffset.x;
      let newY = clientY - dragOffset.y;

      const maxX = window.innerWidth - width;
      const maxY = window.innerHeight - height;

      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
      setCurrentPosition({ x: newX, y: newY });
    };

    const end = () => {
      setIsDragging(false);
      onPositionChange?.(currentPosition.x, currentPosition.y);
    };

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    window.addEventListener('touchmove', move);
    window.addEventListener('touchend', end);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', end);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
    };
  }, [isDragging, dragOffset, currentPosition, onPositionChange, width, height]);

  return {
    widgetRef,
    isDragging,
    currentPosition,
    handleDragStart,
  };
}
