import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';

export interface TriggerTemplate {
  name: string;
  type: 'arrival' | 'departure';
  message: string;
  soundEnabled: boolean;
}

const TEMPLATES: TriggerTemplate[] = [
  {
    name: 'Lock My Car',
    type: 'arrival',
    message: 'Did you lock your car?',
    soundEnabled: true,
  },
  {
    name: 'Arrive Safely',
    type: 'arrival',
    message: "I've arrived safely at {{place_name}}.",
    soundEnabled: true,
  },
  {
    name: 'Heading Home',
    type: 'departure',
    message: 'Leaving now — see you soon.',
    soundEnabled: true,
  },
  {
    name: 'Grocery Reminder',
    type: 'arrival',
    message: 'Open your shopping list.',
    soundEnabled: false,
  },
  {
    name: 'Gym Motivation',
    type: 'arrival',
    message: 'You did the hard part—showing up.',
    soundEnabled: true,
  },
];

interface TemplateSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (template: TriggerTemplate) => void;
}

export const TemplateSheet: React.FC<TemplateSheetProps> = ({ visible, onClose, onSelect }) => {
  const handleSelect = (template: TriggerTemplate) => {
    onSelect(template);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Choose a Template</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {TEMPLATES.map((template, index) => (
              <TouchableOpacity
                key={index}
                style={styles.templateItem}
                onPress={() => handleSelect(template)}
              >
                <View style={styles.templateHeader}>
                  <Text style={styles.templateName}>{template.name}</Text>
                  <View style={[styles.badge, styles[`${template.type}Badge`]]}>
                    <Text style={styles.badgeText}>{template.type}</Text>
                  </View>
                </View>
                <Text style={styles.templateMessage}>{template.message}</Text>
                <View style={styles.templateFooter}>
                  <Text style={styles.templateMeta}>
                    {template.soundEnabled ? '🔊 Sound on' : '🔕 Sound off'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#6B7280',
  },
  content: {
    padding: 20,
  },
  templateItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  arrivalBadge: {
    backgroundColor: '#D1FAE5',
  },
  departureBadge: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#065F46',
  },
  departureBadgeText: {
    color: '#991B1B',
  },
  templateMessage: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
    lineHeight: 20,
  },
  templateFooter: {
    marginTop: 4,
  },
  templateMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
});

