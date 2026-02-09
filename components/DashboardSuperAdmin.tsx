import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Users, GraduationCap, School, CreditCard,
    Bell, Settings, ChevronRight, Search, MoreHorizontal,
    Calendar, BookOpen, FileText, BarChart2, Plus, Edit, Trash2,
    UploadCloud, FolderPlus, UserPlus, Download, Save, SquarePen, Eye, X, Award, Star,
    Zap, UserCheck, Info, ClipboardList, RotateCcw, ChevronLeft, ChevronDown, CheckSquare,
    File as FileIcon, Files as FilesIcon, Upload as UploadIcon, GripVertical, Shirt, Clock,
    Archive, Printer, Lock, PieChart, CheckCircle, TrendingDown, History, Video, List,
    UserCog, Megaphone, CirclePlus, Book, TrendingUp, Wallet, ArrowUpCircle, BookHeart
} from 'lucide-react';

import { studentsDataGlobal, teachersDataGlobal, classesDataGlobal, schedulesDataGlobal, updateSchedulesDataGlobal, examsDataGlobal, updateExamsDataGlobal, MasterExamSchedule, ExamScheduleItem, attendanceDataGlobal, updateAttendanceDataGlobal, AttendanceRecord, gradesDataGlobal, updateGradesDataGlobal, GradeRecord, tutoringSubjectsGlobal, updateTutoringSubjectsGlobal, tutoringTeachersGlobal, updateTutoringTeachersGlobal, schedulePeriodsGlobal } from '../data/sharedData';
import { supabase, isSupabaseConfigured } from '../src/lib/supabase';
import { toast, Toaster } from 'react-hot-toast';
import logger from '../src/utils/logger';
import Sidebar from './DashboardSuperAdmin/components/Sidebar';
import { ScheduleItem, Period, MasterSchedule, DailyScheduleInfo, DAYS } from './DashboardSuperAdmin/types';
import DashboardHome from './DashboardSuperAdmin/components/views/DashboardHome';
import GuruStaffView from './DashboardSuperAdmin/components/views/GuruStaffView';
import TeacherDataView from './DashboardSuperAdmin/components/views/TeacherDataView';
import JabatanView from './DashboardSuperAdmin/components/views/JabatanView';
import MataPelajaranView from './DashboardSuperAdmin/components/views/MataPelajaranView';
import AddSaverModal from './DashboardSuperAdmin/components/modals/AddSaverModal';
import AddExamModal from './DashboardSuperAdmin/components/modals/AddExamModal';
import ExamUniformModal from './DashboardSuperAdmin/components/modals/ExamUniformModal';
import AddExamTimeModal from './DashboardSuperAdmin/components/modals/AddExamTimeModal';

import AddBankModal from './DashboardSuperAdmin/components/modals/AddBankModal';
import AddPaymentTypeModal from './DashboardSuperAdmin/components/modals/AddPaymentTypeModal';
import EditPaymentTypeModal from './DashboardSuperAdmin/components/modals/EditPaymentTypeModal';
import EditYearModal from './DashboardSuperAdmin/components/modals/EditYearModal';

import ExamNoteModal from './DashboardSuperAdmin/components/modals/ExamNoteModal';
import ManageTutoringStudentsModal from './DashboardSuperAdmin/components/modals/ManageTutoringStudentsModal';
import KeuanganView from './DashboardSuperAdmin/components/views/KeuanganView';
import PengumumanView from './DashboardSuperAdmin/components/views/PengumumanView';
import MultimediaView from './DashboardSuperAdmin/components/views/MultimediaView';
import LaporanView from './DashboardSuperAdmin/components/views/LaporanView';
import AlQuranSiswa from './AlQuranSiswa';
import RaporView from './DashboardSuperAdmin/components/views/RaporView';
import RaporSettingsView from './DashboardSuperAdmin/components/views/RaporSettingsView';
import CetakKartuLoginView from './DashboardSuperAdmin/components/views/CetakKartuLoginView';
import NilaiView from './DashboardSuperAdmin/components/views/NilaiView';
import DataSiswaView from './DashboardSuperAdmin/components/views/DataSiswaView';
import UploadSiswaView from './DashboardSuperAdmin/components/views/UploadSiswaView';
import UploadPerKelasView from './DashboardSuperAdmin/components/views/UploadPerKelasView';
import UploadKelasSatuView from './DashboardSuperAdmin/components/views/UploadKelasSatuView';
import TambahKelasView from './DashboardSuperAdmin/components/views/TambahKelasView';
import JadwalPelajaranView from './DashboardSuperAdmin/components/views/JadwalPelajaranView';
import AbsensiView from './DashboardSuperAdmin/components/views/AbsensiView';

import SettingsView from './DashboardSuperAdmin/components/views/SettingsView';
import AIManagementView from './DashboardSuperAdmin/components/views/AIManagementView';
import { useSubjects } from './DashboardSuperAdmin/hooks/useSubjects';
import { useSchedules } from './DashboardSuperAdmin/hooks/useSchedules';
import { useSavings } from './DashboardSuperAdmin/hooks/useSavings';
import { useAttendance } from './DashboardSuperAdmin/hooks/useAttendance';
import { useExams } from './DashboardSuperAdmin/hooks/useExams';
import { useFinance } from './DashboardSuperAdmin/hooks/useFinance';
import { useAnnouncements } from './DashboardSuperAdmin/hooks/useAnnouncements';
import JadwalUjianView from './DashboardSuperAdmin/components/views/JadwalUjianView';
import NaikKelasView from './DashboardSuperAdmin/components/views/NaikKelasView';
import RaporDashboardView from './DashboardSuperAdmin/components/views/RaporDashboardView';
import TabunganView from './DashboardSuperAdmin/components/views/TabunganView';

import { useMultimedia } from './DashboardSuperAdmin/hooks/useMultimedia';
import { useTutoring } from './DashboardSuperAdmin/hooks/useTutoring';
import { useDataContext } from './DashboardSuperAdmin/contexts/DataContext';
import { useAdminUI } from './DashboardSuperAdmin/reducers/adminReducer';

interface SuperAdminProps {
    user: any;
    onLogout: () => void;
    schoolSettings: any;
    setSchoolSettings: React.Dispatch<React.SetStateAction<any>>;
}


const DashboardSuperAdmin: React.FC<SuperAdminProps> = ({ user, onLogout, schoolSettings, setSchoolSettings }) => {
    // --- USE REDUCER FOR UI STATE (Grouped State Management) ---
    const [uiState, dispatch] = useAdminUI();

    /* --- FORCE RESET CLEANUP (Temporarily Disabled for Stability) ---
    useEffect(() => {
        try {
            const resetKey = 'force_reset_v10';
            const hasReset = localStorage.getItem(resetKey);
            if (!hasReset) {
                Object.keys(localStorage).forEach(key => {
                    if (key.includes('data_v') || key.includes('finance_') || key.includes('savings_') || key.includes('announcements_')) {
                        localStorage.removeItem(key);
                    }
                });
                localStorage.setItem(resetKey, 'true');
                logger.log("Force reset triggered, reloading...");
                window.location.reload();
            }
        } catch (e) {
            logger.error("Local storage error during reset:", e);
        }
    }, []);
    */

    // --- STATE DATA (Using DataContext - Centralized) ---
    const {
        students,
        setStudents,
        addNewStudent,
        updateStudent,
        updateStudents,
        selectedStudent,
        setSelectedStudent,
        showAddStudentModal,
        setShowAddStudentModal,
        modalMode,
        setModalMode,
        handleViewStudent,
        handleAddStudent,
        handleEditStudent,
        handleDelete,
        handleDownloadTemplate,
        handleUploadClick,
        handleSaveData,
        teachers,
        setTeachers,
        addTeacher,
        deleteTeacher,
        updateTeacher,
        handleDownloadTemplateTeacher,
        handleUploadClickTeacher,
        handleSaveDataTeacher,
        classes,
        setClasses,
        showAddClassModal,
        setShowAddClassModal,
        handleAddClass,
        handleDeleteClass,
        handleSaveClasses,
        subjectGroups,
        setSubjectGroups,
        subjects,
        setSubjects
    } = useDataContext();

    // Helper functions untuk memudahkan akses state dari reducer
    const setActiveView = (view: string) => dispatch({ type: 'SET_ACTIVE_VIEW', payload: view });
    const setSidebarOpen = (open: boolean) => dispatch({ type: 'SET_SIDEBAR_OPEN', payload: open });
    const setSelectedClass = (cls: string) => dispatch({ type: 'SET_SELECTED_CLASS', payload: cls });
    const setEditItem = (item: any) => dispatch({ type: 'SET_EDIT_ITEM', payload: item });
    const setEditType = (type: string) => dispatch({ type: 'SET_EDIT_TYPE', payload: type });
    const setShowGroupModal = (show: boolean) => dispatch({ type: 'SET_SHOW_GROUP_MODAL', payload: show });
    const setShowSubjectModal = (show: boolean) => dispatch({ type: 'SET_SHOW_SUBJECT_MODAL', payload: show });
    const setSelectedLevels = (levels: string[]) => dispatch({ type: 'SET_SELECTED_LEVELS', payload: levels });
    const setShowPositionModal = (show: boolean) => dispatch({ type: 'SET_SHOW_POSITION_MODAL', payload: show });
    const setShowTeacherModal = (show: boolean) => dispatch({ type: 'SET_SHOW_TEACHER_MODAL', payload: show });
    const setNewTeacher = (teacher: any) => dispatch({ type: 'SET_NEW_TEACHER', payload: teacher });
    const setShowPlottingModal = (show: boolean) => dispatch({ type: 'SET_SHOW_PLOTTING_MODAL', payload: show });
    const setPlottingTeacherId = (id: string) => dispatch({ type: 'SET_PLOTTING_TEACHER_ID', payload: id });
    const setPlottingClassNama = (nama: string) => dispatch({ type: 'SET_PLOTTING_CLASS_NAMA', payload: nama });
    const setPlottingSubjectIds = (ids: any[]) => dispatch({ type: 'SET_PLOTTING_SUBJECT_IDS', payload: ids });
    const setPlottingNip = (nip: string) => dispatch({ type: 'SET_PLOTTING_NIP', payload: nip });
    const setPlottingSelectedClasses = (classes: string[]) => dispatch({ type: 'SET_PLOTTING_SELECTED_CLASSES', payload: classes });
    const setSelectedJadwalClass = (cls: string) => dispatch({ type: 'SET_SELECTED_JADWAL_CLASS', payload: cls });
    const setSelectedJadwalLevel = (level: number) => dispatch({ type: 'SET_SELECTED_JADWAL_LEVEL', payload: level });
    const setShowTimeModal = (show: boolean) => dispatch({ type: 'SET_SHOW_TIME_MODAL', payload: show });
    const setNewPeriodData = (data: { start: string; end: string }) => dispatch({ type: 'SET_NEW_PERIOD_DATA', payload: data });
    const setShowSemesterModal = (show: boolean) => dispatch({ type: 'SET_SHOW_SEMESTER_MODAL', payload: show });
    const setNewSemesterName = (name: string) => dispatch({ type: 'SET_NEW_SEMESTER_NAME', payload: name });
    const setMapelViewMode = (mode: 'master' | 'plotting') => dispatch({ type: 'SET_MAPEL_VIEW_MODE', payload: mode });
    const setDraggedItem = (item: { type: string; id: number | string; name: string } | null) => dispatch({ type: 'SET_DRAGGED_ITEM', payload: item });

    // Persist Positions
    const [positions, setPositions] = useState<any[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('positions_data_v10');
            if (saved) return JSON.parse(saved);
        }
        return [
            { id: 1, nama: 'Kepala Sekolah', kategori: 'Struktural' },
            { id: 2, nama: 'Wakil Kurikulum', kategori: 'Struktural' },
            { id: 3, nama: 'Guru Kelas', kategori: 'Fungsional' },
            { id: 4, nama: 'Guru Mata Pelajaran', kategori: 'Fungsional' },
            { id: 5, nama: 'Staff Tata Usaha', kategori: 'Staff' },
            { id: 6, nama: 'Operator Data', kategori: 'Teknis' },
        ];
    });

    useEffect(() => {
        localStorage.setItem('positions_data_v10', JSON.stringify(positions));
    }, [positions]);

    // --- JADWAL STATE (Refactored to Hook) ---
    const {
        schedules,
        setSchedules,
        saveSchedulesToSupabase,
        refreshSchedules
    } = useSchedules();

    const [activeScheduleId, setActiveScheduleId] = useState<number>(1);
    // selectedJadwalClass, draggedItem now from uiState via reducer
    const [schedulePeriods, setSchedulePeriods] = useState<Period[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('schedule_periods_v2');
            if (saved) return JSON.parse(saved);
        }
        return schedulePeriodsGlobal;
    });

    useEffect(() => {
        localStorage.setItem('schedule_periods_v2', JSON.stringify(schedulePeriods));

        // SYNC TO CLOUD
        const syncPeriods = async () => {
            if (isSupabaseConfigured() && schedulePeriods.length > 0) {
                try {
                    await supabase.from('app_settings').upsert({
                        key: 'schedule_periods_v2',
                        value: schedulePeriods,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'key' });
                } catch (e) {
                    logger.error("Failed to sync schedule periods to cloud", e);
                }
            }
        };
        syncPeriods();
    }, [schedulePeriods]);
    // uiState.selectedJadwalLevel, showTimeModal, uiState.newPeriodData, showSemesterModal, uiState.newSemesterName, mapelViewMode now from uiState via reducer
    const [teacherAssignments, setTeacherAssignments] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('teacher_assignments_v2');
            if (saved) return JSON.parse(saved);
        }
        return [];
    });

    useEffect(() => {
        localStorage.setItem('teacher_assignments_v2', JSON.stringify(teacherAssignments));
    }, [teacherAssignments]);
    useEffect(() => {
        if (!uiState.showPlottingModal) {
            dispatch({ type: 'RESET_PLOTTING_FORM' });
        }
    }, [uiState.showPlottingModal, dispatch]);
    // Teachers, Classes, Subjects already from useDataContext above

    // --- ABSENSI STATE (Refactored to Hook) ---
    const {
        attendanceData,
        setAttendanceData,
        saveAttendance
    } = useAttendance();
    const [absenDate, setAbsenDate] = useState<Date>(new Date());
    const [absenClass, setAbsenClass] = useState<string>('1A');
    const [absenSubjects, setAbsenSubjects] = useState<number[]>([]);
    const [absenMode, setAbsenMode] = useState<'today' | 'history'>('today');

    const [absenSearchQuery, setAbsenSearchQuery] = useState('');
    const [absenSemester, setAbsenSemester] = useState('Ganjil');

    // --- UJIAN STATE (Refactored to Hook) ---
    const {
        examSchedules,
        setExamSchedules,
        saveExams
    } = useExams();

    const [activeExamId, setActiveExamId] = useState<number | null>(examsDataGlobal.length > 0 ? examsDataGlobal[0].id : null);
    const [showExamModal, setShowExamModal] = useState(false);
    const [newExamData, setNewExamData] = useState<MasterExamSchedule>({
        id: 0,
        type: 'UTS',
        semester: 'Ganjil',
        year: '2025/2026',
        status: 'draft',
        items: [],
        timeSlots: []
    });

    // --- EXAM SCHEDULE ITEMS STATE (Similar to Jadwal Pelajaran) ---
    const [examScheduleItems, setExamScheduleItems] = useState<Record<string, { subject: string; teacher: string; color: string }>>({});
    const [examTimeSlots, setExamTimeSlots] = useState<Period[]>([
        { id: 0, start: '07:30', end: '09:00' },
        { id: 1, start: '09:00', end: '09:30' },
        { id: 2, start: '09:30', end: '11:00' },
    ]);
    const [examDailyUniforms, setExamDailyUniforms] = useState<Record<string, string>>({
        'Senin': '', 'Selasa': '', 'Rabu': '', 'Kamis': '', 'Jumat': '', 'Sabtu': ''
    });
    const [examDailyNotes, setExamDailyNotes] = useState<Record<string, string>>({
        'Senin': '', 'Selasa': '', 'Rabu': '', 'Kamis': '', 'Jumat': '', 'Sabtu': ''
    });
    const [selectedExamClass, setSelectedExamClass] = useState<string>('1A');
    const [selectedExamTingkat, setSelectedExamTingkat] = useState<string>('1');
    const [examDraggedItem, setExamDraggedItem] = useState<{ subject: string; teacher: string; color: string } | null>(null);
    const [showExamTimeModal, setShowExamTimeModal] = useState(false);
    const [showExamUniformModal, setShowExamUniformModal] = useState(false);
    const [showExamNoteModal, setShowExamNoteModal] = useState(false);
    const [selectedDayForExamUniform, setSelectedDayForExamUniform] = useState<string | null>(null);
    const [selectedDayForExamNote, setSelectedDayForExamNote] = useState<string | null>(null);
    const [tempExamUniform, setTempExamUniform] = useState('');
    const [tempExamNote, setTempExamNote] = useState('');
    const [newExamTime, setNewExamTime] = useState({ start: '', end: '' });

    // --- GENERIC CONFIRMATION MODAL STATE ---
    const [confirmModal, setConfirmModal] = useState({
        show: false,
        message: '',
        onConfirm: () => { }
    });

    // 1. Sync Load: Master -> Local State
    useEffect(() => {
        const activeExam = examSchedules.find(e => e.id === activeExamId);
        if (activeExam) {
            // Load Time Slots - only if different
            const masterTimeSlots = activeExam.timeSlots || [];
            if (JSON.stringify(masterTimeSlots) !== JSON.stringify(examTimeSlots)) {
                setExamTimeSlots(masterTimeSlots);
            }

            // Load Items for Class - only if different
            const classItems = activeExam.items.filter(item => item.classId === selectedExamClass);
            const newMap: Record<string, any> = {};
            classItems.forEach(item => {
                newMap[`${item.day}-${item.timeSlotId}`] = {
                    subject: item.subjectName,
                    teacher: item.teacherName || '-',
                    color: item.color || 'bg-blue-100 border-blue-200 text-blue-700'
                };
            });

            if (JSON.stringify(newMap) !== JSON.stringify(examScheduleItems)) {
                setExamScheduleItems(newMap);
            }

            // Load Notes - only if different
            const masterNotes = activeExam.dailyNotes || { 'Senin': '', 'Selasa': '', 'Rabu': '', 'Kamis': '', 'Jumat': '', 'Sabtu': '' };
            if (JSON.stringify(masterNotes) !== JSON.stringify(examDailyNotes)) {
                setExamDailyNotes(masterNotes);
            }
        } else if (activeExamId === null) {
            // Reset local states if no exam is selected
            if (Object.keys(examScheduleItems).length > 0) setExamScheduleItems({});
            if (examTimeSlots.length > 0) setExamTimeSlots([]);
        }
    }, [activeExamId, selectedExamClass, examSchedules]);

    // 2. Sync Save: Local State -> Master (Debounced or on Change)
    useEffect(() => {
        if (!activeExamId) return;

        setExamSchedules(prevSchedules => {
            const currentExam = prevSchedules.find(e => e.id === activeExamId);
            if (!currentExam) return prevSchedules;

            // Prepare new items list for this class
            const currentExamId = activeExamId;
            const newClassItems: ExamScheduleItem[] = Object.entries(examScheduleItems).map(([key, data]: [string, any]) => {
                const [day, slotIdStr] = key.split('-');
                return {
                    id: `e-${currentExamId}-${selectedExamClass}-${key}`,
                    examId: currentExamId,
                    classId: selectedExamClass,
                    day,
                    timeSlotId: parseInt(slotIdStr),
                    subjectName: data.subject,
                    teacherName: data.teacher,
                    color: data.color
                };
            });

            // Keep items from other classes
            const otherClassItems = currentExam.items.filter(it => it.classId !== selectedExamClass);
            const allItems = [...otherClassItems, ...newClassItems];

            // Check if anything actually changed before returning new array
            const isItemsChanged = JSON.stringify(allItems) !== JSON.stringify(currentExam.items);
            const isSlotsChanged = JSON.stringify(examTimeSlots) !== JSON.stringify(currentExam.timeSlots);
            const isNotesChanged = JSON.stringify(examDailyNotes) !== JSON.stringify(currentExam.dailyNotes);

            if (!isItemsChanged && !isSlotsChanged && !isNotesChanged) {
                return prevSchedules; // No change, keep reference same to avoid re-triggering Effect 1
            }

            return prevSchedules.map(exam => {
                if (exam.id === activeExamId) {
                    return {
                        ...exam,
                        items: allItems,
                        timeSlots: examTimeSlots,
                        dailyNotes: examDailyNotes
                    };
                }
                return exam;
            });
        });
    }, [examScheduleItems, examTimeSlots, examDailyNotes, activeExamId, selectedExamClass]);

    // --- NILAI STATE ---
    const [activeNilaiSubMenu, setActiveNilaiSubMenu] = useState<'UH' | 'UTS' | 'UAS' | 'PAS' | 'PAT' | 'GRAFIK' | 'SETTING'>('UH');
    const [nilaiData, setNilaiData] = useState<GradeRecord[]>(gradesDataGlobal);

    useEffect(() => {
        updateGradesDataGlobal(nilaiData);
    }, [nilaiData]);

    // Auto-set semester based on Exam Type
    useEffect(() => {
        if (activeNilaiSubMenu === 'PAS' || activeNilaiSubMenu === 'UAS') {
            setSelectedNilaiSemester('Ganjil');
        } else if (activeNilaiSubMenu === 'PAT') {
            setSelectedNilaiSemester('Genap');
        }
    }, [activeNilaiSubMenu]);

    const [selectedNilaiClass, setSelectedNilaiClass] = useState('');
    const [selectedNilaiSubject, setSelectedNilaiSubject] = useState('');
    const [selectedNilaiSemester, setSelectedNilaiSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');
    const [selectedNilaiStudent, setSelectedNilaiStudent] = useState('');


    // --- TABUNGAN STATE (Using Custom Hook) ---
    const [savingsActiveTab, setSavingsActiveTab] = useState('dashboard'); // dashboard, data, setoran, penarikan, riwayat, rekap, pengaturan
    const { savingsData, setSavingsData, savingsTransactions, setSavingsTransactions, saveSavings } = useSavings();
    const [searchSavingsStudent, setSearchSavingsStudent] = useState('');
    const [selectedSavingsStudent, setSelectedSavingsStudent] = useState<any>(null);
    const [savingsAmount, setSavingsAmount] = useState(0);
    const [savingsNote, setSavingsNote] = useState('');
    const [showAddSaverModal, setShowAddSaverModal] = useState(false);
    const [newSaverId, setNewSaverId] = useState('');
    const [saverClassFilter, setSaverClassFilter] = useState('');

    // --- TABUNGAN HANDLERS ---
    const handleSavingsDeposit = () => {
        if (!selectedSavingsStudent || savingsAmount <= 0) return;

        const updatedData = savingsData.map(s =>
            s.id === selectedSavingsStudent.id ? { ...s, saldo: s.saldo + savingsAmount } : s
        );

        const newTrx = {
            id: `TRX-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            studentId: selectedSavingsStudent.id,
            studentName: selectedSavingsStudent.nama,
            type: 'Setor',
            amount: savingsAmount,
            officer: 'Admin'
        };
        const updatedTrx = [newTrx, ...savingsTransactions];

        saveSavings(updatedData, updatedTrx);

        toast.success(`Setoran Rp ${savingsAmount.toLocaleString('id-ID')} berhasil disimpan!`);
        setSelectedSavingsStudent(null);
        setSavingsAmount(0);
        setSavingsNote('');
        setSearchSavingsStudent('');
    };

    const handleSavingsWithdrawal = () => {
        if (!selectedSavingsStudent || savingsAmount <= 0) return;
        if (savingsAmount > selectedSavingsStudent.saldo) {
            toast.error("Saldo tidak mencukupi!");
            return;
        }

        const updatedData = savingsData.map(s =>
            s.id === selectedSavingsStudent.id ? { ...s, saldo: s.saldo - savingsAmount } : s
        );

        const newTrx = {
            id: `TRX-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            studentId: selectedSavingsStudent.id,
            studentName: selectedSavingsStudent.nama,
            type: 'Tarik',
            amount: savingsAmount,
            officer: 'Admin'
        };
        const updatedTrx = [newTrx, ...savingsTransactions];

        saveSavings(updatedData, updatedTrx);

        toast.success(`Penarikan Rp ${savingsAmount.toLocaleString('id-ID')} berhasil diproses!`);
        setSelectedSavingsStudent(null);
        setSavingsAmount(0);
        setSavingsNote('');
        setSearchSavingsStudent('');
    };


    // --- BIMBINGAN BELAJAR (TUTORING) STATE ---
    // --- GLOBAL HANDLERS ---
    const handleLogout = () => {
        setConfirmModal({
            show: true,
            message: 'Apakah anda yakin ingin keluar dari sistem?',
            onConfirm: () => {
                setConfirmModal({ show: false, message: '', onConfirm: () => { } });
                onLogout();
            }
        });
    };

    // --- BIMBINGAN BELAJAR (TUTORING) STATE ---
    const [tutoringActiveTab, setTutoringActiveTab] = useState('dashboard'); // dashboard, mapel, guru, materi

    // Subjects
    const [tutoringSubjects, setTutoringSubjects] = useState<any[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('tutoring_subjects_v10');
            if (saved) return JSON.parse(saved);
        }
        return tutoringSubjectsGlobal;
    });

    // Teachers
    const [tutoringTeachers, setTutoringTeachers] = useState<any[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('tutoring_teachers_v10');
            if (saved) return JSON.parse(saved);
        }
        return tutoringTeachersGlobal;
    });

    // Materials (Assuming these were empty before, now persisted too if needed, but let's stick to initial)
    const [tutoringMaterials, setTutoringMaterials] = useState<any[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('tutoring_materials_v10');
            if (saved) return JSON.parse(saved);
        }
        return [];
    });

    // Enrollments
    const [tutoringEnrollments, setTutoringEnrollments] = useState<{ groupId: number, studentId: number }[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('tutoring_enrollments_v10');
            if (saved) return JSON.parse(saved);
        }
        return [];
    });


    useEffect(() => {
        localStorage.setItem('tutoring_subjects_v10', JSON.stringify(tutoringSubjects));
        updateTutoringSubjectsGlobal(tutoringSubjects);
    }, [tutoringSubjects]);

    useEffect(() => {
        localStorage.setItem('tutoring_teachers_v10', JSON.stringify(tutoringTeachers));
        updateTutoringTeachersGlobal(tutoringTeachers);
    }, [tutoringTeachers]);

    useEffect(() => {
        localStorage.setItem('tutoring_materials_v10', JSON.stringify(tutoringMaterials));
    }, [tutoringMaterials]);

    useEffect(() => {
        localStorage.setItem('tutoring_enrollments_v10', JSON.stringify(tutoringEnrollments));
    }, [tutoringEnrollments]);

    const isInitialLoadTutoring = React.useRef(true);
    const isSyncingFromServer = React.useRef(false);
    const [editItemLocal, setEditItemLocal] = useState<any>(null);
    const [editTypeLocal, setEditTypeLocal] = useState<'SubjectBimbel' | 'TeacherBimbel' | null>(null);
    const [showEnrollStudentModal, setShowEnrollStudentModal] = useState(false);
    const [selectedTutoringGroupId, setSelectedTutoringGroupId] = useState<number | null>(null);
    const [searchStudentQuery, setSearchStudentQuery] = useState('');

    // NEW: FETCH TUTORING DATA FROM SUPABASE
    const fetchTutoringDataMain = async () => {
        if (!isSupabaseConfigured()) return;
        isSyncingFromServer.current = true;
        try {
            // Fetch Subjects
            const { data: subData } = await supabase.from('tutoring_subjects').select('*');
            if (subData && subData.length > 0) {
                setTutoringSubjects(subData.map(s => ({
                    id: s.id,
                    name: s.name,
                    classes: s.classes,
                    meetings: s.meetings_count,
                    status: s.status
                })));
            }

            // Fetch Teachers/Groups
            const { data: teachData } = await supabase.from('tutoring_teachers').select('*');
            if (teachData && teachData.length > 0) {
                setTutoringTeachers(teachData.map(t => ({
                    id: t.id,
                    name: t.name,
                    source: t.source,
                    subjectId: t.subject_id?.toString(),
                    subjectName: t.subject_name,
                    classId: t.class_id,
                    scheduleDay: t.schedule_day,
                    scheduleStart: t.schedule_start,
                    scheduleEnd: t.schedule_end,
                    username: t.username,
                    password: t.password,
                    studentsCount: t.students_count,
                    status: t.status
                })));
            }

            // Fetch Materials
            const { data: matData } = await supabase.from('tutoring_materials').select('*');
            if (matData && matData.length > 0) {
                setTutoringMaterials(matData.map(m => ({
                    id: m.id,
                    teacherId: m.teacher_id,
                    subjectName: m.subject_name,
                    meeting: m.meeting_number,
                    title: m.title,
                    videoUrl: m.video_url,
                    fileUrl: m.file_url
                })));
            }

            // Fetch Enrollments
            const { data: enrollData } = await supabase.from('tutoring_enrollments').select('*');
            if (enrollData && enrollData.length > 0) {
                setTutoringEnrollments(enrollData.map(e => ({
                    groupId: e.teacher_id,
                    studentId: e.student_id
                })));
            }
        } catch (err) {
            logger.error('Error fetching tutoring data:', err);
        } finally {
            setTimeout(() => {
                isSyncingFromServer.current = false;
                isInitialLoadTutoring.current = false;
            }, 1000);
        }
    };

    useEffect(() => {
        fetchTutoringDataMain();
    }, []);

    // NEW: SAVE TUTORING DATA TO SUPABASE
    const handleSaveTutoringData = async (silent = false) => {
        if (!isSupabaseConfigured()) {
            if (!silent) toast.error("Supabase tidak terkonfigurasi!");
            return;
        }

        let loadingToast: string | undefined;
        if (!silent) loadingToast = toast.loading("Sinkronisasi data Bimbel ke database...");

        try {
            // 1. Sync Subjects and get real IDs
            let subjectsMap: Record<number, number> = {}; // temporary ID -> real DB ID
            if (tutoringSubjects.length > 0) {
                const subjectsToSave = tutoringSubjects.map(s => {
                    const obj: any = {
                        name: s.name,
                        classes: s.classes,
                        meetings_count: s.meetings,
                        status: s.status
                    };
                    // Only include id if it's an existing record from DB (small numeric ID)
                    if (typeof s.id === 'number' && s.id < 1000000000) obj.id = s.id;
                    return obj;
                });

                const { data: savedSubjects, error: subError } = await supabase
                    .from('tutoring_subjects')
                    .upsert(subjectsToSave)
                    .select();

                if (subError) throw subError;

                // Map temporary IDs to real IDs
                tutoringSubjects.forEach((s) => {
                    if (typeof s.id === 'number' && s.id > 1000000000 && savedSubjects) {
                        const saved = savedSubjects.find(ss => ss.name === s.name);
                        if (saved) subjectsMap[s.id] = saved.id;
                    } else {
                        subjectsMap[s.id] = s.id;
                    }
                });
            }

            // 2. Sync Teachers and get real IDs
            let teachersMap: Record<number, number> = {};
            if (tutoringTeachers.length > 0) {
                const teachersToSave = tutoringTeachers.map(t => {
                    const tempSubId = parseInt(t.subjectId);
                    const realSubId = subjectsMap[tempSubId] || tempSubId;

                    const obj: any = {
                        name: t.name,
                        source: t.source,
                        subject_id: isNaN(realSubId) ? null : realSubId,
                        subject_name: t.subjectName,
                        class_id: t.classId,
                        schedule_day: t.scheduleDay,
                        schedule_start: t.scheduleStart,
                        schedule_end: t.scheduleEnd,
                        username: t.username,
                        password: t.password,
                        students_count: t.studentsCount,
                        status: t.status
                    };
                    // Only include id if it's an existing record from DB (small numeric ID)
                    if (typeof t.id === 'number' && t.id < 1000000000) obj.id = t.id;
                    return obj;
                });

                const { data: savedTeachers, error: teachError } = await supabase
                    .from('tutoring_teachers')
                    .upsert(teachersToSave)
                    .select();

                if (teachError) throw teachError;

                // Map temporary IDs to real IDs
                tutoringTeachers.forEach((t) => {
                    if (typeof t.id === 'number' && t.id > 1000000000 && savedTeachers) {
                        const saved = savedTeachers.find(st => st.username === t.username);
                        if (saved) teachersMap[t.id] = saved.id;
                    } else {
                        teachersMap[t.id] = t.id;
                    }
                });
            }

            // 3. Sync Materials
            if (tutoringMaterials.length > 0) {
                const materialsToSave = tutoringMaterials.map(m => {
                    const realTeachId = teachersMap[m.teacherId] || m.teacherId;
                    const obj: any = {
                        teacher_id: realTeachId,
                        subject_name: m.subjectName,
                        meeting_number: m.meeting,
                        title: m.title,
                        video_url: m.videoUrl,
                        file_url: m.fileUrl
                    };
                    // Only include id if it's an existing record from DB (small numeric ID)
                    if (typeof m.id === 'number' && m.id < 1000000000) obj.id = m.id;
                    return obj;
                });
                const { error: matError } = await supabase.from('tutoring_materials').upsert(materialsToSave);
                if (matError) throw matError;
            }

            // 4. Sync Enrollments
            if (tutoringEnrollments.length > 0) {
                const enrollmentsToSave = tutoringEnrollments.map(e => ({
                    teacher_id: teachersMap[e.groupId] || e.groupId,
                    student_id: e.studentId
                }));
                const { error: enrollError } = await supabase
                    .from('tutoring_enrollments')
                    .upsert(enrollmentsToSave, { onConflict: 'teacher_id,student_id' });
                if (enrollError) logger.warn("Enrollment sync warned:", enrollError);
            }

            if (!silent && loadingToast) toast.success("Data Bimbel Berhasil Disinkronkan!", { id: loadingToast });
            fetchTutoringDataMain();
        } catch (err: any) {
            logger.error('Save error:', err);
            if (!silent && loadingToast) toast.error("Gagal sinkron: " + err.message, { id: loadingToast });
        }
    };

    // Auto-sync for Tutoring Data (Debounced)
    useEffect(() => {
        if (isSyncingFromServer.current || isInitialLoadTutoring.current) return;

        const timer = setTimeout(() => {
            if (tutoringSubjects.length > 0 || tutoringTeachers.length > 0) {
                handleSaveTutoringData(true);
            }
        }, 5000); // 5 seconds delay for safer auto-sync

        return () => clearTimeout(timer);
    }, [tutoringSubjects, tutoringTeachers, tutoringMaterials, tutoringEnrollments]);

    // Download/Print tutoring recap (PDF via print)
    const handleDownloadTutoringReport = () => {
        try {
            const dateLabel = new Date().toLocaleDateString('id-ID');
            const title = `Rekap_Bimbel_${new Date().toISOString().slice(0, 10)}`;

            const subjectRows = tutoringSubjects.map((s) => `
                <tr>
                    <td>${(s.name || '').toString()}</td>
                    <td>${((s.classes && s.classes.join) ? s.classes.join(', ') : (s.classes || '-'))}</td>
                    <td>${s.meetings || ''}</td>
                    <td>${s.status || ''}</td>
                </tr>
            `).join('');

            const teacherRows = tutoringTeachers.map((t) => `
                <tr>
                    <td>${(t.name || '').toString()}</td>
                    <td>${t.subjectName || ''}</td>
                    <td>${t.classId || ''}</td>
                    <td>${t.studentsCount || 0}</td>
                </tr>
            `).join('');

            const stats = `<p style="margin:8px 0;font-weight:600">Mata Pelajaran: ${tutoringSubjects.length} &nbsp;•&nbsp; Guru: ${tutoringTeachers.length} &nbsp;•&nbsp; Siswa Terdaftar: ${tutoringEnrollments.length}</p>`;

            const html = `<!doctype html>
                <html>
                <head>
                    <meta charset="utf-8" />
                    <title>${title}</title>
                    <style>
                        body{font-family:Inter,Arial,Helvetica,sans-serif;padding:20px;color:#111}
                        h1{font-size:20px;margin:0 0 6px}
                        table{width:100%;border-collapse:collapse;margin-top:10px}
                        th,td{border:1px solid #e5e7eb;padding:8px;text-align:left;font-size:13px}
                        th{background:#f8fafc;color:#0f172a;font-weight:700}
                    </style>
                </head>
                <body>
                    <h1>Rekap Bimbingan Belajar</h1>
                    <div style="font-size:13px;color:#374151">Tanggal: ${dateLabel}</div>
                    ${stats}

                    <h2 style="margin-top:18px;font-size:14px">Mata Pelajaran</h2>
                    <table>
                        <thead>
                            <tr><th>Nama</th><th>Kelas</th><th>Pertemuan</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            ${subjectRows || '<tr><td colspan="4">Tidak ada data</td></tr>'}
                        </tbody>
                    </table>

                    <h2 style="margin-top:18px;font-size:14px">Guru</h2>
                    <table>
                        <thead>
                            <tr><th>Nama</th><th>Mata Pelajaran</th><th>Kelas</th><th>Terdaftar</th></tr>
                        </thead>
                        <tbody>
                            ${teacherRows || '<tr><td colspan="4">Tidak ada data</td></tr>'}
                        </tbody>
                    </table>
                </body>
                </html>`;

            const printWindow = window.open('', '_blank', 'width=900,height=700');
            if (!printWindow) {
                toast.error('Gagal membuka jendela baru untuk mencetak. Periksa popup blocker.');
                return;
            }
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();

            // Delay slightly to ensure resources are ready
            setTimeout(() => {
                try { printWindow.print(); } catch (e) { /* ignore print errors */ }
            }, 600);

            toast.success('Mempersiapkan rekap untuk dicetak.');
        } catch (err: any) {
            logger.error('Download tutoring report failed:', err);
            toast.error('Gagal menyiapkan rekap: ' + (err?.message || ''));
        }
    };

    // --- TUTORING HELPERS ---
    const [showAddTutoringSubject, setShowAddTutoringSubject] = useState(false);
    const [showAddTutoringTeacher, setShowAddTutoringTeacher] = useState(false);
    const [newTutoringSubject, setNewTutoringSubject] = useState({ name: '', classes: [], meetings: 10, status: 'Aktif' });
    const [newTutoringTeacher, setNewTutoringTeacher] = useState({ name: '', source: 'internal', subjectId: '', classId: '', scheduleDay: 'Senin', scheduleStart: '14:00', scheduleEnd: '15:00', username: '', password: '' });

    const handleAddTutoringSubject = () => {
        setTutoringSubjects([...tutoringSubjects, { ...newTutoringSubject, id: Date.now(), classes: newTutoringSubject.classes || [] }]);
        setShowAddTutoringSubject(false);
        setNewTutoringSubject({ name: '', classes: [], meetings: 10, status: 'Aktif' });
    };

    const [editingTutoringTeacherId, setEditingTutoringTeacherId] = useState<number | null>(null);

    const handleAddTutoringTeacher = () => {
        const subject = tutoringSubjects.find(s => s.id.toString() === newTutoringTeacher.subjectId);

        if (editingTutoringTeacherId) {
            setTutoringTeachers(tutoringTeachers.map(t => t.id === editingTutoringTeacherId ? {
                ...t,
                ...newTutoringTeacher,
                subjectName: subject?.name || t.subjectName
            } : t));
            toast.success("Data guru diperbarui");
        } else {
            // Use provided credentials or generate
            const username = newTutoringTeacher.username || newTutoringTeacher.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 1000);
            const password = newTutoringTeacher.password || 'pass' + Math.floor(Math.random() * 1000);

            setTutoringTeachers([...tutoringTeachers, {
                ...newTutoringTeacher,
                id: Date.now(),
                subjectName: subject?.name || '-',
                studentsCount: 0,
                status: 'Aktif',
                username,
                password
            }]);
            toast.success("Guru berhasil ditambahkan");
        }
        setShowAddTutoringTeacher(false);
        setNewTutoringTeacher({ name: '', source: 'internal', subjectId: '', classId: '', scheduleDay: 'Senin', scheduleStart: '14:00', scheduleEnd: '15:00', username: '', password: '' });
        setEditingTutoringTeacherId(null);
    };

    const handleEditTutoringTeacher = (t: any) => {
        setEditingTutoringTeacherId(t.id);
        setNewTutoringTeacher({
            name: t.name,
            source: 'internal',
            subjectId: t.subjectId.toString(),
            classId: t.classId,
            scheduleDay: t.scheduleDay,
            scheduleStart: t.scheduleStart,
            scheduleEnd: t.scheduleEnd,
            username: t.username,
            password: t.password
        } as any);
        setShowAddTutoringTeacher(true);
    };

    const handleDeleteTutoringTeacher = (id: number) => {
        setConfirmModal({
            show: true,
            message: "Hapus data guru bimbel ini?",
            onConfirm: () => {
                setTutoringTeachers(tutoringTeachers.filter(t => t.id !== id));
                setConfirmModal({ show: false, message: '', onConfirm: () => { } });
                toast.success("Guru bimbel berhasil dihapus");
            }
        });
    };

    // --- MANAGE TUTORING STUDENTS ---
    const [showManageTutoringStudentsModal, setShowManageTutoringStudentsModal] = useState(false);
    const [selectedTutoringGroup, setSelectedTutoringGroup] = useState<any>(null);

    const handleManageTutoringStudents = (group: any) => {
        setSelectedTutoringGroup(group);
        setShowManageTutoringStudentsModal(true);
    };

    const handleAddStudentToTutoring = (studentId: number) => {
        if (!selectedTutoringGroup) return;
        if (tutoringEnrollments.some(e => e.groupId === selectedTutoringGroup.id && e.studentId === studentId)) return;

        setTutoringEnrollments([...tutoringEnrollments, { groupId: selectedTutoringGroup.id, studentId }]);
        toast.success("Siswa berhasil ditambahkan ke bimbingan!");
    };

    const handleRemoveStudentFromTutoring = (studentId: number) => {
        if (!selectedTutoringGroup) return;
        setTutoringEnrollments(tutoringEnrollments.filter(e => !(e.groupId === selectedTutoringGroup.id && e.studentId === studentId)));
        toast.success("Siswa dihapus dari bimbingan.");
    };


    // Derived State for Classes (Syncs with Teachers & Students) - Memoized for performance
    const derivedClasses = React.useMemo(() => {
        return classes.map(cls => {
            // Find teacher who is assigned as wali for this class
            const waliGuru = teachers.find(t =>
                t.wali && cls.nama &&
                String(t.wali).trim().toLowerCase() === String(cls.nama).trim().toLowerCase()
            );
            // Count students in this class
            const studentCount = students.filter(s =>
                s.kelas && cls.nama &&
                String(s.kelas).trim().toLowerCase() === String(cls.nama).trim().toLowerCase()
            ).length;

            return {
                ...cls,
                wali: waliGuru ? waliGuru.nama : 'Belum Ditentukan',
                siswa: studentCount
            };
        });
    }, [classes, teachers, students]);



    // ... (rest of menuItems and useEffect) ...






    const handleAddGroup = () => {
        setShowGroupModal(true);
    };

    const handleAddLesson = () => {
        setSelectedLevels([]);
        setShowSubjectModal(true);
    };

    const confirmAddGroup = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const name = (form.elements.namedItem('groupName') as HTMLInputElement).value;
        const reportType = (form.elements.namedItem('reportType') as HTMLSelectElement).value as 'resmi' | 'yayasan';
        if (name) {
            setSubjectGroups([...subjectGroups, { id: Date.now(), name, reportType } as any]);
            toast.success("Kelompok berhasil ditambahkan!");
            form.reset();
        }
    };

    const confirmAddSubject = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const name = (form.elements.namedItem('subjectName') as HTMLInputElement).value;
        const code = (form.elements.namedItem('subjectCode') as HTMLInputElement).value;
        const level = uiState.selectedLevels.length > 0
            ? (uiState.selectedLevels.includes("Semua Tingkat") ? "Semua Tingkat" : `Tingkat ${uiState.selectedLevels.sort().join(', ')}`)
            : "Semua Tingkat";
        const group = (form.elements.namedItem('subjectGroup') as HTMLSelectElement).value;

        setSubjects([...subjects, { id: Date.now(), name, code, level, group }]);
        toast.success("Mata pelajaran berhasil ditambahkan!");
        setShowSubjectModal(false);
    };

    const handleDeleteGroup = (id: number) => {
        setConfirmModal({
            show: true,
            message: "Hapus kelompok ini?",
            onConfirm: () => {
                setSubjectGroups(subjectGroups.filter(g => g.id !== id));
                setConfirmModal({ show: false, message: '', onConfirm: () => { } });
                toast.success("Kelompok berhasil dihapus");
            }
        });
    };

    const handleAddPosition = () => {
        setEditItem(null);
        setEditType('Jabatan');
        setShowPositionModal(true);
    };

    const confirmAddPosition = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const nama = (form.elements.namedItem('positionName') as HTMLInputElement).value;
        const kategori = (form.elements.namedItem('positionCategory') as HTMLSelectElement).value;

        if (nama && kategori) {
            if (uiState.editItem && uiState.editType === 'Jabatan') {
                setPositions(positions.map(p => p.id === uiState.editItem.id ? { ...p, nama, kategori } : p));
                toast.success("Jabatan berhasil diperbarui");
            } else {
                setPositions([...positions, { id: Date.now(), nama, kategori }]);
                toast.success("Jabatan berhasil ditambahkan");
            }
            setShowPositionModal(false);
            setEditItem(null);
            setEditType('');
        }
    }

    const handleDeletePosition = (id: number) => {
        setConfirmModal({
            show: true,
            message: 'Apakah anda yakin ingin menghapus jabatan ini?',
            onConfirm: () => {
                setPositions(positions.filter(p => p.id !== id));
                toast.success("Jabatan berhasil dihapus");
                setConfirmModal({ show: false, message: '', onConfirm: () => { } });
            }
        });
    }

    const handleAddTeacher = () => {
        setShowTeacherModal(true);
    };

    const handleSaveTeacher = async () => {
        if (!uiState.newTeacher.nama || !uiState.newTeacher.nip) {
            toast.error("Nama dan NIP wajib diisi!");
            return;
        }

        const teacherToSave = {
            id: uiState.editItem ? uiState.editItem.id : Date.now(),
            nama: uiState.newTeacher.nama,
            nip: uiState.newTeacher.nip,
            jabatan: uiState.newTeacher.jabatan,
            mapel: uiState.newTeacher.jabatan === 'Guru Mata Pelajaran' ? uiState.newTeacher.mapel : '-',
            wali: uiState.newTeacher.jabatan === 'Guru Kelas' || uiState.newTeacher.jabatan === 'Wali Kelas' ? uiState.newTeacher.class : '-',
            username: uiState.newTeacher.nip.trim(),
            password: uiState.newTeacher.nip.trim()
        };

        if (uiState.editItem && uiState.editType === 'Teacher') {
            await updateTeacher(uiState.editItem.id, teacherToSave);
        } else {
            await addTeacher(teacherToSave);
        }

        setShowTeacherModal(false);
        setEditItem(null);
        setEditType('');
        setNewTeacher({ nama: '', nip: '', jabatan: 'Guru Mata Pelajaran', mapel: '', class: '' });
    };

    const handleDeleteTeacher = (id: number) => {
        setConfirmModal({
            show: true,
            message: "Apakah anda yakin ingin menghapus data guru ini?",
            onConfirm: () => {
                deleteTeacher(id);
                setConfirmModal({ show: false, message: '', onConfirm: () => { } });
                toast.success("Data guru berhasil dihapus");
            }
        });
    };

    // --- GENERIC EDIT HANDLER ---
    const handleEditItem = (item: any, type: string) => {
        setEditItem(item);
        setEditType(type);
        if (type === 'Mata Pelajaran') {
            // Implement logic to edit subject
            toast(`Edit Mapel: ${item.name} (Fitur segera hadir)`, { icon: '🚧' });
        } else if (type === 'Teacher') {
            setNewTeacher({
                nama: item.nama,
                nip: item.nip,
                jabatan: item.jabatan,
                mapel: item.mapel,
                class: item.wali
            });
            // We might need to handle ID tracking for update vs add
            setShowTeacherModal(true);
        } else if (type === 'Jabatan') {
            // Logic for position
            setShowPositionModal(true);
        }
    };

    // --- JADWAL HANDLERS ---
    const handleDragStart = (e: React.DragEvent, type: string, id: number | string, name: string) => {
        e.dataTransfer.setData('type', type);
        e.dataTransfer.setData('id', id.toString());
        e.dataTransfer.setData('name', name);
        setDraggedItem({ type, id, name });
    };

    const handleScheduleDrop = (e: React.DragEvent, day: string, period: number) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('type');
        const idStr = e.dataTransfer.getData('id');
        const name = e.dataTransfer.getData('name');

        let subjectId: number | string = idStr;
        if (type === 'subject') subjectId = parseInt(idStr);

        // Add to schedule
        const newItem: ScheduleItem = {
            id: Date.now().toString(),
            classId: uiState.selectedJadwalClass,
            day,
            period,
            subjectId: subjectId,
            customName: type === 'custom' ? name : undefined
        };

        const newSchedules = schedules.map(s => {
            if (s.id === activeScheduleId) {
                // Remove existing item in this slot if any
                const filteredItems = s.items.filter(i => !(i.classId === uiState.selectedJadwalClass && i.day === day && i.period === period));
                return { ...s, items: [...filteredItems, newItem] };
            }
            return s;
        });

        setSchedules(newSchedules);
        setDraggedItem(null);
    };

    const handleDeleteScheduleItem = (itemId: string) => {
        setSchedules(schedules.map(s => {
            if (s.id === activeScheduleId) {
                return { ...s, items: s.items.filter(i => i.id !== itemId) };
            }
            return s;
        }));
    };

    const getConflictingItem = (item: ScheduleItem) => {
        if (typeof item.subjectId === 'string') return null; // Ignore custom items for conflict now

        // 1. Get Teacher for this item
        const assignment = teacherAssignments.find(ta => ta.classNama === item.classId && ta.subjectIds.includes(item.subjectId as number));
        if (!assignment) return null; // No teacher assigned yet

        // 2. Search for other items with SAME teacher at SAME time
        const schedule = schedules.find(s => s.id === activeScheduleId);
        if (!schedule) return null;

        return schedule.items.find(other => {
            if (other.id === item.id) return false; // Self
            if (other.day !== item.day || other.period !== item.period) return false; // Different time

            // Check teacher
            if (typeof other.subjectId === 'string') return false;
            const otherAssignment = teacherAssignments.find(ta => ta.classNama === other.classId && ta.subjectIds.includes(other.subjectId as number));

            return otherAssignment?.teacherId?.toString() === assignment.teacherId?.toString();
        });
    };

    const handlePublishSchedule = async () => {
        const newSchedules = schedules.map(s => s.id === activeScheduleId ? { ...s, status: 'published' as const } : s);
        await saveSchedulesToSupabase(newSchedules);
        toast.success("Jadwal Berhasil Dipublikasikan!");
    };

    const handleUnpublishSchedule = () => {
        setSchedules(schedules.map(s => s.id === activeScheduleId ? { ...s, status: 'draft' } : s));
    };

    const handleDeleteSemester = () => {
        if (schedules.length <= 1) {
            toast.error("Tidak dapat menghapus semester terakhir. Minimal harus ada satu semester.");
            return;
        }

        setConfirmModal({
            show: true,
            message: "Apakah anda yakin ingin menghapus SEMESTER ini beserta seluruh jadwalnya? Tindakan ini tidak dapat dibatalkan.",
            onConfirm: () => {
                const newSchedules = schedules.filter(s => s.id !== activeScheduleId);
                setSchedules(newSchedules);
                setActiveScheduleId(newSchedules[0].id);
                toast.success("Semester berhasil dihapus.");
                setConfirmModal({ show: false, message: '', onConfirm: () => { } });
            }
        });
    };

    const handleResetClassSchedule = () => {
        setConfirmModal({
            show: true,
            message: `Reset semua jadwal untuk Kelas ${uiState.selectedJadwalClass} di semester ini?`,
            onConfirm: () => {
                setSchedules(schedules.map(s => {
                    if (s.id === activeScheduleId) {
                        return { ...s, items: s.items.filter(i => i.classId !== uiState.selectedJadwalClass) };
                    }
                    return s;
                }));
                toast.success(`Jadwal Kelas ${uiState.selectedJadwalClass} dikosongkan.`);
                setConfirmModal({ show: false, message: '', onConfirm: () => { } });
            }
        });
    };

    const confirmAddTime = (e: React.FormEvent) => {
        e.preventDefault();
        if (!uiState.newPeriodData.start || !uiState.newPeriodData.end) {
            toast.error("Jam mulai dan selesai wajib diisi!");
            return;
        }

        const newId = schedulePeriods.length > 0
            ? Math.max(...schedulePeriods.map(p => p.id)) + 1
            : 1;

        const newPeriod: Period = {
            id: newId,
            start: uiState.newPeriodData.start,
            end: uiState.newPeriodData.end
        };

        setSchedulePeriods([...schedulePeriods, newPeriod].sort((a, b) => a.start.localeCompare(b.start)));
        setShowTimeModal(false);
        setNewPeriodData({ start: '', end: '' });
        toast.success("Jam pelajaran berhasil ditambahkan!");
    };

    const handleDailyInfoChange = (day: string, field: 'seragam' | 'catatan', value: string) => {
        setSchedules(schedules.map(s => {
            if (s.id === activeScheduleId) {
                // Find existing daily info
                const existingInfoIndex = s.dailyInfos?.findIndex(info => info.classId === uiState.selectedJadwalClass && info.day === day);
                let newDailyInfos = s.dailyInfos ? [...s.dailyInfos] : [];

                if (existingInfoIndex !== undefined && existingInfoIndex !== -1) {
                    newDailyInfos[existingInfoIndex] = { ...newDailyInfos[existingInfoIndex], [field]: value };
                } else {
                    newDailyInfos.push({ classId: uiState.selectedJadwalClass, day, [field]: value });
                }
                return { ...s, dailyInfos: newDailyInfos };
            }
            return s;
        }));
    };

    const confirmAddSemester = (e: React.FormEvent) => {
        e.preventDefault();
        if (!uiState.newSemesterName) {
            toast.error("Nama semester wajib diisi!");
            return;
        }

        const newSemester: MasterSchedule = {
            id: Date.now(),
            name: uiState.newSemesterName,
            status: 'draft',
            items: [],
            dailyInfos: []
        };

        setSchedules([...schedules, newSemester]);
        setActiveScheduleId(newSemester.id);
        setShowSemesterModal(false);
        setNewSemesterName('');
        toast.success(`Semester "${uiState.newSemesterName}" berhasil dibuat!`, {
            icon: '📅',
            style: {
                borderRadius: '16px',
                background: '#333',
                color: '#fff',
            }
        });
    };

    return (
        <div className="flex h-screen bg-[#F4F7FE] font-sans text-slate-800 overflow-hidden">
            <Toaster
                position="top-center"
                reverseOrder={false}
                gutter={12}
                toastOptions={{
                    className: 'modern-toast',
                    duration: 3000,
                    style: {
                        background: 'rgba(30, 41, 59, 0.95)',
                        color: '#fff',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '24px',
                        padding: '12px 24px',
                        fontSize: '14px',
                        fontWeight: '600',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    },
                    success: {
                        iconTheme: {
                            primary: '#10B981',
                            secondary: '#fff',
                        },
                        style: {
                            borderLeft: '4px solid #10B981',
                        }
                    },
                    error: {
                        iconTheme: {
                            primary: '#EF4444',
                            secondary: '#fff',
                        },
                        style: {
                            borderLeft: '4px solid #EF4444',
                        }
                    },
                }}
            />
            {/* SIDEBAR */}
            <Sidebar
                isSidebarOpen={uiState.isSidebarOpen}
                setSidebarOpen={(open: boolean) => dispatch({ type: 'SET_SIDEBAR_OPEN', payload: open })}
                activeView={uiState.activeView}
                setActiveView={(view: string) => dispatch({ type: 'SET_ACTIVE_VIEW', payload: view })}
                onLogout={onLogout}
                user={user}
                schoolSettings={schoolSettings}
            />

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex overflow-hidden p-6 gap-6">

                <main className="flex-1 flex flex-col gap-6 overflow-hidden pr-2">


                    {/* --- VIEW: DASHBOARD HOME --- */}
                    {uiState.activeView === 'dashboard' && (
                        <DashboardHome
                            students={students}
                            teachers={teachers}
                            classes={classes}
                            attendanceData={attendanceData}
                            setActiveView={setActiveView}
                        />
                    )}

                    {/* --- VIEW: DATA SISWA & KELAS --- */}
                    {uiState.activeView === 'data_siswa' && (
                        <DataSiswaView setActiveView={setActiveView} />
                    )}

                    {/* --- VIEW: CETAK KARTU LOGIN --- */}
                    {uiState.activeView === 'cetak_kartu_login' && (
                        <CetakKartuLoginView setActiveView={setActiveView} students={students} classes={classes} schoolSettings={schoolSettings} />
                    )}

                    {/* --- VIEW: TAMBAH KELAS --- */}
                    {uiState.activeView === 'tambah_kelas_view' && (
                        <TambahKelasView
                            setActiveView={setActiveView}
                            classes={classes}
                            setClasses={setClasses}
                            teachers={teachers}
                            students={students}
                            setShowAddClassModal={setShowAddClassModal}
                            setConfirmModal={setConfirmModal}
                            handleSaveClasses={handleSaveClasses}
                        />
                    )}

                    {/* --- VIEW: UPLOAD SISWA BARU (MODERN TABLE + FILTER KELAS 1) --- */}
                    {uiState.activeView === 'upload_kelas_satu_view' && (
                        <UploadKelasSatuView
                            setActiveView={setActiveView}
                            handleDownloadTemplate={handleDownloadTemplate}
                            handleUploadClick={handleUploadClick}
                            handleSaveData={handleSaveData}
                            students={students}
                            handleViewStudent={handleViewStudent}
                            handleEditStudent={handleEditStudent}
                            handleDelete={handleDelete}
                            classes={classes}
                        />
                    )}

                    {/* --- VIEW: UPLOAD SISWA VIEW (MODERN TABLE) --- */}
                    {uiState.activeView === 'upload_siswa_view' && (
                        <UploadSiswaView
                            setActiveView={setActiveView}
                            handleDownloadTemplate={handleDownloadTemplate}
                            handleUploadClick={handleUploadClick}
                            handleSaveData={handleSaveData}
                            students={students}
                            handleViewStudent={handleViewStudent}
                            handleEditStudent={handleEditStudent}
                            handleDelete={handleDelete}
                        />
                    )}

                    {/* --- VIEW: UPLOAD PERKELAS VIEW (MODERN TABLE + FILTER) --- */}
                    {uiState.activeView === 'upload_perkelas_view' && (
                        <UploadPerKelasView
                            setActiveView={setActiveView}
                            handleDownloadTemplate={handleDownloadTemplate}
                            handleUploadClick={handleUploadClick}
                            handleSaveData={handleSaveData}
                            students={students}
                            handleViewStudent={handleViewStudent}
                            handleEditStudent={handleEditStudent}
                            handleDelete={handleDelete}
                            classes={classes}
                            handleAddStudent={handleAddStudent}
                        />
                    )}

                    {/* --- VIEW: DATA GURU & STAFF (Refactored) --- */}
                    {uiState.activeView === 'data_guru' && (
                        <GuruStaffView setActiveView={setActiveView} />
                    )}

                    {/* --- VIEW: TAMBAH DATA GURU (Refactored) --- */}
                    {uiState.activeView === 'tambah_guru_view' && (
                        <TeacherDataView
                            teachers={teachers}
                            setTeachers={setTeachers}
                            positions={positions}
                            setActiveView={setActiveView}
                            handleDownloadTemplate={handleDownloadTemplateTeacher}
                            handleUploadClick={handleUploadClickTeacher}
                            handleAddTeacher={handleAddTeacher}
                            handleSaveData={handleSaveDataTeacher}
                            handleEditItem={handleEditItem}
                            handleDeleteTeacher={handleDeleteTeacher}
                            classes={classes}
                        />
                    )}

                    {/* --- VIEW: TAMBAH MATA PELAJARAN --- */}
                    {/* --- VIEW: TAMBAH MATA PELAJARAN & KELOLA MAPEL (Refactored) --- */}
                    {(uiState.activeView === 'mapel' || uiState.activeView === 'tambah_mapel_view') && (
                        <MataPelajaranView
                            mapelViewMode={uiState.mapelViewMode}
                            setMapelViewMode={setMapelViewMode}
                            teacherAssignments={teacherAssignments}
                            setTeacherAssignments={setTeacherAssignments}
                            teachers={teachers}
                            subjects={subjects}
                            handleAddGroup={handleAddGroup}
                            setShowSubjectModal={setShowSubjectModal}
                            setShowPlottingModal={setShowPlottingModal}
                            handleEditItem={handleEditItem}
                            setActiveView={setActiveView}
                        />
                    )}




                    {/* --- VIEW: TAMBAH JABATAN (Refactored) --- */}
                    {
                        uiState.activeView === 'tambah_jabatan_view' && (
                            <JabatanView
                                positions={positions}
                                handleAddPosition={handleAddPosition}
                                handleEditItem={handleEditItem}
                                handleDeletePosition={handleDeletePosition}
                                setActiveView={setActiveView}
                            />
                        )
                    }




                    {/* --- VIEW: JADWAL PELAJARAN --- */}
                    {uiState.activeView === 'jadwal' && (
                        <JadwalPelajaranView
                            activeView={uiState.activeView}
                            selectedJadwalLevel={uiState.selectedJadwalLevel}
                            setSelectedJadwalLevel={setSelectedJadwalLevel}
                            selectedJadwalClass={uiState.selectedJadwalClass}
                            setSelectedJadwalClass={setSelectedJadwalClass}
                            activeScheduleId={activeScheduleId}
                            setActiveScheduleId={setActiveScheduleId}
                            schedules={schedules}
                            classes={classes}
                            subjects={subjects}
                            teacherAssignments={teacherAssignments}
                            teachers={teachers}
                            schedulePeriods={schedulePeriods}
                            setSchedulePeriods={setSchedulePeriods}
                            setShowSemesterModal={setShowSemesterModal}
                            setShowTimeModal={setShowTimeModal}
                            handleDeleteSemester={handleDeleteSemester}
                            handleResetClassSchedule={handleResetClassSchedule}
                            handlePublishSchedule={handlePublishSchedule}
                            handleDragStart={handleDragStart}
                            handleScheduleDrop={handleScheduleDrop}
                            handleDeleteScheduleItem={handleDeleteScheduleItem}
                            handleDailyInfoChange={handleDailyInfoChange}
                            getConflictingItem={getConflictingItem}
                            handleSaveSchedules={() => saveSchedulesToSupabase(schedules)}
                        />
                    )}


                    {/* --- VIEW: ABSENSI SISWA --- */}
                    {uiState.activeView === 'absen' && (
                        <AbsensiView
                            activeView={uiState.activeView}
                            absenClass={absenClass}
                            setAbsenClass={setAbsenClass}
                            absenSemester={absenSemester}
                            setAbsenSemester={setAbsenSemester}
                            absenDate={absenDate}
                            setAbsenDate={setAbsenDate}
                            absenMode={absenMode}
                            setAbsenMode={setAbsenMode}
                            absenSearchQuery={absenSearchQuery}
                            setAbsenSearchQuery={setAbsenSearchQuery}
                            attendanceData={attendanceData}
                            setAttendanceData={setAttendanceData}
                            saveAttendance={saveAttendance}
                            students={students}
                            classes={classes}
                            subjects={subjects}
                        />
                    )}


                    {/* --- VIEW: KELAS DAN WALI KELAS --- */}
                    {
                        uiState.activeView === 'kelas_wali' && (
                            <div className="bg-white rounded-[2.5rem] p-4 h-full shadow-sm animate-in fade-in flex flex-col">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                                    <div className="flex items-center gap-3">
                                        <School size={28} className="text-blue-800" />
                                        <h2 className="text-xl font-bold text-[#1E1B4B]">Data Kelas & Wali kelas</h2>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setShowAddClassModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-all border border-blue-200">
                                            <Plus size={18} /> Tambah Kelas
                                        </button>
                                        <button onClick={handleSaveClasses} className="flex items-center gap-2 px-5 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-200">
                                            <Save size={18} /> Simpan
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-auto rounded-[1.5rem] border border-slate-200 shadow-inner bg-slate-50/50">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-[#F1F5F9] text-slate-700 font-bold sticky top-0 z-10 shadow-sm">
                                            <tr>
                                                <th className="p-4 border-r border-slate-200 text-center w-16">No</th>
                                                <th className="p-4 border-r border-slate-200">Nama Kelas</th>
                                                <th className="p-4 border-r border-slate-200 text-center">Tingkat</th>
                                                <th className="p-4 border-r border-slate-200 text-center">Paralel</th>
                                                <th className="p-4 border-r border-slate-200">Wali Kelas</th>
                                                <th className="p-4 border-r border-slate-200 text-center">Jumlah Siswa</th>
                                                <th className="p-4 text-center">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-100">
                                            {classes.map((kelas, i) => {
                                                const waliGuru = teachers.find(t =>
                                                    t.wali && kelas.nama &&
                                                    String(t.wali).trim().toLowerCase() === String(kelas.nama).trim().toLowerCase()
                                                );
                                                const studentCount = students.filter(s =>
                                                    s.kelas && kelas.nama &&
                                                    String(s.kelas).trim().toLowerCase() === String(kelas.nama).trim().toLowerCase()
                                                ).length;

                                                return (
                                                    <tr key={kelas.id} className="hover:bg-blue-50/50 transition-colors">
                                                        <td className="p-4 text-center text-slate-500 font-medium">{i + 1}</td>
                                                        <td className="p-4 font-bold text-slate-800">{kelas.nama}</td>
                                                        <td className="p-4 text-center text-slate-600">{kelas.tingkat}</td>
                                                        <td className="p-4 text-center text-slate-600">{kelas.paralel}</td>
                                                        <td className="p-4">
                                                            {waliGuru ? (
                                                                <span className="text-slate-700 font-medium">{waliGuru.nama}</span>
                                                            ) : (
                                                                <span className="text-red-500 italic text-xs font-bold bg-red-50 px-2 py-1 rounded-md">Belum Ada</span>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{studentCount} Siswa</span>
                                                        </td>
                                                        <td className="p-4 flex justify-center gap-2">
                                                            <button onClick={() => handleEditItem(kelas, 'Kelas')} className="p-2 hover:bg-blue-50 text-blue-500 rounded-lg group tooltip-trigger relative">
                                                                <Edit size={16} />
                                                            </button>
                                                            <button onClick={() => handleDeleteClass(kelas.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )
                    }

                    {/* --- VIEW: JADWAL UJIAN --- */}
                    {uiState.activeView === 'ujian' && (
                        <JadwalUjianView
                            subjects={subjects}
                            classes={classes}
                            examSchedules={examSchedules}
                            saveExams={saveExams}
                            setExamSchedules={setExamSchedules}
                            setConfirmModal={setConfirmModal}
                        />
                    )}



                    {/* --- VIEW: RAPOT --- */}
                    {
                        uiState.activeView === 'rapot' && (
                            <RaporDashboardView
                                students={students}
                                classes={classes}
                                derivedClasses={derivedClasses}
                                setActiveView={setActiveView}
                                setSelectedClass={setSelectedClass}
                                toast={toast}
                            />
                        )
                    }

                    {/* --- VIEW: RAPOR PRINT (Detail Cetak) --- */}
                    {uiState.activeView === 'rapot_print' && (
                        <div className="bg-white rounded-[2.5rem] p-6 h-full shadow-sm animate-in fade-in overflow-hidden">
                            <RaporView
                                setActiveView={setActiveView}
                                students={students}
                                classes={classes}
                                subjects={subjects}
                                schoolSettings={schoolSettings}
                                teachers={teachers}
                            />
                        </div>
                    )}

                    {/* --- VIEW: RAPOR SETTINGS --- */}
                    {uiState.activeView === 'rapot_settings' && (
                        <div className="bg-white rounded-[2.5rem] p-6 h-full shadow-sm animate-in fade-in overflow-hidden">
                            <RaporSettingsView setActiveView={setActiveView} />
                        </div>
                    )}

                    {/* --- VIEW: INPUT NILAI (NEW) --- */}
                    {uiState.activeView === 'nilai' && (
                        <div className="h-full">
                            <NilaiView setActiveView={setActiveView} students={students} classes={classes} subjects={subjects} />
                        </div>
                    )}

                    {/* --- VIEW: KEUANGAN --- */}
                    {uiState.activeView === 'keuangan' && (
                        <KeuanganView students={students} classes={classes} />
                    )}

                    {/* --- VIEW: TABUNGAN --- */}
                    {uiState.activeView === 'tabungan' && (
                        <TabunganView />
                    )}


                    {
                        uiState.activeView === 'naik_kelas' && (
                            <div className="bg-[#F4F7FE] p-6 h-full overflow-y-auto">
                                <NaikKelasView
                                    students={students}
                                    classes={classes}
                                    updateStudents={updateStudents}
                                    handleSaveData={handleSaveData}
                                    setConfirmModal={setConfirmModal}
                                />
                            </div>
                        )
                    }


                    {/* --- VIEW: BIMBINGAN BELAJAR --- */}
                    {
                        uiState.activeView === 'bimbingan_belajar' && (
                            <div className="bg-[#F4F7FE] p-6 h-full overflow-y-auto">
                                <div className="animate-in fade-in space-y-6">
                                    {/* Header & Tabs */}
                                    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 relative overflow-hidden">
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-4 mb-8">
                                                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100">
                                                    <Book size={24} className="text-orange-600" />
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-bold text-slate-800">Bimbingan Belajar</h2>
                                                    <div className="flex items-center gap-4 mt-1">
                                                        <p className="text-slate-500 text-sm font-medium">Manajemen kelas tambahan dan materi bimbel.</p>
                                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg border border-emerald-100">
                                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
                                                            Auto-Sync Aktif
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                                                {[
                                                    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
                                                    { id: 'mapel', label: 'Mata Pelajaran', icon: <Book size={16} /> },
                                                    { id: 'guru', label: 'Guru Bimbel', icon: <UserCog size={16} /> },
                                                    { id: 'materi', label: 'Materi Kelas', icon: <FileText size={16} /> },
                                                ].map(tab => (
                                                    <button
                                                        key={tab.id}
                                                        onClick={() => setTutoringActiveTab(tab.id)}
                                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${tutoringActiveTab === tab.id
                                                            ? 'bg-orange-600 text-white shadow-lg shadow-orange-200'
                                                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100'
                                                            }`}
                                                    >
                                                        {tab.icon}
                                                        <span>{tab.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tab Content moved outside of dark header for better layout and interaction */}
                                    <div className="space-y-6">
                                        {/* 1. DASHBOARD */}
                                        {tutoringActiveTab === 'dashboard' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
                                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Mata Pelajaran</p>
                                                    <h3 className="text-3xl font-bold text-slate-800">{tutoringSubjects.length}</h3>
                                                </div>
                                                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
                                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Guru Bimbel</p>
                                                    <h3 className="text-3xl font-bold text-slate-800">{tutoringTeachers.length}</h3>
                                                </div>
                                                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
                                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Siswa</p>
                                                    <h3 className="text-3xl font-bold text-slate-800">
                                                        {tutoringEnrollments.length}
                                                    </h3>
                                                </div>
                                                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex flex-col gap-3">
                                                    <div>
                                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Materi Aktif</p>
                                                        <h3 className="text-3xl font-bold text-slate-800">{tutoringMaterials.length}</h3>
                                                    </div>
                                                    <div className="flex gap-2 mt-1">
                                                        <button
                                                            type="button"
                                                            onClick={handleDownloadTutoringReport}
                                                            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                                                        >
                                                            <FileText size={14} /> PDF Rekap
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (typeof window !== 'undefined') {
                                                                    window.print();
                                                                }
                                                            }}
                                                            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                                                        >
                                                            <Printer size={14} /> Cetak
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* 2. MATA PELAJARAN */}
                                        {tutoringActiveTab === 'mapel' && (
                                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                                    <h3 className="font-bold text-slate-800">Daftar Mata Pelajaran Bimbel</h3>
                                                    <button onClick={() => setShowAddTutoringSubject(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
                                                        <Plus size={18} /> Tambah Mapel
                                                    </button>
                                                </div>
                                                <table className="w-full text-left border-collapse">
                                                    <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                                        <tr>
                                                            <th className="p-4 border-b">Nama Mapel</th>
                                                            <th className="p-4 border-b">Untuk Kelas</th>
                                                            <th className="p-4 border-b text-center">Jml Pertemuan</th>
                                                            <th className="p-4 border-b text-center">Status</th>
                                                            <th className="p-4 border-b text-center">Aksi</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 text-sm">
                                                        {tutoringSubjects.map(s => (
                                                            <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                                                <td className="p-4 font-bold text-slate-700">{s.name}</td>
                                                                <td className="p-4 text-slate-600">
                                                                    <div className="flex gap-1 flex-wrap">
                                                                        {s.classes.map(c => <span key={c} className="px-2 py-0.5 bg-slate-100 rounded text-xs border border-slate-200">{c}</span>)}
                                                                    </div>
                                                                </td>
                                                                <td className="p-4 text-center font-bold text-slate-700">{s.meetings}x</td>
                                                                <td className="p-4 text-center">
                                                                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${s.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{s.status}</span>
                                                                </td>
                                                                <td className="p-4 text-center">
                                                                    <div className="flex justify-center gap-3">
                                                                        <button
                                                                            onClick={() => {
                                                                                setNewTutoringSubject({
                                                                                    name: s.name,
                                                                                    classes: s.classes,
                                                                                    meetings: s.meetings
                                                                                });
                                                                                setEditItem(s);
                                                                                setEditType('SubjectBimbel');
                                                                                setShowAddTutoringSubject(true);
                                                                            }}
                                                                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                                        >
                                                                            <SquarePen size={18} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setConfirmModal({
                                                                                show: true,
                                                                                message: `Hapus mata pelajaran ${s.name}?`,
                                                                                onConfirm: () => {
                                                                                    setTutoringSubjects(prev => prev.filter(item => item.id !== s.id));
                                                                                    toast.success("Mapel berhasil dihapus");
                                                                                    setConfirmModal(prev => ({ ...prev, show: false }));
                                                                                }
                                                                            })}
                                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                        >
                                                                            <Trash2 size={18} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        {/* 3. GURU BIMBEL */}
                                        {tutoringActiveTab === 'guru' && (
                                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                                    <h3 className="font-bold text-slate-800">Data Guru Pengajar</h3>
                                                    <button onClick={() => setShowAddTutoringTeacher(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
                                                        <Plus size={18} /> Tambah Guru
                                                    </button>
                                                </div>
                                                <table className="w-full text-left border-collapse">
                                                    <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                                        <tr>
                                                            <th className="p-4 border-b">Nama Lengkap</th>
                                                            <th className="p-4 border-b">Kelas Bimbingan</th>
                                                            <th className="p-4 border-b">Username</th>
                                                            <th className="p-4 border-b">Password</th>
                                                            <th className="p-4 border-b text-center">Aksi</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 text-sm">
                                                        {tutoringTeachers.map(t => (
                                                            <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                                                <td className="p-4 font-bold text-slate-700">{t.name}</td>
                                                                <td className="p-4 text-slate-600">
                                                                    <div className="font-bold">{t.subjectName}</div>
                                                                    <div className="text-xs text-slate-400">Kelas {t.classId}</div>
                                                                    <div className="text-xs text-slate-500 mt-1">{t.scheduleDay}, {t.scheduleStart}-{t.scheduleEnd}</div>
                                                                </td>
                                                                <td className="p-4 font-mono text-slate-600 bg-slate-50/50">{t.username || '-'}</td>
                                                                <td className="p-4 font-mono text-slate-600 bg-slate-50/50">{t.password || '-'}</td>
                                                                <td className="p-4 text-center">
                                                                    <div className="flex justify-center gap-3">
                                                                        <button
                                                                            onClick={() => {
                                                                                handleManageTutoringStudents(t);
                                                                            }}
                                                                            className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                                                                            title="Kelola Siswa"
                                                                        >
                                                                            <UserPlus size={18} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                setNewTutoringTeacher({
                                                                                    name: t.name,
                                                                                    source: t.source || 'Internal',
                                                                                    subjectId: t.subjectId,
                                                                                    subjectName: t.subjectName,
                                                                                    classId: t.classId,
                                                                                    scheduleDay: t.scheduleDay,
                                                                                    scheduleStart: t.scheduleStart,
                                                                                    scheduleEnd: t.scheduleEnd,
                                                                                    username: t.username,
                                                                                    password: t.password,
                                                                                    studentsCount: t.studentsCount,
                                                                                    status: t.status
                                                                                });
                                                                                setEditItemLocal(t);
                                                                                setEditTypeLocal('TeacherBimbel');
                                                                                setShowAddTutoringTeacher(true);
                                                                            }}
                                                                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                                            title="Edit"
                                                                        >
                                                                            <SquarePen size={18} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setConfirmModal({
                                                                                show: true,
                                                                                message: `Hapus guru ${t.name}?`,
                                                                                onConfirm: () => {
                                                                                    setTutoringTeachers(prev => prev.filter(item => item.id !== t.id));
                                                                                    toast.success("Guru berhasil dihapus");
                                                                                    setConfirmModal(prev => ({ ...prev, show: false }));
                                                                                }
                                                                            })}
                                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                            title="Hapus"
                                                                        >
                                                                            <Trash2 size={18} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        {/* 4. MATERI KELAS */}
                                        {tutoringActiveTab === 'materi' && (
                                            <div className="space-y-6">
                                                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                                    <div className="p-5 border-b border-slate-100 bg-slate-50">
                                                        <h3 className="font-bold text-slate-800">Materi Pembelajaran Aktif</h3>
                                                    </div>
                                                    <table className="w-full text-left border-collapse">
                                                        <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                                            <tr>
                                                                <th className="p-4 border-b">Guru & Mapel</th>
                                                                <th className="p-4 border-b">Detail Materi</th>
                                                                <th className="p-4 border-b">Konten</th>
                                                                <th className="p-4 border-b text-center">Aksi</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 text-sm">
                                                            {tutoringMaterials.map(m => (
                                                                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                                                                    <td className="p-4">
                                                                        <div className="font-bold text-slate-700">
                                                                            {tutoringTeachers.find(t => t.id === m.teacherId)?.name || 'Guru Bimbel'}
                                                                        </div>
                                                                        <div className="text-xs text-slate-500">{m.subjectName}</div>
                                                                    </td>
                                                                    <td className="p-4">
                                                                        <div className="font-bold text-slate-700">Pertemuan {m.meeting}</div>
                                                                        <div className="text-xs text-slate-500">{m.title}</div>
                                                                    </td>
                                                                    <td className="p-4 text-slate-600">
                                                                        <div className="flex gap-2">
                                                                            {m.videoUrl && <span className="bg-red-50 text-red-600 px-2 py-1 rounded text-xs border border-red-100 flex items-center gap-1"><Video size={12} /> Video</span>}
                                                                            {m.fileUrl && <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs border border-blue-100 flex items-center gap-1"><FileText size={12} /> File</span>}
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-4 text-center">
                                                                        <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">Lihat Detail</button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {/* --- VIEW: PENGUMUMAN --- */}
                    {uiState.activeView === 'pengumuman' && <PengumumanView />}

                    {/* --- VIEW: LAPORAN --- */}
                    {uiState.activeView === 'laporan' && <LaporanView />}

                    {/* --- VIEW: MULTIMEDIA --- */}
                    {uiState.activeView === 'multimedia' && <MultimediaView />}

                    {/* --- VIEW: PENGATURAN --- */}
                    {/* --- VIEW: PENGATURAN --- */}
                    {uiState.activeView === 'settings' && <SettingsView schoolSettings={schoolSettings} setSchoolSettings={setSchoolSettings} />}

                    {/* --- VIEW: AI MANAGEMENT --- */}
                    {
                        uiState.activeView === 'ai_management' && (
                            <div className="bg-white rounded-[2.5rem] p-6 h-full shadow-sm animate-in fade-in overflow-hidden">
                                <AIManagementView onBack={() => dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'dashboard' })} />
                            </div>
                        )
                    }



                    {/* MODAL INPUT KELAS */}
                    {
                        showAddClassModal && (
                            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in backdrop-blur-sm">
                                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8">
                                    <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                        <h3 className="font-bold text-lg text-slate-800">Input Kelas Baru</h3>
                                        <button onClick={() => setShowAddClassModal(false)}><X size={24} className="text-slate-400 hover:text-red-500" /></button>
                                    </div>


                                    <form onSubmit={(e) => {
                                        e.preventDefault();
                                        const form = e.currentTarget;
                                        const customName = (form.elements.namedItem('className') as HTMLInputElement).value;
                                        const tingkat = (form.elements.namedItem('tingkat') as HTMLSelectElement).value;
                                        const paralel = (form.elements.namedItem('paralel') as HTMLInputElement).value;

                                        if (handleAddClass(tingkat, paralel, customName)) {
                                            toast.success("Kelas berhasil ditambahkan");
                                        } else {
                                            toast.error("Mohon lengkapi Tingkat dan Paralel");
                                        }
                                    }} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Nama Kelas (Opsional)</label>
                                            <input name="className" className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white transition-colors outline-none focus:border-blue-500" placeholder="Contoh: 1A" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Tingkat</label>
                                                <select name="tingkat" className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none">
                                                    <option value="">Pilih</option>
                                                    {[1, 2, 3, 4, 5, 6].map(i => <option key={i} value={i}>{i}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Paralel</label>
                                                <input name="paralel" className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none" placeholder="Contoh: A" />
                                            </div>
                                        </div>

                                        <button type="submit" className="w-full py-4 mt-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">Simpan Kelas</button>
                                    </form>
                                </div>
                            </div>
                        )
                    }

                    {/* MODAL INPUT SISWA */}
                    {
                        showAddStudentModal && (
                            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in backdrop-blur-sm p-4">
                                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl p-8 max-h-[90vh] overflow-y-auto">
                                    <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                        <h3 className="font-bold text-lg text-slate-800">
                                            {modalMode === 'add' ? 'Tambah Siswa Baru' : modalMode === 'edit' ? 'Edit Data Siswa' : 'Detail Data Siswa'}
                                        </h3>
                                        <button onClick={() => setShowAddStudentModal(false)}><X size={24} className="text-slate-400 hover:text-red-500" /></button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 space-y-2" key={selectedStudent?.id || 'new'}>
                                        {/* Data Pribadi */}
                                        <div className="col-span-1 md:col-span-2">
                                            <h4 className="font-bold text-slate-600 mb-2 border-b pb-1">Data Pribadi</h4>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Nomor Induk Siswa (NIS)</label>
                                            <input disabled={modalMode === 'view'} value={selectedStudent?.nis || ''} onChange={e => setSelectedStudent({ ...selectedStudent, nis: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 transition-colors disabled:opacity-60" placeholder="Nomor Induk" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Nama Lengkap</label>
                                            <input disabled={modalMode === 'view'} value={selectedStudent?.nama || ''} onChange={e => setSelectedStudent({ ...selectedStudent, nama: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 transition-colors disabled:opacity-60" placeholder="Nama Lengkap Siswa" />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Jenis Kelamin</label>
                                            <div className="flex gap-4 p-2 bg-slate-50 rounded-xl border border-slate-200 h-[50px] items-center">
                                                <label className="flex items-center gap-2 cursor-pointer px-3 py-1 hover:bg-white rounded-lg transition-colors">
                                                    <input
                                                        type="radio"
                                                        disabled={modalMode === 'view'}
                                                        name="gender"
                                                        value="L"
                                                        checked={selectedStudent?.gender === 'L'}
                                                        onChange={() => setSelectedStudent({ ...selectedStudent, gender: 'L' })}
                                                        className="scale-125 accent-blue-600"
                                                    />
                                                    <span className="text-sm font-bold text-slate-700">Laki-laki</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer px-3 py-1 hover:bg-white rounded-lg transition-colors">
                                                    <input
                                                        type="radio"
                                                        disabled={modalMode === 'view'}
                                                        name="gender"
                                                        value="P"
                                                        checked={selectedStudent?.gender === 'P'}
                                                        onChange={() => setSelectedStudent({ ...selectedStudent, gender: 'P' })}
                                                        className="scale-125 accent-pink-600"
                                                    />
                                                    <span className="text-sm font-bold text-slate-700">Perempuan</span>
                                                </label>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Tempat Lahir</label>
                                            <input disabled={modalMode === 'view'} value={selectedStudent?.ttl?.split(',')[0] || ''} onChange={e => setSelectedStudent({ ...selectedStudent, ttl: `${e.target.value}, ${selectedStudent?.ttl?.split(',')[1] || ''}` })} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 transition-colors disabled:opacity-60" placeholder="Kota Kelahiran" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Tanggal Lahir</label>
                                            <input disabled={modalMode === 'view'} type="date" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 transition-colors disabled:opacity-60"
                                                onChange={e => {
                                                    const date = new Date(e.target.value);
                                                    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' };
                                                    const formatted = date.toLocaleDateString('id-ID', options);
                                                    const place = selectedStudent?.ttl?.split(',')[0] || '';
                                                    setSelectedStudent({ ...selectedStudent, ttl: `${place}, ${formatted}` });
                                                }} />
                                        </div>

                                        {/* Data Akademik */}
                                        <div className="col-span-1 md:col-span-2 mt-2">
                                            <h4 className="font-bold text-slate-600 mb-2 border-b pb-1">Data Akademik</h4>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Kelas</label>
                                            <select disabled={modalMode === 'view'} value={selectedStudent?.kelas || uiState.selectedClass} onChange={e => setSelectedStudent({ ...selectedStudent, kelas: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none disabled:opacity-60">
                                                <option>1A</option>
                                                <option>1B</option>
                                                <option>2</option>
                                                <option>3A</option>
                                                <option>4A</option>
                                                <option>5A</option>
                                                <option>6B</option>
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Tingkat</label>
                                                <select disabled={modalMode === 'view'} value={selectedStudent?.tingkat || "1"} onChange={e => setSelectedStudent({ ...selectedStudent, tingkat: parseInt(e.target.value) })} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none disabled:opacity-60">
                                                    {[1, 2, 3, 4, 5, 6].map(i => <option key={i} value={i}>{i}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Paralel</label>
                                                <input disabled={modalMode === 'view'} value={selectedStudent?.paralel || ''} onChange={e => setSelectedStudent({ ...selectedStudent, paralel: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none disabled:opacity-60" placeholder="A/B..." />
                                            </div>
                                        </div>

                                        {/* Data Orang Tua */}
                                        <div className="col-span-1 md:col-span-2 mt-2">
                                            <h4 className="font-bold text-slate-600 mb-2 border-b pb-1">Data Orang Tua</h4>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Nama Ayah</label>
                                            <input disabled={modalMode === 'view'} value={selectedStudent?.ayah || ''} onChange={e => setSelectedStudent({ ...selectedStudent, ayah: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 transition-colors disabled:opacity-60" placeholder="Nama Ayah" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Nama Ibu</label>
                                            <input disabled={modalMode === 'view'} value={selectedStudent?.ibu || ''} onChange={e => setSelectedStudent({ ...selectedStudent, ibu: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 transition-colors disabled:opacity-60" placeholder="Nama Ibu" />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Pekerjaan Ayah</label>
                                            <input disabled={modalMode === 'view'} value={selectedStudent?.jobAyah || ''} onChange={e => setSelectedStudent({ ...selectedStudent, jobAyah: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 transition-colors disabled:opacity-60" placeholder="Pekerjaan Ayah" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Pekerjaan Ibu</label>
                                            <input disabled={modalMode === 'view'} value={selectedStudent?.jobIbu || ''} onChange={e => setSelectedStudent({ ...selectedStudent, jobIbu: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 transition-colors disabled:opacity-60" placeholder="Pekerjaan Ibu" />
                                        </div>

                                        {/* Akun */}
                                        <div className="col-span-1 md:col-span-2 mt-2">
                                            <h4 className="font-bold text-slate-600 mb-2 border-b pb-1">Akun Siswa</h4>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Username</label>
                                            <input disabled={modalMode === 'view'} value={selectedStudent?.username || ''} onChange={e => setSelectedStudent({ ...selectedStudent, username: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 transition-colors disabled:opacity-60" placeholder="Username untuk login" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Password</label>
                                            <input disabled={modalMode === 'view'} value={selectedStudent?.password || '123456'} onChange={e => setSelectedStudent({ ...selectedStudent, password: e.target.value })} type="text" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 transition-colors disabled:opacity-60" placeholder="Password akun" />
                                        </div>
                                    </div>

                                    <div className="flex gap-4 mt-8">
                                        <button onClick={() => setShowAddStudentModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">{modalMode === 'view' ? 'Tutup' : 'Batal'}</button>
                                        {modalMode !== 'view' && (
                                            <button onClick={() => {
                                                if (modalMode === 'edit') {
                                                    toast.success('Perubahan disimpan (Mock Edit)!');
                                                    // Implement edit logic if needed, accessing setStudents
                                                } else {
                                                    if (selectedStudent.nama) {
                                                        const newStudent = {
                                                            id: Date.now(),
                                                            ...selectedStudent
                                                        };
                                                        addNewStudent(newStudent);
                                                        toast.success(`Siswa ${selectedStudent.nama} berhasil ditambahkan!`);
                                                    } else {
                                                        toast.error('Mohon isi nama siswa!');
                                                        return;
                                                    }
                                                }
                                                setShowAddStudentModal(false);
                                            }} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">Simpan Data</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {/* MODAL EDIT DATA UMUM */}
                    {
                        uiState.editItem && (
                            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in backdrop-blur-sm p-4">
                                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8">
                                    <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                        <h3 className="font-bold text-lg text-slate-800">Edit {uiState.editType}</h3>
                                        <button onClick={() => setEditItem(null)}><X size={24} className="text-slate-400 hover:text-red-500" /></button>
                                    </div>

                                    <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                        {Object.entries(uiState.editItem).map(([key, value]) => {
                                            if (key === 'id') return null; // Skip ID
                                            return (
                                                <div key={key}>
                                                    <label className="block text-sm font-bold text-slate-700 mb-1 ml-1 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                                                    <input
                                                        defaultValue={String(value)}
                                                        className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white transition-colors outline-none focus:border-blue-500"
                                                        placeholder={`Masukkan ${key}...`}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="flex gap-4 mt-6">
                                        <button onClick={() => setEditItem(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Batal</button>
                                        <button onClick={() => { toast.success(`Data ${uiState.editType} berhasil diperbarui!`); setEditItem(null); }} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">Simpan Perubahan</button>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {/* MODAL TAMBAH KELOMPOK */}
                    {
                        uiState.showGroupModal && (
                            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in backdrop-blur-sm p-4">
                                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg p-8">
                                    <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                        <h3 className="font-bold text-lg text-slate-800">Kelola Kelompok Mata Pelajaran</h3>
                                        <button onClick={() => setShowGroupModal(false)}><X size={24} className="text-slate-400 hover:text-red-500" /></button>
                                    </div>

                                    <form onSubmit={confirmAddGroup} className="flex gap-2 mb-6">
                                        <div className="flex-1 flex gap-2">
                                            <input name="groupName" required placeholder="Nama Kelompok Baru..." className="flex-1 p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 transition-colors" />
                                            <select name="reportType" className="p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 cursor-pointer w-[140px]">
                                                <option value="resmi">Rapor Resmi</option>
                                                <option value="yayasan">Rapor Yayasan</option>
                                            </select>
                                        </div>
                                        <button type="submit" className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md">Tambah</button>
                                    </form>

                                    <div className="max-h-[40vh] overflow-y-auto custom-scrollbar border rounded-xl">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50 sticky top-0">
                                                <tr>
                                                    <th className="p-3 border-b text-center w-12">No</th>
                                                    <th className="p-3 border-b">Nama Kelompok</th>
                                                    <th className="p-3 border-b text-center">Jenis Rapor</th>
                                                    <th className="p-3 border-b text-center">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {subjectGroups.map((g: any, i) => (
                                                    <tr key={g.id} className="border-b last:border-0 hover:bg-slate-50">
                                                        <td className="p-3 text-center text-slate-500">{i + 1}</td>
                                                        <td className="p-3 font-medium text-slate-700">{g.name}</td>
                                                        <td className="p-3 text-center">
                                                            <span className={`px-2 py-1 rounded text-xs font-bold ${g.reportType === 'yayasan' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                                                {g.reportType === 'yayasan' ? 'Yayasan' : 'Resmi'}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <button onClick={() => handleDeleteGroup(g.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {/* MODAL TAMBAH PELAJARAN */}
                    {
                        uiState.showSubjectModal && (
                            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in backdrop-blur-sm p-4">
                                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg p-8">
                                    <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                        <h3 className="font-bold text-lg text-slate-800">Tambah Mata Pelajaran</h3>
                                        <button onClick={() => setShowSubjectModal(false)}><X size={24} className="text-slate-400 hover:text-red-500" /></button>
                                    </div>

                                    <form onSubmit={confirmAddSubject} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Nama Mata Pelajaran</label>
                                            <input name="subjectName" required className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 transition-colors" placeholder="Contoh: Matematika" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Kode</label>
                                            <input name="subjectCode" required className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 transition-colors" placeholder="Contoh: MP-101" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Untuk Kelas</label>
                                                <div className="relative">
                                                    <input
                                                        readOnly
                                                        value={uiState.selectedLevels.length > 0 ? (uiState.selectedLevels.includes("Semua Tingkat") ? "Semua Tingkat" : `Tingkat ${uiState.selectedLevels.sort().join(', ')}`) : ""}
                                                        placeholder="Pilih tingkat kelas..."
                                                        className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 transition-colors mb-2"
                                                    />
                                                    <select
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (val === "Semua Tingkat") {
                                                                setSelectedLevels(["Semua Tingkat"]);
                                                            } else if (val === "Reset") {
                                                                setSelectedLevels([]);
                                                            } else {
                                                                // Remove "Semua Tingkat" if specific level is selected
                                                                let newLevels = uiState.selectedLevels.filter(l => l !== "Semua Tingkat");
                                                                if (!newLevels.includes(val)) {
                                                                    newLevels.push(val);
                                                                }
                                                                setSelectedLevels(newLevels);
                                                            }
                                                            e.target.value = ""; // Reset dropdown to placeholder
                                                        }}
                                                        className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 cursor-pointer"
                                                    >
                                                        <option value="" disabled selected>+ Tambah Tingkat</option>
                                                        <option value="Semua Tingkat">Semua Tingkat (1-6)</option>
                                                        <option value="1">Tingkat 1</option>
                                                        <option value="2">Tingkat 2</option>
                                                        <option value="3">Tingkat 3</option>
                                                        <option value="4">Tingkat 4</option>
                                                        <option value="5">Tingkat 5</option>
                                                        <option value="6">Tingkat 6</option>
                                                        <option value="Reset" className="text-red-500 font-bold">Reset Pilihan</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Kelompok</label>
                                                <select name="subjectGroup" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 cursor-pointer">
                                                    {subjectGroups.map(g => (
                                                        <option key={g.id} value={g.name}>{g.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 mt-8">
                                            <button type="button" onClick={() => setShowSubjectModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Batal</button>
                                            <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">Simpan</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )
                    }

                    {/* MODAL TAMBAH JABATAN */}
                    {
                        uiState.showPositionModal && (
                            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in backdrop-blur-sm p-4">
                                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg p-8">
                                    <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                        <h3 className="font-bold text-lg text-slate-800">{uiState.editItem ? 'Edit' : 'Tambah'} Jabatan</h3>
                                        <button onClick={() => setShowPositionModal(false)}><X size={24} className="text-slate-400 hover:text-red-500" /></button>
                                    </div>
                                    <form onSubmit={confirmAddPosition} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Nama Jabatan</label>
                                            <input name="positionName" required defaultValue={uiState.editItem?.nama || ''} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 transition-colors" placeholder="Contoh: Kepala Lab Komputer" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Kategori</label>
                                            <select name="positionCategory" defaultValue={uiState.editItem?.kategori || 'Struktural'} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 cursor-pointer">
                                                <option value="Struktural">Struktural</option>
                                                <option value="Fungsional">Fungsional</option>
                                                <option value="Staff">Staff</option>
                                                <option value="Teknis">Teknis</option>
                                                <option value="Lainnya">Lainnya</option>
                                            </select>
                                        </div>
                                        <div className="flex gap-4 mt-8">
                                            <button type="button" onClick={() => setShowPositionModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Batal</button>
                                            <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">{uiState.editItem ? 'Update' : 'Simpan'}</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )
                    }

                    {/* MODAL TAMBAH WAKTU JADWAL */}
                    {
                        uiState.showTimeModal && (
                            <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center animate-in fade-in backdrop-blur-sm p-4">
                                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-8">
                                    <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                        <h3 className="font-bold text-lg text-slate-800">Tambah Jam Pelajaran</h3>
                                        <button onClick={() => setShowTimeModal(false)}><X size={24} className="text-slate-400 hover:text-red-500" /></button>
                                    </div>
                                    <form onSubmit={confirmAddTime} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Jam Mulai</label>
                                                <input
                                                    type="time"
                                                    required
                                                    value={uiState.newPeriodData.start}
                                                    onChange={(e) => setNewPeriodData({ ...uiState.newPeriodData, start: e.target.value })}
                                                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-mono"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Jam Selesai</label>
                                                <input
                                                    type="time"
                                                    required
                                                    value={uiState.newPeriodData.end}
                                                    onChange={(e) => setNewPeriodData({ ...uiState.newPeriodData, end: e.target.value })}
                                                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 font-mono"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-4 mt-8">
                                            <button type="button" onClick={() => setShowTimeModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Batal</button>
                                            <button type="submit" className="flex-1 py-3 bg-[#004AAD] text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">Tambah</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )
                    }

                    {/* MODAL TAMBAH SEMESTER JADWAL */}
                    {
                        uiState.showSemesterModal && (
                            <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center animate-in fade-in backdrop-blur-sm p-4">
                                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-8">
                                    <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                                <Calendar size={20} />
                                            </div>
                                            <h3 className="font-bold text-lg text-slate-800">Tambah Semester</h3>
                                        </div>
                                        <button onClick={() => setShowSemesterModal(false)}><X size={24} className="text-slate-400 hover:text-red-500" /></button>
                                    </div>
                                    <form onSubmit={confirmAddSemester} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Nama Semester / Tahun Ajaran</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Contoh: Genap 2025/2026"
                                                value={uiState.newSemesterName}
                                                onChange={(e) => setNewSemesterName(e.target.value)}
                                                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 transition-all"
                                            />
                                        </div>
                                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3">
                                            <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                            <p className="text-[10px] text-amber-700 leading-relaxed italic">
                                                Semester baru akan dimulai dengan jadwal kosong (Draft). Anda perlu mengatur ulang jadwal per kelas.
                                            </p>
                                        </div>
                                        <div className="flex gap-4 mt-8">
                                            <button type="button" onClick={() => setShowSemesterModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Batal</button>
                                            <button type="submit" className="flex-1 py-3 bg-[#004AAD] text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">Buat Semester</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )
                    }

                    {/* MODAL TAMBAH GURU */}
                    {
                        uiState.showTeacherModal && (
                            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in backdrop-blur-sm p-4">
                                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
                                    <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                        <h3 className="font-bold text-lg text-slate-800">Tambah Guru & Staff Baru</h3>
                                        <button onClick={() => setShowTeacherModal(false)}><X size={24} className="text-slate-400 hover:text-red-500" /></button>
                                    </div>
                                    <form onSubmit={(e) => { e.preventDefault(); handleSaveTeacher(); }} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Nama Lengkap</label>
                                                <input
                                                    value={uiState.newTeacher.nama}
                                                    onChange={(e) => setNewTeacher({ ...uiState.newTeacher, nama: e.target.value })}
                                                    required
                                                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 transition-colors"
                                                    placeholder="Nama Lengkap dengan Gelar"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">NIP (Opsional)</label>
                                                <input
                                                    value={uiState.newTeacher.nip}
                                                    onChange={(e) => setNewTeacher({ ...uiState.newTeacher, nip: e.target.value })}
                                                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 transition-colors"
                                                    placeholder="Nomor Induk Pegawai"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Jabatan</label>
                                                <select
                                                    value={uiState.newTeacher.jabatan}
                                                    onChange={(e) => setNewTeacher({ ...uiState.newTeacher, jabatan: e.target.value })}
                                                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 cursor-pointer"
                                                >
                                                    {positions && positions.map(p => (
                                                        <option key={p.id} value={p.nama}>{p.nama}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Wali Kelas (Opsional)</label>
                                                <select
                                                    value={uiState.newTeacher.class}
                                                    onChange={(e) => setNewTeacher({ ...uiState.newTeacher, class: e.target.value })}
                                                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 cursor-pointer"
                                                    disabled={uiState.newTeacher.jabatan !== 'Guru Kelas' && uiState.newTeacher.jabatan !== 'Wali Kelas'}
                                                >
                                                    <option value="">- Bukan Wali Kelas -</option>
                                                    {classes && classes.map(c => (
                                                        <option key={c.id} value={c.nama}>{c.nama}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Username/Password removed - auto generated */}
                                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-4 text-sm text-blue-800">
                                            <p><strong>Info:</strong> Username dan Password akan disamakan dengan <strong>NIP</strong> secara otomatis.</p>
                                        </div>




                                        <div className="flex gap-4 mt-8">
                                            <button type="button" onClick={() => setShowTeacherModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Batal</button>
                                            <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">Simpan Data Guru</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )
                    }
                    {/* MODAL TAMBAH KELAS */}
                    {
                        showAddClassModal && (
                            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in backdrop-blur-sm p-4">
                                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-8">
                                    <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                        <h3 className="font-bold text-lg text-slate-800">Tambah Kelas Baru</h3>
                                        <button onClick={() => setShowAddClassModal(false)}><X size={24} className="text-slate-400 hover:text-red-500" /></button>
                                    </div>
                                    <form onSubmit={(e) => {
                                        e.preventDefault();
                                        const form = e.target as HTMLFormElement;
                                        const tingkat = (form.elements.namedItem('tingkat') as HTMLSelectElement).value;
                                        const paralel = (form.elements.namedItem('paralel') as HTMLInputElement).value;
                                        if (tingkat && paralel) {
                                            handleAddClass(tingkat, paralel);
                                            toast.success(`Kelas ${tingkat}${paralel} berhasil dibuat!`);
                                        }
                                    }} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Tingkat</label>
                                            <select name="tingkat" required className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 cursor-pointer">
                                                <option value="1">1</option>
                                                <option value="2">2</option>
                                                <option value="3">3</option>
                                                <option value="4">4</option>
                                                <option value="5">5</option>
                                                <option value="6">6</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Paralel (A, B, C...)</label>
                                            <input name="paralel" required maxLength={2} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 transition-colors uppercase" placeholder="Contoh: A" />
                                        </div>
                                        <div className="flex gap-4 mt-8">
                                            <button type="button" onClick={() => setShowAddClassModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Batal</button>
                                            <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">Buat Kelas</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )
                    }

                    {/* MODAL PLOTTING GURU MAPEL */}
                    {
                        uiState.showPlottingModal && (
                            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in backdrop-blur-sm p-4">
                                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg p-8">
                                    <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                        <h3 className="font-bold text-lg text-slate-800">Plotting Guru & Mata Pelajaran</h3>
                                        <button onClick={() => { setShowPlottingModal(false); dispatch({ type: 'RESET_PLOTTING_FORM' }); }}><X size={24} className="text-slate-400 hover:text-red-500" /></button>
                                    </div>
                                    <form onSubmit={(e) => {
                                        e.preventDefault();
                                        if (uiState.plottingTeacherId && uiState.plottingSelectedClasses.length > 0 && uiState.plottingSubjectIds.length > 0) {
                                            // Method A: Expand multiple classes into individual records
                                            let targetClasses = [...uiState.plottingSelectedClasses];

                                            // Handle "Semua Kelas"
                                            if (targetClasses.includes("Semua Kelas")) {
                                                targetClasses = classes.map(c => c.nama);
                                            }

                                            const newAssignments = targetClasses.map(classNama => ({
                                                id: Date.now() + Math.random(),
                                                teacherId: uiState.plottingTeacherId,
                                                classNama: classNama,
                                                subjectIds: uiState.plottingSubjectIds
                                            }));

                                            setTeacherAssignments([...teacherAssignments, ...newAssignments]);
                                            setShowPlottingModal(false);
                                            dispatch({ type: 'RESET_PLOTTING_FORM' });
                                            toast.success(`${newAssignments.length} Plotting guru berhasil disimpan!`);
                                        } else {
                                            toast.error("Mohon lengkapi semua data!");
                                        }
                                    }} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Nama Guru</label>
                                            <select
                                                name="teacherId"
                                                required
                                                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 cursor-pointer"
                                                value={uiState.plottingTeacherId}
                                                onChange={(e) => {
                                                    const tid = e.target.value;
                                                    setPlottingTeacherId(tid);
                                                    const guru = teachers.find(t => t.id.toString() === tid);
                                                    setPlottingNip(guru?.nip || '');
                                                }}
                                            >
                                                <option value="">Pilih Guru</option>
                                                {teachers.map(t => (
                                                    <option key={t.id.toString()} value={t.id.toString()}>{t.nama} ({t.nip || '-'})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">NIP</label>
                                            <input
                                                value={uiState.plottingNip}
                                                readOnly
                                                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed"
                                                placeholder="Otomatis terisi..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Untuk Kelas (Bisa Pilih Banyak)</label>
                                            <div className="relative">
                                                <input
                                                    readOnly
                                                    value={
                                                        uiState.plottingSelectedClasses.length > 0
                                                            ? (uiState.plottingSelectedClasses.includes("Semua Kelas")
                                                                ? "Semua Kelas"
                                                                : uiState.plottingSelectedClasses.join(', '))
                                                            : ""
                                                    }
                                                    placeholder="Pilih kelas..."
                                                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 transition-colors mb-2"
                                                />
                                                <select
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === "Semua Kelas") {
                                                            setPlottingSelectedClasses(["Semua Kelas"]);
                                                        } else if (val === "Reset") {
                                                            setPlottingSelectedClasses([]);
                                                        } else {
                                                            let newClasses = uiState.plottingSelectedClasses.filter(c => c !== "Semua Kelas");
                                                            if (!newClasses.includes(val)) {
                                                                newClasses.push(val);
                                                            }
                                                            setPlottingSelectedClasses(newClasses);
                                                        }
                                                        e.target.value = "";
                                                    }}
                                                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 cursor-pointer"
                                                >
                                                    <option value="" disabled selected>+ Tambah Kelas</option>
                                                    <option value="Semua Kelas">Semua Kelas</option>
                                                    {classes.map(c => (
                                                        <option key={c.id.toString()} value={c.nama}>{c.nama}</option>
                                                    ))}
                                                    <option value="Reset" className="text-red-500 font-bold">Reset Pilihan</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Mata Pelajaran (Bisa Pilih Banyak: Tahan Ctrl)</label>
                                            <select
                                                name="mapelIds"
                                                multiple
                                                required
                                                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 cursor-pointer h-32"
                                                value={uiState.plottingSubjectIds.map((id: any) => String(id))}
                                                onChange={(e) => {
                                                    const selectElement = e.target as HTMLSelectElement;
                                                    const options = Array.from(selectElement.selectedOptions);
                                                    const values = options.map((opt) => opt.value);
                                                    setPlottingSubjectIds(values);
                                                }}
                                            >
                                                {subjects.map(s => (
                                                    <option key={s.id.toString()} value={s.id.toString()}>{s.name} ({s.code})</option>
                                                ))}
                                            </select>
                                            <p className="text-xs text-slate-400 mt-1 italic ml-1">*Tahan tombol Ctrl (Windows) atau Command (Mac) untuk memilih lebih dari satu.</p>
                                        </div>

                                        <div className="flex gap-4 mt-8">
                                            <button type="button" onClick={() => { setShowPlottingModal(false); dispatch({ type: 'RESET_PLOTTING_FORM' }); }} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Batal</button>
                                            <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">Simpan Plotting</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )
                    }

                    {/* MODAL TAMBAH MAPEL BIMBEL */}
                    {
                        showAddTutoringSubject && (
                            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in backdrop-blur-sm p-4">
                                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8">
                                    <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                        <h3 className="font-bold text-lg text-slate-800">Tambah Mata Pelajaran Bimbel</h3>
                                        <button onClick={() => setShowAddTutoringSubject(false)}><X size={24} className="text-slate-400 hover:text-red-500" /></button>
                                    </div>
                                    <div className="space-y-4">
                                        {/* Name */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Nama Mata Pelajaran</label>
                                            <input
                                                value={newTutoringSubject.name}
                                                onChange={(e) => setNewTutoringSubject({ ...newTutoringSubject, name: e.target.value })}
                                                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 transition-colors"
                                                placeholder="Contoh: Matematika Dasar"
                                            />
                                        </div>
                                        {/* Meetings */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Jumlah Pertemuan</label>
                                            <input
                                                type="number"
                                                value={newTutoringSubject.meetings}
                                                onChange={(e) => setNewTutoringSubject({ ...newTutoringSubject, meetings: parseInt(e.target.value) || 0 })}
                                                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 transition-colors"
                                            />
                                        </div>
                                        <button onClick={handleAddTutoringSubject} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all mt-4">Simpan Mapel</button>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {/* MODAL TAMBAH GURU BIMBEL */}
                    {
                        showAddTutoringTeacher && (
                            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in backdrop-blur-sm p-4">
                                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
                                    <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                        <h3 className="font-bold text-lg text-slate-800">{editingTutoringTeacherId ? 'Edit' : 'Tambah'} Guru Bimbel</h3>
                                        <button onClick={() => setShowAddTutoringTeacher(false)}><X size={24} className="text-slate-400 hover:text-red-500" /></button>
                                    </div>
                                    <div className="space-y-4">
                                        {/* Name */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Nama Guru</label>
                                            <input
                                                value={newTutoringTeacher.name}
                                                onChange={(e) => setNewTutoringTeacher({ ...newTutoringTeacher, name: e.target.value })}
                                                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 transition-colors"
                                                placeholder="Nama Lengkap"
                                            />
                                        </div>
                                        {/* Subject */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Mata Pelajaran</label>
                                            <select
                                                value={newTutoringTeacher.subjectId}
                                                onChange={(e) => setNewTutoringTeacher({ ...newTutoringTeacher, subjectId: e.target.value })}
                                                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 cursor-pointer"
                                            >
                                                <option value="">Pilih Mapel</option>
                                                {tutoringSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                        {/* Class */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Kelas Bimbingan</label>
                                            <input
                                                value={newTutoringTeacher.classId}
                                                onChange={(e) => setNewTutoringTeacher({ ...newTutoringTeacher, classId: e.target.value })}
                                                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 transition-colors"
                                                placeholder="Contoh: Kelas 6 Persiapan"
                                            />
                                        </div>
                                        {/* Schedule */}
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Hari</label>
                                                <select
                                                    value={newTutoringTeacher.scheduleDay}
                                                    onChange={(e) => setNewTutoringTeacher({ ...newTutoringTeacher, scheduleDay: e.target.value })}
                                                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 cursor-pointer text-sm"
                                                >
                                                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Mulai</label>
                                                <input type="time" value={newTutoringTeacher.scheduleStart} onChange={(e) => setNewTutoringTeacher({ ...newTutoringTeacher, scheduleStart: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Selesai</label>
                                                <input type="time" value={newTutoringTeacher.scheduleEnd} onChange={(e) => setNewTutoringTeacher({ ...newTutoringTeacher, scheduleEnd: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 text-sm" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Username</label>
                                                <input
                                                    value={newTutoringTeacher.username}
                                                    onChange={(e) => setNewTutoringTeacher({ ...newTutoringTeacher, username: e.target.value })}
                                                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 transition-colors"
                                                    placeholder="Username"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Password</label>
                                                <input
                                                    value={newTutoringTeacher.password}
                                                    onChange={(e) => setNewTutoringTeacher({ ...newTutoringTeacher, password: e.target.value })}
                                                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:border-blue-500 transition-colors"
                                                    placeholder="Password"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                if (!newTutoringTeacher.name || !newTutoringTeacher.subjectId) {
                                                    toast.error("Nama dan Mapel harus diisi!");
                                                    return;
                                                }

                                                if (editItemLocal && editTypeLocal === 'TeacherBimbel') {
                                                    setTutoringTeachers(prev => prev.map(t => t.id === editItemLocal.id ? { ...newTutoringTeacher, id: editItemLocal.id } : t));
                                                    toast.success("Data guru bimbel berhasil diperbarui!");
                                                } else {
                                                    setTutoringTeachers([...tutoringTeachers, { ...newTutoringTeacher, id: Date.now() + Math.random() }]);
                                                    toast.success("Guru bimbel berhasil ditambahkan!");
                                                }

                                                setShowAddTutoringTeacher(false);
                                                setEditItemLocal(null);
                                                setEditTypeLocal(null);
                                                setNewTutoringTeacher({
                                                    name: '', source: 'Internal', subjectId: '', subjectName: '',
                                                    classId: '', scheduleDay: 'Senin', scheduleStart: '14:00', scheduleEnd: '15:30',
                                                    username: '', password: '123', studentsCount: 0, status: 'Aktif'
                                                });
                                            }}
                                            className="w-full py-4 bg-orange-600 text-white font-bold rounded-2xl hover:bg-orange-700 shadow-lg shadow-orange-200 transition-all mt-4"
                                        >
                                            {editItemLocal && editTypeLocal === 'TeacherBimbel' ? 'Update Data Guru' : 'Simpan Data Guru'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {/* --- VIEW: AL QURAN --- */}
                    {
                        uiState.activeView === 'quran' && (
                            <div className="bg-[#F4F7FE] p-6 h-full overflow-hidden">
                                <AlQuranSiswa onBack={() => dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'dashboard' })} />
                            </div>
                        )
                    }

                    {/* MODAL TAMBAH JADAWAL UJIAN */}
                    <AddExamModal
                        isOpen={showExamModal}
                        onClose={() => setShowExamModal(false)}
                        newExamData={newExamData}
                        setNewExamData={setNewExamData}
                        examSchedules={examSchedules}
                        setExamSchedules={setExamSchedules}
                        setActiveExamId={setActiveExamId}
                    />

                    {/* MODAL TAMBAH NASABAH TABUNGAN */}
                    <AddSaverModal
                        isOpen={showAddSaverModal}
                        onClose={() => setShowAddSaverModal(false)}
                        savingsData={savingsData}
                        setSavingsData={setSavingsData}
                        saveSavings={saveSavings}
                        savingsTransactions={savingsTransactions}
                        newSaverId={newSaverId}
                        setNewSaverId={setNewSaverId}
                        saverClassFilter={saverClassFilter}
                        setSaverClassFilter={setSaverClassFilter}
                    />

                    {/* MODAL KELOLA SISWA BIMBEL */}
                    <ManageTutoringStudentsModal
                        isOpen={showManageTutoringStudentsModal}
                        onClose={() => setShowManageTutoringStudentsModal(false)}
                        tutoringGroup={selectedTutoringGroup}
                        allStudents={students}
                        enrolledStudents={tutoringEnrollments.filter(e => e.groupId === selectedTutoringGroup?.id).map(e => e.studentId)}
                        onAddStudent={handleAddStudentToTutoring}
                        onRemoveStudent={handleRemoveStudentFromTutoring}
                    />

                    {/* CONFIRMATION MODAL */}
                    {
                        confirmModal.show && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100">
                                    <div className="text-center mb-6">
                                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Trash2 size={32} className="text-red-500" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-2">Konfirmasi Tindakan</h3>
                                        <p className="text-slate-500 text-sm">{confirmModal.message}</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setConfirmModal({ show: false, message: '', onConfirm: () => { } })}
                                            className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            onClick={confirmModal.onConfirm}
                                            className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-200 transition-colors"
                                        >
                                            Ya, Lanjutkan
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                </main >
            </div >
        </div >
    );
};

export default DashboardSuperAdmin;
