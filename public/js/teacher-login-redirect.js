import {auth} from './firebase.js';import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
// Firebase keeps the teacher sign-in in this browser until Sign out is pressed.
onAuthStateChanged(auth,user=>{if(user&&location.pathname.endsWith('/teacher/login.html'))location.replace('dashboard.html')});
