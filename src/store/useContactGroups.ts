import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { ContactGroup, ContactGroupMember } from '../types';
import { TrustedContact } from '../components/TrustedContactCard';

export interface ContactGroupWithMembers extends ContactGroup {
  members: TrustedContact[];
}

interface ContactGroupsState {
  groups: ContactGroupWithMembers[];
  loading: boolean;
  error: string | null;
  fetchGroups: () => Promise<void>;
  addGroup: (name: string) => Promise<ContactGroup | null>;
  updateGroup: (id: string, name: string) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  addMemberToGroup: (groupId: string, contactId: string) => Promise<void>;
  removeMemberFromGroup: (groupId: string, contactId: string) => Promise<void>;
  getGroup: (id: string) => ContactGroupWithMembers | undefined;
}

export const useContactGroups = create<ContactGroupsState>((set, get) => ({
  groups: [],
  loading: false,
  error: null,

  fetchGroups: async () => {
    set({ loading: true, error: null });
    try {
      // Fetch groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('contact_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      // Fetch all group members
      const { data: membersData, error: membersError } = await supabase
        .from('contact_group_members')
        .select('*');

      if (membersError) throw membersError;

      // Fetch all contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from('trusted_contacts')
        .select('*');

      if (contactsError) throw contactsError;

      // Build groups with members
      const groupsWithMembers: ContactGroupWithMembers[] = (groupsData || []).map((group) => {
        const memberIds = (membersData || [])
          .filter((m) => m.group_id === group.id)
          .map((m) => m.contact_id);
        
        const members = (contactsData || [])
          .filter((c) => memberIds.includes(c.id))
          .map((c) => c as TrustedContact);

        return {
          ...group,
          members,
        };
      });

      set({ groups: groupsWithMembers, loading: false });
    } catch (error) {
      console.error('Error fetching contact groups:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch groups', loading: false });
    }
  },

  addGroup: async (name: string) => {
    try {
      const { data, error } = await supabase
        .from('contact_groups')
        .insert({ name })
        .select()
        .single();

      if (error) throw error;

      const newGroup: ContactGroupWithMembers = {
        ...data,
        members: [],
      };

      set((state) => ({ groups: [newGroup, ...state.groups] }));
      return data;
    } catch (error) {
      console.error('Error adding group:', error);
      return null;
    }
  },

  updateGroup: async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from('contact_groups')
        .update({ name })
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        groups: state.groups.map((g) => (g.id === id ? { ...g, name } : g)),
      }));
    } catch (error) {
      console.error('Error updating group:', error);
    }
  },

  deleteGroup: async (id: string) => {
    try {
      const { error } = await supabase
        .from('contact_groups')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({ groups: state.groups.filter((g) => g.id !== id) }));
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  },

  addMemberToGroup: async (groupId: string, contactId: string) => {
    try {
      const { error } = await supabase
        .from('contact_group_members')
        .insert({ group_id: groupId, contact_id: contactId });

      if (error) throw error;

      // Refresh groups to get updated members
      await get().fetchGroups();
    } catch (error) {
      console.error('Error adding member to group:', error);
    }
  },

  removeMemberFromGroup: async (groupId: string, contactId: string) => {
    try {
      const { error } = await supabase
        .from('contact_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('contact_id', contactId);

      if (error) throw error;

      // Refresh groups to get updated members
      await get().fetchGroups();
    } catch (error) {
      console.error('Error removing member from group:', error);
    }
  },

  getGroup: (id: string) => get().groups.find((g) => g.id === id),
}));

