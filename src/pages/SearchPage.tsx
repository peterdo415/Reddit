import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePostStore } from '../stores/postStore';
import { useCommunityStore } from '../stores/communityStore';
import PostCard from '../components/posts/PostCard';
import { Community } from '../lib/supabase';

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const { searchPosts } = usePostStore();
  const { searchCommunities } = useCommunityStore();
  
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  
  useEffect(() => {
    const search = async () => {
      if (query.length < 2) return;
      
      setLoading(true);
      try {
        const [postsResults, communitiesResults] = await Promise.all([
          searchPosts(query),
          searchCommunities(query)
        ]);
        
        setPosts(postsResults);
        setCommunities(communitiesResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    search();
  }, [query, searchPosts, searchCommunities]);
  
  if (query.length < 2) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-center">
            検索するには2文字以上入力してください
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">「{query}」の検索結果</h1>
      
      {loading ? (
        <div className="flex justify-center my-8">
          <div className="loader"></div>
        </div>
      ) : (
        <>
          {/* Communities results */}
          {communities.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-3">コミュニティ</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {communities.map(community => (
                  <div 
                    key={community.id}
                    className="bg-white rounded-lg shadow p-4"
                  >
                    <div className="flex items-center mb-2">
                      {community.image_url ? (
                        <img 
                          src={community.image_url} 
                          alt={community.display_name}
                          className="w-10 h-10 rounded-full mr-3"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                          <span className="text-lg font-bold text-gray-600">
                            {community.display_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium">{community.display_name}</h3>
                        <p className="text-sm text-gray-500">
                          メンバー: {community.member_count || 0}
                        </p>
                      </div>
                    </div>
                    {community.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {community.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Posts results */}
          {posts.length > 0 ? (
            <div>
              <h2 className="text-lg font-semibold mb-3">投稿</h2>
              {posts.map((post, index) => (
                <PostCard key={post.id} post={post} index={index} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-600">
                検索結果が見つかりませんでした
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SearchPage;