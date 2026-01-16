import { initializeApp, getApps } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyCQWUC8cw5Yw-UMupJPyUhziHN0vB4E_wI",
  authDomain: "gomera-7464a.firebaseapp.com",
  projectId: "gomera-7464a",
  storageBucket: "gomera-7464a.firebasestorage.app",
  messagingSenderId: "163014170644",
  appId: "1:163014170644:web:e98394b872df3cc4a12f01",
  measurementId: "G-PFZ8G02D8C",
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const db = getFirestore(app)
const storage = getStorage(app)

export { app, db, storage }
