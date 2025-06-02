/*
  # Seed Data

  1. Default Communities
    - news, tech, gaming, sports, entertainment
  
  2. Test Data
    - Sample users
    - Community memberships
    - Posts with varying content
    - Comments with threading
    - Votes
*/

-- Default communities
INSERT INTO communities (name, display_name, description, image_url) VALUES
  ('news', 'ニュース', '最新のニュースと話題', 'https://images.pexels.com/photos/518543/pexels-photo-518543.jpeg'),
  ('tech', 'テクノロジー', '技術とイノベーションについて', 'https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg'),
  ('gaming', 'ゲーム', 'ゲームに関する話題', 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg'),
  ('sports', 'スポーツ', 'スポーツニュースと議論', 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg'),
  ('entertainment', 'エンタメ', '映画、音楽、芸能情報', 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg');

-- Test users
WITH user_data AS (
  SELECT
    gen_random_uuid() as id,
    'user' || i || '@example.com' as email,
    'user_' || i as username,
    'Bio for user ' || i as bio,
    'https://api.dicebear.com/7.x/avatars/svg?seed=' || i as profile_image_url,
    floor(random() * 200 + 50) as karma_score
  FROM generate_series(1, 5) i
)
INSERT INTO users (
  id, email, username, bio, profile_image_url, karma_score,
  email_verified, created_at, updated_at
)
SELECT
  id, email, username, bio, profile_image_url, karma_score,
  true, NOW(), NOW()
FROM user_data;

-- User-community relationships
INSERT INTO user_communities (user_id, community_id)
SELECT 
  u.id,
  c.id
FROM users u
CROSS JOIN communities c
WHERE random() < 0.7;

-- Sample posts
WITH post_data AS (
  SELECT
    gen_random_uuid() as id,
    (SELECT id FROM users ORDER BY random() LIMIT 1) as user_id,
    (SELECT id FROM communities ORDER BY random() LIMIT 1) as community_id,
    (
      CASE floor(random() * 5)
        WHEN 0 THEN '新しい技術の発表について'
        WHEN 1 THEN '今日のスポーツハイライト'
        WHEN 2 THEN '話題の新作ゲームレビュー'
        WHEN 3 THEN '最新エンタメニュース'
        ELSE '注目のテクノロジートレンド'
      END
    ) || ' ' || floor(random() * 100)::text as title,
    CASE WHEN random() < 0.7 THEN
      CASE floor(random() * 5)
        WHEN 0 THEN '最近の技術動向について興味深い発見がありました。'
        WHEN 1 THEN '昨日の試合は本当に素晴らしかったです。'
        WHEN 2 THEN 'この新作ゲーム、グラフィックもゲーム性も素晴らしいです。'
        WHEN 3 THEN '話題の新作映画を見てきました。'
        ELSE '最新のガジェットを試してみました。'
      END
    ELSE NULL END as body,
    CASE WHEN random() < 0.3 THEN
      (array[
        'https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg',
        'https://images.pexels.com/photos/1089440/pexels-photo-1089440.jpeg',
        'https://images.pexels.com/photos/735911/pexels-photo-735911.jpeg',
        'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg',
        'https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg'
      ])[floor(random() * 5 + 1)]
    ELSE NULL END as image_url,
    floor(random() * 100) as upvotes_count,
    floor(random() * 20) as downvotes_count,
    floor(random() * 10) as comments_count,
    floor(random() * 500) as view_count,
    NOW() - (random() * interval '30 days') as created_at
  FROM generate_series(1, 50)
)
INSERT INTO posts (
  id, user_id, community_id, title, body, image_url,
  upvotes_count, downvotes_count, comments_count, view_count,
  created_at, updated_at
)
SELECT
  id, user_id, community_id, title, body, image_url,
  upvotes_count, downvotes_count, comments_count, view_count,
  created_at, created_at
FROM post_data;

-- Sample comments
WITH RECURSIVE comment_data AS (
  SELECT
    gen_random_uuid() as id,
    posts.id as post_id,
    NULL::uuid as parent_comment_id,
    (SELECT id FROM users ORDER BY random() LIMIT 1) as user_id,
    (
      CASE floor(random() * 5)
        WHEN 0 THEN '興味深い投稿ですね。'
        WHEN 1 THEN 'とても参考になりました！'
        WHEN 2 THEN '私も同じように感じています。'
        WHEN 3 THEN 'もう少し詳しく教えていただけますか？'
        ELSE '素晴らしい視点だと思います。'
      END
    ) as body,
    floor(random() * 20) as upvotes_count,
    floor(random() * 5) as downvotes_count,
    0 as depth,
    NOW() - (random() * interval '30 days') as created_at
  FROM posts
  WHERE random() < 0.7
  
  UNION ALL
  
  SELECT
    gen_random_uuid() as id,
    c.post_id,
    c.id as parent_comment_id,
    (SELECT id FROM users ORDER BY random() LIMIT 1) as user_id,
    (
      CASE floor(random() * 5)
        WHEN 0 THEN 'その通りですね。'
        WHEN 1 THEN '私も同感です。'
        WHEN 2 THEN 'なるほど、参考になります。'
        WHEN 3 THEN '違う視点からの意見です。'
        ELSE '補足情報を共有させていただきます。'
      END
    ) as body,
    floor(random() * 10) as upvotes_count,
    floor(random() * 3) as downvotes_count,
    c.depth + 1 as depth,
    c.created_at + (random() * interval '1 day') as created_at
  FROM comment_data c
  WHERE c.depth < 2 AND random() < 0.3
)
INSERT INTO comments (
  id, post_id, parent_comment_id, user_id, body,
  upvotes_count, downvotes_count, depth,
  created_at, updated_at
)
SELECT
  id, post_id, parent_comment_id, user_id, body,
  upvotes_count, downvotes_count, depth,
  created_at, created_at
FROM comment_data;

-- Sample votes
INSERT INTO votes (user_id, post_id, vote_type, created_at, updated_at)
SELECT
  u.id,
  p.id,
  CASE WHEN random() < 0.8 THEN 1 ELSE -1 END as vote_type,
  NOW() - (random() * interval '30 days') as created_at,
  NOW() - (random() * interval '30 days') as updated_at
FROM users u
CROSS JOIN posts p
WHERE random() < 0.3;

-- Update community counts
UPDATE communities c
SET
  member_count = (
    SELECT count(*)
    FROM user_communities uc
    WHERE uc.community_id = c.id
  ),
  post_count = (
    SELECT count(*)
    FROM posts p
    WHERE p.community_id = c.id
  );