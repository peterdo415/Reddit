# MVP要件定義（修正版v2）

---

## 1. ビジネスゴール / KPI

| 目標       | 指標         | 数値         | 備考                 |
| -------- | ---------- | ---------- | ------------------ |
| 広告収益     | 月次売上       | **¥1,000** | フィード内ネイティブ広告（CPC）  |
| 利用者獲得    | DAU        | **50人**    | リリース後1か月以内         |
| エンゲージメント | 1セッション滞在時間 | **5分以上**   | Hot投稿の魅力的エフェクト    |
| クリック率    | CTR        | **1%**     | Promoted Post に対して |

---

## 2. ターゲットユーザ（ペルソナ）

* **年齢**: 18–35 歳のデジタルネイティブ層
* **動機**: "今" 盛り上がる話題を直感的に眺めたい／コミュニティで気軽に交流したい
* **利用環境**: スマホ4G中心（滑らかなスクロール体験）

---

## 3. 機能要件

### 3.1 認証機能

#### 3.1.1 ログイン方式
* **パスワード認証**: Username or email + Password（bcryptでハッシュ化）
* **OAuth認証**: Continue with Google
* **ログイン動線**: ヘッダー右上に「ログイン」ボタン配置
* **新規登録**: email + username + password で新規アカウント作成

#### 3.1.2 セッション管理
* **セッション**: Supabaseのセッション機能を利用
* **ログイン状態表示**: 右上にプロフィール画像（デフォルト画像またはアップロード画像）
* **プロフィールメニュー**: 画像クリック → 管理画面（プロフィール編集・ログアウト）
* **ログアウト**: セッション完全削除

#### 3.1.3 権限制御
* **ログイン必須機能**: 投稿作成・コメント投稿・投票・コミュニティ作成
* **未ログイン**: 閲覧のみ可能

#### 3.1.4 初回ログイン時のコミュニティ選択フロー
* **ログイン後**: 必須でコミュニティ選択画面に遷移
* **選択画面表示**: デフォルト5コミュニティ + 追加作成済みコミュニティを最大20件表示
* **選択必須**: 最低1つのコミュニティを選択してからメインフィードに進める
* **再選択**: サイドバーからいつでも別コミュニティに切り替え可能

---

### 3.2 メインフィード — Reddit風リスト表示＋Hotエフェクト

| 項目      | 仕様                              |
| ------- | ------------------------------- |
| 表示数     | 初期25件＋広告1–2件                    |
| 配置      | 縦スクロールリスト、Hotスコア降順              |
| 特別エフェクト | **上位3投稿に「炎上エフェクト」** - 背景に動的な火の粒子アニメーション |
| 投稿カード   | タイトル、画像（あれば）、スコア、コメント数、時間、コミュニティ表示 |

---

#### 3.2.1 「何これ！」炎上エフェクト

**上位3投稿（最もHotな投稿）**に以下の視覚エフェクトを適用：

* **背景**: 微細な火の粒子が左右からゆらゆらと舞い上がるCSS/Canvas アニメーション
* **境界線**: オレンジ〜赤のグラデーション枠で囲む
* **アイコン**: 投稿スコア横に小さな🔥アイコンを脈動表示
* **効果**: 「この投稿、今めちゃくちゃ燃えてる！」という直感的な理解を促す

#### 3.2.2 Hot アルゴリズムによるスコア計算

各投稿の**Hot スコア**は Reddit 本家と同一の計算式で動的に算出する。

```python
import math

def hot_score(ups: int, downs: int, created_utc: int) -> float:
    score = ups - downs
    if score > 0:
        s = 1
    elif score < 0:
        s = -1
    else:
        s = 0
    z = max(abs(score), 1)
    order = math.log10(z)
    seconds = created_utc - 1134028003
    return round(order + (s * (seconds / 45000)), 7)
```

---

### 3.3 検索機能

#### 3.3.1 投稿検索
* **配置**: ヘッダー中央の検索バー
* **対象**: `posts.title` と `posts.body` の文字列部分一致
* **実装**: Supabase の `ilike` 演算子を使用（最速実装）
* **結果表示**: 投稿一覧形式、Hot順ソート
* **検索クエリ**: 日本語・英語対応、3文字以上で検索実行

#### 3.3.2 コミュニティ検索
* **配置**: コミュニティ選択画面とサイドバー
* **対象**: `communities.display_name` と `communities.description` の部分一致
* **実装**: Supabase の `ilike` 演算子を使用
* **結果表示**: コミュニティカード形式、作成日順

---

### 3.4 投票機能（Upvote / Downvote）

1. **操作フロー**

   * 投稿カードタップ → **投稿詳細ページに遷移**
   * 詳細ページに「Upvote」「Downvote」ボタン配置
   * カード上でも矢印ボタンで直接投票可能（ログイン必須）
   * 投票後 `upvotes_count` / `downvotes_count` を更新し、Hotスコア再計算

2. **リアルタイム同期**

   * Supabase Realtime / WebSocket で投票イベントを全クライアントに配信
   * クライアント側は楽観更新 → サーバACKで確定表示

---

### 3.5 投稿詳細ページ

* **URL構成**: `/post/[id]`
* **表示内容**: 
  * 投稿タイトル・本文・画像（あれば）
  * Upvote/Downvote ボタン（ログイン必須）
  * **階層コメント表示**（実質無制限階層）
  * コメント投稿フォーム（ログイン必須）
  * 関連投稿（同コミュニティ）

---

### 3.6 投稿／コメント機能

| 機能   | 仕様                                               |
| ---- | ------------------------------------------------ |
| 投稿   | タイトル必須＋本文任意＋**画像1枚Upload対応**。ログイン必須。        |
| コメント | **実質無制限階層対応**。親コメントへの返信可能。ログイン必須。            |
| 画像   | Supabase Storage利用、JPEG/PNG対応、最大5MB。         |

---

### 3.7 コミュニティ（旧チャンネル）

#### 3.7.1 コミュニティ機能
* **作成**: ログインユーザーが新規コミュニティ作成可能
* **管理**: 作成者が管理者として設定・削除権限を持つ
* **表示**: サイドバーにコミュニティ一覧、フィードで選択可能
* **画像アップロード**: コミュニティ画像1枚対応（任意、デフォルト画像あり）

#### 3.7.2 デフォルトコミュニティ
* システム管理者が以下を事前作成：
  * `news` - ニュース（🗞️ デフォルト画像）
  * `entertainment` - エンターテイメント（🎬 デフォルト画像）
  * `tech` - テクノロジー（💻 デフォルト画像）
  * `sports` - スポーツ（⚽ デフォルト画像）
  * `gaming` - ゲーム（🎮 デフォルト画像）

#### 3.7.3 サイドバー機能
* **コミュニティ一覧**: 参加中コミュニティの表示
* **コミュニティ追加ボタン**: 新規コミュニティ作成画面への遷移
* **コミュニティ詳細**: クリック → コミュニティ詳細ページ（投稿一覧・情報・設定）

---

### 3.8 プロモート投稿（ネイティブ広告）

1. **表示位置と頻度**
   * 初期ロード（25件の投稿）に広告1–2件をランダム挿入
   * 「もっと読む」で25件追加取得ごとに広告1–2件再挿入

2. **広告カードの見た目**
   * 通常投稿カードと同じ形式、下部に **Promoted** ラベル
   * 背景色を微妙に変更（薄いグレー）

---

### 3.9 UI構成（本家Reddit準拠）

#### 3.9.1 レイアウト
* **ヘッダー**: ロゴ、**検索バー（中央）**、ログイン/プロフィール
* **サイドバー**: コミュニティ一覧、コミュニティ追加ボタン、人気投稿、広告枠
* **メインコンテンツ**: 投稿フィード、投稿詳細ページ
* **サイドバー制御**: 表示/非表示の切り替えボタン

#### 3.9.2 レスポンシブ対応
* **デスクトップ**: サイドバー + メインコンテンツの2カラム
* **モバイル**: サイドバーは折りたたみメニュー

---

### 3.10 「もっと読む」ボタン

* 文言: **「もっと読む」**
* リスト下部固定。タップ → 次の25件＋広告取得 → リストに追加表示

---

## 4. 非機能要件 (NFR)

| 区分       | 要件                      |
| -------- | ----------------------- |
| パフォーマンス  | 初期描画 <3秒 / 滑らかスクロール、投稿25件 |
| 同期       | 投票・コメント P99≦1秒          |
| 可用性      | 99.9% (Supabase+Vercel) |
| セキュリティ   | RLS、OAuth、セッション管理、**bcryptパスワードハッシュ化**      |
| ランニングコスト | ¥0–¥5,000/月             |
| **スケーラビリティ** | **コンポーネント単位での拡張性、DB正規化、インデックス最適化** |

---

## 5. データスキーマ（スケーラブル設計）

### 5.1 communities テーブル（修正版）

```sql
create table communities (
  id serial primary key,              -- コミュニティID
  name text not null unique,          -- internal identifier, ex: 'news'
  display_name text not null,         -- 表示名, ex: 'ニュース'
  description text,                   -- コミュニティ説明
  image_url text,                     -- コミュニティ画像URL（任意）
  user_id uuid references users(id) on delete set null, -- 作成者
  member_count int default 0,         -- メンバー数キャッシュ（将来拡張用）
  post_count int default 0,           -- 投稿数キャッシュ（将来拡張用）
  created_at timestamptz default now(),-- 作成日時
  updated_at timestamptz default now() -- 更新日時
);

-- インデックス（スケーラビリティ対応）
create index idx_communities_name on communities(name);
create index idx_communities_display_name on communities using gin(to_tsvector('japanese', display_name));
create index idx_communities_created_at on communities(created_at desc);
```

### 5.2 users テーブル（修正版）

```sql
create table users (
  id uuid primary key default gen_random_uuid(),  -- ユーザーUUID
  email text unique not null,                     -- 認証済みメールアドレス
  username text unique,                           -- ユーザー名（任意）
  password_hash text,                             -- パスワードハッシュ（bcrypt）
  profile_image_url text,                         -- プロフィール画像URL
  bio text,                                       -- 自己紹介
  karma_score int default 0,                      -- カルマスコア（将来拡張用）
  email_verified boolean default false,           -- メール認証状態
  created_at timestamptz default now(),           -- 作成日時
  updated_at timestamptz default now()            -- 更新日時
);

-- インデックス（スケーラビリティ対応）
create index idx_users_email on users(email);
create index idx_users_username on users(username);
create index idx_users_karma_score on users(karma_score desc);
```

### 5.3 posts テーブル（修正版）

```sql
create table posts (
  id uuid primary key default gen_random_uuid(),   -- 投稿UUID
  user_id uuid references users(id) on delete set null,  -- 投稿者
  community_id int references communities(id) on delete cascade, -- コミュニティ
  title text not null,                            -- タイトル
  body text,                                      -- 本文（省略可）
  image_url text,                                 -- 画像URL（省略可）
  is_promoted boolean default false,              -- 広告フラグ
  upvotes_count int default 0,                    -- 賛成票数
  downvotes_count int default 0,                  -- 反対票数
  comments_count int default 0,                   -- コメント数キャッシュ
  view_count int default 0,                       -- 閲覧数（将来拡張用）
  created_at timestamptz default now(),           -- 作成日時
  updated_at timestamptz default now()            -- 更新日時
);

-- インデックス（スケーラビリティ対応）
create index idx_posts_community_created on posts(community_id, created_at desc);
create index idx_posts_user_created on posts(user_id, created_at desc);
create index idx_posts_hot_score on posts((upvotes_count - downvotes_count) desc, created_at desc);
create index idx_posts_search on posts using gin(to_tsvector('japanese', title || ' ' || coalesce(body, '')));
create index idx_posts_promoted on posts(is_promoted, created_at desc);
```

### 5.4 comments テーブル（修正版）

```sql
create table comments (
  id uuid primary key default gen_random_uuid(),   -- コメントUUID
  post_id uuid references posts(id) on delete cascade, -- 対象投稿
  parent_comment_id uuid references comments(id) on delete cascade, -- 親コメント（階層対応）
  user_id uuid references users(id) on delete set null, -- コメント者
  body text not null,                              -- コメント本文
  upvotes_count int default 0,                     -- コメント賛成票（将来拡張用）
  downvotes_count int default 0,                   -- コメント反対票（将来拡張用）
  depth int default 0,                             -- コメント階層深度
  created_at timestamptz default now(),            -- 作成日時
  updated_at timestamptz default now()             -- 更新日時
);

-- インデックス（スケーラビリティ対応）
create index idx_comments_post_created on comments(post_id, created_at desc);
create index idx_comments_parent_created on comments(parent_comment_id, created_at desc);
create index idx_comments_user_created on comments(user_id, created_at desc);
create index idx_comments_depth on comments(depth);
```

### 5.5 votes テーブル（修正版）

```sql
create table votes (
  user_id uuid references users(id) on delete cascade, -- 投票者
  post_id uuid references posts(id) on delete cascade, -- 対象投稿
  vote_type smallint not null,     -- 1=upvote, -1=downvote
  created_at timestamptz default now(), -- 投票日時
  updated_at timestamptz default now(), -- 更新日時
  primary key (user_id, post_id)    -- 重複投票防止
);

-- インデックス（スケーラビリティ対応）
create index idx_votes_post_type on votes(post_id, vote_type);
create index idx_votes_user_created on votes(user_id, created_at desc);
```

### 5.6 user_communities テーブル（将来拡張用）

```sql
create table user_communities (
  user_id uuid references users(id) on delete cascade,
  community_id int references communities(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (user_id, community_id)
);

-- インデックス
create index idx_user_communities_user on user_communities(user_id);
create index idx_user_communities_community on user_communities(community_id);
```

### 5.7 Hotスコア計算ビュー（修正版）

```sql
create view post_hot_scores as
select
  p.*,
  c.name as community_name,
  c.display_name as community_display_name,
  c.image_url as community_image_url,
  u.username,
  u.profile_image_url,
  ( log(greatest(abs(p.upvotes_count - p.downvotes_count),1)) / ln(10)
    + (
        case
          when (p.upvotes_count - p.downvotes_count) > 0 then 1
          when (p.upvotes_count - p.downvotes_count) < 0 then -1
          else 0
        end
      ) * ((extract(epoch from p.created_at)::bigint - 1134028003) / 45000.0)
  ) as hot_score
from posts p
left join communities c on p.community_id = c.id
left join users u on p.user_id = u.id
where p.is_promoted = false;
```

### 5.8 コメント数キャッシュ再集計SQL（Reddit本家仕様）

- コメント数は「親コメント・返信コメントすべて（is_deleted=falseのみ）」をカウントします。
- postsテーブルのcomments_countカラムは、下記の関数で再集計できます。

```sql
-- 1投稿のみ再集計
select update_comments_count('<POST_ID>');

-- 全投稿一括再集計
update posts set comments_count = (
  select count(*) from comments where post_id = posts.id and is_deleted = false
);
```

---

## 6. Hot アルゴリズム運用フロー

1. **投稿作成**: `upvotes_count=0`, `downvotes_count=0`, `comments_count=0`, `created_at` 保存
2. **投票**: `votes` テーブル upsert → `upvotes_count` / `downvotes_count` 更新 → Hot再計算
3. **一覧取得**: `post_hot_scores`ビューからHot降順に取得
   * **上位3件**: 炎上エフェクト適用
   * **4件目以降**: 通常表示
4. **再取得**: 30秒毎に軽量JSON再取得 → リスト順序更新

---

## 7. スケーラブル設計原則

### 7.1 コード設計
* **コンポーネント分離**: 機能単位での独立性確保
* **API設計**: RESTfulな設計、バージョニング対応
* **状態管理**: Zustand/Reduxでの一元管理
* **型安全性**: TypeScriptでの厳密な型定義

### 7.2 データベース設計
* **正規化**: 適切な正規化でデータ整合性確保
* **インデックス**: 検索パフォーマンス最適化
* **キャッシュ戦略**: カウント系カラムでの高速化
* **パーティショニング**: 将来的な大量データ対応
* **セキュリティ**: パスワードハッシュ化、RLS適用

### 7.3 インフラ設計
* **CDN**: 画像配信の高速化
* **ロードバランシング**: トラフィック分散対応
* **モニタリング**: パフォーマンス監視体制
* **バックアップ**: データ保護戦略

---

## 8. マイルストーン（4週）

| 週 | ゴール                            |
| - | ------------------------------ |
| 1 | パスワード認証 + OAuth + DB設計 + RLS + コミュニティ選択フロー     |
| 2 | 投稿/コメント（階層対応）/投票 API + Realtime + 検索機能 |
| 3 | Reddit風UI + サイドバー + Hot順ソート + コミュニティ画像      |
| 4 | 炎上エフェクト + 画像アップロード + 検索UI + β公開        |

---

## 9. まとめ

* **本家Reddit準拠のUI**（サイドバー付き2カラムレイアウト）で馴染みやすい操作感
* **パスワード認証 + OAuth**でセキュアなログイン機能
* **必須コミュニティ選択フロー**でユーザーエンゲージメント向上
* **コミュニティ画像 + 検索機能**で豊富なコンテンツ発見体験
* **投稿検索機能**でコンテンツアクセシビリティ向上
* **階層コメント + 画像アップロード**で豊富な表現力
* **炎上エフェクト**で上位3投稿を際立たせ「何これ！」感を演出
* **スケーラブル設計**で将来的な機能拡張に対応
* **Supabase+Vercel無料枠**で4週間開発し、MVPローンチ
