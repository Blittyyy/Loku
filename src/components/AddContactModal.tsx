import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Button } from './Button';
import { ToggleRow } from './ToggleRow';

interface AddContactModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (contact: {
    name: string;
    phone?: string;
    email?: string;
    share_arrival: boolean;
    share_departure: boolean;
  }) => void;
}

export const AddContactModal: React.FC<AddContactModalProps> = ({
  visible,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [shareArrival, setShareArrival] = useState(true);
  const [shareDeparture, setShareDeparture] = useState(true);

  const handleAdd = () => {
    if (!name.trim()) return;

    onAdd({
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      share_arrival: shareArrival,
      share_departure: shareDeparture,
    });

    // Reset form
    setName('');
    setPhone('');
    setEmail('');
    setShareArrival(true);
    setShareDeparture(true);
    onClose();
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
              <Text style={styles.title}>Add Trusted Contact</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              <View style={styles.field}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Contact name"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={setName}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+1234567890"
                  placeholderTextColor="#9CA3AF"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  returnKeyType="next"
                />
                {phone.trim() && (
                  <View style={styles.phoneNotice}>
                    <Text style={styles.phoneNoticeText}>
                      💡 Contacts must be confirmed before receiving SMS. They can reply STOP to opt-out.
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="contact@example.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
              </View>

              <View style={styles.toggles}>
                <ToggleRow
                  title="Share Arrival"
                  subtitle="Notify when I arrive"
                  value={shareArrival}
                  onValueChange={setShareArrival}
                />
                <ToggleRow
                  title="Share Departure"
                  subtitle="Notify when I leave"
                  value={shareDeparture}
                  onValueChange={setShareDeparture}
                />
              </View>

              <View style={styles.buttonContainer}>
                <Button title="Add Contact" onPress={handleAdd} disabled={!name.trim()} />
              </View>
            </View>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 1000,
  },
  content: {
    padding: 20,
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
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#6B7280',
  },
  scrollContent: {
    flex: 1,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  inputFocused: {
    borderColor: '#3B82F6',
  },
  toggles: {
    marginTop: 8,
    marginBottom: 16,
  },
  buttonContainer: {
    marginTop: 8,
  },
  phoneNotice: {
    marginTop: 8,
    backgroundColor: '#F0F9FF',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  phoneNoticeText: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 16,
  },
});

