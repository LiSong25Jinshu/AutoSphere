/**
 * Run this once to generate VAPID keys for Web Push notifications.
 * Copy the output into your .env file.
 *
 * Usage: node backend/generate-vapid-keys.js
 */
import webpush from 'web-push';

const keys = webpush.generateVAPIDKeys();

console.log('\n=== VAPID Keys for Web Push Notifications ===\n');
console.log('Add these to your backend/.env file:\n');
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`VAPID_EMAIL=mailto:support@autosphere.com`);
console.log('\n==============================================\n');
