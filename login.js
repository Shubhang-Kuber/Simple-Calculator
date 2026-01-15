// ============================================
// Firebase Configuration for Login Page
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAbgwXphQFT-sAWwB4BTtNW1VGWSm2hJkw",
    authDomain: "simple-calculator-fe0f4.firebaseapp.com",
    projectId: "simple-calculator-fe0f4",
    storageBucket: "simple-calculator-fe0f4.firebasestorage.app",
    messagingSenderId: "257254173160",
    appId: "1:257254173160:web:ed0ec2c3c35bfb6e871c5d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ============================================
// DOM Elements
// ============================================
const signInBtn = document.getElementById('sign-in-btn');
const submitBtn = document.getElementById('submit-btn');
const signupBtn = document.getElementById('signup-btn');
const authForm = document.getElementById('auth-form');
const togglePasswordBtn = document.getElementById('toggle-password');
const passwordField = document.getElementById('password');
const eyeIcon = document.getElementById('eye-icon');
const eyeOffIcon = document.getElementById('eye-off-icon');

// ============================================
// Check if user is already logged in
// ============================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is already signed in, redirect to calculator
        showToast('Redirecting to calculator...');
        window.location.href = 'index.html';
    }
});

// ============================================
// Authentication Functions
// ============================================

// Sign in with Google
async function signInWithGoogle() {
    try {
        signInBtn.classList.add('loading');
        showToast('Signing in with Google...');
        const result = await signInWithPopup(auth, provider);
        showToast(`Welcome, ${result.user.displayName}!`);
        // Redirect to calculator after successful login
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Sign in error:', error);
        alert(error);
        showToast('Sign in failed. Please try again.');
    } finally {
        signInBtn.classList.remove('loading');
    }
}

// Sign up with Email/Password
async function signUpWithEmail(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showToast('Please enter email and password');
        return;
    }
    
    if (password.length < 6) {
        showToast('Password must be at least 6 characters');
        return;
    }
    
    try {
        signupBtn.classList.add('loading');
        showToast('Creating Account.....');
        const result = await createUserWithEmailAndPassword(auth, email, password);
        showToast(`Account created! Welcome, ${result.user.email}!`);
        // Redirect to calculator after successful signup
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Sign up error:', error);
        alert(error);
        handleAuthError(error);
    } finally {
        signupBtn.classList.remove('loading');
    }
}

// Login with Email/Password
async function loginWithEmail(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showToast('Please enter email and password');
        return;
    }
    
    try {
        submitBtn.classList.add('loading');
        showToast('Logging in.....');
        const result = await signInWithEmailAndPassword(auth, email, password);
        showToast(`Welcome back, ${result.user.email}!`);
        // Redirect to calculator after successful login
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Login error:', error);
        alert(error);
        handleAuthError(error);
    } finally {
        submitBtn.classList.remove('loading');
    }
}

// Handle auth errors with user-friendly messages
function handleAuthError(error) {
    switch (error.code) {
        case 'auth/email-already-in-use':
            showToast('Email already in use. Try logging in.');
            break;
        case 'auth/invalid-email':
            showToast('Invalid email address.');
            break;
        case 'auth/weak-password':
            showToast('Password is too weak.');
            break;
        case 'auth/user-not-found':
            showToast('No account found. Please sign up.');
            break;
        case 'auth/wrong-password':
            showToast('Incorrect password.');
            break;
        case 'auth/invalid-credential':
            showToast('Invalid email or password.');
            break;
        default:
            showToast('Authentication failed. Please try again.');
    }
}

// ============================================
// Toast Notification
// ============================================
function showToast(message) {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}

// ============================================
// Event Listeners
// ============================================

// Auth buttons
signInBtn.addEventListener('click', signInWithGoogle);
authForm.addEventListener('submit', loginWithEmail);
signupBtn.addEventListener('click', signUpWithEmail);

// Password visibility toggle
togglePasswordBtn.addEventListener('click', () => {
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        eyeIcon.classList.add('hidden');
        eyeOffIcon.classList.remove('hidden');
    } else {
        passwordField.type = 'password';
        eyeIcon.classList.remove('hidden');
        eyeOffIcon.classList.add('hidden');
    }
});

console.log('Login page initialized!');
