import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCommunityStore } from '../stores/communityStore';
import { usePostStore } from '../stores/postStore';
import { Community } from '../lib/supabase';
import PostCard from '../components/posts/PostCard';

const CommunityPage: React.FC = () => {
  const { communityName } = useParams<{ communityName: string }>();
  const { fetchCommunityByName } = useCommunityStore();
  const { posts, loading, hasMore, fetchPostsByCommunity } = usePostStore();
  const [community, setCommunity] = useState<Community | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadCommunity = async () => {
      if (!communityName) return;
      
      try {
        const fetchedCommunity = await fetchCommunityByName(communityName);
        if (fetchedCommunity) {
          setCommunity(fetchedCommunity);
          await fetchPostsByCommunity(communityName, true);
        } else {
          setError('コミュニティが見つかりませんでした');
        }
      } catch (err) {
        setError('コミュニティの読み込みに失敗しました');
      }
    };
    
    loadCommunity();
  }, [communityName, fetchCommunityByName, fetchPostsByCommunity]);
  
  const loadMorePosts = () => {
    if (!loading && hasMore && communityName) {
      fetchPostsByCommunity(communityName);
    }
  };
  
  if (error || !community) {
    return (
      <div className="max-w-2xl mx-auto my-8">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      {/* Community header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center mb-4">
          {community.image_url ? (
            <img 
              src={community.image_url} 
              alt={community.display_name}
              className="w-16 h-16 rounded-full mr-4"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mr-4">
              <span className="text-2xl font-bold text-gray-600">
                {community.display_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          
          <div>
            <h1 className="text-2xl font-bold">{community.display_name}</h1>
            <p className="text-gray-600">r/{community.name}</p>
          </div>
        </div>
        
        {community.description && (
          <p className="text-gray-700">{community.description}</p>
        )}
        
        <div className="mt-4 flex items-center text-sm text-gray-500">
          <div className="mr-4">
            <span className="font-medium">{community.member_count}</span>
            <span className="ml-1">メンバー</span>
          </div>
          <div>
            <span className="font-medium">{community.post_count}</span>
            <span className="ml-1">投稿</span>
          </div>
        </div>
      </div>
      
      {/* Posts */}
      {posts.length === 0 && !loading ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600">まだ投稿がありません</p>
        </div>
      ) : (
        <div>
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

export default CommunityPage;