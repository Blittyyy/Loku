import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTriggers } from '../../src/store/useTriggers';
import { Input } from '../../src/components/Input';
import { ToggleRow } from '../../src/components/ToggleRow';
import { Button } from '../../src/components/Button';
import { NotificationPreview } from '../../src/components/NotificationPreview';
import { SoundPicker, SoundOption } from '../../src/components/SoundPicker';

export default function EditTriggerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params as { id: string };

  const [type, setType] = useState<'arrival' | 'departure'>('arrival');
  const [message, setMessage] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [customSoundUri, setCustomSoundUri] = useState<string | null>(null);
  const [soundType, setSoundType] = useState<'default' | 'custom'>('default');

  const getTrigger = useTriggers((state) => state.getTrigger);
  const updateTrigger = useTriggers((state) => state.updateTrigger);

  useEffect(() => {
    const trigger = getTrigger(id);
    if (trigger) {
      setType(trigger.type);
      setMessage(trigger.message);
      setSoundEnabled(trigger.soundEnabled);
      setCustomSoundUri(trigger.customSoundUri || null);
      setSoundType(trigger.soundType || 'default');
    }
  }, [id, getTrigger]);

  const handleSave = () => {
    updateTrigger(id, {
      type,
      message,
      soundEnabled,
      customSoundUri: soundType === 'custom' ? customSoundUri : null,
      soundType,
    });
    navigation.goBack();
  };

  const handleSoundSelect = (sound: SoundOption | null) => {
    if (sound) {
      setSoundType(sound.type);
      if (sound.type === 'custom' && sound.uri) {
        setCustomSoundUri(sound.uri);
      } else {
        setCustomSoundUri(null);
      }
    }
  };

  const handleDelete = () => {
    const { deleteTrigger } = useTriggers.getState();
    deleteTrigger(id);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Trigger</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        <Text style={styles.sectionLabel}>Trigger Type</Text>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segment,
              styles.segmentLeft,
              type === 'arrival' && styles.segmentActive,
            ]}
            onPress={() => setType('arrival')}
          >
            <Text style={[styles.segmentText, type === 'arrival' && styles.segmentTextActive]}>
              Arrival
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segment,
              styles.segmentRight,
              type === 'departure' && styles.segmentActive,
            ]}
            onPress={() => setType('departure')}
          >
            <Text style={[styles.segmentText, type === 'departure' && styles.segmentTextActive]}>
              Departure
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Message</Text>
        <Input
          placeholder="Enter notification message"
          value={message}
          onChangeText={setMessage}
          multiline
        />

        {message && (
          <>
            <Text style={styles.sectionLabel}>Preview</Text>
            <View style={styles.previewContainer}>
              <NotificationPreview message={message} type={type} />
            </View>
          </>
        )}

        <ToggleRow
          title="Enable Sound"
          value={soundEnabled}
          onValueChange={setSoundEnabled}
        />

        {soundEnabled && (
          <SoundPicker
            value={customSoundUri || undefined}
            soundType={soundType}
            onSelect={handleSoundSelect}
            triggerType={type}
          />
        )}

        <View style={styles.saveButtonContainer}>
          <Button title="Save" onPress={handleSave} disabled={!message.trim()} />
        </View>

        <View style={styles.deleteButtonContainer}>
          <Button title="Delete" onPress={handleDelete} variant="secondary" />
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
  cancelButton: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
    padding: 20,
    paddingBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
    marginTop: 0,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
    marginTop: 0,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  segmentLeft: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  segmentRight: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  segmentActive: {
    backgroundColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  saveButtonContainer: {
    marginTop: 4,
    marginBottom: 12,
  },
  previewContainer: {
    marginTop: 0,
    marginBottom: 12,
  },
  deleteButtonContainer: {
    marginBottom: 0,
  },
});

