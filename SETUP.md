# Påskäggsjakt - Setup Guide

## 1. Firebase Setup (free tier)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project** → name it (e.g. `stenaline-easter-2026`)
3. Disable Google Analytics (not needed) → **Create project**
4. In the project dashboard, click the **Web** icon (`</>`) to add a web app
5. Name it anything → **Register app**
6. Copy the `firebaseConfig` object and paste it into `js/firebase-config.js`
7. Go to **Firestore Database** → **Create database**
   - Select **Start in test mode** (or use the rules from `firestore.rules`)
   - Pick a region close to you (e.g. `europe-west1`)

## 2. Add Your Puzzle Image

Place your puzzle image as `images/puzzle.jpg` (or `.png` and update the path in `js/app.js` line 7).

The image will be split into a **9x8 grid** (72 pieces). Landscape images work best.

## 3. Deploy to GitHub Pages

1. Create a GitHub repo and push all files
2. Go to **Settings** → **Pages** → set source to `main` branch, root folder
3. Your site will be at `https://YOUR_USERNAME.github.io/REPO_NAME/`

## 4. Generate QR Codes

1. Edit `BASE_URL` in `generate-qrcodes.js` to your GitHub Pages URL
2. Run:
   ```bash
   npm install qrcode
   node generate-qrcodes.js
   ```
3. QR code PNGs are saved in `qrcodes/` folder
4. Open `qrcodes/print-sheet.html` to print all 72 codes (4 per row)

## 5. Prepare the Eggs

- Print the QR codes and cut them out
- Attach one QR code to each of the 72 eggs
- Each egg number (1-72) corresponds to a puzzle piece position (left-to-right, top-to-bottom)

## How It Works

- When someone scans a QR code, the URL contains a unique secret token
- The app checks Firebase: if the token hasn't been used, it marks the egg as found
- The corresponding puzzle piece is revealed with an animation
- A Firestore transaction prevents the same egg from being counted twice
- Anyone visiting the page sees real-time progress (Firestore real-time listener)
- All progress is persisted in Firebase

## File Structure

```
├── index.html              # Main page
├── css/style.css           # Stena Line branded styles
├── js/
│   ├── firebase-config.js  # Your Firebase credentials
│   ├── eggs.js             # 72 unique egg tokens (auto-generated)
│   └── app.js              # App logic
├── images/
│   └── puzzle.jpg          # YOUR puzzle image goes here
├── generate-qrcodes.js     # Node script to generate QR codes
├── firestore.rules         # Firebase security rules
└── qrcodes/                # Generated QR codes (after running script)
```

## Reset the Hunt

To start over, delete all documents in the `eggs` collection in Firebase Console.
