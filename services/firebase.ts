
/**
 * TO DEPLOY THIS GAME TO FIREBASE:
 * 
 * 1. Create a project in Firebase Console (https://console.firebase.google.com)
 * 2. Enable Firestore and Authentication (Email/Anonymous)
 * 3. Install Firebase CLI: `npm install -g firebase-tools`
 * 4. Run `firebase init` in this directory
 * 5. Use the configuration below:
 */

/*
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
*/

/**
 * FIRESTORE SCHEMA EXAMPLE:
 * 
 * collection "users":
 *   {userId}: {
 *     username: string,
 *     photoURL: string,
 *     stats: { wins: number, losses: number, draws: number }
 *   }
 * 
 * collection "rooms":
 *   {roomId}: {
 *     players: { BLACK: userId, WHITE: userId },
 *     status: "waiting" | "active" | "finished",
 *     turn: "BLACK" | "WHITE",
 *     board: Array<Piece | null>,
 *     history: Array<Move>,
 *     createdAt: timestamp
 *   }
 */

/**
 * SECURITY RULES (firestore.rules):
 * 
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     match /users/{userId} {
 *       allow read: if true;
 *       allow write: if request.auth != null && request.auth.uid == userId;
 *     }
 *     match /rooms/{roomId} {
 *       allow read: if true;
 *       allow create: if request.auth != null;
 *       allow update: if request.auth != null && 
 *           (resource.data.players.BLACK == request.auth.uid || 
 *            resource.data.players.WHITE == request.auth.uid);
 *     }
 *   }
 * }
 */
export const IS_MOCK = true;
