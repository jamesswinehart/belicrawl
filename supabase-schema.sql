-- TODO: Run this SQL in your Supabase SQL editor to create the restaurants table

CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  address TEXT,
  beli_score NUMERIC,       -- 0–10, mock Beli rating
  is_bookmarked BOOLEAN,    -- mock bookmark flag
  tags TEXT[],              -- optional, e.g. ['dumplings', 'casual']
  price TEXT,               -- Price range: $, $$, $$$, $$$$
  cuisine TEXT,             -- Type of food/cuisine, e.g. 'American', 'Italian', 'Chinese'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index on city for faster queries
CREATE INDEX IF NOT EXISTS idx_restaurants_city ON restaurants(city);

-- Create an index on coordinates for spatial queries (basic bounding box)
CREATE INDEX IF NOT EXISTS idx_restaurants_lat ON restaurants(lat);
CREATE INDEX IF NOT EXISTS idx_restaurants_lng ON restaurants(lng);

-- Migration: Add price and cuisine columns if they don't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'price') THEN
    ALTER TABLE restaurants ADD COLUMN price TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'cuisine') THEN
    ALTER TABLE restaurants ADD COLUMN cuisine TEXT;
  END IF;
END $$;

-- Example seed data for Princeton, NJ
-- TODO: Add more restaurants for testing

INSERT INTO restaurants (name, city, lat, lng, address, beli_score, is_bookmarked, tags, price, cuisine) VALUES
  ('Din Tai Fung', 'Princeton, NJ', 40.3573, -74.6553, '123 Nassau St', 9.3, true, ARRAY['dumplings', 'fine dining'], '$$$', 'Chinese'),
  ('Princeton University Art Museum', 'Princeton, NJ', 40.3481, -74.6586, 'McCormick Hall', 8.5, false, ARRAY['museum', 'cultural'], NULL, 'Museum'),
  ('Local Restaurant', 'Princeton, NJ', 40.3600, -74.6500, '456 Main St', 7.8, false, ARRAY['casual', 'american'], '$$', 'American'),
  ('Cafe Corner', 'Princeton, NJ', 40.3550, -74.6600, '789 University Pl', 8.2, true, ARRAY['cafe', 'coffee'], '$', 'Cafe');

-- Example seed data for New York, NY
INSERT INTO restaurants (name, city, lat, lng, address, beli_score, is_bookmarked, tags, price, cuisine) VALUES
  ('Din Tai Fung', 'New York, NY', 40.7589, -73.9851, '123 W 57th St', 9.5, true, ARRAY['dumplings', 'fine dining'], '$$$', 'Chinese'),
  ('Joe''s Pizza', 'New York, NY', 40.7282, -73.9942, '7 Carmine St', 8.7, false, ARRAY['pizza', 'casual'], '$', 'Pizza'),
  ('Le Bernardin', 'New York, NY', 40.7614, -73.9776, '155 W 51st St', 9.8, true, ARRAY['fine dining', 'french'], '$$$$', 'French'),
  ('Katz''s Delicatessen', 'New York, NY', 40.7224, -73.9875, '205 E Houston St', 9.0, false, ARRAY['deli', 'sandwiches'], '$$', 'Deli');

