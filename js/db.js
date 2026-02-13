// ============================================
// SUPABASE CONFIGURATION & AUTH & DATABASE
// ============================================

// GANTI DENGAN KREDENSIAL SUPABASE KAMU
const SUPABASE_URL = 'https://zjiwmihocpajstgzdlec.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqaXdtaWhvY3BhanN0Z3pkbGVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3ODc1ODMsImV4cCI6MjA4NjM2MzU4M30.yKxQdQO2U61taFVm2J6YhPnRwLTbfDmtGXA6Vxo2A3A';

let supabaseClient = null;
let currentUser = null;

if (SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// ============================================
// AUTH UI HELPERS
// ============================================

let authMode = 'login';

function switchAuthTab(mode) {
    authMode = mode;
    const loginBtn = document.getElementById('loginTabBtn');
    const registerBtn = document.getElementById('registerTabBtn');
    const nameField = document.getElementById('nameField');
    const submitBtn = document.getElementById('authSubmitBtn');
    const errorDiv = document.getElementById('authError');

    errorDiv.classList.add('hidden');

    if (mode === 'login') {
        loginBtn.className = 'flex-1 py-2 text-xs font-bold rounded-lg text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 transition-all';
        registerBtn.className = 'flex-1 py-2 text-xs font-bold rounded-lg text-slate-400 transition-all';
        nameField.classList.add('hidden');
        submitBtn.textContent = 'Masuk';
    } else {
        registerBtn.className = 'flex-1 py-2 text-xs font-bold rounded-lg text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 transition-all';
        loginBtn.className = 'flex-1 py-2 text-xs font-bold rounded-lg text-slate-400 transition-all';
        nameField.classList.remove('hidden');
        submitBtn.textContent = 'Daftar';
    }
}

function showAuthError(msg) {
    const errorDiv = document.getElementById('authError');
    errorDiv.textContent = msg;
    errorDiv.classList.remove('hidden');
}

// ============================================
// AUTH ACTIONS
// ============================================

async function handleAuth() {
    if (!supabaseClient) {
        showAuthError('Supabase belum dikonfigurasi.');
        return;
    }

    const username = document.getElementById('authUsername').value.trim();
    const password = document.getElementById('authPassword').value;
    const submitBtn = document.getElementById('authSubmitBtn');

    if (!username || !password) {
        showAuthError('Username dan password harus diisi.');
        return;
    }
    if (password.length < 6) {
        showAuthError('Password minimal 6 karakter.');
        return;
    }

    // Convert username to fake email for Supabase Auth
    const email = username.toLowerCase().replace(/\s+/g, '') + '@mindguard.app';

    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Loading...';

    try {
        if (authMode === 'register') {
            const name = document.getElementById('authName').value.trim() || username;
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: { data: { display_name: name } }
            });
            if (error) throw error;

            if (data.user && data.user.identities && data.user.identities.length === 0) {
                showAuthError('Username sudah terdaftar. Silakan masuk.');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Daftar';
                return;
            }

            currentUser = data.user;
            enterApp();
        } else {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
            currentUser = data.user;
            enterApp();
        }
    } catch (err) {
        const msg = err.message || 'Terjadi kesalahan.';
        if (msg.includes('Invalid login')) {
            showAuthError('Username atau password salah.');
        } else if (msg.includes('already registered')) {
            showAuthError('Username sudah terdaftar.');
        } else if (msg.includes('Email not confirmed')) {
            showAuthError('Akun belum dikonfirmasi. Hubungi admin.');
        } else {
            showAuthError(msg);
        }
        submitBtn.disabled = false;
        submitBtn.textContent = authMode === 'login' ? 'Masuk' : 'Daftar';
    }
}

function enterApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    initApp();
}

async function checkExistingSession() {
    if (!supabaseClient) {
        enterApp();
        return;
    }

    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session && session.user) {
            currentUser = session.user;
            enterApp();
            return;
        }
        // No session = show login screen (default)
    } catch (err) {
        console.error('Session check error:', err);
    }
}

async function logout() {
    if (supabaseClient) {
        await supabaseClient.auth.signOut();
    }
    currentUser = null;
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('authUsername').value = '';
    document.getElementById('authPassword').value = '';
    document.getElementById('authError').classList.add('hidden');
}

function getAuthUserId() {
    if (currentUser) return currentUser.id;
    return (window.appData && window.appData.userName) || 'Herzi';
}

function getAuthDisplayName() {
    if (currentUser && currentUser.user_metadata && currentUser.user_metadata.display_name) {
        return currentUser.user_metadata.display_name;
    }
    return 'User';
}

// ============================================
// DATABASE FUNCTIONS (Cloud Sync)
// ============================================

async function loadFromCloud(userName) {
    if (!supabaseClient) return null;

    const userId = getAuthUserId();

    try {
        // 1. Try loading with auth user ID
        const { data, error } = await supabaseClient
            .from('mindguard_data')
            .select('payload')
            .eq('user_id', userId)
            .single();

        if (!error && data) {
            return data.payload;
        }

        // 2. If not found and we have auth, try migrating from old userName
        if (currentUser) {
            const oldNames = ['Herzi', userName].filter(Boolean);
            for (const oldName of oldNames) {
                if (oldName === userId) continue; // skip if same
                const { data: oldData, error: oldError } = await supabaseClient
                    .from('mindguard_data')
                    .select('payload')
                    .eq('user_id', oldName)
                    .single();

                if (!oldError && oldData) {
                    console.log(`🔄 Migrating data from "${oldName}" to auth ID "${userId}"`);
                    // Save under new auth ID
                    await supabaseClient
                        .from('mindguard_data')
                        .upsert({
                            user_id: userId,
                            payload: oldData.payload,
                            updated_at: new Date()
                        }, { onConflict: 'user_id' });

                    console.log('✅ Data migration complete!');
                    return oldData.payload;
                }
            }
        }

        return null;
    } catch (err) {
        console.error('Supabase Fetch Error:', err);
        return null;
    }
}

async function saveToCloud() {
    if (!supabaseClient) return;

    const userId = getAuthUserId();

    try {
        const { error } = await supabaseClient
            .from('mindguard_data')
            .upsert({
                user_id: userId,
                payload: window.appData,
                updated_at: new Date()
            }, { onConflict: 'user_id' });

        if (error) {
            console.error('Supabase Save Error:', error);
        } else {
            console.log('✅ Data synced to cloud');
        }
    } catch (err) {
        console.error('Supabase Sync Error:', err);
    }
}

// ============================================
// AUTO-CHECK SESSION ON PAGE LOAD
// ============================================
window.addEventListener('DOMContentLoaded', checkExistingSession);
