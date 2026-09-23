/* ChatNest — make one account an administrator.
   Run this ONCE on your computer (needs Node.js installed).

   Steps:
     1. Open a command window (cmd / terminal) in this "setup" folder
     2. Run:  npm install          (first time only)
     3. Run:  node make-admin.js <serviceAccountKey.json> <your-gmail-address>

   The serviceAccountKey.json file is downloaded from Firebase console:
   Project settings -> Service accounts -> Generate new private key.
   NEVER upload that JSON file to GitHub. */
const admin = require('firebase-admin');
const path = require('path');

const keyPath = process.argv[2];
const email = process.argv[3];
if (!keyPath || !email) {
  console.log('Usage: node make-admin.js <serviceAccountKey.json> <your-gmail-address>');
  process.exit(1);
}

const serviceAccount = require(path.resolve(keyPath));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

(async () => {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log('SUCCESS: ' + email + ' is now a ChatNest administrator.');
    console.log('Open your admin.html page and sign in with this Google account.');
    process.exit(0);
  } catch (e) {
    console.error('Failed:', e.message);
    process.exit(1);
  }
})();
