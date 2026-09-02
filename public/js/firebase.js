import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';import {getAuth,connectAuthEmulator,signInAnonymously} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';import {getFirestore,connectFirestoreEmulator} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';import {firebaseConfig} from './firebase-config.js';
const app=initializeApp(firebaseConfig);export const auth=getAuth(app),db=getFirestore(app);
// Use local emulators only with ?emulator=1. A normal localhost preview uses your real Firebase project.
if(new URLSearchParams(location.search).get('emulator')==='1'){connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});connectFirestoreEmulator(db,'127.0.0.1',8080)}
export async function studentAuth(){return auth.currentUser|| (await signInAnonymously(auth)).user}
