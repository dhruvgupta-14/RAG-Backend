import admin from "../utils/firebase.js";

const db = admin.firestore();

// Load all messages for a user
export async function getMessagesFromFirestore(userId) {
  try {
    const docRef = db.collection("chatHistory").doc(userId);
    const doc = await docRef.get();

    if (!doc.exists) {
      // First time user — create empty document
      await docRef.set({ messages: [] });
      return [];
    }

    return doc.data().messages || [];
  } catch (err) {
    console.error("Error getting messages:", err);
    return [];
  }
}

// Save a single message
export async function saveMessage(userId, role, content) {
  try {
    const docRef = db.collection("chatHistory").doc(userId);
    const message = {
      role,        
      content,
      timestamp: new Date().toISOString(),
    };

    await docRef.set(
      { messages: admin.firestore.FieldValue.arrayUnion(message) },
      { merge: true }  // don't overwrite existing data
    );
  } catch (err) {
    console.error("Error saving message:", err);
  }
}


export async function clearMemory(userId) {
  try {
    const docRef = db.collection("chatHistory").doc(userId);
    await docRef.set({ messages: [] });
  } catch (err) {
    console.error("Error clearing memory:", err);
  }
}