import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTriggers } from '../../src/store/useTriggers';
import { Input } from '../../src/components/Input';
import { ToggleRow } from '../../src/components/ToggleRow';
import { Button } from '../../src/components/Button';
import { NotificationPreview } from '../../src/components/NotificationPreview';

export default function EditTriggerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params as { id: string };

  const [type, setType] = useState<'arrival' | 'departure'>('arrival');
  const [message, setMessage] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(false);

  const getTrigger = useTriggers((state) => state.getTrigger);
  const updateTrigger = useTriggers((state) => state.updateTrigger);

  useEffect(() => {
    const trigger = getTrigger(id);
    if (trigger) {
      setType(trigger.type);
      setMessage(trigger.message);
      setSoundEnabled(trigger.soundEnabled);
    }
  }, [id, getTrigger]);

  const handleSave = () => {
    updateTrigger(id, { type, message, soundEnabled });
    navigation.goBack();
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
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeButton, type === 'arrival' && styles.typeButtonActive]}
            onPress={() => setType('arrival')}
          >
            <Text style={[styles.typeText, type === 'arrival' && styles.typeTextActive]}>
              Arrival
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, type === 'departure' && styles.typeButtonActive]}
            onPress={() => setType('departure')}
          >
            <Text style={[styles.typeText, type === 'departure' && styles.typeTextActive]}>
              Departure
            </Text>
          </TouchableOpacity>
        </View>

        <Input
          label="Message"
          placeholder="Enter notification message"
          value={message}
          onChangeText={setMessage}
          multiline
        />

        {message && (
          <View style={styles.previewContainer}>
            <NotificationPreview message={message} type={type} />
          </View>
        )}

        <ToggleRow
          title="Enable Sound"
          value={soundEnabled}
          onValueChange={setSoundEnabled}
        />

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
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  typeButtonActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#3B82F6',
  },
  typeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  typeTextActive: {
    color: '#FFFFFF',
  },
  saveButtonContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  previewContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  deleteButtonContainer: {
    marginBottom: 40,
  },
});

