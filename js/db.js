// ============================================
// SUPABASE CONFIGURATION & DATABASE LOGIC
// ============================================

// GANTI DENGAN KREDENSIAL SUPABASE KAMU
const SUPABASE_URL = 'https://zjiwmihocpajstgzdlec.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqaXdtaWhvY3BhanN0Z3pkbGVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3ODc1ODMsImV4cCI6MjA4NjM2MzU4M30.yKxQdQO2U61taFVm2J6YhPnRwLTbfDmtGXA6Vxo2A3AY';

let supabaseClient = null;

if (SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
    // initialize the supabase client
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

/**
 * Mendapatkan data dari Supabase berdasarkan userName
 */
async function loadFromCloud() {
    if (!supabaseClient) return null;

    try {
        const { data, error } = await supabaseClient
            .from('mindguard_data')
            .select('payload')
            .eq('user_id', window.appData.userName)
            .single();

        if (error) {
            console.error('Supabase Load Error:', error);
            return null;
        }

        return data.payload;
    } catch (err) {
        console.error('Supabase Fetch Error:', err);
        return null;
    }
}

/**
 * Menyimpan data ke Supabase
 */
async function saveToCloud() {
    if (!supabaseClient) return;

    try {
        const { error } = await supabaseClient
            .from('mindguard_data')
            .upsert({
                user_id: window.appData.userName,
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
