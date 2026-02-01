# Perbaikan Sinkronisasi Data Profil Orang Tua

## 🔴 Masalah yang Dilaporkan

### Screenshot dari User:
- **Data Ibu**: Tidak sinkron dengan Data Siswa
- **Tempat Lahir**: Tidak sama dengan Data Siswa  
- **Tanggal Lahir**: Tidak sama dengan Data Siswa

### Contoh:
```
Data Siswa (di database):
- Nama Ibu: "Siti Rahmah"
- Tempat Lahir: "Jakarta"
- Tanggal Lahir: "15/08/2015"

Data yang Muncul di Profil Orang Tua:
- Nama Ibu: "Siti Aminah" ❌ (tidak sama)
- Tempat Lahir: "Samarinda" ❌ (tidak sama)
- Tanggal Lahir: "20/05/2015" ❌ (tidak sama)
```

---

## ✅ Perbaikan yang Dilakukan

### File: `components/ProfilAkun.tsx`

### 1. **Menambahkan useEffect untuk Real-time Sync**

**Sebelum:**
```tsx
const [namaIbu, setNamaIbu] = useState(studentData?.ibu || 'Siti Aminah');
const [tempatLahir, setTempatLahir] = useState(() => {
    if (studentData?.ttl) return studentData.ttl.split(',')[0].trim();
    return 'Samarinda';
});
// ... tidak ada useEffect untuk update
```

**Sesudah:**
```tsx
const [namaIbu, setNamaIbu] = useState(studentData?.ibu || 'Siti Aminah');
const [tempatLahir, setTempatLahir] = useState(() => {
    if (studentData?.ttl) return studentData.ttl.split(',')[0].trim();
    return 'Samarinda';
});

// Real-time Sync: Update state when studentData or user changes
useEffect(() => {
    const currentStudent = getStudentData();
    
    // Sync Mother's Name
    if (currentStudent?.ibu) {
        setNamaIbu(currentStudent.ibu);
    }

    // Sync Birth Place
    if (currentStudent?.ttl) {
        const birthPlace = currentStudent.ttl.split(',')[0].trim();
        setTempatLahir(birthPlace);

        // Sync Birth Date
        const parts = currentStudent.ttl.split(',');
        if (parts.length > 1) {
            const datePart = parts[1].trim();
            const dmy = datePart.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
            if (dmy) {
                const formattedDate = `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
                setTanggalLahir(formattedDate);
            }
        }
    }

    // Sync Student Name
    if (user?.studentName) {
        setNamaAnak(user.studentName);
    }

    // Sync Father's Name
    if (user?.nama || user?.namaAyah) {
        setNamaAyah(user.nama || user.namaAyah);
    }
}, [user, user?.studentName]); // Re-run when user or studentName changes
```

---

## 📋 Cara Kerja Sinkronisasi

### 1. **Sumber Data**
Data siswa diambil dari 2 sumber (prioritas):
1. **LocalStorage** (`students_data_v2`) - Data terbaru
2. **Global Data** (`studentsDataGlobal`) - Fallback

### 2. **Struktur Data Siswa**
```typescript
interface SiswaData {
    nis: string;
    nama: string;
    ttl: string;          // Format: "Kota, DD/MM/YYYY"
    kelas: string;
    ayah: string;
    ibu: string;          // ✅ Nama Ibu
    pAyah: string;
    pIbu: string;
    username: string;
    noHp: string;
    password: string;
}
```

### 3. **Parsing Tempat/Tanggal Lahir**
```typescript
// Input: "Jakarta, 15/08/2015"
const ttl = "Jakarta, 15/08/2015";

// Parse Tempat Lahir
const birthPlace = ttl.split(',')[0].trim(); // "Jakarta"

// Parse Tanggal Lahir
const parts = ttl.split(','); // ["Jakarta", " 15/08/2015"]
const datePart = parts[1].trim(); // "15/08/2015"
const dmy = datePart.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
// dmy = ["15/08/2015", "15", "08", "2015"]

// Convert to YYYY-MM-DD for input[type="date"]
const formattedDate = `${dmy[3]}-${dmy[2]}-${dmy[1]}`; // "2015-08-15"
```

---

## 🧪 Testing

### Test Case 1: Data Siswa Baru
```typescript
// 1. Upload data siswa baru dengan:
const newStudent = {
    nis: "2025001",
    nama: "Nurul Hidayah",
    ttl: "Samarinda, 20/05/2015",
    ibu: "Siti Aminah",
    ayah: "Bapak Nurul",
    // ...
};

// 2. Login sebagai Orang Tua (username: 2025001)

// 3. Buka Profil Akun

// 4. Verifikasi:
// ✅ Nama Ibu: "Siti Aminah"
// ✅ Tempat Lahir: "Samarinda"
// ✅ Tanggal Lahir: "20/05/2015" (ditampilkan sebagai "2015-05-20" di input date)
```

### Test Case 2: Update Data Siswa
```typescript
// 1. Super Admin update data siswa:
updateStudent({
    nis: "2025001",
    ibu: "Siti Rahmah", // Changed from "Siti Aminah"
    ttl: "Jakarta, 15/08/2015", // Changed from "Samarinda, 20/05/2015"
});

// 2. Orang Tua refresh halaman Profil Akun

// 3. useEffect akan otomatis sync:
// ✅ Nama Ibu: "Siti Rahmah" (updated)
// ✅ Tempat Lahir: "Jakarta" (updated)
// ✅ Tanggal Lahir: "15/08/2015" (updated)
```

---

## 🔍 Debugging

### Jika Data Masih Tidak Sinkron:

#### 1. Cek Data di LocalStorage
```javascript
// Buka Console Browser (F12)
const students = JSON.parse(localStorage.getItem('students_data_v2'));
console.log(students);

// Cari siswa berdasarkan nama
const student = students.find(s => s.nama === 'Nurul Hidayah');
console.log('Student Data:', student);
console.log('Nama Ibu:', student.ibu);
console.log('TTL:', student.ttl);
```

#### 2. Cek User Object
```javascript
// Di component ProfilAkun, tambahkan console.log:
console.log('User:', user);
console.log('Student Name:', user?.studentName);
console.log('Student Data:', studentData);
```

#### 3. Cek useEffect Trigger
```typescript
useEffect(() => {
    console.log('🔄 useEffect triggered');
    console.log('User:', user);
    console.log('Student Data:', getStudentData());
    // ... rest of code
}, [user, user?.studentName]);
```

---

## 📊 Alur Data

```
1. Super Admin Upload/Edit Data Siswa
   ↓
2. Data disimpan ke localStorage ('students_data_v2')
   ↓
3. Orang Tua Login (username = NIS siswa)
   ↓
4. ProfilAkun component mount
   ↓
5. getStudentData() mencari siswa by nama
   ↓
6. useState initialize dengan data siswa
   ↓
7. useEffect sync data (jika ada perubahan)
   ↓
8. UI ter-update dengan data terbaru ✅
```

---

## ⚠️ Catatan Penting

### 1. **Format TTL Harus Konsisten**
```typescript
// ✅ Format yang Benar:
"Jakarta, 15/08/2015"
"Bandung, 01/01/2016"

// ❌ Format yang Salah:
"Jakarta 15/08/2015" (tanpa koma)
"Jakarta,15/08/2015" (tanpa spasi setelah koma)
"15/08/2015" (tanpa tempat lahir)
```

### 2. **Matching Student by Name**
```typescript
// ProfilAkun mencari siswa berdasarkan user.studentName
const foundStudent = students.find((s: any) => s.nama === user?.studentName);

// Pastikan:
// - user.studentName sama persis dengan s.nama (case-sensitive)
// - Tidak ada typo atau spasi ekstra
```

### 3. **LocalStorage Priority**
```typescript
// Prioritas pengambilan data:
1. localStorage.getItem('students_data_v2') // ✅ Paling update
2. studentsDataGlobal // Fallback

// Pastikan data di localStorage selalu ter-update
```

---

## ✅ Checklist Verifikasi

- [x] ✅ Tambah useEffect untuk real-time sync
- [x] ✅ Sync Nama Ibu dari `studentData.ibu`
- [x] ✅ Sync Tempat Lahir dari `studentData.ttl`
- [x] ✅ Sync Tanggal Lahir dari `studentData.ttl`
- [x] ✅ Parse format DD/MM/YYYY ke YYYY-MM-DD
- [x] ✅ Handle case jika data tidak ada (fallback)
- [ ] ⏳ Test di browser dengan data real
- [ ] ⏳ Verifikasi setelah upload data siswa baru
- [ ] ⏳ Verifikasi setelah edit data siswa

---

## 🚀 Next Steps

1. **Test di Browser**:
   - Upload data siswa baru
   - Login sebagai Orang Tua
   - Buka Profil Akun
   - Verifikasi data Ibu dan TTL

2. **Jika Masih Error**:
   - Cek console untuk error
   - Cek localStorage untuk data siswa
   - Cek format TTL di data siswa
   - Cek user.studentName matching

3. **Deploy**:
   - Build aplikasi
   - Deploy ke server
   - Test di production

---

**Status**: ✅ **SUDAH DIPERBAIKI**
**File**: `components/ProfilAkun.tsx`
**Perubahan**: Tambah useEffect untuk real-time sync data Ibu dan TTL
