import { supabase } from '../lib/supabase';
import { useSettings } from '../store/useSettings';

interface Contact {
  id: string;
  phone?: string | null;
  email?: string | null;
  share_arrival: boolean;
  share_departure: boolean;
}

/**
 * Sends safety alert to trusted contacts when arrival/departure confirmed
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

    // Send alert to each contact
    const promises = contacts.map(async (contact: Contact) => {
      try {
        const { data, error } = await supabase.functions.invoke('send-shared-alert', {
          body: {
            contact_phone: contact.phone,
            contact_email: contact.email,
            place_name: placeName,
            event_type: eventType,
          },
        });

        if (error) throw error;

        console.log(`Safety alert sent to ${contact.phone || contact.email} - ${eventType} at ${placeName}`);
        
        // Log to trigger_logs
        await supabase.from('trigger_logs').insert({
          place_name: `${placeName} (to ${contact.phone || contact.email})`,
          event_type: `safety_${eventType}`,
        });

        return { success: true };
      } catch (error) {
        console.error(`Error sending alert to contact:`, error);
        return { success: false, error };
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('Error in sendSafetyAlerts:', error);
  }
};

