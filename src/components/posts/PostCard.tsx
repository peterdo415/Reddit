import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistance } from 'date-fns';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Flame } from 'lucide-react';
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
  
  // Get user's vote for this post
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
  
  // Check if this post should have fire effect (top 3 posts)
  const showFireEffect = index < 3 && !post.is_promoted;
  
  // Format relative time
  const formattedTime = formatDistance(
    new Date(post.created_at),
    new Date(),
    { addSuffix: true }
  );
  
  return (
    <Link
      to={`/post/${post.id}`}
      className={`block mb-3 ${showFireEffect ? 'fire-effect rounded-lg' : 'bg-white rounded-lg shadow hover:shadow-md'} transition-all duration-200`}
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
          <div className="flex items-center mb-2">
            <h2 className="text-lg font-medium">{post.title}</h2>
            {showFireEffect && (
              <div className="ml-2 animate-float">
                <div className="relative">
                  <Flame 
                    size={16} 
                    className="text-[var(--upvote)] animate-pulse-slow" 
                  />
                  <div className="absolute top-0 left-0 w-full h-full">
                    <Flame 
                      size={16} 
                      className="text-[var(--upvote)] opacity-50 animate-pulse-reverse" 
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
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
          <div className="flex items-center text-sm text-gray-500">
            <div className="flex items-center mr-4">
              <MessageSquare size={16} className="mr-1" />
              <span>{post.comments_count} コメント</span>
            </div>
            
            {post.is_promoted && (
              <span className="text-xs font-medium bg-gray-200 px-2 py-0.5 rounded">
                Promoted
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PostCard;