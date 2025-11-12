import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { ContactGroupWithMembers } from '../store/useContactGroups';
import { TrustedContact } from './TrustedContactCard';
import { useContacts } from '../store/useContacts';

interface ManageGroupMembersModalProps {
  visible: boolean;
  group: ContactGroupWithMembers | null;
  onClose: () => void;
  onAddMember: (groupId: string, contactId: string) => Promise<void>;
  onRemoveMember: (groupId: string, contactId: string) => Promise<void>;
}

export const ManageGroupMembersModal: React.FC<ManageGroupMembersModalProps> = ({
  visible,
  group,
  onClose,
  onAddMember,
  onRemoveMember,
}) => {
  const contacts = useContacts((state) => state.contacts);
  const fetchContacts = useContacts((state) => state.fetchContacts);
  const contactsLoading = useContacts((state) => state.loading);
  const [loading, setLoading] = useState<string | null>(null);

  // Fetch contacts when modal opens
  React.useEffect(() => {
    if (visible) {
      console.log('Modal opened, fetching contacts...');
      fetchContacts().then(() => {
        console.log('Contacts fetched, count:', contacts.length);
      });
    }
  }, [visible, fetchContacts]);

  // Calculate derived data (must be after hooks)
  const groupMemberIds = group ? new Set(group.members.map((m) => m.id)) : new Set();
  // Show all contacts with phone numbers
  // Users can add any contact, but only confirmed contacts with phones will receive messages
  const availableContacts = contacts.filter((c) => {
    const phone = c.phone;
    return phone && typeof phone === 'string' && phone.trim().length > 0;
  });
  const membersInGroup = availableContacts.filter((c) => groupMemberIds.has(c.id));
  const membersNotInGroup = availableContacts.filter((c) => !groupMemberIds.has(c.id));

  // Debug logging
  React.useEffect(() => {
    if (visible && group) {
      console.log('ManageGroupMembersModal - Contacts:', contacts.length);
      console.log('ManageGroupMembersModal - Available contacts:', availableContacts.length);
      console.log('ManageGroupMembersModal - Members in group:', membersInGroup.length);
      console.log('ManageGroupMembersModal - Members not in group:', membersNotInGroup.length);
      console.log('ManageGroupMembersModal - All contacts:', contacts.map(c => ({ name: c.name, phone: c.phone, confirmed: c.confirmed })));
    }
  }, [visible, group, contacts, availableContacts, membersInGroup, membersNotInGroup]);

  // Early return AFTER all hooks
  if (!group) return null;

  const handleToggleMember = async (contactId: string, isInGroup: boolean) => {
    setLoading(contactId);
    try {
      if (isInGroup) {
        await onRemoveMember(group.id, contactId);
      } else {
        await onAddMember(group.id, contactId);
      }
    } catch (error) {
      console.error('Error toggling member:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.overlayTouchable} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>{group.name}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {contactsLoading ? (
            <View style={styles.loadingState}>
              <Text style={styles.loadingText}>Loading contacts...</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.contentContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.instructionBox}>
                <Text style={styles.instructionText}>
                  💡 Tap contacts to add or remove them from this group
                </Text>
              </View>

                  {membersInGroup.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Members ({membersInGroup.length})</Text>
                      {membersInGroup.map((contact) => (
                        <TouchableOpacity
                          key={contact.id}
                          style={[styles.contactItem, styles.contactItemActive]}
                          onPress={() => handleToggleMember(contact.id, true)}
                          disabled={loading === contact.id}
                        >
                          <View style={styles.contactInfo}>
                            <Text style={styles.contactName}>{contact.name}</Text>
                            <Text style={styles.contactPhone}>{contact.phone}</Text>
                          </View>
                          <View style={styles.checkbox}>
                            <Text style={styles.checkmark}>✓</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {membersNotInGroup.length > 0 && (
                    <View style={styles.section}>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                          Available Contacts ({membersNotInGroup.length})
                        </Text>
                        <Text style={styles.sectionHint}>Tap to add</Text>
                      </View>
                      {membersNotInGroup.map((contact) => (
                        <TouchableOpacity
                          key={contact.id}
                          style={styles.contactItem}
                          onPress={() => handleToggleMember(contact.id, false)}
                          disabled={loading === contact.id}
                          activeOpacity={0.7}
                        >
                          <View style={styles.contactInfo}>
                            <Text style={styles.contactName}>{contact.name}</Text>
                            <Text style={styles.contactPhone}>{contact.phone}</Text>
                            {!contact.confirmed && (
                              <Text style={styles.unconfirmedLabel}>Pending confirmation</Text>
                            )}
                          </View>
                          <View style={[styles.checkbox, styles.checkboxEmpty]}>
                            <Text style={styles.plusIcon}>+</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {contacts.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>No contacts found</Text>
                      <Text style={styles.emptySubtext}>
                        Add contacts in Settings → Safety Mode first
                      </Text>
                    </View>
                  ) : availableContacts.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>No contacts with phone numbers</Text>
                      <Text style={styles.emptySubtext}>
                        You have {contacts.length} contact{contacts.length !== 1 ? 's' : ''}, but none have phone numbers.
                        {'\n'}Add phone numbers to contacts in Settings → Safety Mode.
                      </Text>
                    </View>
                  ) : null}

              {membersNotInGroup.length === 0 && membersInGroup.length > 0 && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    All available contacts are already in this group
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 1000,
  },
  scrollView: {
    maxHeight: 500,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
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
  contentContainer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  instructionBox: {
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  instructionText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  sectionHint: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contactItemActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  unconfirmedLabel: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 2,
    fontStyle: 'italic',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkboxEmpty: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 14,
  },
  plusIcon: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 16,
    includeFontPadding: false,
  },
  infoBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  loadingState: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
});

