// ============================================
// Firebase Configuration
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { 
    getAuth, 
    signOut, 
    onAuthStateChanged
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

// ============================================
// DOM Elements
// ============================================
const signOutBtn = document.getElementById('sign-out-btn');
const userInfo = document.getElementById('user-info');
const userPhoto = document.getElementById('user-photo');
const userName = document.getElementById('user-name');
const previousOperand = document.getElementById('previous-operand');
const currentOperand = document.getElementById('current-operand');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const loadingScreen = document.getElementById('loading-screen');
const mainContent = document.getElementById('main-content');

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

// Sign out and redirect to login page
async function signOutUser() {
    try {
        await signOut(auth);
        showToast('Signed out successfully');
        // Redirect to login page
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Sign out error:', error);
        showToast('Sign out failed. Please try again.');
    }
}

// Listen for auth state changes - Protect this page
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in - Show the calculator
        currentUser = user;
        
        // Hide loading, show main content
        loadingScreen.classList.add('hidden');
        mainContent.classList.remove('hidden');
        
        // Update user info
        userPhoto.src = user.photoURL || 'https://via.placeholder.com/40';
        userName.textContent = user.displayName || user.email;
        
        // Start listening to user's calculation history
        subscribeToHistory(user.uid);
    } else {
        // User is NOT signed in - Redirect to login page
        window.location.href = 'login.html';
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
    if (!currentUser) {
        showToast('Please sign in first');
        return;
    }
    
    try {
        showToast('Clearing history...');
        
        const q = query(
            collection(db, 'calculations'),
            where('userId', '==', currentUser.uid)
        );
        
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            showToast('No history to clear');
            return;
        }
        
        // Delete all documents
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        
        showToast('History cleared successfully!');
    } catch (error) {
        console.error('Error clearing history:', error);
        alert('Error: ' + error.message);
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
signOutBtn.addEventListener('click', signOutUser);
clearHistoryBtn.addEventListener('click', clearHistory);

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

console.log('Calculator page initialized!');
