# 🐕 DogStay Manager v3.0

A comprehensive, modern dashboard for dog boarding management. Built with React, TypeScript, and Google Sheets as a backend.

![DogStay Manager](https://img.shields.io/badge/version-3.0.0-orange)
![React](https://img.shields.io/badge/React-18.2-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### Core Features
- 📅 **Booking Management** - Create, edit, and track dog boarding reservations
- 📊 **Analytics Dashboard** - Revenue tracking, occupancy rates, and client insights
- 🗓️ **Visual Calendar** - See availability at a glance with color-coded occupancy
- 👥 **Client History** - Track returning customers and VIP clients
- 📱 **Mobile-First Design** - Fully responsive with native-like mobile experience

### UX/UI Improvements (v3.0)
- 🌍 **Internationalization** - Full Russian and English language support
- 🎨 **Modern UI** - Smooth animations with Framer Motion
- 📝 **Smart Forms** - Multi-step booking wizard with autocomplete
- 📆 **Visual Date Picker** - Interactive calendar showing real-time availability
- 🔔 **Rich Notifications** - Contextual toast messages with actions
- ⚡ **Skeleton Loading** - Beautiful loading states for better perceived performance
- 📱 **Bottom Sheets** - Native-like mobile modals with gesture support
- ✅ **Confirmation Dialogs** - Safe delete operations with custom dialogs
- 🎯 **Quick Actions** - Long-press context menus for power users
- ♿ **Accessibility** - ARIA labels, keyboard navigation, screen reader support
- 📳 **Haptic Feedback** - Tactile response on mobile devices

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Google Account (for backend)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/dogstay-manager.git
cd dogstay-manager

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📊 Setting Up Google Sheets Backend

### Step 1: Create a Google Sheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Note the spreadsheet ID from the URL

### Step 2: Set Up Apps Script
1. In your spreadsheet, go to **Extensions** → **Apps Script**
2. Delete any existing code in `Code.gs`
3. Copy the contents of `backend/Code.js` into the editor
4. Click **Save** (💾)

### Step 3: Run Initial Setup
1. In Apps Script, select `setup` from the function dropdown
2. Click **Run**
3. Grant the necessary permissions when prompted

### Step 4: Deploy as Web App
1. Click **Deploy** → **New deployment**
2. Select type: **Web app**
3. Configure:
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy**
5. Copy the **Web app URL**

### Step 5: Connect the App
1. Open DogStay Manager in your browser
2. Paste the Web app URL when prompted
3. Click **Connect**

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 18 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3.4 |
| State Management | TanStack Query (React Query) |
| Animations | Framer Motion 11 |
| Charts | Recharts |
| Internationalization | i18next |
| Build Tool | Vite 5 |
| Backend | Google Apps Script |
| Database | Google Sheets |

## 📁 Project Structure

```
dogstay-manager/
├── components/
│   ├── ui/                 # Reusable UI components
│   │   ├── Autocomplete.tsx
│   │   ├── BottomSheet.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── DateRangePicker.tsx
│   │   ├── EmptyState.tsx
│   │   ├── QuickActions.tsx
│   │   └── Skeleton.tsx
│   ├── BookingCard.tsx
│   ├── BookingForm.tsx
│   └── Onboarding.tsx
├── pages/
│   ├── Dashboard.tsx
│   ├── BookingsList.tsx
│   ├── Reports.tsx
│   └── Settings.tsx
├── hooks/
│   └── useDogStay.ts      # React Query hooks
├── services/
│   └── api.ts             # API functions
├── locales/
│   ├── ru.json            # Russian translations
│   └── en.json            # English translations
├── utils/
│   └── helpers.ts         # Utility functions
├── styles/
│   └── globals.css        # Global styles
├── backend/
│   └── Code.js            # Google Apps Script
├── App.tsx
├── index.tsx
├── i18n.ts
└── types.ts
```

## 🌍 Internationalization

The app supports multiple languages. To add a new language:

1. Create a new JSON file in `locales/` (e.g., `de.json`)
2. Copy the structure from `en.json`
3. Translate all strings
4. Add the language to `i18n.ts`:

```typescript
import de from './locales/de.json';

i18n.init({
  resources: {
    ru: { translation: ru },
    en: { translation: en },
    de: { translation: de }  // Add new language
  }
});
```

## 📱 Mobile Features

- **Pull to Refresh** - Swipe down to refresh data
- **Bottom Sheet Modals** - Native-like modal experience
- **Haptic Feedback** - Vibration on interactions
- **Safe Area Support** - Proper insets for notched devices
- **Touch Optimized** - Large tap targets, swipe gestures

## 🎨 Customization

### Theme Colors
Edit `tailwind.config.js` to customize the color scheme:

```javascript
colors: {
  primary: {
    500: '#f97316',  // Main brand color
    600: '#ea580c',  // Hover state
  }
}
```

### Adding New Booking Statuses
Edit `types.ts`:

```typescript
export enum BookingStatus {
  WAITLIST = 'WAITLIST',
  REQUEST = 'REQUEST',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  // Add new status here
}
```

## 🚀 Deployment

### GitHub Pages

1. Push your code to GitHub
2. Go to repository **Settings** → **Pages**
3. Set source to **GitHub Actions**
4. The workflow will automatically deploy on push to `main`

### Vercel

```bash
npm install -g vercel
vercel
```

### Netlify

```bash
npm run build
# Upload the `dist` folder to Netlify
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

- 📧 Email: support@dogstay.app
- 💬 Telegram: @dogstay_support
- 📝 Issues: [GitHub Issues](https://github.com/your-username/dogstay-manager/issues)

---

Made with ❤️ for dog lovers everywhere
