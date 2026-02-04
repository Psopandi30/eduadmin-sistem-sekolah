# FIX ERROR SYNTAX - DashboardSuperAdmin.tsx

## ✅ ERROR YANG SUDAH DIPERBAIKI

1. **Baris 2072**: `payload:'rapot_print')` → `payload: 'rapot_print' })}`
2. **Baris 2153**: `payload:'nilai')` → `payload: 'nilai' })}`
3. **Baris 2157**: `payload:'rapot_print')` → `payload: 'rapot_print' })}`
4. **Baris 2166**: `payload:'rapot_print')` → `payload: 'rapot_print' })}`
5. **Baris 3127**: `payload:'dashboard')` → `payload: 'dashboard' })}`
6. **Baris 3955**: `payload:'dashboard')` → `payload: 'dashboard' })}`

## ⚠️ MASALAH YANG TERSISA

Masih ada banyak error "Cannot find name" karena state yang sudah dipindah ke reducer belum semua diganti dengan `uiState` atau helper functions.

### Helper Functions Sudah Dibuat

Di awal komponen (setelah useDataContext), sudah ditambahkan helper functions:
- `setActiveView`, `setSidebarOpen`, `setSelectedClass`, dll

### Yang Perlu Diganti

Ganti semua penggunaan state berikut dengan `uiState` atau helper functions:

1. **activeView** → `uiState.activeView` atau gunakan helper `setActiveView()`
2. **selectedClass** → `uiState.selectedClass` atau gunakan helper `setSelectedClass()`
3. **editItem** → `uiState.editItem` atau gunakan helper `setEditItem()`
4. **editType** → `uiState.editType` atau gunakan helper `setEditType()`
5. **showGroupModal** → `uiState.showGroupModal` atau gunakan helper `setShowGroupModal()`
6. **showSubjectModal** → `uiState.showSubjectModal` atau gunakan helper `setShowSubjectModal()`
7. **selectedLevels** → `uiState.selectedLevels` atau gunakan helper `setSelectedLevels()`
8. **showPositionModal** → `uiState.showPositionModal` atau gunakan helper `setShowPositionModal()`
9. **showTeacherModal** → `uiState.showTeacherModal` atau gunakan helper `setShowTeacherModal()`
10. **newTeacher** → `uiState.newTeacher` atau gunakan helper `setNewTeacher()`
11. **plottingTeacherId** → `uiState.plottingTeacherId` atau gunakan helper `setPlottingTeacherId()`
12. **plottingClassNama** → `uiState.plottingClassNama` atau gunakan helper `setPlottingClassNama()`
13. **plottingSubjectIds** → `uiState.plottingSubjectIds` atau gunakan helper `setPlottingSubjectIds()`
14. **plottingNip** → `uiState.plottingNip` atau gunakan helper `setPlottingNip()`
15. **selectedJadwalClass** → `uiState.selectedJadwalClass` atau gunakan helper `setSelectedJadwalClass()`
16. **selectedJadwalLevel** → `uiState.selectedJadwalLevel` atau gunakan helper `setSelectedJadwalLevel()`
17. **showTimeModal** → `uiState.showTimeModal` atau gunakan helper `setShowTimeModal()`
18. **newPeriodData** → `uiState.newPeriodData` atau gunakan helper `setNewPeriodData()`
19. **showSemesterModal** → `uiState.showSemesterModal` atau gunakan helper `setShowSemesterModal()`
20. **newSemesterName** → `uiState.newSemesterName` atau gunakan helper `setNewSemesterName()`
21. **mapelViewMode** → `uiState.mapelViewMode` atau gunakan helper `setMapelViewMode()`
22. **draggedItem** → `uiState.draggedItem` atau gunakan helper `setDraggedItem()`
23. **showPlottingModal** → `uiState.showPlottingModal` atau gunakan helper `setShowPlottingModal()`

## 🔧 CARA MEMPERBAIKI

### Option 1: Find & Replace Manual

Gunakan Find & Replace di editor untuk mengganti:
- `activeView` → `uiState.activeView`
- `setActiveView(` → `setActiveView(` (sudah helper function)
- `selectedClass` → `uiState.selectedClass`
- `setSelectedClass(` → `setSelectedClass(` (sudah helper function)
- dll...

### Option 2: Gunakan Helper Functions

Karena helper functions sudah dibuat, cukup gunakan:
- `setActiveView('dashboard')` instead of `setActiveView('dashboard')`
- `setSelectedClass('1A')` instead of `setSelectedClass('1A')`
- dll...

### Option 3: Gunakan uiState Langsung

Untuk membaca state:
- `uiState.activeView` instead of `activeView`
- `uiState.selectedClass` instead of `selectedClass`
- dll...

## 📝 CONTOH PERBAIKAN

### Sebelum:
```typescript
{activeView === 'dashboard' && (
    <DashboardHome />
)}
```

### Sesudah:
```typescript
{uiState.activeView === 'dashboard' && (
    <DashboardHome />
)}
```

### Sebelum:
```typescript
<button onClick={() => setActiveView('nilai')}>
```

### Sesudah (sudah benar karena helper function):
```typescript
<button onClick={() => setActiveView('nilai')}>
```

## ⚡ QUICK FIX

Untuk memperbaiki error build dengan cepat, cari dan ganti:

1. `{activeView ===` → `{uiState.activeView ===` (semua)
2. `selectedClass` → `uiState.selectedClass` (untuk read)
3. `editItem` → `uiState.editItem` (untuk read)
4. `editType` → `uiState.editType` (untuk read)
5. `showGroupModal` → `uiState.showGroupModal` (untuk read)
6. `showSubjectModal` → `uiState.showSubjectModal` (untuk read)
7. `selectedLevels` → `uiState.selectedLevels` (untuk read)
8. `newTeacher` → `uiState.newTeacher` (untuk read)
9. `plottingTeacherId` → `uiState.plottingTeacherId` (untuk read)
10. `plottingClassNama` → `uiState.plottingClassNama` (untuk read)
11. `plottingSubjectIds` → `uiState.plottingSubjectIds` (untuk read)
12. `plottingNip` → `uiState.plottingNip` (untuk read)
13. `selectedJadwalClass` → `uiState.selectedJadwalClass` (untuk read)
14. `selectedJadwalLevel` → `uiState.selectedJadwalLevel` (untuk read)
15. `newPeriodData` → `uiState.newPeriodData` (untuk read)
16. `newSemesterName` → `uiState.newSemesterName` (untuk read)
17. `mapelViewMode` → `uiState.mapelViewMode` (untuk read)
18. `draggedItem` → `uiState.draggedItem` (untuk read)
19. `showPlottingModal` → `uiState.showPlottingModal` (untuk read)
20. `showPositionModal` → `uiState.showPositionModal` (untuk read)
21. `showTeacherModal` → `uiState.showTeacherModal` (untuk read)
22. `showTimeModal` → `uiState.showTimeModal` (untuk read)
23. `showSemesterModal` → `uiState.showSemesterModal` (untuk read)

**Note:** Untuk setter (setXxx), sudah ada helper functions, jadi tidak perlu diganti.

---

**Status:** Error syntax utama sudah diperbaiki. Masih perlu mengganti penggunaan state dengan uiState untuk menghilangkan semua error.
