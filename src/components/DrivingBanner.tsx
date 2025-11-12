import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useDriving } from '../store/useDriving';
import { useContactGroups } from '../store/useContactGroups';

interface DrivingBannerProps {
  onNotifyContacts: () => void;
  onDismiss: () => void;
}

export const DrivingBanner: React.FC<DrivingBannerProps> = ({ onNotifyContacts, onDismiss }) => {
  const isDriving = useDriving((state) => state.isDriving);
  const shouldShow = useDriving((state) => state.shouldShowPrompt());

  if (!isDriving || !shouldShow) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <View style={styles.content}>
        <Text style={styles.icon}>🚗</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Driving detected</Text>
          <Text style={styles.subtitle}>Notify your contacts?</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={onNotifyContacts}>
          <Text style={styles.buttonText}>Notify</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.dismissButton]} onPress={onDismiss}>
          <Text style={[styles.buttonText, styles.dismissButtonText]}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2563EB',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#DBEAFE',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  dismissButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  dismissButtonText: {
    color: '#FFFFFF',
  },
});

