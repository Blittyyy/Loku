import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { validateAudioFile, playCustomSound, playArrival, playReminder, playChimeSound, playBellSound, playNotificationSound } from '../services/sounds';

export type SoundOption = {
  id: string;
  name: string;
  type: 'default' | 'custom';
  uri?: string;
};

const DEFAULT_SOUNDS: SoundOption[] = [
  { id: 'default', name: 'Default', type: 'default' },
  { id: 'chime', name: 'Chime', type: 'default' },
  { id: 'bell', name: 'Bell', type: 'default' },
  { id: 'notification', name: 'Notification', type: 'default' },
];

interface SoundPickerProps {
  value?: string | null;
  soundType?: 'default' | 'custom';
  onSelect: (sound: SoundOption | null) => void;
  triggerType?: 'arrival' | 'departure';
}

export const SoundPicker: React.FC<SoundPickerProps> = ({
  value,
  soundType = 'default',
  onSelect,
  triggerType = 'arrival',
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedSound, setSelectedSound] = useState<SoundOption | null>(
    soundType === 'custom' && value
      ? { id: 'custom', name: 'Custom Sound', type: 'custom', uri: value }
      : DEFAULT_SOUNDS.find((s) => s.id === 'default') || DEFAULT_SOUNDS[0]
  );

  const handleSelectDefault = (sound: SoundOption) => {
    setSelectedSound(sound);
    onSelect(sound);
    setShowModal(false);
  };

  const handleSelectCustom = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      
      if (!validateAudioFile(file.uri)) {
        Alert.alert('Invalid File', 'Please select a valid audio file (.mp3, .m4a, .wav, .aac, or .ogg)');
        return;
      }

      // Copy file to app's document directory for persistent storage
      const fileName = `custom_sound_${Date.now()}${file.uri.substring(file.uri.lastIndexOf('.'))}`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.copyAsync({
        from: file.uri,
        to: fileUri,
      });

      const customSound: SoundOption = {
        id: 'custom',
        name: file.name || 'Custom Sound',
        type: 'custom',
        uri: fileUri,
      };

      setSelectedSound(customSound);
      onSelect(customSound);
      setShowModal(false);
    } catch (error) {
      console.error('Error picking custom sound:', error);
      Alert.alert('Error', 'Failed to select custom sound. Please try again.');
    }
  };

  const handleRemoveCustom = () => {
    const defaultSound = DEFAULT_SOUNDS.find((s) => s.id === `default-${triggerType}`) || DEFAULT_SOUNDS[0];
    setSelectedSound(defaultSound);
    onSelect(defaultSound);
    setShowModal(false);
  };

  const handlePreview = async (sound: SoundOption) => {
    if (sound.type === 'custom' && sound.uri) {
      try {
        await playCustomSound(sound.uri, false);
      } catch (error) {
        console.error('Error previewing sound:', error);
        Alert.alert('Error', 'Could not preview sound');
      }
    } else {
      // Preview default sounds using actual sound functions
      try {
        // Play appropriate sound based on sound selection
        if (sound.id === 'default') {
          // Use arrival sound for default (works for both arrival and departure triggers)
          await playArrival(true, false);
        } else if (sound.id === 'chime') {
          // Chime sound - light, pleasant tone
          await playChimeSound();
        } else if (sound.id === 'bell') {
          // Bell sound - medium, attention-grabbing tone
          await playBellSound();
        } else if (sound.id === 'notification') {
          // Notification sound - standard notification tone
          await playNotificationSound();
        } else {
          // Default fallback
          await playArrival(true, false);
        }
      } catch (error) {
        console.error('Error previewing default sound:', error);
        // Fallback to haptic feedback
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setShowModal(true)}
      >
        <View style={styles.pickerContent}>
          <Text style={styles.pickerLabel}>Sound</Text>
          <Text style={styles.pickerValue}>
            {selectedSound?.name || 'Default'}
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Sound</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.modalClose}>Done</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.soundList}>
              <Text style={styles.sectionTitle}>Default Sounds</Text>
              {DEFAULT_SOUNDS.map((sound) => (
                <TouchableOpacity
                  key={sound.id}
                  style={[
                    styles.soundOption,
                    selectedSound?.id === sound.id && styles.soundOptionSelected,
                  ]}
                  onPress={() => handleSelectDefault(sound)}
                >
                  <View style={styles.soundOptionContent}>
                    <Text style={styles.soundOptionName}>{sound.name}</Text>
                    {selectedSound?.id === sound.id && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.previewButton}
                    onPress={() => handlePreview(sound)}
                  >
                    <Text style={styles.previewButtonText}>Preview</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}

              <Text style={[styles.sectionTitle, styles.sectionTitleMargin]}>Custom Sound</Text>
              {selectedSound?.type === 'custom' ? (
                <View style={styles.customSoundContainer}>
                  <View style={styles.customSoundInfo}>
                    <Text style={styles.customSoundName}>{selectedSound.name}</Text>
                    <TouchableOpacity
                      style={styles.previewButton}
                      onPress={() => handlePreview(selectedSound)}
                    >
                      <Text style={styles.previewButtonText}>Preview</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={handleRemoveCustom}
                  >
                    <Text style={styles.removeButtonText}>Remove Custom Sound</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.customSoundButton}
                  onPress={handleSelectCustom}
                >
                  <Text style={styles.customSoundButtonText}>+ Choose Custom Sound</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  pickerButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pickerContent: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  pickerValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  chevron: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalClose: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  soundList: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitleMargin: {
    marginTop: 24,
  },
  soundOption: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  soundOptionSelected: {
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  soundOptionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  soundOptionName: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 18,
    color: '#3B82F6',
    marginLeft: 12,
  },
  previewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginLeft: 12,
  },
  previewButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  customSoundContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  customSoundInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  customSoundName: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    flex: 1,
  },
  removeButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  customSoundButton: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  customSoundButtonText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
});
