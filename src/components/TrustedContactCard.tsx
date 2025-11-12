import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export interface TrustedContact {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  confirmed: boolean;
  share_arrival: boolean;
  share_departure: boolean;
  created_at: string;
}

interface TrustedContactCardProps {
  contact: TrustedContact;
  onToggle: (id: string, field: 'share_arrival' | 'share_departure') => void;
  onDelete: (id: string) => void;
  onConfirm?: (id: string) => void;
}

export const TrustedContactCard: React.FC<TrustedContactCardProps> = ({
  contact,
  onToggle,
  onDelete,
  onConfirm,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.name}>{contact.name}</Text>
          {contact.phone && <Text style={styles.phone}>{contact.phone}</Text>}
          {contact.email && <Text style={styles.email}>{contact.email}</Text>}
        </View>
        <TouchableOpacity
          onPress={() => onDelete(contact.id)}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.toggles}>
        <TouchableOpacity
          style={styles.toggle}
          onPress={() => onToggle(contact.id, 'share_arrival')}
        >
          <Text style={styles.toggleLabel}>Arrival</Text>
          <View style={[styles.toggleDot, contact.share_arrival && styles.toggleDotActive]} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toggle}
          onPress={() => onToggle(contact.id, 'share_departure')}
        >
          <Text style={styles.toggleLabel}>Departure</Text>
          <View style={[styles.toggleDot, contact.share_departure && styles.toggleDotActive]} />
        </TouchableOpacity>
      </View>

      {!contact.confirmed ? (
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => onConfirm?.(contact.id)}
        >
          <Text style={styles.confirmButtonText}>✓ Confirm Contact</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.confirmedText}>✓ Confirmed</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  phone: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    color: '#6B7280',
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonText: {
    fontSize: 18,
    color: '#EF4444',
  },
  toggles: {
    flexDirection: 'row',
    gap: 16,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#4B5563',
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  toggleDotActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  confirmButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  confirmButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  confirmedText: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 8,
    fontWeight: '500',
  },
});

