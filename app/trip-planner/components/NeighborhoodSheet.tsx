'use client';

import BottomSheet from './BottomSheet';

interface NeighborhoodSheetProps {
  cityName: string;
  onSelect: () => void;
}

export default function NeighborhoodSheet({
  cityName,
  onSelect,
}: NeighborhoodSheetProps) {
  const headerContent = (
    <>
      {/* Subtitle */}
      <p className="text-sm text-gray-500 mb-2">
        Nothing like {cityName}...
      </p>

      {/* Title */}
      <h2 className="text-2xl font-serif font-bold text-beli-teal mb-3">
        What part of town?
      </h2>
    </>
  );

  return (
    <BottomSheet headerContent={headerContent} maxHeight="40vh">
      {/* Helper text */}
      <p className="text-sm text-gray-700 mb-6">
        Drag and zoom to your desired neighborhood
      </p>

      {/* Select button */}
      <button
        onClick={onSelect}
        className="w-full bg-beli-teal text-white py-4 rounded-lg font-medium hover:bg-beli-teal-dark active:bg-beli-teal-dark transition-colors min-h-[48px] flex items-center justify-center"
      >
        Select
      </button>
    </BottomSheet>
  );
}

