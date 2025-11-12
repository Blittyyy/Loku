import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useQuickActions } from '../store/useQuickActions';
import { useContactGroups } from '../store/useContactGroups';
import { useSettings } from '../store/useSettings';
import { usePlanQuota, Plan } from '../store/usePlanQuota';
import { UpgradePrompt } from './UpgradePrompt';
import { QuickAction } from '../types';
import { Linking } from 'react-native';
import { supabase } from '../lib/supabase';

interface QuickActionsFABProps {
  onActionPress?: (action: QuickAction) => void;
}

export const QuickActionsFAB: React.FC<QuickActionsFABProps> = ({ onActionPress }) => {
  const [visible, setVisible] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeData, setUpgradeData] = useState<{ plan: Plan; used: number; limit: number } | null>(null);
  
  const actions = useQuickActions((state) => state.actions);
  const fetchActions = useQuickActions((state) => state.fetchActions);
  const groups = useContactGroups((state) => state.groups);
  const fetchGroups = useContactGroups((state) => state.fetchGroups);
  const defaultDelivery = useSettings((state) => state.settings.quickActionsDefaultDelivery);
  
  const quota = usePlanQuota((state) => state.quota);
  const fetchQuota = usePlanQuota((state) => state.fetchQuota);
  const refreshQuota = usePlanQuota((state) => state.refreshQuota);

  // Get user_id from first group, or use default single-user ID
  // Since Loku doesn't have auth, we use a default user for quota tracking
  const getUserId = (): string => {
    if (groups.length > 0 && groups[0].user_id) {
      return groups[0].user_id;
    }
    // Default user ID for single-user mode (no authentication)
    return '00000000-0000-0000-0000-000000000001';
  };

  // Fetch groups and actions when component mounts
  useEffect(() => {
    fetchGroups();
    fetchActions();
  }, [fetchGroups, fetchActions]);

  // Refresh when modal opens
  useEffect(() => {
    if (visible) {
      fetchGroups();
      fetchActions();
      const userId = getUserId();
      fetchQuota(userId);
    }
  }, [visible, fetchGroups, fetchActions, fetchQuota]);

  const handleActionPress = async (action: QuickAction) => {
    // For default actions, we need to find a group or use first available
    let groupId = action.group_id;
    if (!groupId || groupId === '') {
      if (groups.length > 0) {
        // Use first group if no group specified
        groupId = groups[0].id;
      } else {
        // No groups available - show helpful message
        Alert.alert(
          'No Contact Groups',
          'Please create a contact group first in Settings → Safety Mode, then add contacts to it.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    const group = groups.find((g) => g.id === groupId);
    if (!group) {
      Alert.alert(
        'Group Not Found',
        'Contact group not found. Please create a contact group first.',
        [{ text: 'OK' }]
      );
      return;
    }

    const confirmedMembers = group.members.filter((m) => m.phone && m.confirmed);
    if (confirmedMembers.length === 0) {
      Alert.alert(
        'No Contacts',
        'No confirmed contacts with phone numbers in this group. Please add and confirm contacts first.',
        [{ text: 'OK' }]
      );
      return;
    }

    const deliveryMethod = action.delivery_method || defaultDelivery;

    if (deliveryMethod === 'composer') {
      // Open native SMS composer
      const phoneNumbers = confirmedMembers.map((m) => m.phone).join(',');

      const smsUrl = `sms:${phoneNumbers}?body=${encodeURIComponent(action.message)}`;

      try {
        const canOpen = await Linking.canOpenURL(smsUrl);
        if (canOpen) {
          await Linking.openURL(smsUrl);
        } else {
          Alert.alert(
            'Cannot Open SMS',
            'Cannot open SMS composer. Make sure you have a messaging app installed.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Error opening SMS composer:', error);
        Alert.alert(
          'Error',
          'Error opening SMS composer. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } else {
      // Send via Loku (Twilio)
      try {
        const { data, error } = await supabase.functions.invoke('send-bulk', {
          body: {
            group_id: groupId,
            message: action.message,
            preview_only: false,
          },
        });

        if (error) {
          console.error('Edge Function error:', error);
          
          // Supabase functions return errors in different formats
          // Try to extract the actual error message
          let errorBody: any = null;
          let errorMessage = '';
          
          try {
            // Check if error has a context with body (Supabase FunctionsHttpError)
            if (error?.context?.body) {
              errorBody = typeof error.context.body === 'string' 
                ? JSON.parse(error.context.body) 
                : error.context.body;
            }
            // Check if error.message is JSON
            else if (error?.message) {
              try {
                errorBody = JSON.parse(error.message);
              } catch {
                errorMessage = error.message;
              }
            }
            // Check if error itself is an object with error/message
            else if (error && typeof error === 'object') {
              errorBody = error;
            }
            
            // Extract message from errorBody
            if (errorBody) {
              errorMessage = errorBody.message || errorBody.error || JSON.stringify(errorBody);
            }
          } catch (parseError) {
            console.error('Error parsing error response:', parseError);
            errorMessage = error?.message || String(error);
          }

          // Check if it's a quota error (status 403 with QUOTA_EXCEEDED)
          if (errorBody?.error === 'QUOTA_EXCEEDED' || errorBody?.message?.includes('limit reached') || errorMessage.includes('QUOTA_EXCEEDED')) {
            setUpgradeData({
              plan: errorBody?.plan || 'free',
              used: errorBody?.used || 0,
              limit: errorBody?.limit || 30,
            });
            setShowUpgrade(true);
            return;
          }
          
          // Show the actual error message
          Alert.alert(
            'Error Sending',
            errorMessage || 'Failed to send message. Please check your configuration.',
            [{ text: 'OK' }]
          );
          return;
        }

        console.log('Bulk message sent:', data);
        
        // Refresh quota after successful send
        const userId = getUserId();
        refreshQuota(userId);

        Alert.alert(
          'Message Sent!',
          `Message sent to ${data?.sent || confirmedMembers.length} contact(s)!`,
          [{ text: 'OK' }]
        );
      } catch (error: any) {
        console.error('Error sending bulk message (catch block):', error);
        
        // Try to extract error body from Supabase function error
        let errorBody: any = null;
        let errorMessage = '';
        
        try {
          // Supabase FunctionsHttpError structure
          if (error?.context?.body) {
            errorBody = typeof error.context.body === 'string' 
              ? JSON.parse(error.context.body) 
              : error.context.body;
          }
          // Try parsing error.message as JSON
          else if (error?.message) {
            try {
              errorBody = JSON.parse(error.message);
            } catch {
              errorMessage = error.message;
            }
          }
          else if (error && typeof error === 'object') {
            errorBody = error;
          }
          
          if (errorBody) {
            errorMessage = errorBody.message || errorBody.error || JSON.stringify(errorBody);
          }
        } catch (parseError) {
          console.error('Error parsing error in catch:', parseError);
          errorMessage = error?.message || String(error);
        }
        
        // Check if it's a quota error
        if (errorBody?.error === 'QUOTA_EXCEEDED' || errorBody?.message?.includes('limit reached') || errorMessage.includes('QUOTA_EXCEEDED')) {
          setUpgradeData({
            plan: errorBody?.plan || 'free',
            used: errorBody?.used || 0,
            limit: errorBody?.limit || 30,
          });
          setShowUpgrade(true);
        } else {
          Alert.alert(
            'Error Sending',
            errorMessage || error?.message || 'Error sending message. Please check your Twilio configuration and Edge Function logs.',
            [{ text: 'OK' }]
          );
        }
      }
    }

    if (onActionPress) {
      onActionPress(action);
    }
    setVisible(false);
  };

  // Default quick actions if none exist (will use first available group)
  const defaultActions: QuickAction[] = groups.length > 0 ? [
    {
      id: 'default-1',
      user_id: null,
      name: 'On the way home',
      group_id: groups[0].id,
      message: "I'm on the way home. See you soon!",
      delivery_method: defaultDelivery,
      created_at: new Date().toISOString(),
    },
    {
      id: 'default-2',
      user_id: null,
      name: 'In the car',
      group_id: groups[0].id,
      message: "I'm in the car. I'll reply when I arrive.",
      delivery_method: defaultDelivery,
      created_at: new Date().toISOString(),
    },
    {
      id: 'default-3',
      user_id: null,
      name: 'Driving—reply later',
      group_id: groups[0].id,
      message: "I'm driving right now. I'll reply when I'm safe.",
      delivery_method: defaultDelivery,
      created_at: new Date().toISOString(),
    },
  ] : [];

  const displayActions = actions.length > 0 ? actions : defaultActions;

  // Debug logging
  useEffect(() => {
    if (visible) {
      console.log('QuickActionsFAB - Actions from store:', actions.length);
      console.log('QuickActionsFAB - Groups:', groups.length);
      console.log('QuickActionsFAB - Default actions:', defaultActions.length);
      console.log('QuickActionsFAB - Display actions:', displayActions.length);
    }
  }, [visible, actions, groups, defaultActions, displayActions]);

  return (
    <>
      <TouchableOpacity style={styles.fab} onPress={() => setVisible(true)}>
        <Text style={styles.fabIcon}>🚗</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <TouchableOpacity 
            style={styles.overlayTouchable} 
            activeOpacity={1} 
            onPress={() => setVisible(false)}
          />
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.title}>Quick Actions</Text>
              <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {displayActions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No Quick Actions Available</Text>
                <Text style={styles.emptyStateSubtext}>
                  Create a contact group first in Settings → Safety Mode, then add contacts to it.
                </Text>
              </View>
            ) : (
              <View style={styles.contentContainer}>
                {displayActions.map((action) => {
                  const group = groups.find((g) => g.id === action.group_id);
                  return (
                    <TouchableOpacity
                      key={action.id}
                      style={styles.actionItem}
                      onPress={() => handleActionPress(action)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.actionHeader}>
                        <Text style={styles.actionName}>{action.name}</Text>
                        {group && (
                          <View style={styles.groupBadge}>
                            <Text style={styles.groupBadgeText}>{group.name}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.actionMessage}>{action.message}</Text>
                      <Text style={styles.actionMethod}>
                        {action.delivery_method === 'composer' ? '📱 SMS Composer' : '📨 Loku (Twilio)'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </Modal>

      <UpgradePrompt
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        onUpgrade={(plan) => {
          // Placeholder for upgrade logic
          console.log('Upgrade to plan:', plan);
          Alert.alert('Upgrade', `Upgrade to ${plan} plan - This is a placeholder. Implement payment integration.`);
        }}
        currentPlan={upgradeData?.plan || 'free'}
        used={upgradeData?.used || 0}
        limit={upgradeData?.limit || 30}
      />
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  fabIcon: {
    fontSize: 24,
  },
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
  sheet: {
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
  },
  actionItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  groupBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  groupBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1E40AF',
  },
  actionMessage: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  actionMethod: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

