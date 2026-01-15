# Simple Calculator with Firebase Authentication

A beautiful calculator web application that demonstrates Google Authentication and Firestore database integration using Firebase.

## Features

- ✅ **Google Sign-In/Sign-Out** - Secure authentication using Firebase Auth
- ✅ **Basic Calculator Operations** - Add, subtract, multiply, divide, and percentage
- ✅ **Calculation History** - All calculations are saved to Firebase Firestore
- ✅ **Real-time Sync** - History updates in real-time across devices
- ✅ **Keyboard Support** - Use your keyboard for quick calculations
- ✅ **Responsive Design** - Works on desktop and mobile devices

## Setup Instructions

### Step 1: Firebase Project Configuration

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (or create a new one)
3. Click the **gear icon** (⚙️) → **Project settings**
4. Scroll down to **"Your apps"** section
5. If you haven't added a web app yet:
   - Click **"Add app"** → Select **Web** (</> icon)
   - Register your app with a nickname
   - Copy the `firebaseConfig` object
6. If you already have a web app, click on it to see the config

### Step 2: Update Firebase Configuration

Open `app.js` and replace the placeholder config (around line 30):

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### Step 3: Enable Google Sign-In (if not done)

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click on **Google** provider
3. Toggle **Enable**
4. Select a **Project support email**
5. Click **Save**

### Step 4: Setup Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select a Cloud Firestore location
5. Click **Enable**

### Step 5: Firestore Security Rules (Optional but Recommended)

For production, update your Firestore rules to secure user data:

1. Go to **Firestore Database** → **Rules**
2. Replace with these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own calculations
    match /calculations/{calculationId} {
      allow read, write: if request.auth != null 
                         && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null 
                    && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

3. Click **Publish**

### Step 6: Run the Application

Since this uses ES modules, you need to serve it via a local server:

**Option 1: Using VS Code Live Server Extension**
1. Install "Live Server" extension in VS Code
2. Right-click on `index.html` → **Open with Live Server**

**Option 2: Using Python**
```bash
# Python 3
python -m http.server 8000

# Then open http://localhost:8000 in your browser
```

**Option 3: Using Node.js**
```bash
# Install serve globally
npm install -g serve

# Run server
serve .

# Then open the provided URL in your browser
```

## Project Structure

```
Simple-Calculator/
├── index.html      # Main HTML structure
├── styles.css      # Styling and animations
├── app.js          # Calculator logic + Firebase integration
└── README.md       # This file
```

## How It Works

### Google Authentication Flow

1. User clicks "Sign in with Google"
2. Firebase opens a popup for Google sign-in
3. After successful auth, `onAuthStateChanged` listener triggers
4. UI updates to show user info and load their history

### Firestore Database Structure

```
calculations/
├── {documentId}/
│   ├── userId: "user_uid_string"
│   ├── expression: "5 + 3"
│   ├── result: 8
│   └── timestamp: Timestamp
```

### Real-time History Updates

- Uses `onSnapshot` listener for real-time updates
- History is ordered by timestamp (newest first)
- Clicking on a history item loads the result into the calculator

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| 0-9 | Number input |
| . | Decimal point |
| + | Addition |
| - | Subtraction |
| * | Multiplication |
| / | Division |
| % | Percentage |
| Enter or = | Calculate result |
| Backspace | Delete last digit |
| Escape | Clear all |

## Troubleshooting

### "Firebase App not configured"
- Make sure you've replaced the `firebaseConfig` with your actual Firebase project config

### "Sign-in popup blocked"
- Allow popups for your localhost URL in browser settings

### "Permission denied" in Firestore
- Check if Firestore is in test mode or update security rules
- Make sure the user is authenticated before writing data

### CORS errors
- Make sure you're running the app through a local server, not directly opening the HTML file

## Technologies Used

- **Firebase v10** - Authentication & Firestore
- **Vanilla JavaScript** - ES6 modules
- **CSS3** - Flexbox, Grid, Animations
- **HTML5** - Semantic markup

## License

MIT License - Feel free to use this for learning purposes!

---

Made with ❤️ for learning Firebase Authentication
