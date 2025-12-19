'use client';

import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useDragControls } from 'framer-motion';

interface BottomSheetProps {
  children: ReactNode;
  headerContent?: ReactNode;
  footerContent?: ReactNode;
  className?: string;
  maxHeight?: string; // e.g. "70vh"
  /**
   * When this value changes, the sheet will auto-expand to the top snap point.
   * Useful for cases like selecting an item in the list or on the map.
   */
  expandOnChangeKey?: string | number | null;
  /** Optional override for bottom padding inside the scrollable content area */
  contentBottomPadding?: string;
}

// Three snap points: expanded (top), collapsed (normal), minimized (handle-only)
const COLLAPSED_PEEK_PX = 420;
const MINIMIZED_PEEK_PX = 80;
const VELOCITY_THRESHOLD = 800;

export default function BottomSheet({
  children,
  headerContent,
  footerContent,
  className = '',
  maxHeight = '70vh',
  expandOnChangeKey,
  contentBottomPadding,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const y = useMotionValue(0); // 0 = expanded, positive = moved down
  const dragControls = useDragControls();

  const [sheetHeightPx, setSheetHeightPx] = useState(0);
  const [headerHeightPx, setHeaderHeightPx] = useState(0);
  const [footerHeightPx, setFooterHeightPx] = useState(0);
  const [snap, setSnap] = useState<'expanded' | 'collapsed' | 'minimized'>('collapsed');

  // Better mobile behavior: vh that respects browser chrome
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', setVh);
    return () => {
      window.removeEventListener('resize', setVh);
      window.removeEventListener('orientationchange', setVh);
    };
  }, []);

  // Measure sheet/header/footer heights
  useEffect(() => {
    const measure = () => {
      if (sheetRef.current) setSheetHeightPx(sheetRef.current.getBoundingClientRect().height);
      if (headerRef.current) setHeaderHeightPx(headerRef.current.getBoundingClientRect().height);
      if (footerRef.current) setFooterHeightPx(footerRef.current.getBoundingClientRect().height);
    };

    measure();

    const ros: ResizeObserver[] = [];
    if (sheetRef.current) {
      const ro = new ResizeObserver(measure);
      ro.observe(sheetRef.current);
      ros.push(ro);
    }
    if (headerRef.current) {
      const ro = new ResizeObserver(measure);
      ro.observe(headerRef.current);
      ros.push(ro);
    }
    if (footerRef.current) {
      const ro = new ResizeObserver(measure);
      ro.observe(footerRef.current);
      ros.push(ro);
    }

    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      ros.forEach((ro) => ro.disconnect());
    };
  }, [headerContent, footerContent]);

  const { collapsedY, minimizedY } = useMemo(() => {
    // Collapsed: keep a usable content viewport
    const minVisibleCollapsed = Math.max(COLLAPSED_PEEK_PX, headerHeightPx + footerHeightPx + 120);
    const collapsed = Math.max(0, sheetHeightPx - minVisibleCollapsed);

    // Minimized: show mostly the handle/header (and preserve safe spacing)
    const minVisibleMinimized = Math.max(MINIMIZED_PEEK_PX, headerHeightPx + 8);
    const minimized = Math.max(0, sheetHeightPx - minVisibleMinimized);

    // Ensure ordering: expanded (0) <= collapsed <= minimized
    return {
      collapsedY: Math.min(collapsed, minimized),
      minimizedY: Math.max(minimized, collapsed),
    };
  }, [sheetHeightPx, headerHeightPx, footerHeightPx]);

  const constraints = useMemo(
    () => ({ top: 0, bottom: minimizedY }),
    [minimizedY]
  );

  // Snap animation when state changes
  useEffect(() => {
    const target = snap === 'expanded' ? 0 : snap === 'collapsed' ? collapsedY : minimizedY;
    const controls = animate(y, target, {
      type: 'spring',
      stiffness: 420,
      damping: 42,
    });
    return () => controls.stop();
  }, [snap, collapsedY, minimizedY, y]);

  const handleDragEnd = (_: any, info: { velocity: { y: number } }) => {
    const vY = info?.velocity?.y ?? 0;
    const currentY = y.get();

    // Fast flicks
    if (vY < -VELOCITY_THRESHOLD) {
      setSnap('expanded');
      return;
    }
    if (vY > VELOCITY_THRESHOLD) {
      // If already collapsed-ish, allow minimizing on a strong downward flick
      setSnap(currentY > (collapsedY + minimizedY) / 2 ? 'minimized' : 'collapsed');
      return;
    }

    // No strong velocity: choose nearest snap point
    const dExpanded = Math.abs(currentY - 0);
    const dCollapsed = Math.abs(currentY - collapsedY);
    const dMin = Math.abs(currentY - minimizedY);

    const next = dExpanded <= dCollapsed && dExpanded <= dMin
      ? 'expanded'
      : dCollapsed <= dMin
        ? 'collapsed'
        : 'minimized';

    setSnap(next);
  };

  const handleToggle = () => {
    setSnap((s) => (s === 'expanded' ? 'collapsed' : s === 'collapsed' ? 'minimized' : 'expanded'));
  };

  // When expandOnChangeKey changes, force the sheet to the expanded snap point
  useEffect(() => {
    if (expandOnChangeKey === null || expandOnChangeKey === undefined) return;
    setSnap('expanded');
  }, [expandOnChangeKey]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <motion.div
        ref={sheetRef}
        className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-sheet-top z-10 flex flex-col min-h-0 overflow-hidden pointer-events-auto ${className}`}
        style={{
          y,
          // Prefer innerHeight-based vh on mobile
          height: `min(calc(var(--vh, 1vh) * 100), ${maxHeight})`,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
        drag="y"
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={constraints}
        dragElastic={0.08}
        onDragEnd={handleDragEnd}
      >
        {/* Drag handle + optional header */}
        <div
          ref={headerRef}
          className="shrink-0"
        >
          <div
            className="flex items-center justify-center mt-3 mb-4"
            onClick={handleToggle}
            onPointerDown={(e) => {
              // Only allow dragging the sheet from the handle area.
              // This prevents scroll gestures in the content area from collapsing/minimizing the sheet.
              e.stopPropagation();
              dragControls.start(e);
            }}
            style={{ touchAction: 'none' }}
          >
            <button
              type="button"
              aria-label="Toggle sheet"
              className="w-12 h-6 flex items-center justify-center"
            >
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </button>
          </div>

          {headerContent && <div className="px-4 sm:px-8 mb-4">{headerContent}</div>}
        </div>

        {/* Scrollable content */}
        <div
          className="flex-1 min-h-0 px-4 sm:px-8 overflow-y-auto"
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
            overscrollBehavior: 'contain',
            // Leave a configurable gap above the footer when it's visible.
            paddingBottom:
              contentBottomPadding !== undefined
                ? contentBottomPadding
                : footerContent && snap !== 'minimized'
                ? '1.5rem'
                : '0.75rem',
          }}
        >
          {children}
        </div>

        {/* Footer (hidden when sheet is fully minimized) */}
        {footerContent && snap !== 'minimized' && (
          <div
            ref={footerRef}
            className="shrink-0 px-4 sm:px-8 pb-6 sm:pb-8 pt-4 bg-white"
            style={{ boxShadow: '0px -8px 20px rgba(0,0,0,0.06)' }}
          >
            {footerContent}
          </div>
        )}
      </motion.div>
    </div>
  );
}
