'use client';

import { Restaurant } from '@/lib/types';

interface RestaurantCardProps {
  restaurant: Restaurant;
  isSelected?: boolean;
  onClick?: () => void;
  isInRoute?: boolean;
  onToggleRoute?: () => void;
}

export default function RestaurantCard({
  restaurant,
  isSelected,
  onClick,
  isInRoute,
  onToggleRoute,
}: RestaurantCardProps) {
  const handleRouteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleRoute?.();
  };

  return (
    <div
      onClick={onClick}
      className={`py-4 px-1 flex items-center transition-colors duration-150 ease-out ${
        onClick ? 'cursor-pointer' : ''
      } ${isSelected ? 'bg-gray-200' : 'bg-white'}`}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-black">
            {restaurant.name}
          </h3>
          {(restaurant.price || restaurant.cuisine) && (
            <p className="text-sm text-gray-600 mt-1">
              {restaurant.price && restaurant.cuisine
                ? `${restaurant.price} | ${restaurant.cuisine}`
                : restaurant.price || restaurant.cuisine}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 ml-4">
          {/* Bookmark icon (no text) */}
          {restaurant.isBookmarked && (
            <svg
              className="w-5 h-5 text-beli-teal fill-current"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          )}

          {/* Score badge with border */}
          <div className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center">
            <span className="text-green-600 font-semibold text-sm">
              {restaurant.beliScore.toFixed(1)}
            </span>
          </div>

          {/* Add to route / Remove button - Plus/Minus icon (far right) */}
          {onToggleRoute && (
            <button
              onClick={handleRouteClick}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                isInRoute
                  ? 'bg-transparent text-red-600 hover:bg-opacity-90 active:bg-opacity-80'
                  : 'bg-transparent text-beli-teal hover:bg-opacity-90 active:bg-opacity-80'
              }`}
            >
              {isInRoute ? (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

