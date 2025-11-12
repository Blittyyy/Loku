import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ContactGroupWithMembers } from '../store/useContactGroups';

interface ContactGroupCardProps {
  group: ContactGroupWithMembers;
  onPress?: () => void;
  onDelete?: () => void;
}

export const ContactGroupCard: React.FC<ContactGroupCardProps> = ({
  group,
  onPress,
  onDelete,
}) => {
  const confirmedCount = group.members.filter((m) => m.phone && m.confirmed).length;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.content}>
          <Text style={styles.name}>{group.name}</Text>
          <Text style={styles.members}>
            {group.members.length} member{group.members.length !== 1 ? 's' : ''}
            {confirmedCount > 0 && ` • ${confirmedCount} confirmed`}
          </Text>
        </View>
        {onDelete && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={styles.deleteButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.deleteButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
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
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  members: {
    fontSize: 14,
    color: '#6B7280',
  },
  deleteButton: {
    padding: 4,
    marginLeft: 12,
  },
  deleteButtonText: {
    fontSize: 18,
    color: '#EF4444',
  },
});

