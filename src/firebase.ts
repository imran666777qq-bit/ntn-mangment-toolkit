import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the specific database ID from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Auth
export const auth = getAuth(app);

// Test connection to Firestore
import { doc, getDocFromServer } from 'firebase/firestore';
async function testConnection() {
  try {
    // Attempt to fetch a non-existent doc just to test connectivity
    await getDocFromServer(doc(db, '_connection_test', 'ping'));
    console.log("Firestore connection test: Success");
  } catch (error: any) {
    if (error.message && error.message.includes('the client is offline')) {
      console.error("Firestore Error: The client is offline. This usually indicates a network block or incorrect configuration.");
    } else {
      console.warn("Firestore connection test notice (ignore if expected):", error.message);
    }
  }
}
testConnection();

export default app;
