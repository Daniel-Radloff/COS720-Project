import {
  initializeApp,
  type FirebaseOptions,
  type FirebaseApp
} from "firebase/app";
import {connectAuthEmulator, getAuth, type Auth} from "firebase/auth";
import {getAnalytics, type Analytics} from "firebase/analytics"
import {connectFunctionsEmulator, getFunctions, type Functions} from "firebase/functions";
import {connectFirestoreEmulator, getFirestore, type Firestore} from "firebase/firestore";

const config: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: "cos720-4f6dc",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let firebaseAuth:Auth;
let firebaseApp:FirebaseApp;
let firebaseAnalytics:Analytics;
let firebaseFunctions:Functions;
let firebaseFirestore:Firestore;

export const getFirebaseAppClient = ():FirebaseApp => {
  if (!firebaseApp) {
    firebaseApp = initializeApp(config);
  }
  return firebaseApp;
};

export const getFirebaseAuthClient = ():Auth => {
  if (!firebaseAuth) {
    firebaseAuth = getAuth(getFirebaseAppClient());
    if (import.meta.env.DEV === true) {
      connectAuthEmulator(firebaseAuth, "http://127.0.0.1:9099");
    }
  }
  return firebaseAuth;
};

export const getFirebaseAnalyticsClient = ():Analytics => {
  if (!firebaseAnalytics) {
    firebaseAnalytics = getAnalytics(getFirebaseAppClient());
  }
  return firebaseAnalytics;
}

export const getFirebaseFunctionsClient = ():Functions => {
  if (!firebaseFunctions) {
    firebaseFunctions = getFunctions(getFirebaseAppClient());
    if (import.meta.env.DEV === true) {
      connectFunctionsEmulator(firebaseFunctions,'127.0.0.1',5001);
    }
  }
  return firebaseFunctions;
}

export const getFirebaseFirestoreClient = ():Firestore => {
  if (!firebaseFirestore) {
    firebaseFirestore  = getFirestore(getFirebaseAppClient());
    if (import.meta.env.DEV === true) {
      console.log("using emulator")
      connectFirestoreEmulator(firebaseFirestore, '127.0.0.1', 8080)
    }
  }
  return firebaseFirestore;
}

getFirebaseAppClient();
getFirebaseFirestoreClient();
getFirebaseFunctionsClient();
getFirebaseAuthClient();