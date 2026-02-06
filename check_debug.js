const { createClient } = require('@supabase/supabase-js');

// Hardcoded from lib/supabase.ts
const SUPABASE_URL = 'https://bwsjkoyjwygrfdnxwcwi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3c2prb3lqd3lncmZkbnh3Y3dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzODE0MDksImV4cCI6MjA4Mzk1NzQwOX0.MUzoF7J7o8B_W4DLR_pnCsSy_W6KHkIl8h64uEhlO-o';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkData() {
    console.log("Checking last 5 Kas Masuk records...");
    console.log("Today's date (local):", new Date().toLocaleDateString());
    console.log("Today's date (ISO split):", new Date().toISOString().split('T')[0]);

    const { data: kasMasuk, error } = await supabase
        .from('kas_masuk')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error fetching data:", error);
    } else {
        console.log(JSON.stringify(kasMasuk, null, 2));
    }
}

checkData();
