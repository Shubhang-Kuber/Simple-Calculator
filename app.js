// ============================================
// Firebase Configuration
// ============================================
// Replace the firebaseConfig object below with your own Firebase project configuration.
// You can find this in your Firebase Console:
// 1. Go to Firebase Console (https://console.firebase.google.com)
// 2. Select your project
// 3. Click the gear icon (Settings) > Project settings
// 4. Scroll down to "Your apps" and select your web app
// 5. Copy the firebaseConfig object

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { 
    getAuth, 
    signInWithPopup, 
    signOut, 
    GoogleAuthProvider, 
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    query, 
    where, 
    orderBy, 
    onSnapshot,
    deleteDoc,
    getDocs,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

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
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ============================================
// DOM Elements
// ============================================
const signInBtn = document.getElementById('sign-in-btn');
const signOutBtn = document.getElementById('sign-out-btn');
const userInfo = document.getElementById('user-info');
const userPhoto = document.getElementById('user-photo');
const userName = document.getElementById('user-name');
const previousOperand = document.getElementById('previous-operand');
const currentOperand = document.getElementById('current-operand');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');

// Email/Password Auth Elements
const submitBtn = document.getElementById('submit-btn');
const signupBtn = document.getElementById('signup-btn');
const authForm = document.getElementById('auth-form');

// ============================================
// Calculator State
// ============================================
let calculator = {
    currentValue: '0',
    previousValue: '',
    operation: null,
    shouldResetScreen: false
};

let currentUser = null;
let unsubscribeHistory = null;

// ============================================
// Authentication Functions
// ============================================

// Sign in with Google
async function signInWithGoogle() {
    try {
        signInBtn.classList.add('loading');
        const result = await signInWithPopup(auth, provider);
        showToast(`Welcome, ${result.user.displayName}!`);
    } catch (error) {
        console.error('Sign in error:', error);
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
        clearAuthInputs();
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
        const result = await signInWithEmailAndPassword(auth, email, password);
        showToast(`Welcome back, ${result.user.email}!`);
        clearAuthInputs();
    } catch (error) {
        console.error('Login error:', error);
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

// Clear auth input fields
function clearAuthInputs() {
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
}

// Sign out
async function signOutUser() {
    try {
        await signOut(auth);
        showToast('Signed out successfully');
    } catch (error) {
        console.error('Sign out error:', error);
        showToast('Sign out failed. Please try again.');
    }
}

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        currentUser = user;
        authForm.classList.add('hidden');
        userInfo.classList.remove('hidden');
        userPhoto.src = user.photoURL || 'https://via.placeholder.com/40';
        userName.textContent = user.displayName || user.email;
        clearHistoryBtn.classList.remove('hidden');
        
        // Start listening to user's calculation history
        subscribeToHistory(user.uid);
    } else {
        // User is signed out
        currentUser = null;
        authForm.classList.remove('hidden');
        userInfo.classList.add('hidden');
        clearHistoryBtn.classList.add('hidden');
        
        // Stop listening to history and show login prompt
        if (unsubscribeHistory) {
            unsubscribeHistory();
            unsubscribeHistory = null;
        }
        historyList.innerHTML = '<p class="login-prompt">Sign in to see your calculation history</p>';
    }
});

// ============================================
// Firestore Functions
// ============================================

// Save calculation to Firestore
async function saveCalculation(expression, result) {
    if (!currentUser) return;
    
    try {
        await addDoc(collection(db, 'calculations'), {
            userId: currentUser.uid,
            expression: expression,
            result: result,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error('Error saving calculation:', error);
    }
}

// Subscribe to user's calculation history
function subscribeToHistory(userId) {
    const q = query(
        collection(db, 'calculations'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
    );
    
    unsubscribeHistory = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            historyList.innerHTML = '<p class="login-prompt">No calculations yet. Start calculating!</p>';
            return;
        }
        
        historyList.innerHTML = '';
        snapshot.forEach((doc) => {
            const data = doc.data();
            const historyItem = createHistoryItem(data);
            historyList.appendChild(historyItem);
        });
    }, (error) => {
        console.error('Error fetching history:', error);
        historyList.innerHTML = '<p class="login-prompt">Error loading history</p>';
    });
}

// Create history item element
function createHistoryItem(data) {
    const div = document.createElement('div');
    div.className = 'history-item';
    
    const time = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleString() : 'Just now';
    
    div.innerHTML = `
        <div class="history-expression">${data.expression}</div>
        <div class="history-result">= ${data.result}</div>
        <div class="history-time">${time}</div>
    `;
    
    // Click to load result into calculator
    div.addEventListener('click', () => {
        calculator.currentValue = data.result.toString();
        updateDisplay();
        showToast('Result loaded');
    });
    
    return div;
}

// Clear all history for current user
async function clearHistory() {
    if (!currentUser) return;
    
    try {
        const q = query(
            collection(db, 'calculations'),
            where('userId', '==', currentUser.uid)
        );
        
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        
        showToast('History cleared');
    } catch (error) {
        console.error('Error clearing history:', error);
        showToast('Failed to clear history');
    }
}

// ============================================
// Calculator Functions
// ============================================

function updateDisplay() {
    currentOperand.textContent = calculator.currentValue;
    
    if (calculator.operation) {
        const operatorSymbol = getOperatorSymbol(calculator.operation);
        previousOperand.textContent = `${calculator.previousValue} ${operatorSymbol}`;
    } else {
        previousOperand.textContent = '';
    }
}

function getOperatorSymbol(operation) {
    const symbols = {
        add: '+',
        subtract: '−',
        multiply: '×',
        divide: '÷'
    };
    return symbols[operation] || '';
}

function appendNumber(number) {
    if (calculator.shouldResetScreen) {
        calculator.currentValue = '';
        calculator.shouldResetScreen = false;
    }
    
    // Prevent multiple decimals
    if (number === '.' && calculator.currentValue.includes('.')) return;
    
    // Replace initial 0
    if (calculator.currentValue === '0' && number !== '.') {
        calculator.currentValue = number;
    } else {
        calculator.currentValue += number;
    }
    
    updateDisplay();
}

function handleOperator(action) {
    if (action === 'clear') {
        calculator.currentValue = '0';
        calculator.previousValue = '';
        calculator.operation = null;
        updateDisplay();
        return;
    }
    
    if (action === 'delete') {
        calculator.currentValue = calculator.currentValue.slice(0, -1) || '0';
        updateDisplay();
        return;
    }
    
    if (action === 'percent') {
        calculator.currentValue = (parseFloat(calculator.currentValue) / 100).toString();
        updateDisplay();
        return;
    }
    
    if (action === 'equals') {
        if (!calculator.operation || !calculator.previousValue) return;
        
        const expression = `${calculator.previousValue} ${getOperatorSymbol(calculator.operation)} ${calculator.currentValue}`;
        const result = calculate();
        
        if (result !== null) {
            // Save to Firestore
            saveCalculation(expression, result);
            
            calculator.previousValue = '';
            calculator.operation = null;
            calculator.shouldResetScreen = true;
            updateDisplay();
        }
        return;
    }
    
    // Handle math operations
    if (['add', 'subtract', 'multiply', 'divide'].includes(action)) {
        if (calculator.operation && calculator.previousValue && !calculator.shouldResetScreen) {
            calculate();
        }
        
        calculator.previousValue = calculator.currentValue;
        calculator.operation = action;
        calculator.shouldResetScreen = true;
        updateDisplay();
    }
}

function calculate() {
    const prev = parseFloat(calculator.previousValue);
    const current = parseFloat(calculator.currentValue);
    
    if (isNaN(prev) || isNaN(current)) return null;
    
    let result;
    
    switch (calculator.operation) {
        case 'add':
            result = prev + current;
            break;
        case 'subtract':
            result = prev - current;
            break;
        case 'multiply':
            result = prev * current;
            break;
        case 'divide':
            if (current === 0) {
                showToast('Cannot divide by zero');
                return null;
            }
            result = prev / current;
            break;
        default:
            return null;
    }
    
    // Round to avoid floating point issues
    result = Math.round(result * 1000000000) / 1000000000;
    calculator.currentValue = result.toString();
    
    return result;
}

// ============================================
// Toast Notification
// ============================================

function showToast(message) {
    // Remove existing toast
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
signOutBtn.addEventListener('click', signOutUser);
clearHistoryBtn.addEventListener('click', clearHistory);

// Form submit for login (handles Enter key and button click)
authForm.addEventListener('submit', loginWithEmail);

// Sign up button (separate from form submit)
signupBtn.addEventListener('click', signUpWithEmail);

// Password visibility toggle
const togglePasswordBtn = document.getElementById('toggle-password');
const passwordField = document.getElementById('password');
const eyeIcon = document.getElementById('eye-icon');
const eyeOffIcon = document.getElementById('eye-off-icon');

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

// Calculator buttons
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', () => {
        if (button.dataset.number) {
            appendNumber(button.dataset.number);
        } else if (button.dataset.action) {
            handleOperator(button.dataset.action);
        }
    });
});

// Keyboard support
document.addEventListener('keydown', (e) => {
    if (e.key >= '0' && e.key <= '9') appendNumber(e.key);
    if (e.key === '.') appendNumber('.');
    if (e.key === '+') handleOperator('add');
    if (e.key === '-') handleOperator('subtract');
    if (e.key === '*') handleOperator('multiply');
    if (e.key === '/') handleOperator('divide');
    if (e.key === 'Enter' || e.key === '=') handleOperator('equals');
    if (e.key === 'Backspace') handleOperator('delete');
    if (e.key === 'Escape') handleOperator('clear');
    if (e.key === '%') handleOperator('percent');
});

// Initialize display
updateDisplay();

console.log('Calculator with Firebase Auth initialized!');
console.log('⚠️ Remember to replace the firebaseConfig with your own Firebase configuration.');
