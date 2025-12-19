export type Restaurant = {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  address?: string;
  beliScore: number;
  isBookmarked: boolean;
  tags?: string[];
  distanceMeters?: number;
  score?: number;
  price?: string; // Price range: $, $$, $$$, $$$$
  cuisine?: string; // Type of food/cuisine
};

export type Viewport = {
  latitude: number;
  longitude: number;
  zoom: number;
};

export type Bounds = {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
};

export type GeocodeResult = {
  name: string;
  center: [number, number]; // [lng, lat]
  placeType: string;
};

