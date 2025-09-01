import * as webpush from 'web-push';

function generateVapidKeys() {
  const vapidKeys = webpush.generateVAPIDKeys();
  console.log('VAPID Public Key:', vapidKeys.publicKey);
  console.log('VAPID Private Key:', vapidKeys.privateKey);
}

generateVapidKeys();
