import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Plan } from '../store/usePlanQuota';

interface UpgradePromptProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: (plan: Plan) => void;
  currentPlan: Plan;
  used: number;
  limit: number;
}

const PLAN_DETAILS: Record<Plan, { name: string; limit: number; price: string }> = {
  free: { name: 'Free', limit: 30, price: 'Free' },
  plus: { name: 'Plus', limit: 200, price: '$4.99/mo' },
  pro: { name: 'Pro', limit: 1000, price: '$9.99/mo' },
};

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  visible,
  onClose,
  onUpgrade,
  currentPlan,
  used,
  limit,
}) => {
  const availablePlans: Plan[] = currentPlan === 'free' ? ['plus', 'pro'] : currentPlan === 'plus' ? ['pro'] : [];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Monthly Limit Reached</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.message}>
              You've used {used} of {limit} SMS messages this month.
            </Text>
            <Text style={styles.submessage}>
              Upgrade to a higher plan to send more messages.
            </Text>

            {availablePlans.length > 0 && (
              <View style={styles.plansContainer}>
                {availablePlans.map((plan) => {
                  const details = PLAN_DETAILS[plan];
                  return (
                    <TouchableOpacity
                      key={plan}
                      style={styles.planCard}
                      onPress={() => {
                        onUpgrade(plan);
                        onClose();
                      }}
                    >
                      <View style={styles.planHeader}>
                        <Text style={styles.planName}>{details.name}</Text>
                        <Text style={styles.planPrice}>{details.price}</Text>
                      </View>
                      <Text style={styles.planLimit}>{details.limit} messages/month</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    padding: 20,
  },
  message: {
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  submessage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  plansContainer: {
    marginBottom: 20,
  },
  planCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  planLimit: {
    fontSize: 14,
    color: '#6B7280',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
});

