import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Place } from '../types';

interface PlaceCardProps {
  place: Place;
  onPress: () => void;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({ place, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.content}>
        <Text style={styles.name}>{place.name}</Text>
        <Text style={styles.address}>{place.address || 'No address'}</Text>
        <Text style={styles.radius}>Radius: {place.radius}m</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    gap: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  address: {
    fontSize: 14,
    color: '#6B7280',
  },
  radius: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

