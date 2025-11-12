import { create } from 'zustand';
import { Place } from '../types';
import { supabase, DatabasePlace } from '../lib/supabase';

interface PlacesState {
  places: Place[];
  loading: boolean;
  error: string | null;
  fetchPlaces: () => Promise<void>;
  addPlace: (place: Omit<Place, 'id' | 'createdAt'> & { outer_radius?: number }) => Promise<Place | null>;
  updatePlace: (id: string, place: Partial<Place>) => Promise<void>;
  deletePlace: (id: string) => Promise<void>;
  getPlace: (id: string) => Place | undefined;
}

// Helper to convert database place to app place
const dbPlaceToPlace = (dbPlace: DatabasePlace): Place => ({
  id: dbPlace.id,
  name: dbPlace.name,
  address: dbPlace.address,
  lat: dbPlace.lat,
  lng: dbPlace.lng,
  radius: dbPlace.radius,
  createdAt: dbPlace.created_at,
});

export const usePlaces = create<PlacesState>((set, get) => ({
  places: [],
  loading: false,
  error: null,

  fetchPlaces: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const places = data?.map(dbPlaceToPlace) || [];
      set({ places, loading: false });
    } catch (error) {
      console.error('Error fetching places:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch places', loading: false });
    }
  },

  addPlace: async (place) => {
    try {
      const { data, error } = await supabase
        .from('places')
        .insert({
          name: place.name,
          address: place.address,
          lat: place.lat,
          lng: place.lng,
          radius: place.radius,
        })
        .select()
        .single();

      if (error) throw error;

      const newPlace = dbPlaceToPlace(data);
      set((state) => ({ places: [newPlace, ...state.places] }));
      return newPlace;
    } catch (error) {
      console.error('Error adding place:', error);
      return null;
    }
  },

  updatePlace: async (id: string, updated: Partial<Place>) => {
    try {
      const dbUpdate: any = {};
      if (updated.name) dbUpdate.name = updated.name;
      if (updated.address !== undefined) dbUpdate.address = updated.address;
      if (updated.lat) dbUpdate.lat = updated.lat;
      if (updated.lng) dbUpdate.lng = updated.lng;
      if (updated.radius) dbUpdate.radius = updated.radius;

      const { error } = await supabase
        .from('places')
        .update(dbUpdate)
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        places: state.places.map((p) => (p.id === id ? { ...p, ...updated } : p)),
      }));
    } catch (error) {
      console.error('Error updating place:', error);
    }
  },

  deletePlace: async (id: string) => {
    try {
      const { error } = await supabase
        .from('places')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({ places: state.places.filter((p) => p.id !== id) }));
    } catch (error) {
      console.error('Error deleting place:', error);
    }
  },

  getPlace: (id: string) => get().places.find((p) => p.id === id),
}));

