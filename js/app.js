// ============================================
// MINDGUARD v4.0 - Main Application Logic
// ============================================

// Global Variables
let isSkillEditMode = false;

// ============================================
// TAB NAVIGATION
// ============================================

function switchTab(tabName) {
    // Hide all panels, show target
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById(`panel-${tabName}`);
    if (panel) panel.classList.add('active');

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.onclick && btn.onclick.toString().includes(`'${tabName}'`)) {
            btn.classList.add('active');
        }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// INITIALIZATION
// ============================================

async function initApp() {
    await loadData();

    // Set name from auth if this is a new user
    if (currentUser && window.appData.userName === 'Herzi') {
        const authName = getAuthDisplayName();
        if (authName && authName !== 'User') {
            window.appData.userName = authName;
        }
    }

    applyTheme();
    renderBigFive();
    filterTasks();
    updateDate();
    updateStreak();
    updateLevel();
    displayRandomQuote();
    renderProgressSummary();
    initKeyboardShortcuts();
    updateSkillDisplay();
    updatePersonalityInsight();
    renderRequests();
    checkDailyTaskPenalty();
    updateTodayPreview();

    // Update date every minute
    setInterval(updateDate, 60000);
}

// ============================================
// DATA MANAGEMENT
// ============================================

async function loadData() {
    const saved = localStorage.getItem('mindguardData');

    if (saved) {
        window.appData = JSON.parse(saved);
        // Migration to array for skills if needed
        if (window.appData.skills && !Array.isArray(window.appData.skills)) {
            const oldSkills = window.appData.skills;
            window.appData.skills = [
                { id: 'english', name: 'English Pronunciation', icon: '🇺🇸', level: oldSkills.english || 0, color: 'cyan' },
                { id: 'design', name: 'Graphic Design', icon: '🎨', level: oldSkills.design || 0, color: 'rose' }
            ];
        }
    } else {
        // Initialize default data
        window.appData = {
            userName: 'Herzi',
            energy: 50,
            darkMode: false,
            streak: 0,
            lastCompletedDate: null,
            level: 1,
            xp: 0,
            unlockedAchievements: [],
            purchasedRewards: [],
            skills: [
                { id: 'english', name: 'English Pronunciation', icon: '🇺🇸', level: 0, color: 'cyan' },
                { id: 'design', name: 'Graphic Design', icon: '🎨', level: 0, color: 'rose' }
            ],
            stats: {
                totalCompleted: 0
            },
            bigFive: {
                openness: 50,
                conscientiousness: 50,
                extraversion: 50,
                agreeableness: 50,
                neuroticism: 50
            },
            tasks: [],
            requests: [],
            journal: '',
            planning: '',
            history: [],
            lastUpdated: Date.now(),
            lastDailyCheck: new Date().toDateString(),
            templates: []
        };
    }

    // Attempt to load from Cloud (Supabase)
    const cloudData = await loadFromCloud(window.appData.userName);
    if (cloudData) {
        const localUpdate = window.appData.lastUpdated || 0;
        const cloudUpdate = cloudData.lastUpdated || 0;

        if (cloudUpdate > localUpdate) {
            window.appData = cloudData;
            console.log('☁️ Data loaded from Cloud (Newer)');
        } else if (localUpdate > cloudUpdate) {
            console.log('📱 Local data is newer, pushing to Cloud');
            saveToCloud();
        }
    }

    if (!window.appData.templates) window.appData.templates = [];

    // Apply loaded data to UI
    document.getElementById('greeting').textContent = `Halo, ${window.appData.userName}`;
    document.getElementById('energySlider').value = window.appData.energy;
    updateEnergy(window.appData.energy);
    document.getElementById('journalText').value = window.appData.journal || '';
    if (document.getElementById('planningText')) {
        document.getElementById('planningText').value = window.appData.planning || '';
    }
}

function saveData() {
    window.appData.lastUpdated = Date.now();
    const dataStr = JSON.stringify(window.appData);
    localStorage.setItem('mindguardData', dataStr);
    localStorage.setItem('mindguardBackup', dataStr); // Secondary emergency backup
    saveToCloud();
}

function exportData() {
    const dataStr = JSON.stringify(window.appData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindguard-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📥 Data berhasil di-export!', 'success');
}

function importData() {
    document.getElementById('importFileInput').click();
}

function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            window.appData = data;
            saveData();
            location.reload();
            showToast('📤 Data berhasil di-import!', 'success');
        } catch (err) {
            showToast('❌ Error: File tidak valid!', 'error');
        }
    };
    reader.readAsText(file);
}


// ============================================
// THEME MANAGEMENT
// ============================================

function applyTheme() {
    if (window.appData.darkMode) {
        document.documentElement.classList.add('dark');
        document.getElementById('darkModeIcon').textContent = '☀️';
    } else {
        document.documentElement.classList.remove('dark');
        document.getElementById('darkModeIcon').textContent = '🌙';
    }
}

function toggleDarkMode() {
    window.appData.darkMode = !window.appData.darkMode;
    applyTheme();
    saveData();
    renderProgressSummary();
    showToast('🎨 Mode ' + (window.appData.darkMode ? 'gelap' : 'terang') + ' aktif!', 'info');
}

// ============================================
// UI UTILITIES
// ============================================

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    const colors = {
        success: 'bg-emerald-500 text-white',
        error: 'bg-rose-500 text-white',
        info: 'bg-indigo-500 text-white'
    };
    toast.className += ' ' + colors[type];
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function updateDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('id-ID', options);
}

function editName() {
    const newName = prompt('Masukkan nama Anda:', window.appData.userName);
    if (newName && newName.trim() !== '') {
        window.appData.userName = newName.trim();
        document.getElementById('greeting').textContent = `Halo, ${window.appData.userName}`;
        saveData();
        showToast('👋 Nama berhasil diubah!', 'success');
    }
}

function displayRandomQuote() {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    document.getElementById('quote').textContent = `"${randomQuote}"`;
}

// ============================================
// ENERGY MANAGEMENT
// ============================================

function updateEnergy(value) {
    window.appData.energy = parseInt(value);
    const label = document.getElementById('energyLabel');

    if (value < 33) {
        label.textContent = 'Low Battery 🪫';
        label.className = 'text-sm font-bold text-rose-600 dark:text-rose-400';
    } else if (value < 66) {
        label.textContent = 'Medium ⚡';
        label.className = 'text-sm font-bold text-amber-600 dark:text-amber-400';
    } else {
        label.textContent = 'Full Charge 🔋';
        label.className = 'text-sm font-bold text-emerald-600 dark:text-emerald-400';
    }

    saveData();
}

// ============================================
// STREAK MANAGEMENT
// ============================================

function updateStreak() {
    document.getElementById('streakCounter').textContent = `${window.appData.streak} hari streak`;
}

function checkStreak() {
    const today = new Date().toDateString();
    const lastDate = window.appData.lastCompletedDate;

    if (lastDate === today) return;

    if (lastDate) {
        const last = new Date(lastDate);
        const now = new Date(today);
        const diffTime = Math.abs(now - last);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            window.appData.streak++;
        } else if (diffDays > 1) {
            window.appData.streak = 1;
        }
    } else {
        window.appData.streak = 1;
    }

    window.appData.lastCompletedDate = today;
    updateStreak();
    saveData();
    checkAchievements();
}

// ============================================
// LEVEL & XP MANAGEMENT
// ============================================

function updateLevel() {
    const xpNeeded = window.appData.level * 100;

    document.getElementById('levelDisplay').textContent = `Lvl ${window.appData.level}`;
    document.getElementById('xpDisplay').textContent = `${window.appData.xp} XP`;
    document.getElementById('xpProgress').textContent = `${window.appData.xp}/${xpNeeded} XP`;

    const percent = (window.appData.xp / xpNeeded) * 100;
    document.getElementById('xpBar').style.width = `${percent}%`;

    // Check for level up
    if (window.appData.xp >= xpNeeded) {
        window.appData.level++;
        window.appData.xp = window.appData.xp - xpNeeded;

        confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });
        showToast(`🎉 Level Up! Sekarang Level ${window.appData.level}!`, 'success');

        updateLevel();
        checkAchievements();
    }
}

function addXP(amount) {
    window.appData.xp += amount;
    updateLevel();
    saveData();
}

// ============================================
// PROGRESS SUMMARY (User-Friendly)
// ============================================

function renderProgressSummary() {
    const { conscientiousness, neuroticism } = window.appData.bigFive;
    const container = document.getElementById('progressSummary');

    const cards = [
        {
            id: 'conscientiousness',
            name: '🎯 Disiplin / Fokus',
            value: conscientiousness,
            goodThreshold: 60,
            badThreshold: 40,
            goodMsg: 'Bagus Banget!',
            okMsg: 'Cukup Oke',
            badMsg: 'Perlu Ditingkatkan',
            gradient: 'from-indigo-500 to-purple-500'
        },
        {
            id: 'neuroticism',
            name: '😰 Stress / Kecemasan',
            value: neuroticism,
            goodThreshold: 30, // Lower is better for neuroticism
            badThreshold: 60,
            goodMsg: 'Sangat Tenang!',
            okMsg: 'Normal',
            badMsg: 'Terlalu Tinggi!',
            gradient: 'from-rose-500 to-pink-500',
            inverse: true // Lower is better
        }
    ];

    container.innerHTML = cards.map(card => {
        let status, emoji, bgColor, textColor;

        if (card.inverse) {
            // For neuroticism: lower is better
            if (card.value <= card.goodThreshold) {
                status = card.goodMsg;
                emoji = '✅';
                bgColor = 'bg-emerald-50 dark:bg-emerald-900/20';
                textColor = 'text-emerald-700 dark:text-emerald-300';
            } else if (card.value < card.badThreshold) {
                status = card.okMsg;
                emoji = '⚖️';
                bgColor = 'bg-amber-50 dark:bg-amber-900/20';
                textColor = 'text-amber-700 dark:text-amber-300';
            } else {
                status = card.badMsg;
                emoji = '⚠️';
                bgColor = 'bg-rose-50 dark:bg-rose-900/20';
                textColor = 'text-rose-700 dark:text-rose-300';
            }
        } else {
            // For conscientiousness: higher is better
            if (card.value >= card.goodThreshold) {
                status = card.goodMsg;
                emoji = '✅';
                bgColor = 'bg-emerald-50 dark:bg-emerald-900/20';
                textColor = 'text-emerald-700 dark:text-emerald-300';
            } else if (card.value >= card.badThreshold) {
                status = card.okMsg;
                emoji = '⚖️';
                bgColor = 'bg-amber-50 dark:bg-amber-900/20';
                textColor = 'text-amber-700 dark:text-amber-300';
            } else {
                status = card.badMsg;
                emoji = '⚠️';
                bgColor = 'bg-rose-50 dark:bg-rose-900/20';
                textColor = 'text-rose-700 dark:text-rose-300';
            }
        }

        return `
            <div class="${bgColor} rounded-lg px-3 py-2 border-2 border-${textColor.split('-')[1]}-200 dark:border-${textColor.split('-')[1]}-800 flex items-center gap-3">
                <span class="text-sm">${emoji}</span>
                <span class="text-xs font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">${card.name}</span>
                <span class="text-base font-black ${textColor}">${card.value}%</span>
                <span class="text-[10px] font-bold ${textColor} whitespace-nowrap">${status}</span>
                <div class="flex-1 bg-slate-200 dark:bg-slate-600 rounded-full h-1.5">
                    <div class="bg-gradient-to-r ${card.gradient} h-full rounded-full transition-all duration-300" style="width: ${card.value}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

function saveToHistory() {
    const today = new Date().toDateString();
    const existingIndex = window.appData.history.findIndex(h => h.date === today);

    // Get completed tasks for today (assuming tasks are cleared daily or we can filter by date if needed)
    // For now, let's just take the count of completed tasks in the current session
    const completedTasksRaw = window.appData.tasks.filter(t => t.completed).map(t => t.text);

    const entry = {
        date: today,
        bigFive: { ...window.appData.bigFive },
        journal: window.appData.journal || '',
        completedTasks: completedTasksRaw
    };

    if (existingIndex >= 0) {
        window.appData.history[existingIndex] = entry;
    } else {
        window.appData.history.push(entry);
    }

    // Keep only last 60 entries (2 months) for better reflection
    if (window.appData.history.length > 60) {
        window.appData.history = window.appData.history.slice(-60);
    }

    saveData();
    renderProgressSummary();
    updateTodayPreview();
}

// ============================================
// BIG FIVE PERSONALITY TRAITS
// ============================================

function renderBigFive() {
    const container = document.getElementById('bigFiveMeters');
    container.innerHTML = '';

    traits.forEach(trait => {
        const value = window.appData.bigFive[trait.id];
        const isNeuroticism = trait.id === 'neuroticism';
        const barColor = isNeuroticism && value > 60 ? 'bg-rose-500' : `bg-${trait.color}-500`;

        container.innerHTML += `
            <div>
                <div class="flex items-center justify-between mb-1">
                    <div class="flex items-center gap-2">
                        <span class="text-sm">${trait.icon}</span>
                        <div>
                            <p class="text-xs font-bold text-slate-800 dark:text-slate-200">${trait.name}</p>
                            <p class="text-[10px] text-slate-400">${trait.subtitle}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <button onclick="adjustTrait('${trait.id}', -5)" 
                            class="w-6 h-6 text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-700 dark:text-slate-200 font-bold">−</button>
                        <span class="font-bold text-sm text-slate-700 dark:text-slate-200 w-10 text-center">${value}%</span>
                        <button onclick="adjustTrait('${trait.id}', 5)" 
                            class="w-6 h-6 text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-700 dark:text-slate-200 font-bold">+</button>
                    </div>
                </div>
                <div class="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div class="${barColor} h-full rounded-full transition-all duration-300" style="width: ${value}%"></div>
                </div>
            </div>
        `;
    });
}

function adjustTrait(traitId, delta) {
    let newValue = window.appData.bigFive[traitId] + delta;
    newValue = Math.max(0, Math.min(100, newValue));
    window.appData.bigFive[traitId] = newValue;

    renderBigFive();
    updatePersonalityInsight();
    saveToHistory();
    checkAchievements();
}

// ============================================
// PERSONALITY INSIGHT
// ============================================

function updatePersonalityInsight() {
    const { openness, conscientiousness, extraversion, agreeableness, neuroticism } = window.appData.bigFive;
    const container = document.getElementById('personalityInsight');

    const insights = [];

    // --- INDIVIDUAL TRAIT ANALYSIS (FIRM & DIRECT) ---

    // Kedisiplinan (Conscientiousness) - THE CORE OF CHANGE
    if (conscientiousness < 25) {
        insights.push({ type: 'warning', text: '🚨 <strong>KRITIS:</strong> Hidupmu berantakan karena kamu membiarkan rasa malas menang setiap hari. Jangan bermimpi sukses jika merapikan tempat tidur saja kamu nunda.' });
    } else if (conscientiousness < 45) {
        insights.push({ type: 'warning', text: '⚠️ <strong>DISIPLIN RENDAH:</strong> Kamu hanya bekerja saat "mood" bagus. Mood tidak akan memberimu masa depan, disiplin yang akan melakukannya.' });
    } else if (conscientiousness >= 85) {
        insights.push({ type: 'strength', text: '🛡️ <strong>KONTROL TOTAL:</strong> Kedisiplinanmu adalah perisai terbaikmu. Kamu punya kapasitas untuk menaklukkan target apa pun. Pertahankan standar tinggi ini!' });
    }

    // Gejolak Mental (Neuroticism)
    if (neuroticism > 80) {
        insights.push({ type: 'warning', text: '💣 <strong>MENTAL FRAGILE:</strong> Kamu terlalu membiarkan pikiran negatif menjajah harimu. Berhenti membayangkan kegagalan yang belum tentu terjadi!' });
    } else if (neuroticism < 20) {
        insights.push({ type: 'strength', text: '💎 <strong>STABILITAS BERLIAN:</strong> Hatimu sangat tenang. Gunakan ketenangan ini untuk memimpin, bukan untuk menjadi malas karena merasa terlalu aman.' });
    }

    // --- INTELLIGENT COMBO ANALYSIS (ADVANCED) ---

    // 1. The "Toxic Laziness" Loop (Low Discipline + High Neuroticism)
    if (conscientiousness < 40 && neuroticism > 65) {
        insights.push({ type: 'warning', text: '💀 <strong>LINGKARAN SETAN:</strong> Kamu stres karena malas, dan makin malas karena stres. Berhenti lari dari tanggung jawab! Satu-satunya obat stresmu adalah EKSREKUSI.' });
    }

    // 2. The "Lazy Dreamer" (High Openness + Low Discipline)
    if (openness > 75 && conscientiousness < 40) {
        insights.push({ type: 'warning', text: '🌈 <strong>PEMIMPI HALU:</strong> Idenya tinggi, aksinya NOL. Kamu punya potensi besar yang terbuang sia-sia karena kamu terlalu malas untuk belajar teknis.' });
    }

    // 3. The "Social Victim" (High Extraversion + High Agreeableness + Low Discipline)
    if (extraversion > 70 && agreeableness > 70 && conscientiousness < 50) {
        insights.push({ type: 'warning', text: '👥 <strong>KORBAN SOSIAL:</strong> Kamu terlalu sibuk menyenangkan orang lain dan nongkrong sampai lupa masa depanmu sendiri. Belajarlah bilang TIDAK!' });
    }

    // 4. The "Impulsive Action" (Low Neuroticism + Low Conscientiousness)
    if (neuroticism < 35 && conscientiousness < 40) {
        insights.push({ type: 'warning', text: '🎭 <strong>ZONA NYAMAN BERBISA:</strong> Kamu malas tapi tidak merasa bersalah. Ini kondisi paling berbahaya karena kamu tidak punya alarm untuk berubah. Bangun sebelum terlambat!' });
    }

    // 5. The "Burnout Machine" (High Conscientiousness + High Neuroticism)
    if (conscientiousness > 75 && neuroticism > 70) {
        insights.push({ type: 'neutral', text: '⚡ <strong>HIGH PRESSURE:</strong> Kamu sukses tapi tersiksa. Jangan sampai ambisimu membunuh kesehatan mentalmu. Belajarlah untuk istirahat, bukan berhenti.' });
    }

    // 6. The "Silent Achiever" (Low Extraversion + High Conscientiousness)
    if (extraversion < 30 && conscientiousness > 75) {
        insights.push({ type: 'strength', text: '🗡️ <strong>SILENT ASSASSIN:</strong> Kamu bekerja dalam diam dan hasilnya mematikan. Fokusmu sangat murni karena tidak terganggu hiruk pikuk luar.' });
    }

    // 7. The "Stoic Leader" (High Conscientiousness + Low Neuroticism + Low Agreeableness)
    if (conscientiousness > 80 && neuroticism < 30 && agreeableness < 40) {
        insights.push({ type: 'strength', text: '🦁 <strong>SINGA DISIPLIN:</strong> Tegas, disiplin, dan tidak gampang goyah. Kamu punya mentalitas pemimpin besar yang fokus pada hasil nyata.' });
    }

    // 8. The "Flexible Innovator" (High Openness + High Conscientiousness)
    if (openness > 80 && conscientiousness > 70) {
        insights.push({ type: 'strength', text: '🚀 <strong>INOVATOR TERTATA:</strong> Kamu punya visi masa depan dan disiplin untuk membangunnya. Ini adalah kombinasi langka orang-orang sukses dunia.' });
    }

    // --- FINAL MOTIVATION ---
    if (insights.length > 3) {
        insights.push({ type: 'neutral', text: '📌 <strong>KESIMPULAN:</strong> Terlalu banyak gejolak di monitormu. Fokus perbaiki satu hal: <u>Naikkan Kedisiplinan sekarang juga.</u>' });
    }

    // Render insights
    container.innerHTML = insights.map(insight => {
        const colors = {
            strength: 'text-emerald-700 dark:text-emerald-300 font-medium',
            warning: 'text-rose-700 dark:text-rose-300 font-bold',
            neutral: 'text-indigo-700 dark:text-indigo-300 font-semibold italic'
        };
        return `<p class="${colors[insight.type]} mb-3 leading-relaxed">${insight.text}</p>`;
    }).join('');

    if (insights.length === 0) {
        container.innerHTML = '<p class="text-violet-600 dark:text-violet-400">Sesuaikan monitor untuk mendengarkan diagnosa mentalmu yang jujur. 🧠</p>';
    }
}

// ============================================
// DAILY TASK PENALTY SYSTEM
// ============================================

function checkDailyTaskPenalty() {
    const today = new Date().toDateString();
    const lastCheck = window.appData.lastDailyCheck || today;

    // Only check if it's a new day
    if (lastCheck === today) return;

    // Count incomplete tasks from yesterday
    const incompleteTasks = window.appData.tasks.filter(t => !t.completed);

    if (incompleteTasks.length > 0) {
        let totalPenalty = 0;
        let penaltyDetails = [];

        incompleteTasks.forEach(task => {
            let penalty = 0;
            if (task.priority === 'high') {
                penalty = 50;
                penaltyDetails.push(`🔥 ${task.text}: -${penalty} XP`);
            } else if (task.priority === 'medium') {
                penalty = 30;
                penaltyDetails.push(`📌 ${task.text}: -${penalty} XP`);
            } else {
                penalty = 20;
                penaltyDetails.push(`💡 ${task.text}: -${penalty} XP`);
            }
            totalPenalty += penalty;
        });

        // Apply penalty
        window.appData.xp = Math.max(0, window.appData.xp - totalPenalty);

        // Reduce conscientiousness for not completing tasks
        adjustTrait('conscientiousness', -10);
        adjustTrait('neuroticism', 5);

        // Show penalty notification
        showToast(`⚠️ Misi harian tidak selesai! -${totalPenalty} XP, Conscientiousness -10%, Neuroticism +5%`, 'error');

        // Log to console for debugging
        console.log('Daily Task Penalty Applied');
    }

    // RESET FOR NEW DAY
    // 1. Reset completed status for all "Daily Tasks" (tasks without deadline)
    window.appData.tasks.forEach(task => {
        if (!task.deadline) {
            task.completed = false;
        }
    });

    // 2. Clear Daily Journal for the new day
    window.appData.journal = '';
    const journalElem = document.getElementById('journalText');
    if (journalElem) journalElem.value = '';

    // Update last check date
    window.appData.lastDailyCheck = today;
    updateLevel();
    filterTasks(); // Re-render tasks
    updateTodayPreview();
    saveData();
    showToast('🌅 Selamat pagi! Misi harian & jurnal telah di-reset.', 'info');
}

// ============================================
// DEADLINE CHECKER
// ============================================

function checkDeadlines() {
    const now = new Date();
    let penaltyCount = 0;

    window.appData.tasks.forEach(task => {
        if (!task.completed && task.deadline && !task.penaltyApplied) {
            const deadlineDate = new Date(task.deadline);
            if (now > deadlineDate) {
                task.penaltyApplied = true;
                applyDeadlinePenalty(task);
                penaltyCount++;
            }
        }
    });

    if (penaltyCount > 0) {
        saveData();
        filterTasks();
    }
}

function applyDeadlinePenalty(task) {
    showToast(`⏰ DEADLINE TERLEWAT: ${task.text}!`, 'error');

    // Consequences
    window.appData.xp = Math.max(0, window.appData.xp - 20);
    adjustTrait('conscientiousness', -5);
    adjustTrait('neuroticism', 3);

    updateLevel();
    renderBigFive();
    updatePersonalityInsight();
}

// ============================================
// TASK MANAGEMENT
// ============================================

function addTask() {
    const input = document.getElementById('taskInput');
    const deadlineInput = document.getElementById('taskDeadline');
    const text = input.value.trim();
    const priority = document.getElementById('taskPriority').value;
    const deadline = deadlineInput.value;

    if (text === '') return;

    const task = {
        id: Date.now(),
        text: text,
        priority: priority,
        deadline: deadline || null,
        completed: false,
        penaltyApplied: false
    };

    window.appData.tasks.push(task);
    input.value = '';
    deadlineInput.value = '';
    filterTasks();
    saveData();
    showToast('✅ Misi baru ditambahkan!', 'success');
}

function filterTasks() {
    const dailyTasks = window.appData.tasks.filter(t => !t.deadline);
    const deadlineTasks = window.appData.tasks.filter(t => t.deadline);

    renderTasks(dailyTasks, 'dailyTaskList');
    renderTasks(deadlineTasks, 'deadlineTaskList');
}

function renderTasks(tasksToRender, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (tasksToRender.length === 0) {
        container.innerHTML = '<p class="text-slate-400 dark:text-slate-500 text-xs py-2 italic">Belum ada misi di sini.</p>';
        return;
    }

    const priorityEmoji = { high: '🔥', medium: '📌', low: '💡' };

    container.innerHTML = tasksToRender.map(task => {
        const now = new Date();
        const deadlineDate = task.deadline ? new Date(task.deadline) : null;
        const isOverdue = !task.completed && deadlineDate && now > deadlineDate;

        let timeRemainingMsg = '';
        if (deadlineDate && !task.completed) {
            const diff = deadlineDate - now;
            if (diff > 0) {
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

                if (days > 0) {
                    timeRemainingMsg = `⏳ Sisa ${days} hari ${hours} jam`;
                } else if (hours > 0) {
                    timeRemainingMsg = `⏳ Sisa ${hours} jam ${mins} menit`;
                } else {
                    timeRemainingMsg = `⏳ Sisa ${mins} menit!`;
                }
            } else {
                timeRemainingMsg = '❌ TERLEWAT!';
            }
        }

        return `
            <div class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 priority-${task.priority} ${isOverdue ? 'border-2 border-rose-500/50' : ''}">
                <input type="checkbox" ${task.completed ? 'checked' : ''} 
                    onchange="toggleTask(${task.id})" 
                    class="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500">
                <div class="flex-1 flex flex-col">
                    <span class="${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'} font-medium">
                        ${priorityEmoji[task.priority]} ${task.text}
                    </span>
                    ${task.deadline ? `
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-[10px] font-bold uppercase tracking-tight text-slate-400">
                                ⏰ ${new Date(task.deadline).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span class="text-[10px] font-black uppercase ${isOverdue ? 'text-rose-500 animate-pulse' : 'text-indigo-500'}">
                                ${timeRemainingMsg}
                            </span>
                        </div>
                    ` : ''}
                </div>
                <button onclick="deleteTask(${task.id})" 
                    class="text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 font-bold text-lg">×</button>
            </div>
        `;
    }).join('');
}

function toggleTask(taskId) {
    const task = window.appData.tasks.find(t => t.id === taskId);
    if (!task) return;

    const wasCompleted = task.completed;
    task.completed = !task.completed;

    if (task.completed && !wasCompleted) {
        // Task just completed
        adjustTrait('conscientiousness', 5);
        checkStreak();

        // Award XP based on priority
        const xpGain = task.priority === 'high' ? 30 : task.priority === 'medium' ? 20 : 10;
        addXP(xpGain);

        window.appData.stats.totalCompleted++;

        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        showToast(`🎉 Misi selesai! +${xpGain} XP, Conscientiousness +5%`, 'success');
        checkAchievements();
    }

    filterTasks();
    saveData();
    saveToHistory();
}

function deleteTask(taskId) {
    window.appData.tasks = window.appData.tasks.filter(t => t.id !== taskId);
    filterTasks();
    saveData();
    saveToHistory();
    showToast('🗑️ Misi dihapus', 'info');
}

// ============================================
// WASTE BUTTONS (SPECIFIC)
// ============================================


function wasteGaming() {
    adjustTrait('conscientiousness', -10);
    showToast('🎮 Gaming binge! Conscientiousness -10%', 'error');
}

function wasteOversleep() {
    adjustTrait('conscientiousness', -5);
    const newEnergy = Math.min(100, window.appData.energy + 10);
    window.appData.energy = newEnergy;
    document.getElementById('energySlider').value = newEnergy;
    updateEnergy(newEnergy);
    showToast('🛌 Kebanyakan rebahan! Conscientiousness -5%, Energy +10%', 'error');
}

// ============================================
// REQUEST MANAGEMENT (Permintaan Orang Lain)
// ============================================

function addRequest() {
    const personInput = document.getElementById('requestPersonInput');
    const requestInput = document.getElementById('requestInput');
    const person = personInput.value.trim();
    const text = requestInput.value.trim();

    if (person === '' || text === '') {
        showToast('⚠️ Isi nama orang dan permintaannya!', 'error');
        return;
    }

    const request = {
        id: Date.now(),
        person: person,
        text: text,
        completed: false,
        addedDate: new Date().toLocaleDateString('id-ID')
    };

    if (!window.appData.requests) window.appData.requests = [];
    window.appData.requests.push(request);
    personInput.value = '';
    requestInput.value = '';
    renderRequests();
    saveData();
    showToast('🤝 Permintaan ditambahkan!', 'success');
}

function renderRequests() {
    if (!window.appData.requests) window.appData.requests = [];

    const container = document.getElementById('requestList');

    if (window.appData.requests.length === 0) {
        container.innerHTML = '<p class="text-slate-400 dark:text-slate-500 text-center py-4">Belum ada permintaan dari orang lain.</p>';
        return;
    }

    container.innerHTML = window.appData.requests.map(req => `
        <div class="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/30 border-2 border-orange-200 dark:border-orange-800">
            <input type="checkbox" ${req.completed ? 'checked' : ''} 
                onchange="toggleRequest(${req.id})" 
                class="w-5 h-5 text-orange-600 rounded focus:ring-2 focus:ring-orange-500 mt-1">
            <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                    <span class="font-bold text-orange-700 dark:text-orange-400">👤 ${req.person}</span>
                    <span class="text-xs text-slate-500 dark:text-slate-400">${req.addedDate}</span>
                </div>
                <p class="${req.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'} font-medium">
                    ${req.text}
                </p>
            </div>
            <button onclick="deleteRequest(${req.id})" 
                class="text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 font-bold text-lg">×</button>
        </div>
    `).join('');
}

function toggleRequest(requestId) {
    const request = window.appData.requests.find(r => r.id === requestId);
    if (!request) return;

    request.completed = !request.completed;

    if (request.completed) {
        showToast('✅ Permintaan selesai! Good job!', 'success');
        addXP(15); // Bonus XP for completing requests
    }

    renderRequests();
    saveData();
}

function deleteRequest(requestId) {
    window.appData.requests = window.appData.requests.filter(r => r.id !== requestId);
    renderRequests();
    saveData();
    showToast('🗑️ Permintaan dihapus', 'info');
}

// ============================================
// SKILL MASTERY
// ============================================

function toggleSkillEdit() {
    isSkillEditMode = !isSkillEditMode;
    const btn = document.getElementById('toggleSkillEditBtn');
    const form = document.getElementById('addSkillForm');

    btn.textContent = isSkillEditMode ? 'Selesai' : 'Edit';
    btn.classList.toggle('bg-indigo-600', isSkillEditMode);
    btn.classList.toggle('text-white', isSkillEditMode);
    form.classList.toggle('hidden', !isSkillEditMode);

    updateSkillDisplay();
}

function addSkill() {
    const name = document.getElementById('newSkillName').value.trim();
    const icon = document.getElementById('newSkillIcon').value.trim() || '📚';
    const color = document.getElementById('newSkillColor').value;

    if (!name) {
        showToast('⚠️ Isi nama skill!', 'error');
        return;
    }

    const newSkill = {
        id: Date.now().toString(),
        name: name,
        icon: icon,
        level: 0,
        color: color
    };

    window.appData.skills.push(newSkill);
    saveData();
    updateSkillDisplay();

    // Reset form
    document.getElementById('newSkillName').value = '';
    document.getElementById('newSkillIcon').value = '';

    showToast('📚 Skill baru ditambahkan!', 'success');
}

function deleteSkill(skillId) {
    if (confirm('Hapus skill ini?')) {
        window.appData.skills = window.appData.skills.filter(s => s.id.toString() !== skillId.toString());
        saveData();
        updateSkillDisplay();
        showToast('🗑️ Skill dihapus', 'error');
    }
}

function increaseSkill(skillId) {
    const skill = window.appData.skills.find(s => s.id.toString() === skillId.toString());
    if (!skill) return;

    if (skill.level < 100) {
        skill.level += 5;
        if (skill.level > 100) skill.level = 100;

        updateSkillDisplay();
        saveData();

        showToast(`📚 Progress ${skill.name} +5%!`, 'success');

        if (skill.level === 100) {
            confetti({ particleCount: 200, spread: 120 });
            showToast(`🎉 Skill ${skill.name} Mastered!`, 'success');
        }
    }
}

function updateSkillDisplay() {
    const container = document.getElementById('skillList');
    if (!window.appData.skills) window.appData.skills = [];

    container.innerHTML = window.appData.skills.map(skill => {
        const colorClasses = {
            cyan: 'bg-cyan-500',
            rose: 'bg-rose-500',
            emerald: 'bg-emerald-500',
            amber: 'bg-amber-500',
            indigo: 'bg-indigo-500',
            purple: 'bg-purple-500'
        };
        const barColor = colorClasses[skill.color] || 'bg-indigo-500';
        const lightBgColor = `bg-${skill.color}-100 dark:bg-${skill.color}-900`;
        const textColor = `text-${skill.color}-700 dark:text-${skill.color}-300`;

        return `
            <div>
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <span class="text-2xl">${skill.icon}</span>
                        <p class="font-semibold text-slate-800 dark:text-slate-200">${skill.name}</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-lg text-slate-700 dark:text-slate-200">${skill.level}%</span>
                        ${isSkillEditMode ? `
                            <button onclick="deleteSkill('${skill.id}')" 
                                class="w-8 h-8 bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-400 rounded-lg font-bold">×</button>
                        ` : `
                            <button onclick="increaseSkill('${skill.id}')" 
                                class="w-8 h-8 ${lightBgColor} hover:opacity-80 rounded-lg ${textColor} font-bold">+</button>
                        `}
                    </div>
                </div>
                <div class="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div class="${barColor} h-full rounded-full transition-all duration-300" style="width: ${skill.level}%"></div>
                </div>
            </div>
        `;
    }).join('');
}



// ============================================
// XP SHOP
// ============================================

function showXPShop() {
    const modal = document.getElementById('xpShopModal');
    const itemsContainer = document.getElementById('shopItems');

    document.getElementById('shopXPDisplay').textContent = window.appData.xp;

    itemsContainer.innerHTML = shopRewards.map(reward => {
        const canAfford = window.appData.xp >= reward.price;
        return `
            <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div class="flex items-center gap-3">
                    <span class="text-3xl">${reward.icon}</span>
                    <div>
                        <p class="font-semibold text-slate-800 dark:text-slate-200">${reward.name}</p>
                        <p class="text-sm text-slate-500 dark:text-slate-400">${reward.price} XP</p>
                    </div>
                </div>
                <button onclick="purchaseReward('${reward.id}', ${reward.price})" 
                    class="px-6 py-2 ${canAfford ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-300 dark:bg-slate-600 cursor-not-allowed'} text-white rounded-lg font-semibold"
                    ${!canAfford ? 'disabled' : ''}>
                    ${canAfford ? 'Beli' : 'Not Enough XP'}
                </button>
            </div>
        `;
    }).join('');

    modal.classList.add('active');
}

function closeXPShop() {
    document.getElementById('xpShopModal').classList.remove('active');
}

function purchaseReward(rewardId, price) {
    if (window.appData.xp < price) {
        showToast('❌ XP tidak cukup!', 'error');
        return;
    }

    window.appData.xp -= price;
    if (!window.appData.purchasedRewards) window.appData.purchasedRewards = [];
    window.appData.purchasedRewards.push({ id: rewardId, date: new Date().toISOString() });

    updateLevel();
    saveData();

    const reward = shopRewards.find(r => r.id === rewardId);
    showToast(`🎉 Berhasil membeli: ${reward.name}! Enjoy!`, 'success');
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    closeXPShop();
}

// ============================================
// JOURNAL & HISTORY
// ============================================

function saveJournalAndSyncHistory() {
    window.appData.journal = document.getElementById('journalText').value;
    saveToHistory(); // This will auto-save to cloud and local storage
}

function savePlanning() {
    window.appData.planning = document.getElementById('planningText').value;
    saveData();
}

function updateTodayPreview() {
    const container = document.getElementById('todayProgressSummary');
    if (!container) return;

    const completedTasks = window.appData.tasks.filter(t => t.completed);
    const totalTasks = window.appData.tasks.length;
    const journalLength = window.appData.journal ? window.appData.journal.length : 0;

    let html = `
        <div class="flex flex-wrap gap-4 mt-2">
            <div class="flex items-center gap-2">
                <span class="text-emerald-500">✅</span>
                <span class="font-bold">${completedTasks.length}/${totalTasks} Misi Selesai</span>
            </div>
            <div class="flex items-center gap-2">
                <span class="text-amber-500">✍️</span>
                <span>${journalLength} Karakter Jurnal</span>
            </div>
        </div>
    `;

    if (completedTasks.length > 0) {
        html += `
            <div class="mt-3 flex flex-wrap gap-1">
                ${completedTasks.slice(0, 3).map(t => `<span class="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] rounded-full font-bold"># ${t.text.substring(0, 20)}...</span>`).join('')}
                ${completedTasks.length > 3 ? `<span class="text-[10px] text-slate-400 font-bold">+${completedTasks.length - 3} lainnya</span>` : ''}
            </div>
        `;
    }

    container.innerHTML = html;
}

function showHistoryModal() {
    renderHistory();
    document.getElementById('historyModal').classList.add('active');
}

function closeHistoryModal() {
    document.getElementById('historyModal').classList.remove('active');
}

function renderHistory() {
    const container = document.getElementById('historyEntries');
    if (window.appData.history.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-slate-400">
                <p>Belum ada riwayat tercatat. Mulailah beraktivitas dan mencatat jurnal hari ini!</p>
            </div>
        `;
        return;
    }

    // Sort history by date (newest first)
    const sortedHistory = [...window.appData.history].reverse();

    container.innerHTML = sortedHistory.map(entry => {
        const dateObj = new Date(entry.date);
        const formattedDate = dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

        const tasksHtml = (entry.completedTasks && entry.completedTasks.length > 0)
            ? entry.completedTasks.map(t => `<li class="flex items-start gap-2 mb-1">
                <span class="text-emerald-500 mt-0.5">✔</span>
                <span class="text-slate-700 dark:text-slate-300">${t}</span>
              </li>`).join('')
            : '<p class="text-slate-400 italic">Tidak ada misi selesai.</p>';

        return `
            <div class="bg-white dark:bg-slate-700/50 rounded-2xl border border-slate-200 dark:border-slate-600 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div class="bg-slate-50 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-600 flex justify-between items-center">
                    <h3 class="font-bold text-slate-800 dark:text-slate-100">${formattedDate}</h3>
                    <div class="flex gap-1">
                         <span class="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[10px] font-black rounded uppercase">Log Ditemukan</span>
                    </div>
                </div>
                <div class="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- Big Five Snapshot -->
                    <div class="space-y-3">
                        <p class="text-xs font-black text-slate-400 uppercase tracking-widest">Mental Snapshot</p>
                        <div class="grid grid-cols-1 gap-2">
                             ${Object.entries(entry.bigFive).map(([id, val]) => {
            const trait = traits.find(t => t.id === id);
            if (!trait) return '';
            return `
                                    <div>
                                        <div class="flex justify-between text-[10px] font-bold mb-1">
                                            <span class="text-slate-500">${trait.name}</span>
                                            <span class="text-slate-800 dark:text-slate-200">${val}%</span>
                                        </div>
                                        <div class="w-full bg-slate-100 dark:bg-slate-600 rounded-full h-1">
                                            <div class="bg-${trait.color}-500 h-full rounded-full" style="width: ${val}%"></div>
                                        </div>
                                    </div>
                                 `;
        }).join('')}
                        </div>
                    </div>

                    <!-- Tasks Completed -->
                    <div class="space-y-3">
                        <p class="text-xs font-black text-emerald-500 uppercase tracking-widest">Misi Selesai (${entry.completedTasks ? entry.completedTasks.length : 0})</p>
                        <ul class="text-sm">
                            ${tasksHtml}
                        </ul>
                    </div>

                    <!-- Journal -->
                    <div class="space-y-3">
                        <p class="text-xs font-black text-amber-500 uppercase tracking-widest">Jurnal / Catatan</p>
                        <div class="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800 min-h-[100px]">
                            <p class="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">${entry.journal || '<span class="text-slate-400 italic">No entry.</span>'}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}



function checkAchievements() {
    achievements.forEach(ach => {
        if (!window.appData.unlockedAchievements.includes(ach.id) && ach.condition()) {
            window.appData.unlockedAchievements.push(ach.id);
            showToast(`🏆 Achievement unlocked: ${ach.name}!`, 'success');
            confetti({ particleCount: 200, spread: 120 });
            saveData();
        }
    });
}

function showAchievements() {
    const modal = document.getElementById('achievementsModal');
    const list = document.getElementById('achievementsList');

    list.innerHTML = achievements.map(ach => {
        const unlocked = window.appData.unlockedAchievements.includes(ach.id);
        return `
            <div class="badge ${unlocked ? 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 locked'}">
                <div class="text-3xl mb-2">${ach.icon}</div>
                <div class="font-bold">${ach.name}</div>
                <div class="text-xs mt-1">${ach.desc}</div>
            </div>
        `;
    }).join('');

    modal.classList.add('active');
}

function closeAchievements() {
    document.getElementById('achievementsModal').classList.remove('active');
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

function initKeyboardShortcuts() {
    const tabs = ['utama', 'catatan', 'lainnya'];

    function getCurrentTab() {
        for (const tab of tabs) {
            const panel = document.getElementById(`panel-${tab}`);
            if (panel && panel.classList.contains('active')) return tab;
        }
        return tabs[0];
    }

    document.addEventListener('keydown', (e) => {
        // Don't trigger arrow nav when typing in inputs
        const tag = document.activeElement.tagName.toLowerCase();
        const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select';

        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            switchTab('utama');
            setTimeout(() => document.getElementById('taskInput').focus(), 100);
        } else if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            toggleDarkMode();
        } else if (e.ctrlKey && e.key === '1') {
            e.preventDefault();
            switchTab('utama');
        } else if (e.ctrlKey && e.key === '2') {
            e.preventDefault();
            switchTab('catatan');
        } else if (e.ctrlKey && e.key === '3') {
            e.preventDefault();
            switchTab('lainnya');
        } else if (e.key === 'ArrowLeft' && !isTyping) {
            e.preventDefault();
            const idx = tabs.indexOf(getCurrentTab());
            switchTab(tabs[(idx - 1 + tabs.length) % tabs.length]);
        } else if (e.key === 'ArrowRight' && !isTyping) {
            e.preventDefault();
            const idx = tabs.indexOf(getCurrentTab());
            switchTab(tabs[(idx + 1) % tabs.length]);
        } else if (e.key === '?') {
            showKeyboardHelp();
        }
    });
}

function showKeyboardHelp() {
    document.getElementById('keyboardModal').classList.add('active');
}

function closeKeyboardHelp() {
    document.getElementById('keyboardModal').classList.remove('active');
}

// ============================================
// START APPLICATION
// ============================================

// ============================================
// BIG FIVE INFO MODAL
// ============================================

function showBigFiveInfo() {
    document.getElementById('bigFiveModal').classList.add('active');
}

function closeBigFiveInfo() {
    document.getElementById('bigFiveModal').classList.remove('active');
}

// ============================================
// CHARACTER FAULTS (BLIND SPOTS) MODAL
// ============================================

function showFaultsModal() {
    const { openness, conscientiousness, extraversion, agreeableness, neuroticism } = window.appData.bigFive;
    const content = document.getElementById('faultsDetailContent');
    const modal = document.getElementById('faultsModal');

    let faultHtml = '';

    // Analysis logic - FIRM & COMPREHENSIVE
    const faults = [];

    // --- CONSCIENTIOUSNESS (DISIPLIN) ---
    if (conscientiousness < 40) {
        faults.push({
            title: '❌ Penunda Kronis (Kelemahmu)',
            desc: 'Kamu punya kebiasaan buruk menunda tugas sampai detik terakhir. Kamu sering merasa "nanti saja", tapi kenyataannya "nanti" tidak pernah datang. Kamu sedang membunuh masa depanmu pelan-pelan dengan rasa malas ini.',
            advice: 'Berhenti membuat rencana besar. Selesaikan SATU tugas kecil sekarang juga tanpa protes!'
        });
    }

    // --- NEUROTICISM (CEMAS) ---
    if (neuroticism > 60) {
        faults.push({
            title: '🤯 Budak Kecemasan',
            desc: 'Pikiran negatifmu adalah penjara bagimu. Kamu terlalu takut gagal sampai-sampai kamu tidak berani mulai. Stres yang kamu rasakan adalah hasil dari imajinasi burukmu sendiri.',
            advice: 'Dunia tidak sekejam yang kamu pikirkan. Fokus pada tindakan nyata, bukan pada skenario buruk di kepalamu.'
        });
    }

    // --- OPENNESS (KETERBUKAAN) ---
    if (openness > 75 && conscientiousness < 50) {
        faults.push({
            title: '🌈 Si Pemimpi Halu',
            desc: 'Kamu punya ribuan ide hebat tapi nol eksekusi. Kamu senang merencanakan sesuatu yang besar karena itu terasa menyenangkan, tapi kamu benci kerja keras yang membosankan di balik itu.',
            advice: 'Ide tanpa eksekusi hanyalah sampah. Pilih satu ide, dan kerjakan detail teknisnya yang membosankan sampai selesai.'
        });
    }

    // --- AGREEABLENESS (KERAMAHAN) ---
    if (agreeableness > 70 && conscientiousness < 60) {
        faults.push({
            title: '💚 Si Gak Enakan (People Pleaser)',
            desc: 'Kamu sering mengorbankan waktu produktifmu hanya karena tidak enak untuk menolak ajakan atau permintaan orang lain. Kamu ramah kepada orang lain, tapi kejam kepada dirimu sendiri.',
            advice: 'Belajarlah berkata TIDAK. Orang yang benar-benar peduli padamu akan menghargai jadwal dan kerja kerasmu.'
        });
    }

    // --- EXTRAVERSION (SOSIAL) ---
    if (extraversion > 70 && conscientiousness < 50) {
        faults.push({
            title: '🌟 Haus Validasi & Atensi',
            desc: 'Kamu terlalu mudah terdistraksi oleh interaksi sosial dan media sosial. Kamu lebih peduli pada citra dirimu di depan orang lain daripada pencapaian nyatamu saat sendirian.',
            advice: 'Cari kepuasan dari hasil kerja kerasmu, bukan dari jumlah like atau komentar orang lain di media sosial.'
        });
    }

    // --- SPECIAL COMBOS ---
    if (neuroticism < 35 && conscientiousness < 35) {
        faults.push({
            title: '🎭 Zombie Hidup',
            desc: 'Kamu tidak punya disiplin, tapi kamu juga tidak merasa cemas. Kamu benar-benar santai di tengah kegagalanmu sendiri. Ini adalah kondisi mental paling berbahaya bagi pertumbuhan diri.',
            advice: 'Ciptakan "urgensi buatan". Ingatlah bahwa waktu terus berjalan dan kamu sedang tertinggal jauh di belakang!'
        });
    }

    if (faults.length === 0) {
        faultHtml = `
            <div class="text-center p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200">
                <p class="text-emerald-700 dark:text-emerald-300 font-bold text-lg">Luar Biasa!</p>
                <p class="text-slate-600 dark:text-slate-400">Kamu belum menunjukkan "Blind Spots" yang kritis berdasarkan data saat ini. Pertahankan kontrol dirimu!</p>
            </div>
        `;
    } else {
        faultHtml = faults.map(f => `
            <div class="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl border-l-4 border-rose-500">
                <h3 class="font-bold text-rose-700 dark:text-rose-400 text-lg mb-1">${f.title}</h3>
                <p class="text-sm text-slate-700 dark:text-slate-300 mb-2">${f.desc}</p>
                <div class="text-xs bg-white dark:bg-slate-800 p-2 rounded border border-rose-100 dark:border-rose-900 italic text-rose-600 dark:text-rose-400">
                    <strong>Solusi:</strong> ${f.advice}
                </div>
            </div>
        `).join('');
    }

    content.innerHTML = faultHtml;
    modal.classList.add('active');
}

function closeFaultsModal() {
    document.getElementById('faultsModal').classList.remove('active');
}

// ============================================
// DOOMSCROLL WATCHER
// ============================================

let doomscrollSeconds = 0;
let scrollInterval = null;
let lastScrollTimestamp = 0;
const DOOMSCROLL_LIMIT = 300; // 5 minutes in seconds

function initDoomscrollWatcher() {
    window.addEventListener('scroll', () => {
        const now = Date.now();
        lastScrollTimestamp = now;

        // Show card if hidden
        const card = document.getElementById('doomscrollCard');
        if (card.classList.contains('hidden')) {
            card.classList.remove('hidden');
        }

        if (!scrollInterval) {
            scrollInterval = setInterval(() => {
                const currentTime = Date.now();
                // If user has scrolled in the last 3 seconds
                if (currentTime - lastScrollTimestamp < 3000) {
                    doomscrollSeconds++;
                    updateDoomscrollUI();

                    if (doomscrollSeconds >= DOOMSCROLL_LIMIT) {
                        applyDoomscrollPenalty();
                        doomscrollSeconds = 0;
                    }
                } else {
                    // Stop timer if idle for 3 seconds
                    clearInterval(scrollInterval);
                    scrollInterval = null;
                }
            }, 1000);
        }
    });
}

function updateDoomscrollUI() {
    const timerElem = document.getElementById('doomscrollTimer');
    const barElem = document.getElementById('doomscrollBar');
    const cardElem = document.getElementById('doomscrollCard');
    const bgElem = document.getElementById('doomscrollWarningBg');

    const mins = Math.floor(doomscrollSeconds / 60);
    const secs = doomscrollSeconds % 60;
    timerElem.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    const progress = (doomscrollSeconds / DOOMSCROLL_LIMIT) * 100;
    barElem.style.width = progress + '%';

    // Visual feedback as time increases
    if (progress > 80) {
        cardElem.style.borderColor = '#ef4444'; // Red
        bgElem.style.opacity = '1';
        timerElem.classList.replace('text-indigo-600', 'text-rose-600');
    } else if (progress > 50) {
        cardElem.style.borderColor = '#f59e0b'; // Amber
        bgElem.style.opacity = '0.5';
    } else {
        cardElem.style.borderColor = 'transparent';
        bgElem.style.opacity = '0';
        timerElem.classList.add('text-indigo-600');
        timerElem.classList.remove('text-rose-600');
    }
}

function applyDoomscrollPenalty() {
    showToast('🚨 KONSEKUENSI: Laporan Scrolling Buruk Diterima!', 'error');

    // Consequences - Slightly heavier for intentional time wasting
    window.appData.xp = Math.max(0, window.appData.xp - 25);
    window.appData.energy = Math.max(0, window.appData.energy - 15);

    // Adjust Traits
    adjustTrait('conscientiousness', -7);
    adjustTrait('neuroticism', +7);

    saveData();
    updateLevel();
    renderBigFive();
    updatePersonalityInsight();

    // Show a firm modal
    const content = `
        <div class="text-center">
            <h2 class="text-3xl font-black text-rose-600 mb-4 italic uppercase">Hukuman Scrolling Buruk</h2>
            <p class="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                Kamu baru saja jujur melakukan <strong>Scrolling Medsos Berlebihan</strong> selama 5 menit lebih. 
                Tindakan ini adalah malapetaka bagi fokusmu. Sifat <strong>Kedisiplinan (Conscientiousness)</strong> menurun tajam dan level <strong>Stress</strong> meningkat karena rasa bersalah.
            </p>
            <div class="flex flex-col gap-2 mb-6 text-sm">
                <div class="flex justify-between items-center bg-rose-50 dark:bg-rose-900/30 p-2 rounded">
                    <span>Penalti XP</span>
                    <span class="font-bold text-rose-600">-25 XP</span>
                </div>
                <div class="flex justify-between items-center bg-rose-50 dark:bg-rose-900/30 p-2 rounded">
                    <span>Energi Terkuras</span>
                    <span class="font-bold text-rose-600">-15%</span>
                </div>
                <div class="flex justify-between items-center bg-rose-50 dark:bg-rose-900/30 p-2 rounded border-l-4 border-rose-500">
                    <span>Status Mental</span>
                    <span class="font-bold text-rose-600">Disiplin -7, Stress +7</span>
                </div>
            </div>
            <p class="text-sm font-bold text-slate-500 uppercase tracking-widest italic animate-pulse">Berhenti sekarang, atau hancurkan masa depanmu sendiri.</p>
        </div>
    `;

    document.getElementById('faultsDetailContent').innerHTML = content;
    document.getElementById('faultsModal').classList.add('active');
}

// ============================================
// MISSION TEMPLATES
// ============================================

function showTemplateModal() {
    const modal = document.getElementById('templateModal');
    modal.classList.add('active');
    renderTemplateList();
}

function closeTemplateModal() {
    document.getElementById('templateModal').classList.remove('active');
}

function saveCurrentAsTemplate() {
    const nameInput = document.getElementById('templateNameInput');
    const name = nameInput.value.trim();

    if (!name) {
        showToast('⚠️ Masukkan nama template!', 'error');
        return;
    }

    if (window.appData.tasks.length === 0) {
        showToast('⚠️ Kamu tidak punya misi untuk disimpan!', 'error');
        return;
    }

    const template = {
        id: Date.now(),
        name: name,
        tasks: window.appData.tasks.map(t => ({
            text: t.text,
            priority: t.priority,
            deadline: t.deadline
        }))
    };

    window.appData.templates.push(template);
    nameInput.value = '';
    saveData();
    renderTemplateList();
    showToast(`📁 Template "${name}" berhasil disimpan!`, 'success');
}

function renderTemplateList() {
    const list = document.getElementById('templateList');
    if (window.appData.templates.length === 0) {
        list.innerHTML = `
            <div class="text-center py-8 text-slate-400 dark:text-slate-500">
                <p>Belum ada template. Buat satu untuk mempermudah jadwalmu!</p>
            </div>
        `;
        return;
    }

    list.innerHTML = window.appData.templates.map(tpl => `
        <div class="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-all group">
            <div class="flex items-center justify-between mb-2">
                <h3 class="font-bold text-slate-800 dark:text-slate-100">${tpl.name}</h3>
                <div class="flex gap-2">
                    <button onclick="loadTemplate(${tpl.id})" 
                        class="px-3 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-200">Load</button>
                    <button onclick="deleteTemplate(${tpl.id})" 
                        class="px-3 py-1 bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-bold hover:bg-rose-200">Hapus</button>
                </div>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400">${tpl.tasks.length} Misi tersimpan</p>
        </div>
    `).join('');
}

function loadTemplate(templateId) {
    const template = window.appData.templates.find(t => t.id === templateId);
    if (!template) return;

    // Simpan teks misi yang sudah dicentang saat ini
    const completedTexts = window.appData.tasks
        .filter(t => t.completed)
        .map(t => t.text.toLowerCase().trim());

    // Bersihkan daftar lama
    window.appData.tasks = [];

    // Muat dari template
    template.tasks.forEach(task => {
        // Cek apakah misi ini sebelumnya sudah diselesaikan
        const isAlreadyDone = completedTexts.includes(task.text.toLowerCase().trim());

        window.appData.tasks.push({
            id: Date.now() + Math.random(),
            text: task.text,
            priority: task.priority,
            deadline: task.deadline,
            completed: isAlreadyDone,
            penaltyApplied: false
        });
    });

    saveData();
    filterTasks();
    closeTemplateModal();
    showToast(`🚀 Template "${template.name}" berhasil dimuat!`, 'success');
}

function deleteTemplate(templateId) {
    if (!confirm('Hapus template ini?')) return;
    window.appData.templates = window.appData.templates.filter(t => t.id !== templateId);
    saveData();
    renderTemplateList();
    showToast('🗑️ Template dihapus', 'info');
}

// ============================================
// initApp is called from db.js after auth check
