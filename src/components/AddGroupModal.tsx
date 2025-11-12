import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Button } from './Button';

interface AddGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string) => Promise<void>;
}

export const AddGroupModal: React.FC<AddGroupModalProps> = ({
  visible,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) return;

    setLoading(true);
    try {
      await onAdd(name.trim());
      setName('');
      onClose();
    } catch (error) {
      console.error('Error adding group:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={styles.overlayTouchable} />
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback>
            <View style={styles.modal}>
                <View style={styles.header}>
                  <Text style={styles.title}>Create Contact Group</Text>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.content}>
                  <View style={styles.field}>
                    <Text style={styles.label}>Group Name *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Family, Friends, Work"
                      placeholderTextColor="#9CA3AF"
                      value={name}
                      onChangeText={setName}
                      autoFocus
                      returnKeyType="done"
                      onSubmitEditing={handleAdd}
                    />
                  </View>

                  <View style={styles.buttonContainer}>
                    <Button
                      title="Create Group"
                      onPress={handleAdd}
                      disabled={!name.trim() || loading}
                    />
                  </View>
                </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </KeyboardAvoidingView>
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
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 1000,
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  field: {
    marginBottom: 20,
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
  buttonContainer: {
    marginTop: 8,
  },
});

