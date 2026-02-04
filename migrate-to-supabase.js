/**
 * Script untuk Migrasi Data dari localStorage ke Supabase
 * 
 * INSTRUKSI:
 * 1. Pastikan Supabase sudah dikonfigurasi di .env.local
 * 2. Pastikan sudah login ke Supabase (via browser)
 * 3. Buka aplikasi di browser
 * 4. Buka Developer Console (F12)
 * 5. Copy-paste script ini
 * 6. Jalankan: migrateToSupabase()
 * 
 * CATATAN:
 * - Script ini akan migrate data siswa, guru, kelas, dll
 * - Pastikan Supabase schema sudah di-setup
 * - Script ini hanya untuk development/testing
 */

async function migrateToSupabase() {
    console.log('🔄 Starting Data Migration to Supabase...');
    
    // Check if Supabase is configured
    const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Supabase not configured!');
        console.log('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
        return;
    }
    
    console.log('✅ Supabase configured');
    
    // Import Supabase client (if available)
    try {
        // Get data from localStorage
        const students = JSON.parse(localStorage.getItem('students_data_v10') || '[]');
        const teachers = JSON.parse(localStorage.getItem('teachers_data_v10') || '[]');
        const classes = JSON.parse(localStorage.getItem('classes_data_v10') || '[]');
        const schedules = JSON.parse(localStorage.getItem('schedules_data_v2') || '[]');
        
        console.log(`📊 Found data:`);
        console.log(`   - Students: ${students.length}`);
        console.log(`   - Teachers: ${teachers.length}`);
        console.log(`   - Classes: ${classes.length}`);
        console.log(`   - Schedules: ${schedules.length}`);
        
        // Save to Supabase app_settings
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Migrate Students
        if (students.length > 0) {
            const { error: studentsError } = await supabase
                .from('app_settings')
                .upsert({
                    key: 'students_data_v10_sync',
                    value: students,
                    updated_at: new Date().toISOString()
                });
            
            if (studentsError) {
                console.error('❌ Error migrating students:', studentsError);
            } else {
                console.log('✅ Students migrated to Supabase');
            }
        }
        
        // Migrate Teachers
        if (teachers.length > 0) {
            const { error: teachersError } = await supabase
                .from('app_settings')
                .upsert({
                    key: 'teachers_data_v10_sync',
                    value: teachers,
                    updated_at: new Date().toISOString()
                });
            
            if (teachersError) {
                console.error('❌ Error migrating teachers:', teachersError);
            } else {
                console.log('✅ Teachers migrated to Supabase');
            }
        }
        
        // Migrate Classes
        if (classes.length > 0) {
            const { error: classesError } = await supabase
                .from('app_settings')
                .upsert({
                    key: 'classes_data_sync',
                    value: classes,
                    updated_at: new Date().toISOString()
                });
            
            if (classesError) {
                console.error('❌ Error migrating classes:', classesError);
            } else {
                console.log('✅ Classes migrated to Supabase');
            }
        }
        
        // Migrate Schedules
        if (schedules.length > 0) {
            const { error: schedulesError } = await supabase
                .from('app_settings')
                .upsert({
                    key: 'master_schedules_v2',
                    value: schedules,
                    updated_at: new Date().toISOString()
                });
            
            if (schedulesError) {
                console.error('❌ Error migrating schedules:', schedulesError);
            } else {
                console.log('✅ Schedules migrated to Supabase');
            }
        }
        
        console.log('\n✅ Migration completed!');
        console.log('📝 Data sekarang tersimpan di Supabase');
        console.log('🔄 Aplikasi akan otomatis sync dari Supabase saat login');
        
    } catch (error) {
        console.error('❌ Migration error:', error);
        console.log('\n💡 Alternative: Export data manually via Admin Dashboard');
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.migrateToSupabase = migrateToSupabase;
    console.log('✅ Migration function ready!');
    console.log('📝 Run: migrateToSupabase() to start migration');
}
