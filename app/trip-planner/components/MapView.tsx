'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Viewport, Restaurant } from '@/lib/types';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

interface MapViewProps {
  viewport: Viewport;
  onViewportChange: (viewport: Viewport) => void;
  onBoundsChange?: (bounds: {
    minLat: number;
    minLng: number;
    maxLat: number;
    maxLng: number;
  }) => void;
  restaurants?: Restaurant[];
  selectedRestaurantId?: string;
  onRestaurantClick?: (restaurant: Restaurant) => void;
}

export default function MapView({
  viewport,
  onViewportChange,
  onBoundsChange,
  restaurants = [],
  selectedRestaurantId,
  onRestaurantClick,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return;

    // Initialize map
    if (!map.current) {
      // Validate viewport values before initializing map
      const validLat = isFinite(viewport.latitude) && !isNaN(viewport.latitude) 
        ? viewport.latitude 
        : 40.3573; // Default to Princeton
      const validLng = isFinite(viewport.longitude) && !isNaN(viewport.longitude)
        ? viewport.longitude
        : -74.6553;
      const validZoom = isFinite(viewport.zoom) && !isNaN(viewport.zoom)
        ? viewport.zoom
        : 12;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        accessToken: MAPBOX_TOKEN,
        style: 'mapbox://styles/mapbox/standard',
        center: [validLng, validLat],
        zoom: validZoom,
      });

      // Set the Faded theme after map loads
      map.current.on('load', () => {
        if (map.current) {
          map.current.setConfigProperty('basemap', 'theme', 'faded');
        }
      });

      // Update viewport on move
      map.current.on('moveend', () => {
        if (!map.current) return;
        const center = map.current.getCenter();
        const zoom = map.current.getZoom();

        const newViewport: Viewport = {
          latitude: center.lat,
          longitude: center.lng,
          zoom,
        };
        onViewportChange(newViewport);

        // Calculate bounds
        if (onBoundsChange && map.current) {
          try {
            const bounds = map.current.getBounds();
            if (!bounds) return;
            
            const south = bounds.getSouth();
            const west = bounds.getWest();
            const north = bounds.getNorth();
            const east = bounds.getEast();
            
            // Validate bounds are valid numbers
            if (
              !isNaN(south) &&
              !isNaN(west) &&
              !isNaN(north) &&
              !isNaN(east) &&
              isFinite(south) &&
              isFinite(west) &&
              isFinite(north) &&
              isFinite(east)
            ) {
              onBoundsChange({
                minLat: south,
                minLng: west,
                maxLat: north,
                maxLng: east,
              });
            }
          } catch (error) {
            console.error('Error getting map bounds:', error);
          }
        }
      });
    }

    return () => {
      // Cleanup markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update map center/zoom when viewport changes externally
  useEffect(() => {
    if (map.current) {
      // Validate viewport values before using them
      if (
        isNaN(viewport.latitude) ||
        isNaN(viewport.longitude) ||
        isNaN(viewport.zoom) ||
        !isFinite(viewport.latitude) ||
        !isFinite(viewport.longitude) ||
        !isFinite(viewport.zoom)
      ) {
        return;
      }

      const center = map.current.getCenter();
      const zoom = map.current.getZoom();

      if (
        Math.abs(center.lat - viewport.latitude) > 0.0001 ||
        Math.abs(center.lng - viewport.longitude) > 0.0001 ||
        Math.abs(zoom - viewport.zoom) > 0.1
      ) {
        map.current.flyTo({
          center: [viewport.longitude, viewport.latitude],
          zoom: viewport.zoom,
          duration: 500,
        });
      }
    }
  }, [viewport]);

  // Update restaurant markers
  useEffect(() => {
    if (!map.current) return;

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    restaurants.forEach((restaurant) => {
      // Validate restaurant coordinates
      if (
        isNaN(restaurant.lat) ||
        isNaN(restaurant.lng) ||
        !isFinite(restaurant.lat) ||
        !isFinite(restaurant.lng)
      ) {
        console.warn('Skipping restaurant with invalid coordinates:', restaurant);
        return;
      }

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'restaurant-marker';

      const isSelected = restaurant.id === selectedRestaurantId;
      // Keep the same color but grow the dot when selected, with smooth animation
      el.style.width = isSelected ? '40px' : '24px';
      el.style.height = isSelected ? '40px' : '24px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#00505E';
      el.style.border = '2px solid white';
      el.style.cursor = 'pointer';
      el.style.boxShadow = isSelected
        ? '0 4px 8px rgba(0,0,0,0.3)'
        : '0 2px 4px rgba(0,0,0,0.2)';
      el.style.transition =
        'width 150ms ease-out, height 150ms ease-out, box-shadow 150ms ease-out, background-color 150ms ease-out';

      // Add inner dot
      const innerDot = document.createElement('div');
      innerDot.style.width = isSelected ? '12px' : '8px';
      innerDot.style.height = isSelected ? '12px' : '8px';
      innerDot.style.borderRadius = '50%';
      innerDot.style.backgroundColor = 'white';
      innerDot.style.position = 'absolute';
      innerDot.style.top = '50%';
      innerDot.style.left = '50%';
      innerDot.style.transform = 'translate(-50%, -50%)';
      innerDot.style.transition = 'width 150ms ease-out, height 150ms ease-out';
      el.appendChild(innerDot);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([restaurant.lng, restaurant.lat])
        .addTo(map.current!);

      if (onRestaurantClick) {
        el.addEventListener('click', () => {
          onRestaurantClick(restaurant);
        });
      }

      markersRef.current.push(marker);
    });
  }, [restaurants, selectedRestaurantId, onRestaurantClick]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-full"
      style={{ 
        minHeight: '400px',
      }}
    />
  );
}

