/*
  # Add Japanese text search support
  
  1. Changes
    - Create Japanese text search configuration using pg_jieba
    - Update text search indexes to use Japanese configuration
*/

-- Create Japanese text search configuration
CREATE TEXT SEARCH CONFIGURATION japanese (
    PARSER = "pg_jieba.jieba_parser"
);

ALTER TEXT SEARCH CONFIGURATION japanese
    ADD MAPPING FOR n,v,a,i,e,l
    WITH simple;

-- Drop existing indexes that use text search
DROP INDEX IF EXISTS idx_communities_display_name;
DROP INDEX IF EXISTS idx_posts_search;

-- Recreate indexes with Japanese configuration
CREATE INDEX idx_communities_display_name ON communities USING gin(to_tsvector('japanese', display_name));
CREATE INDEX idx_posts_search ON posts USING gin(to_tsvector('japanese', title || ' ' || COALESCE(body, '')));