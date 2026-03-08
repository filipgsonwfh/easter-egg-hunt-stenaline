const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function reset() {
    // Delete all progress documents
    const progressSnap = await db.collection('progress').get();
    const progressBatch = db.batch();
    progressSnap.forEach(doc => progressBatch.delete(doc.ref));
    await progressBatch.commit();
    console.log(`Deleted ${progressSnap.size} progress documents.`);

    // Reset all eggs to found: false
    const eggsSnap = await db.collection('eggs').get();
    const eggsBatch = db.batch();
    eggsSnap.forEach(doc => {
        eggsBatch.update(doc.ref, { found: false, foundAt: admin.firestore.FieldValue.delete() });
    });
    await eggsBatch.commit();
    console.log(`Reset ${eggsSnap.size} egg documents.`);

    console.log('Done! Hunt is ready to start fresh.');
    process.exit(0);
}

reset().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
