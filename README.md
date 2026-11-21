# 🌾 Chakki Smart AI (चक्की स्मार्ट AI)
> **आपकी चक्की का स्मार्ट मैनेजमेंट साथी**
> High-Traffic, 3D UI, Voice-Enabled Flour Mill Management App.

---

## 📁 Repository & Folder Structure

```text
kisan/
├── .github/
│   └── workflows/
│       └── ci-cd.yml             # 🚀 Automated GitHub Actions CI/CD Pipeline
│
├── client/                       # 📱 Mobile App (React Native + Expo)
│   ├── assets/                   # 3D Icons, Audio, Images
│   ├── src/
│   │   ├── components/           # UI Components (Header, HeroCard, StatGrid, VoiceWaveform, ServiceTile)
│   │   ├── screens/              # 1-to-1 Screens from reference:
│   │   │   ├── HomeScreen.js             # Main Dashboard (₹2,850 + 6 Tiles)
│   │   │   ├── VoiceAssistantScreen.js   # Neon Space Voice Recognition
│   │   │   ├── GrahakKhataScreen.js       # Customer Ledger & Tabs
│   │   │   ├── BillPrintScreen.js         # Invoice Slip & WhatsApp Share
│   │   │   └── NewEntryScreen.js          # Grinding / Crop Entry & Giant Green/Red Buttons
│   │   ├── navigation/           # Screen Routing (AppNavigator.js)
│   │   ├── context/              # State & Business Logic (ChakkiContext.js)
│   │   ├── services/             # Voice, Speech TTS, Offline Storage
│   │   ├── constants/            # Theme Colors, Default Rates
│   │   └── utils/                # Calculations & Currency Formatting
│   ├── app.json                  # Expo & Play Store Package Config
│   └── package.json              # React Native Dependencies
│
└── server/                       # ☁️ AWS & Node.js Backend (Ready for phase 2)
    └── README.md
```

---

## 🚀 How to Run the App on Your Phone (Expo Go)

1. Open terminal inside `client`:
   ```bash
   cd client
   npm install
   npx expo start
   ```
2. Scan the QR code with **Expo Go** on your Android or iPhone.
3. The app will open live on your mobile!

