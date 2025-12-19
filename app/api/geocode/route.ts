import { NextRequest, NextResponse } from 'next/server';
import { GeocodeResult } from '@/lib/types';

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: 'Missing query parameter' },
        { status: 400 }
      );
    }

    if (!MAPBOX_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'Mapbox access token not configured' },
        { status: 500 }
      );
    }

    // Call Mapbox Geocoding API
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      query
    )}.json?access_token=${MAPBOX_ACCESS_TOKEN}&types=place&limit=5`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Geocoding API error' },
        { status: response.status }
      );
    }

    // Transform Mapbox response to our format
    const results: GeocodeResult[] = (data.features || []).map((feature: any) => ({
      name: feature.place_name,
      center: feature.center, // [lng, lat]
      placeType: feature.place_type?.[0] || 'place',
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

