// Supabase Edge Function: sms-webhook
// Handles incoming SMS messages from Twilio (e.g., STOP keyword for opt-out)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const twimlResponse = (message: string, status = 200) => {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`,
    {
      status,
      headers: { 'Content-Type': 'text/xml', 'Access-Control-Allow-Origin': '*' },
    }
  );
};

serve(async (req) => {
  try {
    console.log('Request received:', req.method, req.url);
    
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    // Twilio sends form-urlencoded data, not multipart form data
    let fromPhone = '';
    let messageBody = '';
    let messageSid = '';

    try {
      const contentType = req.headers.get('content-type') || '';
      console.log('Content-Type:', contentType);
      
      // Read body once
      const bodyText = await req.text();
      console.log('Body text length:', bodyText.length);
      
      if (contentType.includes('application/x-www-form-urlencoded') || !contentType.includes('multipart')) {
        // Parse URL-encoded form data
        const params = new URLSearchParams(bodyText);
        fromPhone = params.get('From') || '';
        messageBody = params.get('Body') || '';
        messageSid = params.get('MessageSid') || '';
        console.log('Parsed params:', { fromPhone: fromPhone.substring(0, 10) + '...', messageBody, messageSid });
      } else {
        // Try FormData as fallback (reconstruct from text)
        const formData = new URLSearchParams(bodyText);
        fromPhone = formData.get('From') || '';
        messageBody = formData.get('Body') || '';
        messageSid = formData.get('MessageSid') || '';
      }
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return twimlResponse('Error processing your message. Please try again.');
    }

    console.log('Received SMS:', { fromPhone, messageBody, messageSid });

    // Initialize Supabase client
    // Supabase automatically provides these env vars
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('SUPABASE_PROJECT_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_KEY') || '';
    
    console.log('Supabase URL present:', !!supabaseUrl);
    console.log('Supabase Key present:', !!supabaseKey);
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      console.error('SUPABASE_URL:', supabaseUrl ? 'present' : 'missing');
      console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'present' : 'missing');
      return twimlResponse('Service configuration error. Please contact support.');
    }
    
    let supabase;
    try {
      supabase = createClient(supabaseUrl, supabaseKey);
      console.log('Supabase client created successfully');
    } catch (clientError) {
      console.error('Error creating Supabase client:', clientError);
      return twimlResponse('Service configuration error. Please contact support.');
    }

    // Normalize phone number to E.164 format
    const normalizePhone = (phone: string): string => {
      const digits = phone.replace(/\D/g, '');
      // If it doesn't start with +, assume US number and add +1
      if (!phone.startsWith('+')) {
        if (digits.length === 10) {
          return `+1${digits}`;
        } else if (digits.length === 11 && digits.startsWith('1')) {
          return `+${digits}`;
        }
      }
      return phone.startsWith('+') ? phone : `+${digits}`;
    };

    const normalizedFromPhone = normalizePhone(fromPhone);
    console.log('Normalized phone:', normalizedFromPhone);

    // Check for opt-out keywords
    const optOutKeywords = ['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'];
    const messageUpper = messageBody.trim().toUpperCase();

    if (optOutKeywords.some(keyword => messageUpper === keyword || messageUpper.startsWith(keyword))) {
      // Find contact by phone number (try exact match first, then partial)
      let { data: contact, error: findError } = await supabase
        .from('trusted_contacts')
        .select('id, name, phone, confirmed')
        .eq('phone', normalizedFromPhone)
        .eq('confirmed', true)
        .maybeSingle();

      // If not found, try without +1 prefix (US numbers)
      if (!contact && normalizedFromPhone.startsWith('+1')) {
        const withoutPlusOne = normalizedFromPhone.slice(2);
        const { data: contact2 } = await supabase
          .from('trusted_contacts')
          .select('id, name, phone, confirmed')
          .eq('phone', withoutPlusOne)
          .eq('confirmed', true)
          .maybeSingle();
        contact = contact2 || null;
      }

      if (findError) {
        console.error('Error finding contact:', findError);
      } else if (contact) {
        // Unconfirm the contact (opt-out)
        const { error: updateError } = await supabase
          .from('trusted_contacts')
          .update({ confirmed: false })
          .eq('id', contact.id);

        if (updateError) {
          console.error('Error unconfirming contact:', updateError);
        } else {
          console.log(`Contact ${contact.name} (${contact.phone}) opted out`);
        }
      } else {
        console.log(`No confirmed contact found for phone: ${normalizedFromPhone}`);
      }

      // Return TwiML response confirming opt-out
      return twimlResponse('You have been unsubscribed from Loku notifications. You will no longer receive messages. Reply START to opt back in.');
    }

    // Handle opt-in keywords (START, YES, etc.)
    const optInKeywords = ['START', 'YES', 'UNSTOP', 'SUBSCRIBE'];
    if (optInKeywords.some(keyword => messageUpper === keyword || messageUpper.startsWith(keyword))) {
      // Find contact by phone number (try exact match first)
      let { data: contact, error: findError } = await supabase
        .from('trusted_contacts')
        .select('id, name, phone, confirmed')
        .eq('phone', normalizedFromPhone)
        .maybeSingle();

      // If not found, try without +1 prefix (US numbers)
      if (!contact && normalizedFromPhone.startsWith('+1')) {
        const withoutPlusOne = normalizedFromPhone.slice(2);
        const { data: contact2 } = await supabase
          .from('trusted_contacts')
          .select('id, name, phone, confirmed')
          .eq('phone', withoutPlusOne)
          .maybeSingle();
        contact = contact2 || null;
      }

      if (findError) {
        console.error('Error finding contact:', findError);
      } else if (contact && !contact.confirmed) {
        // Re-confirm the contact (opt-in)
        const { error: updateError } = await supabase
          .from('trusted_contacts')
          .update({ confirmed: true })
          .eq('id', contact.id);

        if (updateError) {
          console.error('Error confirming contact:', updateError);
        } else {
          console.log(`Contact ${contact.name} (${contact.phone}) opted back in`);
        }
      } else if (contact && contact.confirmed) {
        console.log(`Contact ${contact.name} (${contact.phone}) is already confirmed`);
      } else {
        console.log(`No contact found for phone: ${normalizedFromPhone}`);
      }

      return twimlResponse('You have been subscribed to Loku notifications. You will receive location updates. Reply STOP to opt-out.');
    }

    // Unknown message - send help text
    return twimlResponse('Loku: Reply STOP to unsubscribe from notifications, or START to subscribe. For help, contact the person who added you.');
  } catch (error) {
    console.error('Error in sms-webhook function:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    console.error('Full error details:', errorMessage);
    console.error('Stack trace:', errorStack);
    
    // Always return valid TwiML, even on errors
    return twimlResponse('An error occurred processing your message. Please try again later.');
  }
});

