import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { Restaurant, Bounds } from '@/lib/types';
import {
  haversineDistance,
  computeTripScore,
} from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { 
          error: 'Supabase not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local' 
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { city, bounds, center }: {
      city: string;
      bounds: Bounds;
      center: { lat: number; lng: number };
    } = body;

    if (!city || !bounds || !center) {
      return NextResponse.json(
        { error: 'Missing required fields: city, bounds, center' },
        { status: 400 }
      );
    }

    // Expand bounds slightly to include restaurants just outside the visible area
    // This buffer (~0.01 degrees ≈ 1km) ensures nearby restaurants aren't excluded
    const BOUNDS_BUFFER = 0.01;
    const expandedBounds = {
      minLat: bounds.minLat - BOUNDS_BUFFER,
      maxLat: bounds.maxLat + BOUNDS_BUFFER,
      minLng: bounds.minLng - BOUNDS_BUFFER,
      maxLng: bounds.maxLng + BOUNDS_BUFFER,
    };
    
    // Query restaurants within expanded bounds
    // Note: Supabase doesn't have native spatial queries, so we filter in the query
    // For production, consider using PostGIS extension
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('*')
      .gte('lat', expandedBounds.minLat)
      .lte('lat', expandedBounds.maxLat)
      .gte('lng', expandedBounds.minLng)
      .lte('lng', expandedBounds.maxLng);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch restaurants' },
        { status: 500 }
      );
    }

    // Debug logging
    console.log('🔍 Restaurant Query Debug:', {
      city,
      originalBounds: bounds,
      expandedBounds,
      center,
      foundCount: restaurants?.length || 0,
      restaurants: restaurants?.map(r => ({
        id: r.id,
        name: r.name,
        city: r.city,
        lat: r.lat,
        lng: r.lng,
        inOriginalBounds: r.lat >= bounds.minLat && r.lat <= bounds.maxLat && 
                          r.lng >= bounds.minLng && r.lng <= bounds.maxLng,
        inExpandedBounds: r.lat >= expandedBounds.minLat && r.lat <= expandedBounds.maxLat && 
                          r.lng >= expandedBounds.minLng && r.lng <= expandedBounds.maxLng
      }))
    });

    if (!restaurants || restaurants.length === 0) {
      return NextResponse.json({ restaurants: [] });
    }

    // Transform and score restaurants
    const scoredRestaurants: Restaurant[] = restaurants.map((r: any) => {
      const distanceMeters = haversineDistance(
        center.lat,
        center.lng,
        r.lat,
        r.lng
      );

      const score = computeTripScore(
        distanceMeters,
        r.beli_score || 0,
        r.is_bookmarked || false
      );

      // Extract cuisine from tags (use first tag as cuisine if available)
      const cuisine = r.cuisine || (r.tags && r.tags.length > 0 ? r.tags[0] : undefined);

      return {
        id: r.id,
        name: r.name,
        city: r.city,
        lat: r.lat,
        lng: r.lng,
        address: r.address,
        beliScore: r.beli_score || 0,
        isBookmarked: r.is_bookmarked || false,
        tags: r.tags || [],
        price: r.price,
        cuisine,
        distanceMeters,
        score,
      };
    });

    // Sort by highest Beli score first, then by proximity as a tie-breaker
    scoredRestaurants.sort((a, b) => {
      const scoreDiff = (b.beliScore || 0) - (a.beliScore || 0);
      if (scoreDiff !== 0) return scoreDiff;
      // If Beli scores are equal, prefer closer restaurants
      return (a.distanceMeters || 0) - (b.distanceMeters || 0);
    });

    return NextResponse.json({ restaurants: scoredRestaurants });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

