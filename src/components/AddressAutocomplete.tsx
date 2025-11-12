import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

interface AddressAutocompleteProps {
  placeholder?: string;
  onSelect: (data: { address: string; lat: number; lng: number; name?: string }) => void;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({ 
  placeholder = "Start typing an address...",
  onSelect 
}) => {
  const [manualAddress, setManualAddress] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

  const handlePlaceSelect = (data: any, details: any = null) => {
    if (details) {
      onSelect({
        address: details.formatted_address || data.description,
        lat: details.geometry.location.lat,
        lng: details.geometry.location.lng,
        name: details.name,
      });
    } else if (data) {
      // Fallback if details not fetched
      onSelect({
        address: data.description,
        lat: 0,
        lng: 0,
        name: data.structured_formatting?.main_text,
      });
    }
  };

  // Fetch suggestions from Google Places API
  const fetchSuggestions = async (input: string) => {
    if (!apiKey || input.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}`
      );
      const data = await response.json();
      
      if (data.predictions) {
        setSuggestions(data.predictions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  };

  const handleTextChange = (text: string) => {
    setManualAddress(text);
    fetchSuggestions(text);
  };

  const handleSelectSuggestion = async (placeId: string, description: string) => {
    if (!apiKey) return;

    try {
      // Get place details to get coordinates
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_address,geometry,name&key=${apiKey}`
      );
      const data = await response.json();
      
      if (data.result) {
        onSelect({
          address: data.result.formatted_address,
          lat: data.result.geometry.location.lat,
          lng: data.result.geometry.location.lng,
          name: data.result.name,
        });
        setManualAddress(data.result.formatted_address);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      // Fallback to just the description
      onSelect({
        address: description,
        lat: 0,
        lng: 0,
      });
    }
  };

  const handleSubmit = () => {
    if (manualAddress.trim()) {
      onSelect({
        address: manualAddress,
        lat: 0,
        lng: 0,
      });
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.textInput}
        placeholder={placeholder}
        value={manualAddress}
        onChangeText={handleTextChange}
        onSubmitEditing={handleSubmit}
        autoCapitalize="words"
        autoCorrect={false}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <ScrollView
          style={styles.suggestionsContainer}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
        >
          {suggestions.map((item) => (
            <TouchableOpacity
              key={item.place_id}
              style={styles.suggestionItem}
              onPress={() => handleSelectSuggestion(item.place_id, item.description)}
            >
              <Text style={styles.suggestionText}>{item.description}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      
      {manualAddress.length > 0 && suggestions.length === 0 && (
        <Text style={styles.hint}>
          💡 Keep typing to see address suggestions...
        </Text>
      )}
    </View>
  );

  // TODO: Re-enable once API is verified working
  /* 
  if (!apiKey) {
    return (
      <View>
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          value={manualAddress}
          onChangeText={setManualAddress}
          onSubmitEditing={handleManualSubmit}
        />
        <Text style={styles.hint}>💡 Add EXPO_PUBLIC_GOOGLE_PLACES_API_KEY to .env for autocomplete</Text>
      </View>
    );
  }

  try {
    return (
      <GooglePlacesAutocomplete
      placeholder={placeholder}
      minLength={2}
      fetchDetails={true}
      onPress={handlePlaceSelect}
      onFail={(error) => {
        console.error('Google Places error:', error);
      }}
      query={{
        key: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '',
        language: 'en',
      }}
      debounce={400}
      filterReverseGeocodingByTypes={['locality', 'administrative_area_level_3']}
      styles={{
        container: {
          flex: 0,
        },
        textInputContainer: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          borderBottomWidth: 0,
        },
        textInput: {
          borderWidth: 1,
          borderColor: '#D1D5DB',
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          fontSize: 16,
          backgroundColor: '#FFFFFF',
          color: '#1F2937',
        },
        listView: {
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          marginTop: 8,
          maxHeight: 200,
        },
        row: {
          padding: 16,
          minHeight: 56,
        },
        separator: {
          height: 1,
          backgroundColor: '#F3F4F6',
        },
        description: {
          fontSize: 14,
          color: '#374151',
        },
        predefinedPlacesDescription: {
          color: '#9CA3AF',
        },
      }}
      enablePoweredByContainer={false}
      />
    );
  } catch (error) {
    console.error('GooglePlacesAutocomplete error:', error);
    // Fallback to manual input on error
    return (
      <View>
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          value={manualAddress}
          onChangeText={setManualAddress}
          onSubmitEditing={handleManualSubmit}
        />
        <Text style={styles.hint}>⚠️ Google Places unavailable. Enter address manually.</Text>
      </View>
    );
  }
  */
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
  },
  suggestionsContainer: {
    maxHeight: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionText: {
    fontSize: 14,
    color: '#374151',
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
});

