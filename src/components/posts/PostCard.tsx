import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistance } from 'date-fns';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Flame, MoreVertical } from 'lucide-react';
import { Post } from '../../lib/supabase';
import { usePostStore } from '../../stores/postStore';
import { useAuthStore } from '../../stores/authStore';
import FireEffect from '../effects/FireEffect';

interface PostCardProps {
  post: Post;
  index: number;
}

const PostCard: React.FC<PostCardProps> = ({ post, index }) => {
  const { upvotePost, downvotePost } = usePostStore();
  const { user } = useAuthStore();
  const [vote, setVote] = useState<number>(0);
  const [showMenu, setShowMenu] = useState(false);
  
  useEffect(() => {
    const fetchVote = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('votes')
        .select('vote_type')
        .eq('user_id', user.id)
        .eq('post_id', post.id)
        .single();
        
      if (data) {
        setVote(data.vote_type);
      }
    };
    
    fetchVote();
  }, [post.id, user]);
  
  const handleUpvote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      alert('投票するにはログインが必要です');
      return;
    }
    
    upvotePost(post.id);
    setVote(vote === 1 ? 0 : 1);
  };
  
  const handleDownvote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      alert('投票するにはログインが必要です');
      return;
    }
    
    downvotePost(post.id);
    setVote(vote === -1 ? 0 : -1);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(!showMenu);
  };
  
  const showFireEffect = index < 3 && !post.is_promoted;
  
  const formattedTime = formatDistance(
    new Date(post.created_at),
    new Date(),
    { addSuffix: true }
  );
  
  return (
    <Link
      to={`/post/${post.id}`}
      className={`block mb-3 relative ${showFireEffect ? 'fire-effect rounded-lg' : 'bg-white rounded-lg shadow hover:shadow-md'} transition-all duration-200`}
    >
      {showFireEffect && <FireEffect />}
      
      <div className="flex p-3">
        {/* Vote buttons */}
        <div className="flex flex-col items-center mr-3">
          <button 
            onClick={handleUpvote}
            className={`p-1 rounded-md ${
              vote === 1 
                ? 'text-[var(--upvote)]' 
                : 'text-gray-500 hover:text-[var(--upvote)] hover:bg-orange-50'
            }`}
          >
            <ArrowBigUp size={24} />
          </button>
          
          <span className={`text-sm font-medium my-1 ${
            vote === 1 
              ? 'text-[var(--upvote)]' 
              : vote === -1 
                ? 'text-[var(--downvote)]' 
                : 'text-gray-700'
          }`}>
            {post.upvotes_count - post.downvotes_count}
            {showFireEffect && (
              <Flame 
                size={14} 
                className="inline-block ml-1 text-[var(--upvote)] animate-pulse-slow" 
              />
            )}
          </span>
          
          <button 
            onClick={handleDownvote}
            className={`p-1 rounded-md ${
              vote === -1 
                ? 'text-[var(--downvote)]' 
                : 'text-gray-500 hover:text-[var(--downvote)] hover:bg-blue-50'
            }`}
          >
            <ArrowBigDown size={24} />
          </button>
        </div>
        
        {/* Post content */}
        <div className="flex-1">
          {/* Post header */}
          <div className="flex items-center text-xs text-gray-500 mb-1">
            {post.community_image_url ? (
              <img 
                src={post.community_image_url} 
                alt={post.community_display_name}
                className="w-5 h-5 rounded-full mr-1"
              />
            ) : (
              <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center mr-1">
                <span className="text-[9px] font-bold text-gray-600">
                  {post.community_display_name?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            
            <Link 
              to={`/c/${post.community_name}`} 
              onClick={(e) => e.stopPropagation()}
              className="font-medium hover:underline"
            >
              {post.community_display_name}
            </Link>
            
            <span className="mx-1">•</span>
            <span>投稿者 {post.username || '削除されたユーザー'}</span>
            <span className="mx-1">•</span>
            <span>{formattedTime}</span>
          </div>
          
          {/* Post title */}
          <h2 className="text-lg font-medium mb-2">{post.title}</h2>
          
          {/* Post image (if exists) */}
          {post.image_url && (
            <div className="mb-3 max-h-96 overflow-hidden rounded">
              <img 
                src={post.image_url} 
                alt={post.title}
                className="w-full object-cover"
              />
            </div>
          )}
          
          {/* Post body preview (if exists) */}
          {post.body && (
            <div className="text-sm text-gray-700 mb-3 line-clamp-3">
              {post.body}
            </div>
          )}
          
          {/* Post footer */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center">
              <MessageSquare size={16} className="mr-1" />
              <span>{post.comments_count} コメント</span>
            </div>
            
            {/* Menu button */}
            <div className="relative">
              <button
                onClick={handleMenuClick}
                className="p-2 hover:bg-gray-100 rounded-full"
                aria-label="投稿メニュー"
              >
                <MoreVertical size={20} className="text-gray-500" />
              </button>
              
              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowMenu(false);
                    }}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    {user?.id === post.user_id && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // TODO: 投稿編集機能
                        }}
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                      >
                        編集
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // TODO: 投稿共有機能
                      }}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      共有
                    </button>
                    {user?.id === post.user_id && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // TODO: 投稿削除機能
                        }}
                        className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                      >
                        削除
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {post.is_promoted && (
        <div className="absolute bottom-2 right-2">
          <span className="text-xs font-medium bg-gray-200 px-2 py-0.5 rounded">
            Promoted
          </span>
        </div>
      )}
    </Link>
  );
};

export default PostCard;