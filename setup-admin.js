/**
 * Setup Admin Account Script
 * Jalankan script ini di browser console untuk membuat admin account
 * 
 * Usage:
 * 1. Buka aplikasi di browser
 * 2. Tekan F12 untuk buka Developer Console
 * 3. Copy-paste script ini
 * 4. Tekan Enter
 * 5. Refresh halaman dan login
 */

(function setupAdmin() {
    console.log('🔧 Starting Admin Setup...');
    
    // Get existing teachers from localStorage
    const existingTeachers = JSON.parse(localStorage.getItem('teachers_data_v10') || '[]');
    
    // Check if admin already exists
    const adminExists = existingTeachers.find((t) => t.username === 'admin' || t.nip === 'ADMIN001');
    
    if (adminExists) {
        console.log('⚠️ Admin account already exists!');
        console.log('Current admin:', adminExists);
        console.log('\n📝 To update password, you can:');
        console.log('1. Edit in Admin Dashboard > Data Guru & Staff');
        console.log('2. Or update in localStorage:');
        console.log('   localStorage.setItem("teachers_data_v10", JSON.stringify([...teachers]))');
        return;
    }
    
    // Create admin account
    const adminAccount = {
        id: 'admin-' + Date.now(),
        nama: 'Administrator',
        nip: 'ADMIN001',
        jabatan: 'Admin',
        role: 'Admin',
        username: 'admin',
        password: 'admin123', // Default password - GANTI SETELAH LOGIN PERTAMA!
        mapel: '-',
        wali: '-',
        kelas: '-',
        avatar: null
    };
    
    // Add admin to the beginning of teachers list
    const updatedTeachers = [adminAccount, ...existingTeachers];
    
    // Save to localStorage
    localStorage.setItem('teachers_data_v10', JSON.stringify(updatedTeachers));
    
    console.log('✅ Admin account created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('\n⚠️ IMPORTANT: Change password after first login!');
    console.log('\n🔄 Please refresh the page and login.');
    
    // Show alert
    alert('✅ Admin Account Created!\n\nUsername: admin\nPassword: admin123\n\n⚠️ Please change password after first login!\n\nRefresh page to continue.');
})();
