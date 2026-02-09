# Fitur Multi-Class Assignment untuk Guru

## 📋 Ringkasan Perubahan

Fitur ini memungkinkan **satu guru bisa mengajar di beberapa kelas sekaligus** saat melakukan plotting Mata Pelajaran & Guru Pengampu.

### Contoh Use Case:
- **Guru Agama** bisa mengajar di Kelas 1A, 1B, 2A, 2B, 3A, 3B
- **Guru PJOK** bisa mengajar di Kelas 1A, 1B, 1C, 1D
- **Guru Tahfidz** bisa mengajar di semua kelas
- Dan guru lainnya yang mengajar di multiple kelas

---

## ✅ Fitur yang Ditambahkan

### 1. **Multi-Select Kelas di Modal "Tambah Pengampu"**

Saat admin klik tombol **"Tambah Pengampu"**, modal akan menampilkan:

1. **Pilih Guru** (dropdown single-select)
2. **Pilih Mata Pelajaran** (multi-select dengan checkbox)
3. **Pilih Kelas** (multi-select dengan checkbox) ← **FITUR BARU**

### 2. **UI Multi-Select Kelas**

- Tampilan **grid 2 kolom** dengan checkbox untuk setiap kelas
- Setiap card kelas menampilkan:
  - Nama kelas (misal: "Kelas 1 Amanah")
  - Wali kelas
- Visual feedback:
  - Kelas yang dipilih: **background biru** + **icon centang**
  - Kelas yang belum dipilih: background putih
- Counter di bawah: **"X kelas dipilih"**

### 3. **Logika Penyimpanan Otomatis**

Saat admin klik **"Simpan"**, sistem akan:

1. **Validasi** bahwa minimal 1 guru, 1 mapel, dan 1 kelas sudah dipilih
2. **Loop** untuk setiap kombinasi guru + mapel + kelas
3. **Cek duplikasi** untuk menghindari entry yang sama
4. **Simpan** ke semua kelas yang dipilih

**Contoh:**
```
Input:
- Guru: Abdul Solihin (Guru Agama)
- Mapel: Pendidikan Agama Islam
- Kelas: Kelas 1A, Kelas 1B, Kelas 2A

Output (3 entry tersimpan):
1. Abdul Solihin → PAI → Kelas 1A
2. Abdul Solihin → PAI → Kelas 1B
3. Abdul Solihin → PAI → Kelas 2A
```

### 4. **Mode Edit Tetap Per Kelas**

Saat **edit** data yang sudah ada:
- Hanya bisa edit untuk **1 kelas** (kelas yang sedang dipilih di dropdown)
- Multi-select kelas **tidak muncul** di mode edit
- Ini untuk menghindari konflik data

---

## 🔄 Alur Kerja

### **Tambah Pengampu Baru (Multi-Class)**

```
1. Admin pilih kelas di dropdown (misal: Kelas 1A)
   ↓
2. Klik tombol "Tambah Pengampu"
   ↓
3. Modal terbuka dengan form:
   - Pilih Guru: [Dropdown]
   - Pilih Mata Pelajaran: [Checkbox Multi-Select]
   - Pilih Kelas: [Checkbox Multi-Select] ← BARU!
   ↓
4. Admin pilih:
   - Guru: Abdul Solihin
   - Mapel: PAI
   - Kelas: ✓ 1A, ✓ 1B, ✓ 2A, ✓ 2B
   ↓
5. Klik "Simpan"
   ↓
6. Sistem otomatis membuat 4 entry:
   - Abdul Solihin → PAI → Kelas 1A
   - Abdul Solihin → PAI → Kelas 1B
   - Abdul Solihin → PAI → Kelas 2A
   - Abdul Solihin → PAI → Kelas 2B
   ↓
7. Data tersimpan di semua kelas yang dipilih ✅
```

### **Edit Pengampu Existing (Single-Class)**

```
1. Admin pilih kelas di dropdown (misal: Kelas 1A)
   ↓
2. Klik tombol "Ubah" pada row yang ingin diedit
   ↓
3. Modal terbuka dengan form:
   - Pilih Guru: [Dropdown]
   - Pilih Mata Pelajaran: [Dropdown Single]
   - Pilih Kelas: [TIDAK MUNCUL - otomatis kelas saat ini]
   ↓
4. Admin ubah data (misal: ganti guru)
   ↓
5. Klik "Simpan Perubahan"
   ↓
6. Data terupdate HANYA untuk Kelas 1A ✅
```

---

## 📊 Perubahan Kode

### File yang Dimodifikasi:
- `components/MataPelajaran.tsx`

### Perubahan Detail:

#### 1. **State Management**
```typescript
// Tambah selectedClasses di formData
const [formData, setFormData] = useState({
    subjectNames: [] as string[],
    teacherNip: '',
    selectedClasses: [] as string[] // ← BARU
});
```

#### 2. **Toggle Function**
```typescript
// Fungsi untuk toggle checkbox kelas
const toggleClass = (className: string) => {
    setFormData(prev => {
        const exists = prev.selectedClasses.includes(className);
        if (exists) {
            return { ...prev, selectedClasses: prev.selectedClasses.filter(c => c !== className) };
        } else {
            return { ...prev, selectedClasses: [...prev.selectedClasses, className] };
        }
    });
};
```

#### 3. **Save Logic**
```typescript
// Loop untuk setiap kelas yang dipilih
formData.selectedClasses.forEach(className => {
    const currentList = [...(updated[className] || [])];
    newEntries.forEach(entry => {
        // Cek duplikasi
        const exists = currentList.some(
            item => item.id === entry.id && item.nip === entry.nip
        );
        if (!exists) {
            currentList.push(entry);
        }
    });
    updated[className] = currentList;
});
```

#### 4. **UI Component**
```typescript
{/* Class Multi-Select - Only show when adding new */}
{!editingState.isEditing && (
    <div className="space-y-3">
        <label className="text-sm font-bold text-slate-700">
            Pilih Kelas (Bisa pilih lebih dari satu)
        </label>
        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
            {kelasData.map((kelas) => {
                const isSelected = formData.selectedClasses.includes(kelas.nama);
                return (
                    <div onClick={() => toggleClass(kelas.nama)}>
                        {/* Checkbox card */}
                    </div>
                );
            })}
        </div>
    </div>
)}
```

---

## 🧪 Testing

### Test Case 1: Tambah Guru ke Multiple Kelas
1. Login sebagai Admin
2. Buka menu **"Kelola Mata Pelajaran"** → **"Plotting Guru & Mata Pelajaran"**
3. Klik **"Tambah Pengampu"**
4. Pilih:
   - Guru: Budi Santoso
   - Mapel: PJOK
   - Kelas: Kelas 1A, Kelas 1B, Kelas 2A
5. Klik **"Simpan"**
6. **Expected Result:**
   - Modal tertutup
   - Saat pilih "Kelas 1A" di dropdown → muncul "Budi Santoso - PJOK"
   - Saat pilih "Kelas 1B" di dropdown → muncul "Budi Santoso - PJOK"
   - Saat pilih "Kelas 2A" di dropdown → muncul "Budi Santoso - PJOK"

### Test Case 2: Edit Data Existing
1. Pilih kelas di dropdown (misal: Kelas 1A)
2. Klik **"Ubah"** pada row yang ada
3. **Expected Result:**
   - Modal terbuka
   - Section "Pilih Kelas" **TIDAK MUNCUL**
   - Hanya bisa edit guru atau mapel untuk kelas saat ini

### Test Case 3: Validasi
1. Klik **"Tambah Pengampu"**
2. Pilih guru dan mapel, tapi **tidak pilih kelas**
3. Klik **"Simpan"**
4. **Expected Result:**
   - Muncul alert: **"Mohon pilih minimal satu Kelas!"**

### Test Case 4: Duplikasi Prevention
1. Tambah: Guru A → Mapel X → Kelas 1A
2. Tambah lagi: Guru A → Mapel X → Kelas 1A
3. **Expected Result:**
   - Entry tidak duplikat
   - Hanya ada 1 entry "Guru A - Mapel X" di Kelas 1A

---

## 🎯 Keuntungan Fitur Ini

1. **Efisiensi Waktu**
   - Admin tidak perlu input data guru yang sama berkali-kali untuk setiap kelas
   - Satu kali input untuk multiple kelas

2. **Mengurangi Error**
   - Tidak ada risiko typo karena copy-paste manual
   - Data konsisten di semua kelas

3. **Fleksibilitas**
   - Bisa pilih kelas mana saja (tidak harus berurutan)
   - Bisa pilih multiple mapel sekaligus

4. **User-Friendly**
   - UI checkbox yang jelas
   - Visual feedback yang baik
   - Counter jumlah kelas yang dipilih

---

## 📝 Catatan Penting

### 1. **Mode Edit vs Mode Add**
- **Mode Add**: Bisa pilih multiple kelas
- **Mode Edit**: Hanya untuk 1 kelas (kelas yang sedang aktif)

### 2. **Data Storage**
- Data disimpan di `classSubjectsData` state
- Format: `{ "Kelas 1A": [...], "Kelas 1B": [...] }`
- Untuk production, perlu sinkronisasi ke Supabase

### 3. **Duplikasi Prevention**
- Sistem otomatis cek apakah kombinasi guru + mapel sudah ada di kelas tersebut
- Jika sudah ada, tidak akan ditambahkan lagi

### 4. **Backward Compatibility**
- Fitur lama tetap berfungsi normal
- Tidak ada breaking changes
- Hanya menambahkan fitur baru

---

## 🚀 Next Steps (Opsional)

### 1. **Sinkronisasi ke Supabase**
Jika ingin data tersimpan permanen, perlu:
- Buat tabel `teacher_subject_assignments` di Supabase
- Kolom: `id`, `teacher_nip`, `subject_code`, `class_name`, `created_at`
- Update `handleSave` untuk insert ke Supabase
- Update `useEffect` untuk fetch dari Supabase

### 2. **Bulk Delete**
Tambah fitur untuk hapus guru dari multiple kelas sekaligus:
- Checkbox di setiap row
- Tombol "Hapus dari Semua Kelas"

### 3. **View Per Guru**
Tambah tab/view untuk melihat:
- Guru X mengajar di kelas mana saja
- Total jam mengajar per guru

### 4. **Export/Import**
- Export data plotting ke Excel
- Import data plotting dari Excel template

---

## ✅ Status Implementasi

- [x] State management untuk selectedClasses
- [x] Toggle function untuk checkbox kelas
- [x] UI multi-select kelas di modal
- [x] Update handleSave untuk multi-class assignment
- [x] Validasi minimal 1 kelas dipilih
- [x] Duplikasi prevention
- [x] Mode edit tetap single-class
- [x] Testing - no errors
- [x] Dokumentasi lengkap

---

## 🎉 Kesimpulan

Fitur **Multi-Class Assignment** berhasil diimplementasikan tanpa error dan tanpa mengubah fitur yang sudah ada. Admin sekarang bisa dengan mudah assign satu guru untuk mengajar di beberapa kelas sekaligus, menghemat waktu dan mengurangi risiko error.

**Tested on:** 2026-02-09  
**Status:** ✅ **READY TO USE**
