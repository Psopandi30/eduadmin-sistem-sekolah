# PANDUAN LOGIN - SISTEM EDUADMIN

## 📋 CARA MENGUJI SETIAP DASHBOARD

Untuk menguji setiap dashboard, Anda perlu membuat akun dengan role yang sesuai di menu **Data Guru & Staff** (Super Admin).

---

## 🔐 LOGIN CREDENTIALS

### 1. **SUPER ADMIN**
- **Username**: `admin`
- **Password**: `admin123` atau `admin`
- **Dashboard**: Dashboard Super Admin (menu lengkap)

---

### 2. **KEPALA SEKOLAH** ✅ (SUDAH BENAR)
**Cara Setup:**
1. Login sebagai Super Admin
2. Buka menu **Data Guru & Staff**
3. Tambah guru baru dengan:
   - **Nama**: Nama Kepala Sekolah
   - **NIP**: 19650101
   - **Jabatan**: `Kepala Sekolah` (HARUS PERSIS)
   - **Username**: kepsek
   - **Password**: 19650101 (atau custom)

**Login:**
- **Username**: `kepsek` atau `19650101`
- **Password**: `19650101` (atau password yang Anda set)

**Hak Akses:**
- ✅ Monitor Sekolah (Dashboard)
- ✅ Laporan & Arsip (dengan grafik hasil belajar)
- ✅ Al Quran
- ✅ Channel Sekolah
- ✅ Foto profil & pengaturan di pojok kanan atas

---

### 3. **WAKIL KURIKULUM** ✅ (SUDAH DIPERBAIKI)
**Cara Setup:**
1. Login sebagai Super Admin
2. Buka menu **Data Guru & Staff**
3. Tambah guru baru dengan:
   - **Nama**: Nama Wakil Kurikulum
   - **NIP**: 19700202
   - **Jabatan**: `Wakil Kurikulum` (HARUS PERSIS)
   - **Username**: wakakur
   - **Password**: 19700202 (atau custom)

**Login:**
- **Username**: `wakakur` atau `19700202`
- **Password**: `19700202` (atau password yang Anda set)

**Hak Akses:**
- ✅ Dashboard
- ✅ Kelas dan Wali Kelas
- ✅ Mata Pelajaran
- ✅ Jadwal
- ✅ Absen
- ✅ Jadwal Ujian
- ✅ Manajemen Nilai
- ✅ Rapot
- ✅ Naik Kelas
- ✅ Foto profil & pengaturan di pojok kanan atas

---

### 4. **STAFF TATA USAHA** ✅ (SUDAH DIPERBAIKI)
**Cara Setup:**
1. Login sebagai Super Admin
2. Buka menu **Data Guru & Staff**
3. Tambah guru baru dengan:
   - **Nama**: Nama Staff TU
   - **NIP**: 19800303
   - **Jabatan**: `Staff Tata Usaha` (HARUS PERSIS)
   - **Username**: stafftu
   - **Password**: 19800303 (atau custom)

**Login:**
- **Username**: `stafftu` atau `19800303`
- **Password**: `19800303` (atau password yang Anda set)

**Hak Akses:**
- ✅ Dashboard
- ✅ Keuangan Sekolah
- ✅ Tabungan Siswa
- ✅ Foto profil & pengaturan di pojok kanan atas

---

### 5. **OPERATOR DATA** ✅ (SUDAH DIPERBAIKI)
**Cara Setup:**
1. Login sebagai Super Admin
2. Buka menu **Data Guru & Staff**
3. Tambah guru baru dengan:
   - **Nama**: Nama Operator Data
   - **NIP**: 19850404
   - **Jabatan**: `Operator Data` (HARUS PERSIS)
   - **Username**: operator
   - **Password**: 19850404 (atau custom)

**Login:**
- **Username**: `operator` atau `19850404`
- **Password**: `19850404` (atau password yang Anda set)

**Hak Akses:**
- ✅ Dashboard
- ✅ Data Siswa dan Kelas
- ✅ Data Guru dan Staff
- ✅ Kelas dan Wali Kelas
- ✅ Jadwal Ujian
- ✅ Bimbingan Belajar
- ✅ Pengumuman
- ✅ Manajemen Multimedia
- ✅ Manajemen AI
- ✅ Foto profil & pengaturan di pojok kanan atas

---

## ⚠️ PENTING - JABATAN HARUS PERSIS

Pastikan **Jabatan** yang Anda masukkan di menu Data Guru & Staff **PERSIS** seperti di bawah ini (case-sensitive):

| Role | Jabatan yang Harus Diisi |
|------|-------------------------|
| Kepala Sekolah | `Kepala Sekolah` |
| Wakil Kurikulum | `Wakil Kurikulum` |
| Staff Tata Usaha | `Staff Tata Usaha` |
| Operator Data | `Operator Data` |
| Guru Mata Pelajaran | `Guru Mapel` atau lainnya |
| Wali Kelas | `Wali Kelas` atau `Guru Kelas` |
| Guru Bimbel | `Guru Bimbingan Belajar` atau `Guru Bimbel` |

---

## 🔧 TROUBLESHOOTING

### Masalah: Login berhasil tapi masuk ke Dashboard Super Admin
**Solusi:**
1. Logout
2. Pastikan **Jabatan** di Data Guru & Staff sudah benar (lihat tabel di atas)
3. Login lagi

### Masalah: Username/Password salah
**Solusi:**
1. Cek di menu **Data Guru & Staff** (login sebagai admin)
2. Lihat kolom **Username** dan **Password** 
3. Jika password `***`, gunakan **NIP** sebagai password

### Masalah: Tidak ada foto profil di pojok kanan
**Solusi:**
- Refresh halaman (F5)
- Jika masih tidak ada, screenshot dan kirim ke saya

---

## 📸 CARA UPLOAD FOTO PROFIL

1. Login dengan role yang ingin diubah
2. Klik **foto profil** di pojok kanan atas
3. Klik icon **kamera** di foto profil
4. Pilih gambar dari komputer
5. Klik **Simpan Perubahan**

---

## ✅ CHECKLIST TESTING

Silakan cek setiap dashboard dengan checklist ini:

### Kepala Sekolah
- [ ] Foto profil muncul di pojok kanan atas
- [ ] Nama dan jabatan "Kepala Sekolah" muncul
- [ ] Menu: Monitor Sekolah, Laporan & Arsip, Al Quran, Channel Sekolah
- [ ] Grafik "Jumlah Siswa Pertahun" muncul
- [ ] Tab "Hasil Belajar" ada di Laporan

### Wakil Kurikulum
- [ ] Foto profil muncul di pojok kanan atas
- [ ] Nama dan jabatan "Wakil Kurikulum" muncul
- [ ] Menu: Dashboard, Kelas dan Wali Kelas, Mata Pelajaran, Jadwal, Absen, Jadwal Ujian, Manajemen Nilai, Rapot, Naik Kelas
- [ ] Modal pengaturan bisa dibuka dengan klik profil

### Staff Tata Usaha
- [ ] Foto profil muncul di pojok kanan atas
- [ ] Nama dan jabatan "Staff Tata Usaha" muncul
- [ ] Menu: Dashboard, Keuangan Sekolah, Tabungan Siswa
- [ ] Statistik keuangan dan tabungan muncul

### Operator Data
- [ ] Foto profil muncul di pojok kanan atas
- [ ] Nama dan jabatan "Operator Data" muncul
- [ ] Menu: Dashboard, Data Siswa dan Kelas, Data Guru dan Staff, Kelas dan Wali Kelas, Jadwal Ujian, Bimbingan Belajar, Pengumuman, Manajemen Multimedia, Manajemen AI
- [ ] Statistik data muncul

---

## 🎯 YANG SUDAH DIPERBAIKI

1. ✅ **Login.tsx** - Role routing sudah diperbaiki
2. ✅ **App.tsx** - Import dan routing untuk 3 dashboard baru
3. ✅ **DashboardWakilKurikulum.tsx** - Sudah ada foto profil & menu lengkap
4. ✅ **DashboardStaffTU.tsx** - Sudah ada foto profil & menu lengkap
5. ✅ **DashboardOperatorData.tsx** - Sudah ada foto profil & menu lengkap

---

Silakan test setiap role dan beri tahu saya jika masih ada yang salah! 🚀
