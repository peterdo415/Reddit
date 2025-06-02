import { create } from 'zustand';
import { supabase, Comment } from '../lib/supabase';
import { useAuthStore } from './authStore';

interface CommentState {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  fetchCommentsByPostId: (postId: string) => Promise<void>;
  createComment: (comment: Partial<Comment>) => Promise<Comment | null>;
  buildCommentTree: (comments: Comment[]) => Comment[];
}

export const useCommentStore = create<CommentState>((set, get) => ({
  comments: [],
  loading: false,
  error: null,

  fetchCommentsByPostId: async (postId: string) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          users!comments_user_id_fkey (
            username,
            profile_image_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      // Format comments
      const formattedComments = data.map((comment) => ({
        ...comment,
        username: comment.users?.username,
        profile_image_url: comment.users?.profile_image_url,
      }));
      
      // Build comment tree
      const commentTree = get().buildCommentTree(formattedComments);
      
      set({
        comments: commentTree,
        loading: false
      });
      
    } catch (error: any) {
      set({ loading: false, error: error.message });
      console.error('Error fetching comments:', error);
    }
  },

  createComment: async (comment: Partial<Comment>) => {
    const { user } = useAuthStore.getState();
    if (!user) return null;
    
    try {
      // Insert comment
      const { data, error } = await supabase
        .from('comments')
        .insert({
          ...comment,
          user_id: user.id,
          depth: comment.parent_comment_id ? 
            // If replying to a comment, get its depth + 1
            await supabase
              .from('comments')
              .select('depth')
              .eq('id', comment.parent_comment_id)
              .single()
              .then(({ data }) => (data?.depth || 0) + 1)
            : 0
        })
        .select(`
          *,
          users!comments_user_id_fkey (
            username,
            profile_image_url
          )
        `)
        .single();
        
      if (error) throw error;
      
      // Increment post comment count
      if (comment.post_id) {
        await supabase
          .from('posts')
          .update({
            comments_count: supabase.rpc('increment', { x: 1 })
          })
          .eq('id', comment.post_id);
      }
      
      // Format comment
      const formattedComment: Comment = {
        ...data,
        username: data.users?.username,
        profile_image_url: data.users?.profile_image_url,
        replies: []
      };
      
      // Update local comments state
      if (comment.parent_comment_id) {
        // Add to existing comment as reply
        const addReply = (comments: Comment[]): Comment[] => {
          return comments.map(c => {
            if (c.id === comment.parent_comment_id) {
              return {
                ...c,
                replies: [...(c.replies || []), formattedComment]
              };
            } else if (c.replies && c.replies.length > 0) {
              return {
                ...c,
                replies: addReply(c.replies)
              };
            }
            return c;
          });
        };
        
        set({ comments: addReply(get().comments) });
      } else {
        // Add as top-level comment
        set({ comments: [...get().comments, formattedComment] });
      }
      
      return formattedComment;
      
    } catch (error) {
      console.error('Error creating comment:', error);
      return null;
    }
  },

  buildCommentTree: (comments: Comment[]) => {
    const commentMap: { [key: string]: Comment } = {};
    const rootComments: Comment[] = [];
    
    // First pass: create a map of comments by ID
    comments.forEach(comment => {
      commentMap[comment.id] = {
        ...comment,
        replies: []
      };
    });
    
    // Second pass: build the tree structure
    comments.forEach(comment => {
      const formattedComment = commentMap[comment.id];
      
      if (comment.parent_comment_id && commentMap[comment.parent_comment_id]) {
        // This is a reply to another comment
        commentMap[comment.parent_comment_id].replies!.push(formattedComment);
      } else {
        // This is a root comment
        rootComments.push(formattedComment);
      }
    });
    
    return rootComments;
  }
}));