# Debugging Profil Akun Orang Tua - Panduan Lengkap

## 🔴 Masalah yang Masih Terjadi

User melaporkan bahwa data di Profil Akun Orang Tua masih menampilkan:
- Nama Ibu: "Siti Aminah" (tidak berubah)
- Tempat Lahir: "Samarinda" (tidak berubah)
- Tanggal Lahir: "20/05/2015" (tidak berubah)

Padahal seharusnya data sudah di-update di database/localStorage.

---

## 🔍 Langkah Debugging

### Step 1: Buka Developer Console

1. Buka aplikasi di browser
2. Tekan **F12** untuk membuka Developer Tools
3. Pilih tab **Console**

### Step 2: Login sebagai Orang Tua

1. Login dengan username orang tua (NIS siswa)
2. Buka menu **"Akun"** (Profil)
3. **Perhatikan console output**

### Step 3: Cek Console Output

Seharusnya muncul log seperti ini:

```
🔄 ProfilAkun useEffect triggered
User: {nama: "Bapak Andi", studentName: "Andi Pratama", ...}
Student Name: Andi Pratama
Current Student Data: {nis: "...", nama: "Andi Pratama", ibu: "...", ttl: "...", ...}
✅ Syncing Nama Ibu: [Nama Ibu dari Database]
✅ Syncing TTL: [Tempat, DD/MM/YYYY]
Parsing date: [DD/MM/YYYY]
✅ Formatted date: [YYYY-MM-DD]
✅ Syncing Student Name: Andi Pratama
✅ Syncing Father Name: Bapak Andi
✅ ProfilAkun sync completed
```

---

## ⚠️ Kemungkinan Masalah

### Masalah 1: Data Siswa Tidak Ditemukan

**Console Output:**
```
⚠️ No ibu data found in student data
⚠️ No ttl data found in student data
Current Student Data: null
```

**Penyebab:**
- `user.studentName` tidak cocok dengan `student.nama` di localStorage
- Data siswa belum ter-save ke localStorage

**Solusi:**
```javascript
// Cek di console:
const students = JSON.parse(localStorage.getItem('students_data_v2'));
console.log('All Students:', students);

// Cari siswa by nama
const student = students.find(s => s.nama === 'Andi Pratama');
console.log('Found Student:', student);

// Cek apakah ada field ibu dan ttl
console.log('Nama Ibu:', student?.ibu);
console.log('TTL:', student?.ttl);
```

---

### Masalah 2: Format TTL Salah

**Console Output:**
```
⚠️ Date format not matched: [format yang salah]
```

**Penyebab:**
Format TTL tidak sesuai dengan regex `DD/MM/YYYY` atau `DD-MM-YYYY`

**Format yang Benar:**
```
✅ "Jakarta, 15/08/2015"
✅ "Bandung, 01-01-2016"
✅ "Samarinda, 20/05/2015"
```

**Format yang Salah:**
```
❌ "Jakarta 15/08/2015" (tanpa koma)
❌ "Jakarta,15/08/2015" (tanpa spasi setelah koma)
❌ "15/08/2015" (tanpa tempat lahir)
❌ "Jakarta, 15-8-2015" (bulan/tanggal tidak 2 digit)
```

**Solusi:**
Pastikan format TTL di data siswa sudah benar.

---

### Masalah 3: Field `ibu` Tidak Ada di Data Siswa

**Console Output:**
```
Current Student Data: {nis: "...", nama: "...", ttl: "...", ...}
⚠️ No ibu data found in student data
```

**Penyebab:**
Field `ibu` tidak ada dalam object student data

**Solusi:**
```javascript
// Cek struktur data siswa
const student = students.find(s => s.nama === 'Andi Pratama');
console.log('Student keys:', Object.keys(student));

// Pastikan ada field 'ibu'
// Jika tidak ada, tambahkan saat upload/edit data siswa
```

---

### Masalah 4: Nama Siswa Tidak Cocok (Case Sensitive)

**Console Output:**
```
Current Student Data: null
```

**Penyebab:**
`user.studentName` dan `student.nama` tidak sama persis (case-sensitive)

**Contoh:**
```javascript
user.studentName = "andi pratama"  // lowercase
student.nama = "Andi Pratama"      // capitalize
// Tidak akan match!
```

**Solusi:**
```javascript
// Cek di console:
console.log('User Student Name:', user.studentName);
console.log('All Student Names:', students.map(s => s.nama));

// Pastikan nama sama persis (termasuk kapitalisasi)
```

---

## 🛠️ Solusi Manual

### Solusi 1: Clear Cache & Reload

```javascript
// Di console browser:
localStorage.removeItem('students_data_v2');
location.reload();
```

Kemudian:
1. Login sebagai Super Admin
2. Upload ulang data siswa
3. Logout
4. Login sebagai Orang Tua
5. Cek Profil Akun

---

### Solusi 2: Manual Update Data di Console

```javascript
// 1. Ambil data siswa
const students = JSON.parse(localStorage.getItem('students_data_v2'));

// 2. Cari siswa yang ingin diupdate
const studentIndex = students.findIndex(s => s.nama === 'Andi Pratama');

// 3. Update data
students[studentIndex].ibu = "Nama Ibu yang Benar";
students[studentIndex].ttl = "Jakarta, 15/08/2015";

// 4. Save kembali ke localStorage
localStorage.setItem('students_data_v2', JSON.stringify(students));

// 5. Refresh page
location.reload();
```

---

### Solusi 3: Force Refresh Component

Tambahkan tombol refresh di Profil Akun:

```tsx
// Di component ProfilAkun.tsx
<button 
    onClick={() => setRefreshTrigger(prev => prev + 1)}
    className="px-4 py-2 bg-blue-500 text-white rounded"
>
    🔄 Refresh Data
</button>
```

---

## 📝 Checklist Debugging

Jalankan command ini di Console Browser (F12):

### 1. Cek Data di LocalStorage
```javascript
const students = JSON.parse(localStorage.getItem('students_data_v2'));
console.log('📦 Total Students:', students?.length);
console.log('📦 All Students:', students);
```

### 2. Cek User Object
```javascript
// Ambil dari React DevTools atau log di component
console.log('👤 User Object:', user);
console.log('👤 Student Name:', user?.studentName);
```

### 3. Cari Siswa Spesifik
```javascript
const studentName = "Andi Pratama"; // Ganti dengan nama siswa
const student = students.find(s => s.nama === studentName);
console.log('🔍 Found Student:', student);
console.log('🔍 Nama Ibu:', student?.ibu);
console.log('🔍 TTL:', student?.ttl);
```

### 4. Cek Format TTL
```javascript
const ttl = student?.ttl;
console.log('📅 TTL:', ttl);

// Parse
const parts = ttl.split(',');
console.log('📅 Tempat:', parts[0]?.trim());
console.log('📅 Tanggal:', parts[1]?.trim());

// Test regex
const datePart = parts[1]?.trim();
const dmy = datePart?.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
console.log('📅 Regex Match:', dmy);
```

### 5. Cek Matching
```javascript
const userStudentName = user?.studentName;
const allStudentNames = students.map(s => s.nama);

console.log('🔍 User Student Name:', userStudentName);
console.log('🔍 All Student Names:', allStudentNames);
console.log('🔍 Match Found:', allStudentNames.includes(userStudentName));
```

---

## 🎯 Langkah-langkah Testing

### Test 1: Upload Data Siswa Baru

1. Login sebagai **Super Admin**
2. Buka menu **"Data Siswa"**
3. Upload data siswa dengan format:
   ```csv
   NIS,Nama,TTL,Kelas,Ayah,Ibu,...
   2025001,Andi Pratama,"Jakarta, 15/08/2015",1A,Bapak Andi,Ibu Siti,...
   ```
4. **Simpan Data**
5. Buka Console (F12) dan cek:
   ```javascript
   const students = JSON.parse(localStorage.getItem('students_data_v2'));
   const student = students.find(s => s.nis === '2025001');
   console.log('Uploaded Student:', student);
   ```

### Test 2: Login sebagai Orang Tua

1. Logout dari Super Admin
2. Login dengan username: `2025001` (NIS siswa)
3. Buka menu **"Akun"**
4. **Buka Console (F12)**
5. Perhatikan log output
6. Verifikasi data yang ditampilkan

---

## 🚨 Jika Masih Tidak Berubah

### Kemungkinan Penyebab:

1. **Browser Cache**: Hard reload dengan `Ctrl + Shift + R`
2. **React State Tidak Update**: Component tidak re-render
3. **Data Tidak Ter-save**: localStorage tidak ter-update
4. **Wrong User Object**: `user.studentName` salah

### Solusi Terakhir:

```javascript
// 1. Clear semua localStorage
localStorage.clear();

// 2. Reload page
location.reload();

// 3. Login ulang sebagai Super Admin
// 4. Upload ulang data siswa
// 5. Logout
// 6. Login sebagai Orang Tua
// 7. Cek Profil Akun
```

---

## 📞 Informasi untuk Developer

Jika masih error, kirimkan screenshot dari:

1. **Console Output** (semua log yang muncul)
2. **localStorage Data**:
   ```javascript
   console.log(localStorage.getItem('students_data_v2'));
   ```
3. **User Object**:
   ```javascript
   console.log(user);
   ```
4. **Student Data yang Ditemukan**:
   ```javascript
   const students = JSON.parse(localStorage.getItem('students_data_v2'));
   const student = students.find(s => s.nama === user?.studentName);
   console.log(student);
   ```

---

**Last Updated**: 2026-02-01  
**Status**: ⏳ DEBUGGING MODE ACTIVE
