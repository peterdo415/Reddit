import { create } from 'zustand';
import { supabase, Post, calculateHotScore } from '../lib/supabase';
import { useAuthStore } from './authStore';

interface PostState {
  posts: Post[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  offset: number;
  fetchPosts: (refresh?: boolean) => Promise<void>;
  fetchPostsByCommunity: (communityName: string, refresh?: boolean) => Promise<void>;
  fetchPostById: (id: string) => Promise<Post | null>;
  upvotePost: (postId: string) => Promise<void>;
  downvotePost: (postId: string) => Promise<void>;
  createPost: (post: Partial<Post>) => Promise<Post | null>;
  searchPosts: (query: string) => Promise<Post[]>;
}

const POSTS_PER_PAGE = 25;

export const usePostStore = create<PostState>((set, get) => ({
  posts: [],
  loading: false,
  error: null,
  hasMore: true,
  offset: 0,

  fetchPosts: async (refresh = false) => {
    try {
      const newOffset = refresh ? 0 : get().offset;
      set({ loading: true, error: null });
      
      const { selectedCommunities } = useAuthStore.getState();
      
      // Get promoted posts (1-2 ads)
      const { data: promotedPosts, error: promotedError } = await supabase
        .from('posts')
        .select(`
          *,
          communities!inner (
            name,
            display_name,
            image_url
          ),
          users!posts_user_id_fkey (
            username,
            profile_image_url
          )
        `)
        .eq('is_promoted', true)
        .order('created_at', { ascending: false })
        .limit(2);
        
      if (promotedError) throw promotedError;
      
      // Get regular posts
      let query = supabase
        .from('post_hot_scores')
        .select('*')
        .order('hot_score', { ascending: false })
        .eq('is_promoted', false)
        .range(newOffset, newOffset + POSTS_PER_PAGE - 1);
        
      // Filter by selected communities if any
      if (selectedCommunities.length > 0) {
        query = query.in('community_id', selectedCommunities);
      }
      
      const { data: regularPosts, error } = await query;
      
      if (error) throw error;
      
      // Format posts
      const formattedPromoted = promotedPosts ? promotedPosts.map((post) => ({
        ...post,
        community_name: post.communities?.name,
        community_display_name: post.communities?.display_name,
        community_image_url: post.communities?.image_url,
        username: post.users?.username,
        profile_image_url: post.users?.profile_image_url,
      })) : [];
      
      // Insert 1-2 promoted posts randomly in the first 25 regular posts
      const newPosts = [...(regularPosts || [])];
      
      if (formattedPromoted.length > 0 && newOffset === 0) {
        // Insert first promoted post at position 3-6
        const position1 = Math.floor(Math.random() * 4) + 3;
        newPosts.splice(position1, 0, formattedPromoted[0]);
        
        // Insert second promoted post (if exists) at position 10-15
        if (formattedPromoted.length > 1) {
          const position2 = Math.floor(Math.random() * 6) + 10;
          newPosts.splice(position2, 0, formattedPromoted[1]);
        }
      }
      
      set({
        posts: refresh ? newPosts : [...get().posts, ...newPosts],
        loading: false,
        hasMore: (regularPosts?.length || 0) === POSTS_PER_PAGE,
        offset: newOffset + POSTS_PER_PAGE
      });
      
    } catch (error: any) {
      set({ loading: false, error: error.message });
      console.error('Error fetching posts:', error);
    }
  },

  fetchPostsByCommunity: async (communityName: string, refresh = false) => {
    try {
      const newOffset = refresh ? 0 : get().offset;
      set({ loading: true, error: null });
      
      // Get community ID
      const { data: community, error: communityError } = await supabase
        .from('communities')
        .select('id')
        .eq('name', communityName)
        .maybeSingle();
        
      if (communityError) throw communityError;
      
      // Get regular posts
      const { data: posts, error } = await supabase
        .from('post_hot_scores')
        .select('*')
        .eq('community_id', community.id)
        .eq('is_promoted', false)
        .order('hot_score', { ascending: false })
        .range(newOffset, newOffset + POSTS_PER_PAGE - 1);
        
      if (error) throw error;
      
      set({
        posts: refresh ? posts || [] : [...get().posts, ...(posts || [])],
        loading: false,
        hasMore: (posts?.length || 0) === POSTS_PER_PAGE,
        offset: newOffset + POSTS_PER_PAGE
      });
      
    } catch (error: any) {
      set({ loading: false, error: error.message });
      console.error('Error fetching community posts:', error);
    }
  },

  fetchPostById: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          communities!inner (
            name,
            display_name,
            image_url
          ),
          users!posts_user_id_fkey (
            username,
            profile_image_url
          )
        `)
        .eq('id', id)
        .maybeSingle();
        
      if (error) throw error;
      
      // Increment view count
      await supabase
        .from('posts')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', id);
        
      // Format post
      const post: Post = {
        ...data,
        community_name: data.communities?.name,
        community_display_name: data.communities?.display_name,
        community_image_url: data.communities?.image_url,
        username: data.users?.username,
        profile_image_url: data.users?.profile_image_url,
      };
      
      return post;
      
    } catch (error) {
      console.error('Error fetching post:', error);
      return null;
    }
  },

  upvotePost: async (postId: string) => {
    const { user } = useAuthStore.getState();
    if (!user) return;
    
    try {
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('votes')
        .select('vote_type')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .maybeSingle();
        
      // Handle vote logic
      if (existingVote) {
        if (existingVote.vote_type === 1) {
          // Remove upvote if already upvoted
          await supabase
            .from('votes')
            .delete()
            .eq('user_id', user.id)
            .eq('post_id', postId);
            
          // Update post counts
          await supabase
            .from('posts')
            .update({
              upvotes_count: supabase.rpc('decrement', { x: 1 })
            })
            .eq('id', postId);
        } else {
          // Change downvote to upvote
          await supabase
            .from('votes')
            .update({ vote_type: 1 })
            .eq('user_id', user.id)
            .eq('post_id', postId);
            
          // Update post counts
          await supabase
            .from('posts')
            .update({
              upvotes_count: supabase.rpc('increment', { x: 1 }),
              downvotes_count: supabase.rpc('decrement', { x: 1 })
            })
            .eq('id', postId);
        }
      } else {
        // Add new upvote
        await supabase
          .from('votes')
          .insert({
            user_id: user.id,
            post_id: postId,
            vote_type: 1
          });
          
        // Update post count
        await supabase
          .from('posts')
          .update({
            upvotes_count: supabase.rpc('increment', { x: 1 })
          })
          .eq('id', postId);
      }
      
      // Update local posts state
      const { posts } = get();
      const updatedPosts = posts.map(post => {
        if (post.id === postId) {
          const oldVoteType = existingVote ? existingVote.vote_type : 0;
          const newUpvotes = post.upvotes_count + (oldVoteType === 1 ? -1 : 1);
          const newDownvotes = oldVoteType === -1 ? post.downvotes_count - 1 : post.downvotes_count;
          
          return {
            ...post,
            upvotes_count: newUpvotes,
            downvotes_count: newDownvotes,
            hot_score: calculateHotScore(
              newUpvotes, 
              newDownvotes, 
              new Date(post.created_at)
            )
          };
        }
        return post;
      });
      
      set({ posts: updatedPosts });
      
    } catch (error) {
      console.error('Error upvoting post:', error);
    }
  },

  downvotePost: async (postId: string) => {
    const { user } = useAuthStore.getState();
    if (!user) return;
    
    try {
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('votes')
        .select('vote_type')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .maybeSingle();
        
      // Handle vote logic
      if (existingVote) {
        if (existingVote.vote_type === -1) {
          // Remove downvote if already downvoted
          await supabase
            .from('votes')
            .delete()
            .eq('user_id', user.id)
            .eq('post_id', postId);
            
          // Update post counts
          await supabase
            .from('posts')
            .update({
              downvotes_count: supabase.rpc('decrement', { x: 1 })
            })
            .eq('id', postId);
        } else {
          // Change upvote to downvote
          await supabase
            .from('votes')
            .update({ vote_type: -1 })
            .eq('user_id', user.id)
            .eq('post_id', postId);
            
          // Update post counts
          await supabase
            .from('posts')
            .update({
              upvotes_count: supabase.rpc('decrement', { x: 1 }),
              downvotes_count: supabase.rpc('increment', { x: 1 })
            })
            .eq('id', postId);
        }
      } else {
        // Add new downvote
        await supabase
          .from('votes')
          .insert({
            user_id: user.id,
            post_id: postId,
            vote_type: -1
          });
          
        // Update post count
        await supabase
          .from('posts')
          .update({
            downvotes_count: supabase.rpc('increment', { x: 1 })
          })
          .eq('id', postId);
      }
      
      // Update local posts state
      const { posts } = get();
      const updatedPosts = posts.map(post => {
        if (post.id === postId) {
          const oldVoteType = existingVote ? existingVote.vote_type : 0;
          const newUpvotes = oldVoteType === 1 ? post.upvotes_count - 1 : post.upvotes_count;
          const newDownvotes = post.downvotes_count + (oldVoteType === -1 ? -1 : 1);
          
          return {
            ...post,
            upvotes_count: newUpvotes,
            downvotes_count: newDownvotes,
            hot_score: calculateHotScore(
              newUpvotes, 
              newDownvotes, 
              new Date(post.created_at)
            )
          };
        }
        return post;
      });
      
      set({ posts: updatedPosts });
      
    } catch (error) {
      console.error('Error downvoting post:', error);
    }
  },

  createPost: async (post: Partial<Post>) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert(post)
        .select()
        .single();
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error creating post:', error);
      return null;
    }
  },

  searchPosts: async (query: string) => {
    try {
      if (query.length < 3) return [];
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          communities!inner (
            name,
            display_name,
            image_url
          ),
          users!posts_user_id_fkey (
            username,
            profile_image_url
          )
        `)
        .or(`title.ilike.%${query}%,body.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(25);
        
      if (error) throw error;
      
      // Format posts
      const formattedPosts = data.map((post) => ({
        ...post,
        community_name: post.communities?.name,
        community_display_name: post.communities?.display_name,
        community_image_url: post.communities?.image_url,
        username: post.users?.username,
        profile_image_url: post.users?.profile_image_url,
      }));
      
      return formattedPosts;
    } catch (error) {
      console.error('Error searching posts:', error);
      return [];
    }
  }
}));