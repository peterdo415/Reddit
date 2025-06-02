import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePostStore } from '../stores/postStore';
import { useAuthStore } from '../stores/authStore';
import PostCard from '../components/posts/PostCard';
import { useCommunityStore } from '../stores/communityStore';

const HomePage: React.FC = () => {
  const { posts, loading, hasMore, fetchPosts } = usePostStore();
  const { user, selectedCommunities } = useAuthStore();
  const { fetchCommunities } = useCommunityStore();
  const navigate = useNavigate();
  
  // Check if user needs to select communities
  useEffect(() => {
    if (user && selectedCommunities.length === 0) {
      navigate('/community-selection');
    }
  }, [user, selectedCommunities, navigate]);
  
  // Initial fetch
  useEffect(() => {
    fetchPosts(true);
    
    if (user) {
      fetchCommunities();
    }
    
    // Set up polling for hot scores refresh
    const intervalId = setInterval(() => {
      fetchPosts(true);
    }, 30000); // 30 seconds
    
    return () => clearInterval(intervalId);
  }, [fetchPosts, fetchCommunities, user]);
  
  // Load more posts
  const loadMorePosts = () => {
    if (!loading && hasMore) {
      fetchPosts();
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">トレンド投稿</h1>
      
      {posts.length === 0 && !loading ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600 mb-4">投稿がありません</p>
          {user ? (
            <button
              onClick={() => navigate('/create-post')}
              className="bg-[var(--primary)] text-white px-4 py-2 rounded-md hover:bg-[var(--primary-hover)] transition-colors"
            >
              最初の投稿を作成
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="bg-[var(--primary)] text-white px-4 py-2 rounded-md hover:bg-[var(--primary-hover)] transition-colors"
            >
              ログインして投稿
            </button>
          )}
        </div>
      ) : (
        <div>
          {/* Post list */}
          {posts.map((post, index) => (
            <PostCard key={post.id} post={post} index={index} />
          ))}
          
          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-center my-4">
              <div className="loader"></div>
            </div>
          )}
          
          {/* Load more button */}
          {!loading && hasMore && (
            <div className="flex justify-center my-4">
              <button
                onClick={loadMorePosts}
                className="bg-white text-[var(--primary)] border border-[var(--primary)] px-4 py-2 rounded-md hover:bg-[var(--primary)] hover:text-white transition-colors"
              >
                もっと読む
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;