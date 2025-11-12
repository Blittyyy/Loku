import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface NotificationPreviewProps {
  message: string;
  type: 'arrival' | 'departure';
}

export const NotificationPreview: React.FC<NotificationPreviewProps> = ({ message, type }) => {
  const title = 'Loku';
  const body = message || (type === 'arrival' ? 'Arrival reminder' : 'You left this place');

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Preview</Text>
      <View style={styles.notification}>
        <View style={styles.notificationHeader}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.now}>now</Text>
        </View>
        <Text style={styles.body}>{body}</Text>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{type === 'arrival' ? '🏠' : '👋'}</Text>
        </View>
      </View>
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
    marginBottom: 12,
  },
  notification: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  now: {
    fontSize: 12,
    color: '#6B7280',
  },
  body: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  iconContainer: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  icon: {
    fontSize: 24,
  },
});

