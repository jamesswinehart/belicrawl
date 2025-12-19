'use client';

import { useState, useEffect, useRef } from 'react';
import { GeocodeResult } from '@/lib/types';
import BottomSheet from './BottomSheet';
import { haversineDistance } from '@/lib/utils';

interface CitySearchSheetProps {
  onCitySelect: (city: string, center: [number, number]) => void;
}

interface NearbyCity {
  name: string;
  center: [number, number]; // [lng, lat]
}

const NEARBY_CITIES: NearbyCity[] = [
  { name: 'Princeton, NJ', center: [-74.6609, 40.3493] },
  { name: 'New York, NY', center: [-74.006, 40.7128] },
];

export default function CitySearchSheet({ onCitySelect }: CitySearchSheetProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sortedNearbyCities, setSortedNearbyCities] = useState<NearbyCity[]>(NEARBY_CITIES);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // If geolocation fails, use default order
          setUserLocation(null);
        }
      );
    }
  }, []);

  // Sort nearby cities by distance when user location is available
  useEffect(() => {
    if (!userLocation) {
      setSortedNearbyCities(NEARBY_CITIES);
      return;
    }

    const citiesWithDistance = NEARBY_CITIES.map((city) => {
      const distance = haversineDistance(
        userLocation.lat,
        userLocation.lng,
        city.center[1], // lat
        city.center[0] // lng
      );
      return { ...city, distance };
    });

    // Sort by distance (closest first)
    citiesWithDistance.sort((a, b) => a.distance - b.distance);
    setSortedNearbyCities(citiesWithDistance.map(({ distance, ...city }) => city));
  }, [userLocation]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        setSuggestions(data.results || []);
      } catch (error) {
        console.error('Geocoding error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  const handleCityClick = (cityName: string, center: [number, number]) => {
    onCitySelect(cityName, center);
    setSearchQuery('');
    setSuggestions([]);
  };

  const headerContent = (
    <>
      <h1 className="text-3xl font-serif font-bold text-beli-teal mb-1">Beli Crawl</h1>
      <p className="text-xs text-gray-600">
        A foodie trip planner powered by <span className="text-beli-teal font-serif font-bold">beli</span>
      </p>
    </>
  );

  return (
    <BottomSheet headerContent={headerContent}>
      {/* Search section */}
      <div className="mb-6">
        <h2 className="text-xl font-serif font-bold text-beli-teal mb-3">Where to?</h2>
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="New York, Princeton, etc."
            className="w-full pl-10 pr-4 py-3.5 bg-gray-100 rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-beli-teal text-base text-beli-teal sm:text-black"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </div>

        {/* Autocomplete suggestions */}
        {suggestions.length > 0 && (
          <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleCityClick(suggestion.name, suggestion.center)}
                className="w-full text-left px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 border-b border-gray-100 last:border-b-0 min-h-[44px] flex items-center text-gray-900"
              >
                {suggestion.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Nearby section */}
      <div>
        <h3 className="text-sm font-semibold text-black mb-3">Nearby</h3>
        <div className="space-y-0">
          {sortedNearbyCities.map((city, idx) => (
            <button
              key={idx}
              onClick={() => handleCityClick(city.name, city.center)}
              className="w-full text-left py-3.5 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 active:bg-gray-100 min-h-[44px] flex items-center"
            >
              {city.name}
            </button>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}
