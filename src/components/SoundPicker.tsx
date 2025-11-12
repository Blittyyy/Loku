import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { validateAudioFile, SUPPORTED_AUDIO_FORMATS } from '../services/sounds';

interface SoundPickerProps {
  currentSound?: string;
  onSoundSelected: (uri: string) => void;
}

export const SoundPicker: React.FC<SoundPickerProps> = ({ currentSound, onSoundSelected }) => {
  const handlePickSound = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      
      // Validate file format
      if (!validateAudioFile(file.uri)) {
        Alert.alert(
          'Unsupported Format',
          `Please choose one of these formats: ${SUPPORTED_AUDIO_FORMATS.join(', ')}`
        );
        return;
      }

      onSoundSelected(file.uri);
    } catch (error) {
      console.error('Error picking sound file:', error);
      Alert.alert('Error', 'Failed to select sound file');
    }
  };

  const handleRemoveSound = () => {
    Alert.alert(
      'Remove Custom Sound',
      'This will use the default system sound. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onSoundSelected(''),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Custom Sound (Optional)</Text>
      {currentSound ? (
        <View style={styles.soundSelected}>
          <Text style={styles.soundName} numberOfLines={1}>
            {currentSound.substring(currentSound.lastIndexOf('/') + 1)}
          </Text>
          <TouchableOpacity onPress={handleRemoveSound} style={styles.removeButton}>
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.pickButton} onPress={handlePickSound}>
          <Text style={styles.pickButtonText}>Choose Custom Sound</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.helpText}>
        Supported formats: {SUPPORTED_AUDIO_FORMATS.join(', ')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  pickButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  pickButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  soundSelected: {
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
  },
  soundName: {
    fontSize: 14,
    color: '#065F46',
    flex: 1,
    marginRight: 8,
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  removeButtonText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
});

