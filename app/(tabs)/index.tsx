import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePlaces } from '../../src/store/usePlaces';
import { useTriggers } from '../../src/store/useTriggers';
import { useSettings } from '../../src/store/useSettings';
import { useDriving } from '../../src/store/useDriving';
import { PlaceCard } from '../../src/components/PlaceCard';
import { Button } from '../../src/components/Button';
import { EmptyState } from '../../src/components/EmptyState';
import { DrivingBanner } from '../../src/components/DrivingBanner';
import { QuickActionsFAB } from '../../src/components/QuickActionsFAB';
import { initDrivingDetection } from '../../src/services/drivingDetection';

export default function HomeScreen() {
  const navigation = useNavigation();
  const places = usePlaces((state) => state.places) || [];
  const activeCount = useTriggers((state) => state.activeCount);
  const paused = useSettings((state) => state.settings.paused);
  const fetchPlaces = usePlaces((state) => state.fetchPlaces);
  const fetchTriggers = useTriggers((state) => state.fetchTriggers);

  const isDriving = useDriving((state) => state.isDriving);
  const shouldShowPrompt = useDriving((state) => state.shouldShowPrompt());
  const markPromptShown = useDriving((state) => state.markPromptShown);

  useEffect(() => {
    // Fetch data on mount
    fetchPlaces();
    fetchTriggers();
    // Initialize driving detection
    initDrivingDetection();
  }, []);

  const handleNotifyContacts = () => {
    // Open quick actions sheet
    markPromptShown();
    // You could trigger the FAB to open here
  };

  const handleDismissPrompt = () => {
    markPromptShown();
  };

  const handleAddPlace = () => {
    (navigation as any).navigate('PlaceNew');
  };

  const handlePlacePress = (placeId: string) => {
    (navigation as any).navigate('PlaceDetails', { id: placeId });
  };

  const handleSettingsPress = () => {
    (navigation as any).navigate('Settings');
  };

  const handleOnboardingPress = () => {
    (navigation as any).navigate('Onboarding');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.branding}>Loku</Text>
        <View style={styles.headerButtons}>
          {/* Temporary onboarding button */}
          <TouchableOpacity
            onPress={handleOnboardingPress}
            style={styles.tempButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.tempButtonText}>🎓</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSettingsPress}
            style={styles.settingsButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.settingsButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.subheader}>
        <Text style={styles.subtitle}>
          {activeCount} active trigger{activeCount !== 1 ? 's' : ''}
        </Text>
      </View>

      {paused && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>⚠️ Automations paused</Text>
        </View>
      )}

      <DrivingBanner onNotifyContacts={handleNotifyContacts} onDismiss={handleDismissPrompt} />

      {places.length === 0 ? (
        <EmptyState
          icon="📍"
          title="No places yet"
          subtitle="Add your first location to start getting smart reminders"
          buttonTitle="+ Add Your First Place"
          onButtonPress={handleAddPlace}
        />
      ) : (
        <>
          <TouchableOpacity onPress={handleAddPlace} style={styles.addButton}>
            <Button title="Add Place" onPress={handleAddPlace} />
          </TouchableOpacity>

          <ScrollView style={styles.scrollView}>
            {places.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                onPress={() => handlePlacePress(place.id)}
              />
            ))}
          </ScrollView>
        </>
      )}

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
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  branding: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  tempButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
  },
  tempButtonText: {
    fontSize: 20,
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButtonText: {
    fontSize: 24,
  },
  subheader: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  addButton: {
    padding: 20,
    paddingTop: 16,
  },
  banner: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FCD34D',
  },
  bannerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#92400E',
    textAlign: 'center',
  },
});

