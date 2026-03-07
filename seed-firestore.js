/**
 * Seeds Firestore with all 72 egg tokens.
 * Run this ONCE before the hunt starts.
 *
 * Usage:
 *   1. npm install firebase-admin
 *   2. Download your Firebase service account key:
 *      Firebase Console -> Project Settings -> Service accounts -> Generate new private key
 *   3. Save it as "service-account.json" in this folder
 *   4. node seed-firestore.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load service account
const serviceAccount = require('./service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Load egg data
const eggsContent = fs.readFileSync(path.join(__dirname, 'js', 'eggs.js'), 'utf8');
const match = eggsContent.match(/const EGG_DATA = ({[\s\S]*?});/);
if (!match) {
    console.error('Could not parse eggs.js');
    process.exit(1);
}
const EGG_DATA = JSON.parse(match[1]);

async function seed() {
    const entries = Object.entries(EGG_DATA);
    console.log(`Seeding ${entries.length} eggs to Firestore...`);

    // Firestore batch writes (max 500 per batch, we have 72)
    const batch = db.batch();

    for (const [token, data] of entries) {
        const ref = db.collection('eggs').doc(token);
        batch.set(ref, {
            pieceIndex: data.pieceIndex,
            found: false
        });
    }

    await batch.commit();
    console.log('Done! All eggs seeded to Firestore.');
    console.log('Tokens are now validated server-side only.');
    process.exit(0);
}

seed().catch(err => {
    console.error('Error seeding:', err);
    process.exit(1);
});
