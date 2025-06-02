import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { formatDistance } from 'date-fns';
import { ArrowBigUp, ArrowBigDown, MessageSquare } from 'lucide-react';
import { usePostStore } from '../stores/postStore';
import { useCommentStore } from '../stores/commentStore';
import { useAuthStore } from '../stores/authStore';
import { Post, Comment } from '../lib/supabase';

const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const { fetchPostById } = usePostStore();
  const { comments, fetchCommentsByPostId, createComment } = useCommentStore();
  const { user } = useAuthStore();
  
  const [post, setPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadPost = async () => {
      if (!postId) return;
      
      try {
        const fetchedPost = await fetchPostById(postId);
        if (fetchedPost) {
          setPost(fetchedPost);
          await fetchCommentsByPostId(postId);
        } else {
          setError('投稿が見つかりませんでした');
        }
      } catch (err) {
        setError('投稿の読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };
    
    loadPost();
  }, [postId, fetchPostById, fetchCommentsByPostId]);
  
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!post || !user || !newComment.trim()) return;
    
    try {
      await createComment({
        post_id: post.id,
        parent_comment_id: replyTo?.id || null,
        body: newComment.trim()
      });
      
      setNewComment('');
      setReplyTo(null);
    } catch (err) {
      console.error('Error creating comment:', err);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center my-8">
        <div className="loader"></div>
      </div>
    );
  }
  
  if (error || !post) {
    return (
      <div className="max-w-2xl mx-auto my-8">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }
  
  const formattedTime = formatDistance(
    new Date(post.created_at),
    new Date(),
    { addSuffix: true }
  );
  
  return (
    <div className="max-w-2xl mx-auto">
      {/* Post */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        {/* Post header */}
        <div className="flex items-center text-sm text-gray-500 mb-2">
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
          
          <span className="font-medium">{post.community_display_name}</span>
          <span className="mx-1">•</span>
          <span>投稿者 {post.username || '削除されたユーザー'}</span>
          <span className="mx-1">•</span>
          <span>{formattedTime}</span>
        </div>
        
        {/* Post content */}
        <h1 className="text-xl font-bold mb-2">{post.title}</h1>
        
        {post.image_url && (
          <div className="mb-4">
            <img 
              src={post.image_url} 
              alt={post.title}
              className="w-full rounded-md"
            />
          </div>
        )}
        
        {post.body && (
          <div className="text-gray-800 mb-4 whitespace-pre-wrap">
            {post.body}
          </div>
        )}
        
        {/* Post stats */}
        <div className="flex items-center text-sm text-gray-500">
          <div className="flex items-center mr-4">
            <ArrowBigUp size={20} className="text-gray-400" />
            <span className="mx-1">{post.upvotes_count}</span>
            <ArrowBigDown size={20} className="text-gray-400" />
            <span className="mx-1">{post.downvotes_count}</span>
          </div>
          <div className="flex items-center">
            <MessageSquare size={16} className="mr-1" />
            <span>{post.comments_count} コメント</span>
          </div>
        </div>
      </div>
      
      {/* Comment form */}
      {user ? (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            {replyTo && (
              <div className="mb-2 text-sm">
                <span className="text-gray-600">返信先: </span>
                <span className="font-medium">{replyTo.username || '削除されたユーザー'}</span>
                <button
                  onClick={() => setReplyTo(null)}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  キャンセル
                </button>
              </div>
            )}
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="コメントを書く..."
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              rows={3}
            />
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="bg-[var(--primary)] text-white px-4 py-2 rounded-md hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                投稿
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
          <p className="text-gray-600">
            コメントするには
            <a href="/login" className="text-[var(--primary)] hover:underline mx-1">
              ログイン
            </a>
            してください
          </p>
        </div>
      )}
      
      {/* Comments */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <span className="font-medium">
                {comment.username || '削除されたユーザー'}
              </span>
              <span className="mx-1">•</span>
              <span>
                {formatDistance(
                  new Date(comment.created_at),
                  new Date(),
                  { addSuffix: true }
                )}
              </span>
            </div>
            <div className="text-gray-800 whitespace-pre-wrap">
              {comment.body}
            </div>
            {user && (
              <button
                onClick={() => setReplyTo(comment)}
                className="mt-2 text-sm text-gray-500 hover:text-gray-700"
              >
                返信
              </button>
            )}
            {/* Nested replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-4 ml-4 space-y-4 border-l-2 border-gray-100 pl-4">
                {comment.replies.map((reply) => (
                  <div key={reply.id}>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <span className="font-medium">
                        {reply.username || '削除されたユーザー'}
                      </span>
                      <span className="mx-1">•</span>
                      <span>
                        {formatDistance(
                          new Date(reply.created_at),
                          new Date(),
                          { addSuffix: true }
                        )}
                      </span>
                    </div>
                    <div className="text-gray-800 whitespace-pre-wrap">
                      {reply.body}
                    </div>
                    {user && (
                      <button
                        onClick={() => setReplyTo(reply)}
                        className="mt-2 text-sm text-gray-500 hover:text-gray-700"
                      >
                        返信
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PostDetailPage;