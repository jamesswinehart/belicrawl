'use client';

import { useState, useEffect, useRef } from 'react';
import { Restaurant } from '@/lib/types';
import RestaurantCard from './RestaurantCard';
import BottomSheet from './BottomSheet';

const MAX_STOPS_MOBILE = 9;
const MAX_STOPS_DESKTOP = 11;

interface ResultsSheetProps {
  restaurants: Restaurant[];
  selectedRestaurantId?: string;
  onRestaurantClick: (restaurant: Restaurant) => void;
  onSearchAgain: () => void;
  routeStops: Restaurant[];
  onToggleRouteStop: (restaurant: Restaurant) => void;
  onRemoveRouteStop: (restaurantId: string) => void;
  onClearRouteStops: () => void;
  onCreateCrawl: () => void;
}

export default function ResultsSheet({
  restaurants,
  selectedRestaurantId,
  onRestaurantClick,
  onSearchAgain,
  routeStops,
  onToggleRouteStop,
  onCreateCrawl,
}: ResultsSheetProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const maxStops = isMobile ? MAX_STOPS_MOBILE : MAX_STOPS_DESKTOP;
  const sheetMaxHeight = isMobile ? '60vh' : '72vh';

  const handleToggleRoute = (restaurant: Restaurant) => {
    const isInRoute = routeStops.some((r) => r.id === restaurant.id);

    if (!isInRoute && routeStops.length >= maxStops) {
      setLimitMessage(`Google Maps supports up to ${maxStops} stops on this device.`);
      setTimeout(() => setLimitMessage(null), 3000);
      return;
    }

    // Select the restaurant to trigger sheet expansion
    onRestaurantClick(restaurant);
    onToggleRouteStop(restaurant);
    setLimitMessage(null);
  };

  const headerContent = (
    <h2 className="text-2xl font-serif font-bold text-beli-teal">Top Picks</h2>
  );

  const footerContent = (
    <>
      {/* Search Again button */}
      <button
        onClick={onSearchAgain}
        className="w-full bg-beli-teal text-white py-4 rounded-lg flex items-center justify-center font-medium hover:bg-beli-teal-dark active:bg-beli-teal-dark min-h-[48px]"
      >
        Search Again
      </button>
      {/* Create Crawl button */}
      <button
        onClick={onCreateCrawl}
        disabled={routeStops.length === 0}
        className={`w-full py-4 rounded-lg font-medium mt-3 flex items-center justify-center ${
          routeStops.length > 0
            ? 'bg-beli-teal text-white hover:bg-opacity-90 active:bg-opacity-80'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        Create Crawl
      </button>
    </>
  );

  // When the selected restaurant changes, scroll it into view within the list
  useEffect(() => {
    if (!selectedRestaurantId) return;
    const el = itemRefs.current[selectedRestaurantId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedRestaurantId, restaurants]);

  return (
    <BottomSheet
      headerContent={headerContent}
      footerContent={footerContent}
      maxHeight={sheetMaxHeight}
      expandOnChangeKey={selectedRestaurantId ?? null}
    >
      {/* Limit message */}
      {limitMessage && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">{limitMessage}</p>
        </div>
      )}

      {/* Restaurant list */}
      {restaurants.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No restaurants found in this area.
        </p>
      ) : (
        <div className="space-y-0 divide-y divide-gray-200">
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              ref={(el) => {
                if (el) {
                  itemRefs.current[restaurant.id] = el;
                }
              }}
            >
              <RestaurantCard
                restaurant={restaurant}
                isSelected={restaurant.id === selectedRestaurantId}
                onClick={() => onRestaurantClick(restaurant)}
                isInRoute={routeStops.some((r) => r.id === restaurant.id)}
                onToggleRoute={() => handleToggleRoute(restaurant)}
              />
            </div>
          ))}
        </div>
      )}
    </BottomSheet>
  );
}
