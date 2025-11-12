import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';

interface ActivityEntry {
  id: string;
  place_name: string | null;
  event_type: 'arrival' | 'departure' | null;
  timestamp: string;
}

interface RecentActivityProps {
  limit?: number;
  placeId?: string;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ limit = 10, placeId }) => {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [limit, placeId]);

  const fetchActivities = async () => {
    try {
      let query = supabase
        .from('trigger_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      // If filtering by place, get place name first
      if (placeId) {
        const { data: place } = await supabase
          .from('places')
          .select('name')
          .eq('id', placeId)
          .single();

        if (place) {
          query = query.eq('place_name', place.name);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes > 0 ? `${minutes}m ago` : 'Just now';
    }
  };

  const getEventIcon = (eventType: string | null) => {
    switch (eventType) {
      case 'arrival':
        return '🏠';
      case 'departure':
        return '👋';
      default:
        return '📍';
    }
  };

  if (loading && activities.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <Text style={styles.emptyText}>Loading...</Text>
      </View>
    );
  }

  if (activities.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <Text style={styles.emptyText}>No activity yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      {activities.map((item) => (
        <View key={item.id} style={styles.activityItem}>
          <View style={styles.activityLeft}>
            <Text style={styles.activityIcon}>{getEventIcon(item.event_type)}</Text>
            <View style={styles.activityContent}>
              <Text style={styles.activityPlace}>{item.place_name || 'Unknown'}</Text>
              <Text style={styles.activityType}>
                {item.event_type ? item.event_type.toUpperCase() : 'Event'}
              </Text>
            </View>
          </View>
          <Text style={styles.activityTime}>{formatTimestamp(item.timestamp)}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    padding: 16,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityPlace: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  activityType: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

