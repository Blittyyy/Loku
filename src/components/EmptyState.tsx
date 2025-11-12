import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  subtitle: string;
  icon?: string;
  buttonTitle?: string;
  onButtonPress?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  subtitle, 
  icon,
  buttonTitle,
  onButtonPress
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon || '📍'}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {buttonTitle && onButtonPress && (
        <View style={styles.buttonContainer}>
          <Button title={buttonTitle} onPress={onButtonPress} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 8,
  },
});

