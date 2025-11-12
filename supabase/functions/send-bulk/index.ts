// Supabase Edge Function: send-bulk
// Sends SMS messages via Twilio to all members of a contact group

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');

serve(async (req) => {
  try {
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

    const { group_id, message, preview_only = false } = await req.json();

    if (!group_id || !message) {
      return new Response(
        JSON.stringify({ error: 'group_id and message are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user_id from auth token, group, or use default single-user ID
    let user_id: string | null = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      user_id = user?.id ?? null;
    }

    // If no user from auth, get from group
    if (!user_id) {
      const { data: group, error: groupError } = await supabase
        .from('contact_groups')
        .select('user_id')
        .eq('id', group_id)
        .single();
      
      if (groupError) {
        console.error('Error fetching contact group:', groupError);
        return new Response(
          JSON.stringify({ 
            error: 'GROUP_NOT_FOUND',
            message: `Contact group not found: ${groupError.message}` 
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          }
        );
      }
      
      user_id = group?.user_id ?? null;
    }

    // If still no user_id, use a default single-user ID for the app
    // This allows the quota system to work without authentication
    if (!user_id) {
      // Use a constant UUID for single-user mode (no auth)
      // You can change this to any UUID you prefer
      user_id = '00000000-0000-0000-0000-000000000001';
    }

    // Get or create user record and check quota
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('plan, monthly_sms_count, monthly_sms_limit, last_reset_at')
      .eq('id', user_id)
      .single();

    // If user doesn't exist, create with defaults
    if (userError && userError.code === 'PGRST116') {
      console.log(`User ${user_id} not found, creating with defaults...`);
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({ id: user_id, plan: 'free', monthly_sms_count: 0, monthly_sms_limit: 30, last_reset_at: new Date().toISOString() })
        .select('plan, monthly_sms_count, monthly_sms_limit, last_reset_at')
        .single();
      
      if (createError) {
        console.error('Error creating user:', createError);
        return new Response(
          JSON.stringify({ 
            error: 'USER_CREATE_FAILED',
            message: `Failed to create user record: ${createError.message}` 
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          }
        );
      }
      user = newUser;
    } else if (userError) {
      console.error('Error fetching user:', userError);
      return new Response(
        JSON.stringify({ 
          error: 'USER_FETCH_FAILED',
          message: `Failed to fetch user quota: ${userError.message}` 
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve user quota information' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Reset monthly count if needed (new month)
    const now = new Date();
    const lastReset = user.last_reset_at ? new Date(user.last_reset_at) : null;
    const shouldReset = !lastReset || 
      lastReset.getMonth() !== now.getMonth() || 
      lastReset.getFullYear() !== now.getFullYear();

    if (shouldReset) {
      await supabase
        .from('users')
        .update({ monthly_sms_count: 0, last_reset_at: now.toISOString() })
        .eq('id', user_id);
      user.monthly_sms_count = 0;
    }

    // Fetch group members
    const { data: members, error: membersError } = await supabase
      .from('contact_group_members')
      .select('contact_id')
      .eq('group_id', group_id);

    if (membersError) throw membersError;

    if (!members || members.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No members found in group' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Fetch contact details (only confirmed contacts with phone numbers)
    const contactIds = members.map((m) => m.contact_id);
    const { data: contacts, error: contactsError } = await supabase
      .from('trusted_contacts')
      .select('id, phone, confirmed')
      .in('id', contactIds)
      .eq('confirmed', true)
      .not('phone', 'is', null);

    if (contactsError) throw contactsError;

    if (!contacts || contacts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No confirmed contacts with phone numbers found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    const recipientCount = contacts.length;
    const newCount = user.monthly_sms_count + recipientCount;

    // Check quota before sending (skip for preview)
    if (!preview_only && newCount > user.monthly_sms_limit) {
      return new Response(
        JSON.stringify({ 
          error: 'QUOTA_EXCEEDED',
          message: `Monthly SMS limit reached. You've used ${user.monthly_sms_count} of ${user.monthly_sms_limit} messages.`,
          plan: user.plan,
          used: user.monthly_sms_count,
          limit: user.monthly_sms_limit,
          remaining: Math.max(0, user.monthly_sms_limit - user.monthly_sms_count)
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // If preview only, return count without sending
    if (preview_only) {
      return new Response(
        JSON.stringify({ 
          sent: 0, 
          preview: true, 
          recipients_count: contacts.length,
          recipients: contacts.map((c) => ({ id: c.id, phone: c.phone?.substring(0, 4) + '***' })),
          quota: {
            plan: user.plan,
            used: user.monthly_sms_count,
            limit: user.monthly_sms_limit,
            remaining: Math.max(0, user.monthly_sms_limit - user.monthly_sms_count)
          }
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Check Twilio credentials
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      return new Response(
        JSON.stringify({ error: 'Twilio credentials not configured' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Send SMS via Twilio
    let sentCount = 0;
    const errors: string[] = [];

    for (const contact of contacts) {
      if (!contact.phone) continue;

      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
        
        const formData = new URLSearchParams();
        formData.append('From', TWILIO_PHONE_NUMBER);
        formData.append('To', contact.phone);
        formData.append('Body', message);

        const response = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        });

        if (response.ok) {
          sentCount++;
        } else {
          const errorData = await response.text();
          errors.push(`Failed to send to ${contact.phone}: ${errorData}`);
        }
      } catch (error) {
        errors.push(`Error sending to ${contact.phone}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Update quota after successful sends
    if (sentCount > 0) {
      await supabase
        .from('users')
        .update({ monthly_sms_count: newCount })
        .eq('id', user_id);
    }

    return new Response(
      JSON.stringify({ 
        sent: sentCount, 
        total: contacts.length,
        errors: errors.length > 0 ? errors : undefined,
        quota: {
          plan: user.plan,
          used: newCount,
          limit: user.monthly_sms_limit,
          remaining: Math.max(0, user.monthly_sms_limit - newCount)
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error) {
    console.error('Error in send-bulk function:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // If error is already a Response (from quota check), return it
    if (error instanceof Response) {
      return error;
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
});

