import { create } from 'zustand';
import { supabase, Community } from '../lib/supabase';
import { useAuthStore } from './authStore';

interface CommunityState {
  communities: Community[];
  defaultCommunities: Community[];
  currentCommunity: Community | null;
  loading: boolean;
  error: string | null;
  fetchCommunities: () => Promise<void>;
  fetchDefaultCommunities: () => Promise<void>;
  fetchCommunityByName: (name: string) => Promise<Community | null>;
  createCommunity: (community: Partial<Community>) => Promise<Community | null>;
  searchCommunities: (query: string) => Promise<Community[]>;
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  communities: [],
  defaultCommunities: [],
  currentCommunity: null,
  loading: false,
  error: null,

  fetchCommunities: async () => {
    try {
      set({ loading: true, error: null });
      
      const { selectedCommunities } = useAuthStore.getState();
      
      if (selectedCommunities.length === 0) {
        set({ communities: [], loading: false });
        return;
      }
      
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .in('id', selectedCommunities)
        .order('name', { ascending: true });
        
      if (error) throw error;
      
      set({
        communities: data || [],
        loading: false
      });
      
    } catch (error: any) {
      set({ loading: false, error: error.message });
      console.error('Error fetching communities:', error);
    }
  },

  fetchDefaultCommunities: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .in('name', ['news', 'entertainment', 'tech', 'sports', 'gaming'])
        .order('name', { ascending: true });
        
      if (error) throw error;
      
      set({
        defaultCommunities: data || [],
        loading: false
      });
      
    } catch (error: any) {
      set({ loading: false, error: error.message });
      console.error('Error fetching default communities:', error);
    }
  },

  fetchCommunityByName: async (name: string) => {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('name', name)
        .maybeSingle();
        
      if (error) throw error;
      
      set({ currentCommunity: data });
      return data;
      
    } catch (error) {
      console.error('Error fetching community:', error);
      set({ currentCommunity: null });
      return null;
    }
  },

  createCommunity: async (community: Partial<Community>) => {
    const { user } = useAuthStore.getState();
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('communities')
        .insert({
          ...community,
          user_id: user.id
        })
        .select()
        .maybeSingle();
        
      if (error) throw error;
      
      // Add to user's selected communities
      await supabase
        .from('user_communities')
        .insert({
          user_id: user.id,
          community_id: data.id
        });
        
      // Update auth store
      const { selectedCommunities, setSelectedCommunities } = useAuthStore.getState();
      setSelectedCommunities([...selectedCommunities, data.id]);
      
      // Update local communities
      set({
        communities: [...get().communities, data]
      });
      
      return data;
      
    } catch (error) {
      console.error('Error creating community:', error);
      return null;
    }
  },

  searchCommunities: async (query: string) => {
    try {
      if (query.length < 2) return [];
      
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .or(`name.ilike.%${query}%,display_name.ilike.%${query}%,description.ilike.%${query}%`)
        .order('member_count', { ascending: false })
        .limit(20);
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error searching communities:', error);
      return [];
    }
  }
}));