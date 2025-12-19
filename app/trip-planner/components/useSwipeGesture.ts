'use client';

import { useRef, useState, useEffect } from 'react';

interface UseSwipeGestureOptions {
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum distance in pixels to trigger swipe
  enabled?: boolean;
  elementRef?: React.RefObject<HTMLElement | null>;
}

export function useSwipeGesture({
  onSwipeUp,
  onSwipeDown,
  threshold = 40, // Default threshold
  enabled = true,
  elementRef,
}: UseSwipeGestureOptions) {
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOccurredRef = useRef(false);

  useEffect(() => {
    const element = elementRef?.current;
    if (!enabled || !element) {
      console.log('Swipe gesture: element not available', { enabled, element: !!element });
      return;
    }

    // Find the sheet header element
    const sheetHeader = element.querySelector('[data-sheet-header]') as HTMLElement;
    if (!sheetHeader) {
      console.log('Swipe gesture: sheet header not found', element);
      return;
    }

    console.log('Swipe gesture: Setting up event listeners on', sheetHeader);

    let isTracking = false;

    // Use pointer events which work for both touch and mouse
    const handlePointerDown = (e: PointerEvent) => {
      console.log('Pointer down', e.target);
      const target = e.target as HTMLElement;
      if (!sheetHeader.contains(target)) {
        isTracking = false;
        return;
      }

      // Only track primary button (left mouse button or touch)
      if (e.button !== 0 && e.pointerType !== 'touch') return;

      console.log('Tracking pointer down', e.clientY);
      dragOccurredRef.current = false; // Reset on new pointer down
      touchStartY.current = e.clientY;
      touchStartX.current = e.clientX;
      isTracking = true;
      setIsDragging(true);
      
      // Capture the pointer to track movement outside the element
      try {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      } catch (err) {
        console.log('Could not capture pointer', err);
      }
      e.preventDefault();
      e.stopPropagation(); // Prevent click events
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isTracking || touchStartY.current === null || touchStartX.current === null) return;
      
      const deltaY = e.clientY - touchStartY.current;
      const deltaX = Math.abs(e.clientX - (touchStartX.current || 0));

      // Only handle vertical drags/swipes
      if (Math.abs(deltaY) > deltaX && Math.abs(deltaY) > 5) {
        e.preventDefault();
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      console.log('Pointer up', { isTracking, hasStartY: touchStartY.current !== null });
      if (!isTracking || touchStartY.current === null) {
        isTracking = false;
        setIsDragging(false);
        return;
      }

      const deltaY = e.clientY - touchStartY.current;
      const deltaX = Math.abs(e.clientX - (touchStartX.current || 0));

      console.log('Pointer up calculation', { deltaY, deltaX, threshold, absDeltaY: Math.abs(deltaY) });

      // Only trigger swipe if vertical movement is dominant and exceeds threshold
      if (Math.abs(deltaY) > deltaX && Math.abs(deltaY) > threshold) {
        console.log('Swipe detected!', deltaY > 0 ? 'down' : 'up');
        dragOccurredRef.current = true; // Mark that a drag occurred
        e.preventDefault();
        e.stopPropagation();
        
        // Prevent click event from firing
        const target = e.target as HTMLElement;
        if (target) {
          target.style.pointerEvents = 'none';
          setTimeout(() => {
            target.style.pointerEvents = '';
          }, 100);
        }
        
        if (deltaY > 0 && onSwipeDown) {
          console.log('Calling onSwipeDown');
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          console.log('Calling onSwipeUp');
          onSwipeUp();
        }
      } else {
        // No significant drag, allow click
        dragOccurredRef.current = false;
      }

      // Release pointer capture
      if (e.target) {
        try {
          (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        } catch (err) {
          // Ignore errors if pointer capture wasn't set
        }
      }

      touchStartY.current = null;
      touchStartX.current = null;
      isTracking = false;
      setIsDragging(false);
    };

    const handlePointerCancel = () => {
      touchStartY.current = null;
      touchStartX.current = null;
      isTracking = false;
      setIsDragging(false);
    };

    // Attach pointer event listeners (works for both touch and mouse)
    sheetHeader.addEventListener('pointerdown', handlePointerDown);
    // Use document for move/up to track movement outside the header
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerCancel);

    return () => {
      sheetHeader.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerCancel);
    };
  }, [onSwipeUp, onSwipeDown, threshold, enabled, elementRef]);

  // Expose a function to check if drag occurred (for click handlers)
  const checkDragOccurred = () => {
    const occurred = dragOccurredRef.current;
    if (occurred) {
      dragOccurredRef.current = false; // Reset after checking
    }
    return occurred;
  };

  return { isDragging, checkDragOccurred };
}