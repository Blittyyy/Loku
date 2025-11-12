import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTriggers } from '../../src/store/useTriggers';
import { Input } from '../../src/components/Input';
import { ToggleRow } from '../../src/components/ToggleRow';
import { Button } from '../../src/components/Button';
import { NotificationPreview } from '../../src/components/NotificationPreview';
import { TemplateSheet, TriggerTemplate } from '../../src/components/TemplateSheet';

export default function NewTriggerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { placeId } = route.params as { placeId: string };

  const [type, setType] = useState<'arrival' | 'departure'>('arrival');
  const [message, setMessage] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const addTrigger = useTriggers((state) => state.addTrigger);

  const handleTemplateSelect = (template: TriggerTemplate) => {
    setType(template.type);
    setMessage(template.message);
    setSoundEnabled(template.soundEnabled);
  };

  const handleSave = () => {
    const newTrigger = {
      id: Date.now().toString(),
      placeId,
      type,
      message,
      soundEnabled,
      enabled: true,
      createdAt: new Date().toISOString(),
    };

    addTrigger(newTrigger);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Trigger</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        <TouchableOpacity
          style={styles.templateButton}
          onPress={() => setShowTemplates(true)}
        >
          <Text style={styles.templateButtonText}>📝 Use a Template</Text>
        </TouchableOpacity>

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
      </ScrollView>

      <TemplateSheet
        visible={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelect={handleTemplateSelect}
      />
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
  previewContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  templateButton: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  templateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  saveButtonContainer: {
    marginTop: 8,
    marginBottom: 40,
  },
});

