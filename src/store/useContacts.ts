import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { TrustedContact } from '../components/TrustedContactCard';

interface ContactsState {
  contacts: TrustedContact[];
  loading: boolean;
  error: string | null;
  fetchContacts: () => Promise<void>;
  addContact: (contact: {
    name: string;
    phone?: string;
    email?: string;
    share_arrival: boolean;
    share_departure: boolean;
  }) => Promise<TrustedContact | null>;
  updateContact: (id: string, updated: Partial<TrustedContact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
}

export const useContacts = create<ContactsState>((set) => ({
  contacts: [],
  loading: false,
  error: null,

  fetchContacts: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('trusted_contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ contacts: data || [], loading: false });
    } catch (error) {
      console.error('Error fetching contacts:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch contacts', loading: false });
    }
  },

  addContact: async (contact) => {
    try {
      const { data, error } = await supabase
        .from('trusted_contacts')
        .insert({
          name: contact.name,
          phone: contact.phone || null,
          email: contact.email || null,
          share_arrival: contact.share_arrival,
          share_departure: contact.share_departure,
          confirmed: false,
        })
        .select()
        .single();

      if (error) throw error;
      
      const newContact = data as TrustedContact;
      set((state) => ({ contacts: [newContact, ...state.contacts] }));
      return newContact;
    } catch (error) {
      console.error('Error adding contact:', error);
      return null;
    }
  },

  updateContact: async (id, updated) => {
    try {
      const dbUpdate: any = {};
      if (updated.share_arrival !== undefined) dbUpdate.share_arrival = updated.share_arrival;
      if (updated.share_departure !== undefined) dbUpdate.share_departure = updated.share_departure;
      if (updated.confirmed !== undefined) dbUpdate.confirmed = updated.confirmed;

      const { error } = await supabase
        .from('trusted_contacts')
        .update(dbUpdate)
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        contacts: state.contacts.map((c) => (c.id === id ? { ...c, ...updated } : c)),
      }));
    } catch (error) {
      console.error('Error updating contact:', error);
    }
  },

  deleteContact: async (id: string) => {
    try {
      const { error } = await supabase
        .from('trusted_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({ contacts: state.contacts.filter((c) => c.id !== id) }));
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  },
}));

