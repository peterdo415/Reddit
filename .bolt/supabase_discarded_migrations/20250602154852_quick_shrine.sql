/*
  # Fix text search indexes

  1. Changes
    - Drop existing text search indexes that use 'japanese' configuration
    - Recreate indexes using 'english' configuration for better compatibility
    
  2. Affected Tables
    - communities
    - posts
*/

-- Drop existing text search indexes
DROP INDEX IF EXISTS idx_communities_display_name;
DROP INDEX IF EXISTS idx_posts_search;

-- Recreate indexes with english configuration
CREATE INDEX idx_communities_display_name ON communities USING gin(to_tsvector('english', display_name));
CREATE INDEX idx_posts_search ON posts USING gin(to_tsvector('english', title || ' ' || COALESCE(body, '')));