# MINDGUARD v4.0 - Personal Dashboard

Aplikasi personal dashboard untuk tracking Big Five personality traits, task management, skill development, dan business monitoring.

## 📂 Struktur Project

```
mindguard-v4-project/
├── index.html          # Main HTML file
├── css/
│   └── style.css      # Semua styling
├── js/
│   ├── data.js        # Constants & data (traits, quotes, achievements)
│   └── app.js         # Main application logic
└── README.md          # Dokumentasi ini
```

## 🚀 Cara Menggunakan

1. **Buka aplikasi**: Double-click `index.html` atau buka di browser
2. **Development**: Edit file sesuai kebutuhan:
   - **HTML**: `index.html` - struktur dan layout
   - **CSS**: `css/style.css` - styling dan animasi
   - **JavaScript Logic**: `js/app.js` - semua fungsi aplikasi
   - **Data Constants**: `js/data.js` - ubah quotes, achievements, rewards, dll

## ✨ Fitur Utama

### 1. Big Five Personality Monitor
- Track 5 traits: Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism
- Manual adjustment dengan tombol +/-
- Auto-update dari task completion

### 2. Task Management (The Battlefield)
- Priority system (High/Medium/Low)
- Search & filter tasks
- XP rewards saat complete (30/20/10 XP)
- Streak tracking

### 3. Gamification
- **Level & XP System**: Gain XP dari tasks, level up setiap 100 XP
- **Achievements**: 8 unlockable badges
- **XP Shop**: Beli rewards dengan XP (Mobile Legends, Anime, Snacks)

### 4. Skill Mastery
- English Pronunciation (0-100%)
- Graphic Design (0-100%)
- Track progress dengan tombol +

### 5. Business Tracker
- Hirz Ice revenue tracking
- HFC revenue tracking
- Daily input, monthly auto-calculation

### 6. Productivity Tools
- Pomodoro Timer (25 menit)
- Daily Journal
- 7-day progress chart
- Keyboard shortcuts

### 7. Specific Waste Buttons
- 📱 Doomscroll: -5% Conscientiousness, +5% Neuroticism
- 🎮 Gaming: -10% Conscientiousness
- 🛌 Rebahan: -5% Conscientiousness, +10% Energy

## ⌨️ Keyboard Shortcuts

- `Ctrl+N` - New Task
- `Ctrl+D` - Toggle Dark Mode
- `Ctrl+K` - Focus Search
- `Space` - Start/Pause Pomodoro
- `?` - Show Keyboard Help

## 💾 Data Storage

Semua data tersimpan di **localStorage** browser:
- Big Five scores
- Tasks & completion status
- Level, XP, achievements
- Skills progress
- Business revenue
- Journal entries
- 30-day history

## 🔧 Customization

### Tambah Quote Baru
Edit `js/data.js`:
```javascript
const quotes = [
    "Quote baru kamu...",
    // ...quotes lainnya
];
```

### Tambah Achievement Baru
Edit `js/data.js`:
```javascript
const achievements = [
    {
        id: 'unique_id',
        name: 'Nama Achievement',
        desc: 'Deskripsi',
        icon: '🎯',
        condition: () => appData.stats.totalCompleted >= 50
    },
    // ...achievements lainnya
];
```

### Tambah Reward XP Shop
Edit `js/data.js`:
```javascript
const shopRewards = [
    { id: 'reward_id', name: 'Nama Reward', price: 150, icon: '🎁' },
    // ...rewards lainnya
];
```

### Ubah Styling
Edit `css/style.css`:
- Color schemes
- Animations
- Layout spacing
- Dark mode colors

## 📱 Features Breakdown

**Data Management:**
- Export data as JSON
- Import from backup
- Reset all data

**UI/UX:**
- Dark mode support
- Responsive design (mobile & desktop)
- Toast notifications
- Confetti celebrations
- Smooth animations

**Progress Tracking:**
- 7-day chart (Chart.js)
- Streak counter
- Total completed tasks
- Pomodoro sessions

## 🎨 Color Palette

- **Primary**: Indigo (#6366f1)
- **Success**: Emerald (#10b981)
- **Warning**: Amber (#f59e0b)
- **Danger**: Rose (#f43f5e)
- **Background Light**: Slate 50-100
- **Background Dark**: Slate 800-900

## 📝 Tips Development

1. **Live Server**: Gunakan VS Code Live Server extension untuk auto-reload
2. **Browser DevTools**: Tekan F12 untuk debugging
3. **localStorage**: Cek di Application tab (Chrome DevTools)
4. **Code Comments**: Semua fungsi sudah ada komentar jelas
5. **Section Headers**: Cari `====` di `app.js` untuk navigasi cepat

## 🐛 Troubleshooting

**Data hilang setelah refresh?**
- Cek browser console untuk error
- Pastikan localStorage enabled
- Check `saveData()` di...di fungsi yang diubah

**Chart tidak muncul?**
- Pastikan Chart.js CDN ter-load
- Check console untuk errors
- Verify `initProgressChart()` dipanggil

**Styling kacau?**
- Clear browser cache
- Check Tailwind CDN
- Verify `style.css` ter-load

## 📄 License

Personal project - bebas dimodifikasi untuk kebutuhan pribadi.

---

**Version:** 4.0  
**Last Updated:** 2026-02-11  
**Created by:** Herzi with Antigravity AI
