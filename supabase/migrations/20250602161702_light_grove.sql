/*
  # ダミーデータの追加

  1. データ追加
    - ダミーユーザー5名
    - ダミー投稿50個
    - ダミーコメント
    - ダミー投票
    - ユーザーとコミュニティの関連付け

  2. 注意事項
    - パスワードはすべて 'password123' (bcrypt済み)
    - 投稿は各コミュニティにランダムに分配
    - 投票数とコメント数は自動計算
*/

-- ダミーユーザーの作成
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data
) VALUES
  (
    'c9c1c8e4-4be4-4e3c-9e5d-4a1d8f8f8f8f',
    'tanaka.yuki@example.com',
    '$2a$10$LqpU3z1wvZhX9g5KZ7Z7Z.XzZ9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9',
    NOW(),
    '{"username": "tanaka_yuki"}'
  ),
  (
    'c9c1c8e4-4be4-4e3c-9e5d-4a1d8f8f8f8e',
    'suzuki.mai@example.com',
    '$2a$10$LqpU3z1wvZhX9g5KZ7Z7Z.XzZ9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9',
    NOW(),
    '{"username": "mai_suzuki"}'
  ),
  (
    'c9c1c8e4-4be4-4e3c-9e5d-4a1d8f8f8f8d',
    'sato.kenji@example.com',
    '$2a$10$LqpU3z1wvZhX9g5KZ7Z7Z.XzZ9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9',
    NOW(),
    '{"username": "kenji_sato"}'
  ),
  (
    'c9c1c8e4-4be4-4e3c-9e5d-4a1d8f8f8f8c',
    'yamamoto.akiko@example.com',
    '$2a$10$LqpU3z1wvZhX9g5KZ7Z7Z.XzZ9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9',
    NOW(),
    '{"username": "akiko_yama"}'
  ),
  (
    'c9c1c8e4-4be4-4e3c-9e5d-4a1d8f8f8f8b',
    'nakamura.ryo@example.com',
    '$2a$10$LqpU3z1wvZhX9g5KZ7Z7Z.XzZ9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9',
    NOW(),
    '{"username": "ryo_naka"}'
  );

-- ユーザープロフィールの追加
INSERT INTO users (
  id,
  email,
  username,
  bio,
  profile_image_url,
  karma_score,
  email_verified
) VALUES
  (
    'c9c1c8e4-4be4-4e3c-9e5d-4a1d8f8f8f8f',
    'tanaka.yuki@example.com',
    'tanaka_yuki',
    'テクノロジーと映画が好きです。',
    'https://api.dicebear.com/7.x/avatars/svg?seed=tanaka_yuki',
    125,
    true
  ),
  (
    'c9c1c8e4-4be4-4e3c-9e5d-4a1d8f8f8f8e',
    'suzuki.mai@example.com',
    'mai_suzuki',
    'スポーツ観戦が趣味です。',
    'https://api.dicebear.com/7.x/avatars/svg?seed=mai_suzuki',
    89,
    true
  ),
  (
    'c9c1c8e4-4be4-4e3c-9e5d-4a1d8f8f8f8d',
    'sato.kenji@example.com',
    'kenji_sato',
    'ゲーム開発者です。',
    'https://api.dicebear.com/7.x/avatars/svg?seed=kenji_sato',
    210,
    true
  ),
  (
    'c9c1c8e4-4be4-4e3c-9e5d-4a1d8f8f8f8c',
    'yamamoto.akiko@example.com',
    'akiko_yama',
    'エンタメニュースを追いかけています。',
    'https://api.dicebear.com/7.x/avatars/svg?seed=akiko_yama',
    156,
    true
  ),
  (
    'c9c1c8e4-4be4-4e3c-9e5d-4a1d8f8f8f8b',
    'nakamura.ryo@example.com',
    'ryo_naka',
    'テクノロジーとニュースについて発信します。',
    'https://api.dicebear.com/7.x/avatars/svg?seed=ryo_naka',
    178,
    true
  );

-- ユーザーとコミュニティの関連付け
INSERT INTO user_communities (user_id, community_id)
SELECT 
  u.id,
  c.id
FROM users u
CROSS JOIN communities c
WHERE random() < 0.7; -- 70%の確率でコミュニティに所属

-- ダミー投稿の作成
WITH post_data AS (
  SELECT
    gen_random_uuid() as id,
    (array[
      'c9c1c8e4-4be4-4e3c-9e5d-4a1d8f8f8f8f',
      'c9c1c8e4-4be4-4e3c-9e5d-4a1d8f8f8f8e',
      'c9c1c8e4-4be4-4e3c-9e5d-4a1d8f8f8f8d',
      'c9c1c8e4-4be4-4e3c-9e5d-4a1d8f8f8f8c',
      'c9c1c8e4-4be4-4e3c-9e5d-4a1d8f8f8f8b'
    ])[floor(random() * 5 + 1)] as user_id,
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
        WHEN 0 THEN '最近の技術動向について興味深い発見がありました。皆さんはどう思いますか？'
        WHEN 1 THEN '昨日の試合は本当に素晴らしかったです。特に後半の展開が印象的でした。'
        WHEN 2 THEN 'この新作ゲーム、グラフィックもゲーム性も素晴らしいです。特にストーリーが秀逸。'
        WHEN 3 THEN '話題の新作映画を見てきました。ネタバレなしでレビューを共有します。'
        ELSE '最新のガジェットを試してみました。詳細なレビューを共有させていただきます。'
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

-- ダミーコメントの作成
WITH RECURSIVE comment_data AS (
  SELECT
    gen_random_uuid() as id,
    posts.id as post_id,
    NULL::uuid as parent_comment_id,
    (array[
      'c9c1c8e4-4be4-4e3c-9e5d-4a1d8f8f8f8f',
      'c9c1c8e4-4be4-4e3c-9e5d-4a1d8f8f8f8e',
      'c9c1c8e4-4be4-4e3c-9e5d-4a1d8f8f8f8d',
      'c9c1c8e4-4be4-4e3c-9e5d-4a1d8f8f8f8c',
      'c9c1c8e4-4be4-4e3c-9e5d-4a1d8f8f8f8b'
    ])[floor(random() * 5 + 1)] as user_id,
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
  WHERE random() < 0.7 -- 70%の投稿にコメントを付ける
  
  UNION ALL
  
  SELECT
    gen_random_uuid() as id,
    c.post_id,
    c.id as parent_comment_id,
    (array[
      'c9c1c8e4-4be4-4e3c-9e5d-4a1d8f8f8f8f',
      'c9c1c8e4-4be4-4e3c-9e5d-4a1d8f8f8f8e',
      'c9c1c8e4-4be4-4e3c-9e5d-4a1d8f8f8f8d',
      'c9c1c8e4-4be4-4e3c-9e5d-4a1d8f8f8f8c',
      'c9c1c8e4-4be4-4e3c-9e5d-4a1d8f8f8f8b'
    ])[floor(random() * 5 + 1)] as user_id,
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
  WHERE c.depth < 2 AND random() < 0.3 -- 30%の確率で返信コメントを作成、最大深度2
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

-- ダミー投票の作成
INSERT INTO votes (user_id, post_id, vote_type, created_at)
SELECT
  u.id,
  p.id,
  CASE WHEN random() < 0.8 THEN 1 ELSE -1 END as vote_type,
  NOW() - (random() * interval '30 days') as created_at
FROM users u
CROSS JOIN posts p
WHERE random() < 0.3; -- 30%の確率で投票を作成

-- コミュニティのメンバー数と投稿数を更新
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