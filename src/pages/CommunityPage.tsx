import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCommunityStore } from '../stores/communityStore';
import { usePostStore } from '../stores/postStore';
import { Community } from '../lib/supabase';
import PostCard from '../components/posts/PostCard';
import { useAuthStore } from '../stores/authStore';
import CommunityEditModal from '../components/community/CommunityEditModal';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const CommunityPage: React.FC = () => {
  const { communityName } = useParams<{ communityName: string }>();
  const { fetchCommunityByName } = useCommunityStore();
  const { posts, loading, hasMore, fetchPostsByCommunity } = usePostStore();
  const [community, setCommunity] = useState<Community | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const navigate = useNavigate();
  
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
        <div className="flex items-center mb-4 justify-between">
          <div className="flex items-center">
            {community.image_url ? (
              <img 
                src={community.image_url} 
                alt={community.display_name}
                className="w-16 h-16 rounded-full mr-4"
              />
            ) : (
              <img 
                src="/default-community.png" 
                alt={community.display_name}
                className="w-16 h-16 rounded-full mr-4 object-cover"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold">{community.display_name}</h1>
              <p className="text-gray-600">r/{community.name}</p>
            </div>
          </div>
          {/* 管理者のみ表示 */}
          {user && community.user_id === user.id && (
            <div className="flex space-x-2">
              <button
                className="px-3 py-1 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                onClick={() => setShowEditModal(true)}
              >
                編集
              </button>
              <button
                className="px-3 py-1 text-sm rounded-md bg-red-100 text-red-700 hover:bg-red-200 border border-red-300"
                onClick={() => setShowDeleteConfirm(true)}
              >
                削除
              </button>
            </div>
          )}
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
      
      {showEditModal && (
        <CommunityEditModal
          community={community}
          onClose={() => setShowEditModal(false)}
          onSaved={updated => setCommunity(updated)}
        />
      )}
      
      {/* 削除確認ダイアログ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm relative">
            <h2 className="text-lg font-bold mb-4 text-red-600">本当に削除しますか？</h2>
            <p className="mb-4">このコミュニティと配下の投稿・データは全て完全に削除されます。元に戻せません。</p>
            {deleteError && <div className="mb-3 p-2 bg-red-100 text-red-700 rounded">{deleteError}</div>}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                disabled={deleting}
              >
                キャンセル
              </button>
              <button
                onClick={async () => {
                  setDeleting(true);
                  setDeleteError('');
                  const { error } = await supabase
                    .from('communities')
                    .delete()
                    .eq('id', community.id);
                  setDeleting(false);
                  if (error) {
                    setDeleteError(error.message || '削除に失敗しました');
                  } else {
                    navigate('/');
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                disabled={deleting}
              >
                {deleting ? '削除中...' : '完全に削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityPage;