import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSettings } from '../../src/store/useSettings';
import { useContacts } from '../../src/store/useContacts';
import { useContactGroups } from '../../src/store/useContactGroups';
import { ToggleRow } from '../../src/components/ToggleRow';
import { Button } from '../../src/components/Button';
import { sendLocal } from '../../src/services/notifications';
import { RecentActivity } from '../../src/components/RecentActivity';
import { TrustedContactCard, TrustedContact } from '../../src/components/TrustedContactCard';
import { AddContactModal } from '../../src/components/AddContactModal';
import { ContactGroupCard } from '../../src/components/ContactGroupCard';
import { AddGroupModal } from '../../src/components/AddGroupModal';
import { ManageGroupMembersModal } from '../../src/components/ManageGroupMembersModal';
import { startDrivingDetection, stopDrivingDetection } from '../../src/services/drivingDetection';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const settings = useSettings((state) => state.settings);
  const updateSettings = useSettings((state) => state.updateSettings);
  
  const contacts = useContacts((state) => state.contacts);
  const fetchContacts = useContacts((state) => state.fetchContacts);
  const addContact = useContacts((state) => state.addContact);
  const updateContact = useContacts((state) => state.updateContact);
  const deleteContact = useContacts((state) => state.deleteContact);
  
  const groups = useContactGroups((state) => state.groups);
  const fetchGroups = useContactGroups((state) => state.fetchGroups);
  const addGroup = useContactGroups((state) => state.addGroup);
  const deleteGroup = useContactGroups((state) => state.deleteGroup);
  const addMemberToGroup = useContactGroups((state) => state.addMemberToGroup);
  const removeMemberFromGroup = useContactGroups((state) => state.removeMemberFromGroup);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  useEffect(() => {
    fetchContacts();
    fetchGroups();
  }, []);

  const handleSendTestNotification = async () => {
    await sendLocal('Loku', 'Test notification');
  };

  const handleToggleShare = (id: string, field: 'share_arrival' | 'share_departure') => {
    const contact = contacts.find((c) => c.id === id);
    if (contact) {
      const newValue = !contact[field];
      updateContact(id, { [field]: newValue });
    }
  };

  const handleConfirmContact = (id: string) => {
    updateContact(id, { confirmed: true });
  };

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
        <Text style={styles.title}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <ToggleRow
            title="Pause Automations"
            subtitle="Temporarily disable all triggers"
            value={settings.paused}
            onValueChange={(value) => updateSettings({ paused: value })}
          />
          <ToggleRow
            title="Respect Silent Mode"
            subtitle="Don't play sounds when device is silent"
            value={settings.respectSilentMode}
            onValueChange={(value) => updateSettings({ respectSilentMode: value })}
          />
          <ToggleRow
            title="Safety Mode"
            subtitle="Share location updates with trusted contacts"
            value={settings.safetyMode}
            onValueChange={(value) => updateSettings({ safetyMode: value })}
          />
          {settings.safetyMode && (
            <ToggleRow
              title="Notify Contacts"
              subtitle="Send alerts to trusted contacts"
              value={settings.notifyContacts}
              onValueChange={(value) => updateSettings({ notifyContacts: value })}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Car Mode</Text>
          <ToggleRow
            title="Auto-prompt when driving"
            subtitle="Show notification prompt when driving is detected"
            value={settings.carModeAutoPrompt}
            onValueChange={(value) => {
              updateSettings({ carModeAutoPrompt: value });
              if (value) {
                startDrivingDetection();
              } else {
                stopDrivingDetection();
              }
            }}
          />
          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Speed threshold</Text>
              <Text style={styles.settingSubtitle}>Minimum speed (m/s) to detect driving (default: 4.5)</Text>
            </View>
            <TextInput
              style={styles.numberInput}
              value={settings.carModeSpeedThreshold?.toString() || '4.5'}
              onChangeText={(text) => {
                const num = parseFloat(text);
                if (!isNaN(num) && num > 0) {
                  updateSettings({ carModeSpeedThreshold: num });
                }
              }}
              keyboardType="decimal-pad"
              placeholder="4.5"
            />
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Dwell before confirm</Text>
              <Text style={styles.settingSubtitle}>Time (seconds) at speed before confirming (default: 60)</Text>
            </View>
            <TextInput
              style={styles.numberInput}
              value={((settings.carModeDwellTime || 60000) / 1000).toString()}
              onChangeText={(text) => {
                const num = parseFloat(text);
                if (!isNaN(num) && num > 0) {
                  updateSettings({ carModeDwellTime: num * 1000 });
                }
              }}
              keyboardType="number-pad"
              placeholder="60"
            />
          </View>
          {Platform.OS === 'ios' && (
            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>BLE Tag UUID (Optional)</Text>
                <Text style={styles.settingSubtitle}>UUID of BLE tag in car for enhanced detection</Text>
              </View>
              <TextInput
                style={styles.textInput}
                value={settings.carModeBleUuid || ''}
                onChangeText={(text) => updateSettings({ carModeBleUuid: text || undefined })}
                placeholder="Enter UUID"
                autoCapitalize="none"
              />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Contact Groups</Text>
            <TouchableOpacity onPress={() => setShowAddGroupModal(true)}>
              <Text style={styles.addButton}>+ Add</Text>
            </TouchableOpacity>
          </View>
          {groups.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No contact groups yet</Text>
              <Text style={styles.emptySubtext}>
                Create a group to organize your contacts for Quick Actions
              </Text>
            </View>
          ) : (
            groups.map((group) => (
              <ContactGroupCard
                key={group.id}
                group={group}
                onPress={() => setSelectedGroup(group.id)}
                onDelete={() => deleteGroup(group.id)}
              />
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Default delivery method</Text>
              <Text style={styles.settingSubtitle}>How quick actions send messages</Text>
            </View>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[styles.radioOption, settings.quickActionsDefaultDelivery === 'composer' && styles.radioOptionActive]}
                onPress={() => updateSettings({ quickActionsDefaultDelivery: 'composer' })}
              >
                <Text style={[styles.radioText, settings.quickActionsDefaultDelivery === 'composer' && styles.radioTextActive]}>
                  SMS Composer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.radioOption, settings.quickActionsDefaultDelivery === 'loku' && styles.radioOptionActive]}
                onPress={() => updateSettings({ quickActionsDefaultDelivery: 'loku' })}
              >
                <Text style={[styles.radioText, settings.quickActionsDefaultDelivery === 'loku' && styles.radioTextActive]}>
                  Loku (Twilio)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {settings.safetyMode && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trusted Contacts</Text>
              <TouchableOpacity onPress={() => setShowAddModal(true)}>
                <Text style={styles.addButton}>+ Add</Text>
              </TouchableOpacity>
            </View>
            {contacts.length === 0 ? (
              <View style={styles.emptyContacts}>
                <Text style={styles.emptyText}>No trusted contacts yet</Text>
                <Text style={styles.emptySubtext}>Add a contact to receive safety alerts</Text>
              </View>
            ) : (
              contacts.map((contact) => (
                <TrustedContactCard
                  key={contact.id}
                  contact={contact}
                  onToggle={handleToggleShare}
                  onDelete={deleteContact}
                  onConfirm={handleConfirmContact}
                />
              ))
            )}
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button
            title="Send Test Notification"
            onPress={handleSendTestNotification}
            variant="secondary"
          />
        </View>

        <View style={styles.section}>
          <RecentActivity limit={10} />
        </View>
      </ScrollView>

      <AddContactModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addContact}
      />

      <AddGroupModal
        visible={showAddGroupModal}
        onClose={() => setShowAddGroupModal(false)}
        onAdd={async (name) => {
          await addGroup(name);
          await fetchGroups();
        }}
      />

      <ManageGroupMembersModal
        visible={selectedGroup !== null}
        group={groups.find((g) => g.id === selectedGroup) || null}
        onClose={() => setSelectedGroup(null)}
        onAddMember={async (groupId, contactId) => {
          await addMemberToGroup(groupId, contactId);
          await fetchGroups();
        }}
        onRemoveMember={async (groupId, contactId) => {
          await removeMemberFromGroup(groupId, contactId);
          await fetchGroups();
        }}
      />
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
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#3B82F6',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  addButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  emptyContacts: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  buttonContainer: {
    padding: 20,
    paddingTop: 32,
  },
  settingRow: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  numberInput: {
    width: 80,
    height: 40,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
  },
  textInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  radioOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  radioOptionActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#DBEAFE',
  },
  radioText: {
    fontSize: 14,
    color: '#6B7280',
  },
  radioTextActive: {
    color: '#1E40AF',
    fontWeight: '600',
  },
});

