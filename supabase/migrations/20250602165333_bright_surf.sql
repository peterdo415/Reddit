/*
  # Initial Schema Setup

  1. Tables
    - users: User accounts and profiles
    - communities: Community/subreddit-like groups
    - posts: User submitted content
    - comments: Post comments with threading support
    - votes: Post voting system
    - user_communities: User community memberships
    
  2. Indexes
    - Optimized indexes for search and sorting
    - Full-text search for posts and communities
    - Hot score calculation indexes
    
  3. Views
    - post_hot_scores: Reddit-style hot ranking algorithm
    
  4. Security
    - Row Level Security (RLS) enabled on all tables
    - Appropriate policies for public/authenticated access
*/

-- Users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  password_hash TEXT,
  profile_image_url TEXT,
  bio TEXT,
  karma_score INT DEFAULT 0,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON users FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Communities table
CREATE TABLE communities (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  member_count INT DEFAULT 0,
  post_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Communities are viewable by everyone"
  ON communities FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Communities can be created by authenticated users"
  ON communities FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Communities can be updated by their creator"
  ON communities FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  community_id INT REFERENCES communities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  image_url TEXT,
  is_promoted BOOLEAN DEFAULT false,
  upvotes_count INT DEFAULT 0,
  downvotes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Posts can be created by authenticated users"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Posts can be updated by their author"
  ON posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  upvotes_count INT DEFAULT 0,
  downvotes_count INT DEFAULT 0,
  depth INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Comments can be created by authenticated users"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Comments can be updated by their author"
  ON comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Votes table
CREATE TABLE votes (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  vote_type SMALLINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Votes are viewable by everyone"
  ON votes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Votes can be created by authenticated users"
  ON votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Votes can be updated by their creator"
  ON votes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Votes can be deleted by their creator"
  ON votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- User Communities table
CREATE TABLE user_communities (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  community_id INT REFERENCES communities(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, community_id)
);

ALTER TABLE user_communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User communities are viewable by everyone"
  ON user_communities FOR SELECT
  TO public
  USING (true);

CREATE POLICY "User communities can be managed by the user"
  ON user_communities FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_karma_score ON users(karma_score DESC);

CREATE INDEX idx_communities_name ON communities(name);
CREATE INDEX idx_communities_display_name ON communities USING gin(to_tsvector('japanese', display_name));
CREATE INDEX idx_communities_created_at ON communities(created_at DESC);

CREATE INDEX idx_posts_community_created ON posts(community_id, created_at DESC);
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at DESC);
CREATE INDEX idx_posts_hot_score ON posts((upvotes_count - downvotes_count) DESC, created_at DESC);
CREATE INDEX idx_posts_search ON posts USING gin(to_tsvector('japanese', title || ' ' || COALESCE(body, '')));
CREATE INDEX idx_posts_promoted ON posts(is_promoted, created_at DESC);

CREATE INDEX idx_comments_post_created ON comments(post_id, created_at DESC);
CREATE INDEX idx_comments_parent_created ON comments(parent_comment_id, created_at DESC);
CREATE INDEX idx_comments_user_created ON comments(user_id, created_at DESC);
CREATE INDEX idx_comments_depth ON comments(depth);

CREATE INDEX idx_votes_post_type ON votes(post_id, vote_type);
CREATE INDEX idx_votes_user_created ON votes(user_id, created_at DESC);

CREATE INDEX idx_user_communities_user ON user_communities(user_id);
CREATE INDEX idx_user_communities_community ON user_communities(community_id);

-- Create hot score view
CREATE VIEW post_hot_scores AS
SELECT
  p.*,
  c.name AS community_name,
  c.display_name AS community_display_name,
  c.image_url AS community_image_url,
  u.username,
  u.profile_image_url,
  (
    log(greatest(abs(p.upvotes_count - p.downvotes_count),1)) / ln(10)
    + (
        CASE
          WHEN (p.upvotes_count - p.downvotes_count) > 0 THEN 1
          WHEN (p.upvotes_count - p.downvotes_count) < 0 THEN -1
          ELSE 0
        END
      ) * ((extract(epoch FROM p.created_at)::bigint - 1134028003) / 45000.0)
  ) AS hot_score
FROM posts p
LEFT JOIN communities c ON p.community_id = c.id
LEFT JOIN users u ON p.user_id = u.id
WHERE p.is_promoted = false;