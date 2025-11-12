# Loku - User Consent and Opt-In Process

## Overview

Loku is a location-based safety application that sends SMS notifications to trusted contacts. All messaging is **opt-in only** and requires explicit user consent.

## How Users Provide Consent

### 1. Contact Confirmation Process

Users must explicitly confirm each trusted contact before any messages can be sent:

1. **Add Contact**: User adds a contact's name and phone number in the app
2. **Confirm Contact**: User must tap "✓ Confirm Contact" button for each contact
3. **Verification**: Only contacts with `confirmed: true` status can receive messages

### 2. Contact Group Membership

Users can organize contacts into groups for quick messaging:

- Users manually add contacts to groups
- Only confirmed contacts with valid phone numbers are included
- Users can remove contacts from groups at any time

### 3. Message Delivery Options

Users choose how messages are sent:

- **SMS Composer**: Opens native phone SMS app (no Twilio involvement)
- **Loku (Twilio)**: Sends via Twilio API (requires confirmed contacts only)

## Consent Requirements

### Explicit Opt-In

- ✅ Users must manually confirm each contact
- ✅ Contacts must have `confirmed: true` status in the database
- ✅ Users can revoke consent by removing contacts or unconfirming them
- ✅ No messages sent without explicit confirmation

### Data Collection

- Only phone numbers provided by the user
- Contact names provided by the user
- No third-party data collection
- No automated contact importing

## User Control

Users have full control over:

- Adding/removing contacts
- Confirming/unconfirming contacts
- Managing contact groups
- Choosing delivery method (SMS Composer vs Twilio)
- Viewing and managing all trusted contacts in Settings

## Privacy

- All contact data is stored securely in Supabase
- Users can delete contacts at any time
- No contact information is shared with third parties
- Messages are sent only to user-confirmed contacts

## Revocation of Consent

Users can revoke consent by:

1. Removing a contact from the app
2. Unconfirming a contact (removes `confirmed: true` status)
3. Removing a contact from a contact group
4. Deleting their account (removes all contact data)

## Contact

For questions about consent or privacy, users can manage their contacts directly in the Loku app Settings section.

---

**Last Updated**: January 2025

