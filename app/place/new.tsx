import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { AddressAutocomplete } from '../../src/components/AddressAutocomplete';
import { usePlaces } from '../../src/store/usePlaces';

export default function NewPlaceScreen() {
  const navigation = useNavigation();
  const addPlace = usePlaces((state) => state.addPlace);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAddressSelect = (data: { address: string; lat: number; lng: number; name?: string }) => {
    setAddress(data.address);
    setLat(data.lat);
    setLng(data.lng);
    
    // Don't auto-populate name - let user keep their custom name
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a place name');
      return;
    }

    if (!lat || !lng || lat === 0 || lng === 0) {
      Alert.alert(
        'Address Required',
        'Please enter an address. For full geofencing functionality, you\'ll need to set up Google Places API.',
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);
    try {
      const newPlace = await addPlace({
        name: name.trim(),
        address: address || null,
        lat,
        lng,
        radius: 100, // Default radius in meters
        outerRadius: 150,
        outer_radius: 150,
      });

      if (newPlace) {
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Failed to add place. Please try again.');
      }
    } catch (error) {
      console.error('Error adding place:', error);
      Alert.alert('Error', 'Failed to add place. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Place</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        <Input
          label="Place Name *"
          placeholder="e.g., Home, Office, Gym"
          value={name}
          onChangeText={setName}
        />

        <View style={styles.autocompleteContainer}>
          <Text style={styles.label}>Search Address *</Text>
          <AddressAutocomplete
            placeholder="Start typing an address..."
            onSelect={handleAddressSelect}
          />
        </View>

        {address && (
          <Text style={styles.selectedAddress}>
            ✓ Selected: {address}
          </Text>
        )}

        <View style={styles.saveButtonContainer}>
          <Button 
            title="Save Place" 
            onPress={handleSave} 
            disabled={!name.trim() || loading}
            loading={loading}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButtonText: {
    fontSize: 24,
    color: '#3B82F6',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  autocompleteContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  selectedAddress: {
    fontSize: 13,
    color: '#10B981',
    marginTop: -8,
    marginBottom: 16,
    paddingLeft: 4,
  },
  saveButtonContainer: {
    marginTop: 8,
    marginBottom: 40,
  },
});

