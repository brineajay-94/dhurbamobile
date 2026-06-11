const firebaseConfig = {
  apiKey: "AIzaSyB0_GuX3I4yohZNX2-XroWx8A6zSV0J38Y",
  authDomain: "dhurvmobile-7bb54.firebaseapp.com",
  databaseURL: "https://dhurvmobile-7bb54-default-rtdb.firebaseio.com",
  projectId: "dhurvmobile-7bb54",
  storageBucket: "dhurvmobile-7bb54.firebasestorage.app",
  messagingSenderId: "1072268087565",
  appId: "1:1072268087565:web:dee3c416c8b3dc3d362044",
  measurementId: "G-NC1RJNS7Q5"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
