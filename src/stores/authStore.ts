import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  initialized: boolean;
  selectedCommunities: number[];
  loading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  setSelectedCommunities: (communityIds: number[]) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  initialized: false,
  selectedCommunities: [],
  loading: false,
  error: null,

  initialize: async () => {
    try {
      // Check active session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        set({ user: session.user });
        
        // Fetch selected communities
        const { data: userCommunities } = await supabase
          .from('user_communities')
          .select('community_id')
          .eq('user_id', session.user.id);
          
        if (userCommunities) {
          set({ 
            selectedCommunities: userCommunities.map(uc => uc.community_id) 
          });
        }
      }
      
      // Set up auth state change listener
      supabase.auth.onAuthStateChange((event, session) => {
        set({ user: session?.user || null });
        
        if (event === 'SIGNED_IN' && session) {
          // Fetch communities when signed in
          const fetchCommunities = async () => {
            const { data: userCommunities } = await supabase
              .from('user_communities')
              .select('community_id')
              .eq('user_id', session.user.id);
              
            if (userCommunities) {
              set({ 
                selectedCommunities: userCommunities.map(uc => uc.community_id) 
              });
            }
          };
          
          fetchCommunities();
        } else if (event === 'SIGNED_OUT') {
          set({ selectedCommunities: [] });
        }
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      set({ initialized: true });
    }
  },

  login: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      set({ user: data.user });
      
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  loginWithGoogle: async () => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/community-selection`
        }
      });
      
      if (error) throw error;
      
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  register: async (email: string, password: string, username: string) => {
    try {
      set({ loading: true, error: null });
      
      // Check if username is already taken
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single();
        
      if (existingUser) {
        throw new Error('このユーザー名は既に使用されています');
      }
      
      // Register user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username
          },
          emailRedirectTo: `${window.location.origin}/community-selection`
        }
      });
      
      if (error) throw error;
      
      // Create user profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .upsert([
            {
              id: data.user.id,
              email: data.user.email,
              username: username
            }
          ], { onConflict: 'id' });
        if (profileError) throw profileError;
      }
      
      set({ user: data.user });
      
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      set({ user: null, selectedCommunities: [] });
      
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  setSelectedCommunities: (communityIds: number[]) => {
    set({ selectedCommunities: communityIds });
    
    // Save selected communities to database
    const { user } = get();
    if (user) {
      const saveCommunities = async () => {
        // Delete existing selections
        await supabase
          .from('user_communities')
          .delete()
          .eq('user_id', user.id);
          
        // Insert new selections
        const communitiesToInsert = communityIds.map(communityId => ({
          user_id: user.id,
          community_id: communityId
        }));
        
        if (communitiesToInsert.length > 0) {
          await supabase
            .from('user_communities')
            .insert(communitiesToInsert);
        }
      };
      
      saveCommunities();
    }
  }
}));

// Initialize auth state immediately
useAuthStore.getState().initialize();