/**
 * Shared configuration for all bottom sheets
 * Change these values in one place to update all sheets
 */

export const SHEET_CONFIG = {
  // How far the sheet moves down when expanded (in pixels)
  expandDistance: 120,
  
  // Drag handle visual size
  handleWidth: 'w-16',      // Tailwind width class (w-12 = 48px, w-16 = 64px, w-20 = 80px)
  handleHeight: 'h-1.5',    // Tailwind height class (h-1 = 4px, h-1.5 = 6px, h-2 = 8px)
  
  // Clickable area padding (increases click target without changing visual size)
  handleClickPadding: {
    top: '8px',
    bottom: '8px',
  },
  
  // Shadow styling
  shadow: '0 -4px 16px 4px rgba(0, 0, 0, 0.25)',
  
  // Transition timing
  transition: 'transform 0.3s ease-out',
} as const;

