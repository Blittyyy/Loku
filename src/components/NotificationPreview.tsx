import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface NotificationPreviewProps {
  message: string;
  type: 'arrival' | 'departure';
}

export const NotificationPreview: React.FC<NotificationPreviewProps> = ({ message, type }) => {
  const body = message || (type === 'arrival' ? 'Arrival reminder' : 'You left this place');

  return (
    <View style={styles.container}>
      <View style={styles.notification}>
        <View style={styles.content}>
          <View style={styles.appIcon}>
            <Text style={styles.appIconText}>L</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.appName}>Loku</Text>
            <Text style={styles.body}>{body}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  notification: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  appIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  appIconText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  textContainer: {
    flex: 1,
  },
  appName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});

