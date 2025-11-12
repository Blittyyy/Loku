import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { usePlaces } from '../../src/store/usePlaces';
import { useTriggers } from '../../src/store/useTriggers';
import { Button } from '../../src/components/Button';
import { EmptyState } from '../../src/components/EmptyState';
import { RecentActivity } from '../../src/components/RecentActivity';
import { QuickActionsFAB } from '../../src/components/QuickActionsFAB';

export default function PlaceDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params as { id: string };
  
  // Use basic selectors to avoid infinite loops
  const places = usePlaces((state) => state.places);
  const allTriggers = useTriggers((state) => state.triggers);
  
  const place = places.find((p) => p.id === id);
  const triggers = allTriggers.filter((t) => t.placeId === id);
  
  // Memoize filtered triggers
  const arrivalTriggers = useMemo(() => 
    triggers.filter((t) => t.type === 'arrival' && t.enabled),
    [triggers]
  );
  const departureTriggers = useMemo(() => 
    triggers.filter((t) => t.type === 'departure' && t.enabled),
    [triggers]
  );

  const handleAddTrigger = () => {
    (navigation as any).navigate('TriggerNew', { placeId: id });
  };

  if (!place) {
    return (
      <View style={styles.container}>
        <EmptyState title="Place not found" subtitle="This place doesn't exist" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.placeName}>{place.name}</Text>
          <Text style={styles.address}>{place.address || 'No address'}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Arrival Triggers</Text>
          {arrivalTriggers.length === 0 ? (
            <View style={styles.emptyTriggerSection}>
              <Text style={styles.emptyText}>No arrival triggers</Text>
            </View>
          ) : (
            arrivalTriggers.map((trigger) => (
              <View key={trigger.id} style={styles.triggerCard}>
                <Text style={styles.triggerMessage}>{trigger.message}</Text>
                <Text style={styles.triggerMeta}>
                  Sound: {trigger.soundEnabled ? 'On' : 'Off'}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Departure Triggers</Text>
          {departureTriggers.length === 0 ? (
            <View style={styles.emptyTriggerSection}>
              <Text style={styles.emptyText}>No departure triggers</Text>
            </View>
          ) : (
            departureTriggers.map((trigger) => (
              <View key={trigger.id} style={styles.triggerCard}>
                <Text style={styles.triggerMessage}>{trigger.message}</Text>
                <Text style={styles.triggerMeta}>
                  Sound: {trigger.soundEnabled ? 'On' : 'Off'}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.addButtonContainer}>
          <Button title="Add Trigger" onPress={handleAddTrigger} />
        </View>

        <View style={styles.activityContainer}>
          <RecentActivity limit={10} placeId={id} />
        </View>
      </ScrollView>

      <QuickActionsFAB />
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
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 24,
    color: '#3B82F6',
  },
  headerContent: {
    flex: 1,
  },
  placeName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  triggerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  triggerMessage: {
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 8,
  },
  triggerMeta: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyTriggerSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  addButtonContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  activityContainer: {
    paddingBottom: 40,
  },
});

