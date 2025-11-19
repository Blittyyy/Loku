import { supabase } from '../lib/supabase';
import { useSettings } from '../store/useSettings';
import { Linking } from 'react-native';

interface Contact {
  id: string;
  phone?: string | null;
  email?: string | null;
  share_arrival: boolean;
  share_departure: boolean;
}

/**
 * Sends safety alert to trusted contacts when arrival/departure confirmed
 * Uses SMS Composer (user's personal number) for all contacts
 */
export const sendSafetyAlerts = async (
  placeName: string,
  eventType: 'arrival' | 'departure',
  triggerId: string
): Promise<void> => {
  const settings = useSettings.getState().settings;
  
  // Check if Safety Mode is enabled
  if (!settings.safetyMode || !settings.notifyContacts) {
    console.log('Safety Mode disabled - skipping contact alerts');
    return;
  }

  try {
    // Fetch trusted contacts where sharing is enabled for this event
    const shareField = eventType === 'arrival' ? 'share_arrival' : 'share_departure';
    const { data: contacts, error } = await supabase
      .from('trusted_contacts')
      .select('*')
      .eq('confirmed', true)
      .eq(shareField, true);

    if (error) {
      console.error('Error fetching contacts:', error);
      return;
    }

    if (!contacts || contacts.length === 0) {
      console.log('No trusted contacts to notify');
      return;
    }

    // Filter contacts with phone numbers
    const contactsWithPhone = contacts.filter((c) => c.phone && c.phone.trim().length > 0);

    if (contactsWithPhone.length === 0) {
      console.log('No contacts with phone numbers to notify');
      return;
    }

    // Build message
    const message = eventType === 'arrival'
      ? `📍 ${placeName}: I've arrived safely.`
      : `👋 ${placeName}: I've left.`;

    // Build SMS URL with all phone numbers (comma-separated)
    const phoneNumbers = contactsWithPhone.map((c) => c.phone).join(',');
    const smsUrl = `sms:${phoneNumbers}?body=${encodeURIComponent(message)}`;

    try {
      const canOpen = await Linking.canOpenURL(smsUrl);
      if (canOpen) {
        await Linking.openURL(smsUrl);
        console.log(`Safety alert opened in SMS composer - ${eventType} at ${placeName} to ${contactsWithPhone.length} contact(s)`);
        
        // Log to trigger_logs
        await supabase.from('trigger_logs').insert({
          place_name: `${placeName} (to ${contactsWithPhone.length} contact(s))`,
          event_type: `safety_${eventType}`,
        });
      } else {
        console.error('Cannot open SMS composer');
        // Don't show alert here - this runs in background, user might not see it
      }
    } catch (error) {
      console.error('Error opening SMS composer:', error);
      // Don't show alert here - this runs in background
    }

    // Note: Email notifications could be added here in the future
    // For now, we only support SMS via the user's personal number
  } catch (error) {
    console.error('Error in sendSafetyAlerts:', error);
  }
};

