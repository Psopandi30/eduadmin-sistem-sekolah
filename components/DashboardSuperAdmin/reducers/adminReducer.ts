import { useReducer } from 'react';

// UI State Types
export interface AdminUIState {
    // Navigation
    activeView: string;
    isSidebarOpen: boolean;
    selectedClass: string;

    // Modal States
    editItem: any;
    editType: string;
    showGroupModal: boolean;
    showSubjectModal: boolean;
    showPositionModal: boolean;
    showTeacherModal: boolean;
    showPlottingModal: boolean;
    showTimeModal: boolean;
    showSemesterModal: boolean;
    showExamModal: boolean;
    showExamTimeModal: boolean;
    showExamUniformModal: boolean;
    showExamNoteModal: boolean;
    showAddSaverModal: boolean;
    showManageTutoringStudentsModal: boolean;
    showAddTutoringSubject: boolean;
    showAddTutoringTeacher: boolean;

    // Selection States
    selectedLevels: string[];
    selectedJadwalClass: string;
    selectedJadwalLevel: number;
    selectedExamClass: string;
    selectedExamTingkat: string;
    selectedNilaiClass: string;
    selectedNilaiSubject: string;
    selectedNilaiSemester: 'Ganjil' | 'Genap';
    selectedNilaiStudent: string;
    selectedSavingsStudent: any;
    selectedTutoringGroup: any;
    selectedDayForExamUniform: string | null;
    selectedDayForExamNote: string | null;

    // Form States
    newPeriodData: { start: string; end: string };
    newSemesterName: string;
    newTeacher: { nama: string; nip: string; jabatan: string; mapel: string; class: string };
    newExamData: any;
    newExamTime: { start: string; end: string };
    newTutoringSubject: any;
    newTutoringTeacher: any;
    newSaverId: string;
    tempExamUniform: string;
    tempExamNote: string;

    // Plotting States
    plottingTeacherId: string;
    plottingClassNama: string;
    plottingSubjectIds: any[];
    plottingNip: string;
    mapelViewMode: 'master' | 'plotting';

    // Drag & Drop
    draggedItem: { type: string; id: number | string; name: string } | null;
    examDraggedItem: { subject: string; teacher: string; color: string } | null;

    // Confirmation Modal
    confirmModal: {
        show: boolean;
        message: string;
        onConfirm: () => void;
    };
}

// Action Types
type AdminUIAction =
    | { type: 'SET_ACTIVE_VIEW'; payload: string }
    | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
    | { type: 'SET_SELECTED_CLASS'; payload: string }
    | { type: 'SET_EDIT_ITEM'; payload: any }
    | { type: 'SET_EDIT_TYPE'; payload: string }
    | { type: 'SET_SHOW_GROUP_MODAL'; payload: boolean }
    | { type: 'SET_SHOW_SUBJECT_MODAL'; payload: boolean }
    | { type: 'SET_SHOW_POSITION_MODAL'; payload: boolean }
    | { type: 'SET_SHOW_TEACHER_MODAL'; payload: boolean }
    | { type: 'SET_SHOW_PLOTTING_MODAL'; payload: boolean }
    | { type: 'SET_SHOW_TIME_MODAL'; payload: boolean }
    | { type: 'SET_SHOW_SEMESTER_MODAL'; payload: boolean }
    | { type: 'SET_SHOW_EXAM_MODAL'; payload: boolean }
    | { type: 'SET_SHOW_EXAM_TIME_MODAL'; payload: boolean }
    | { type: 'SET_SHOW_EXAM_UNIFORM_MODAL'; payload: boolean }
    | { type: 'SET_SHOW_EXAM_NOTE_MODAL'; payload: boolean }
    | { type: 'SET_SHOW_ADD_SAVER_MODAL'; payload: boolean }
    | { type: 'SET_SHOW_MANAGE_TUTORING_STUDENTS_MODAL'; payload: boolean }
    | { type: 'SET_SHOW_ADD_TUTORING_SUBJECT'; payload: boolean }
    | { type: 'SET_SHOW_ADD_TUTORING_TEACHER'; payload: boolean }
    | { type: 'SET_SELECTED_LEVELS'; payload: string[] }
    | { type: 'SET_SELECTED_JADWAL_CLASS'; payload: string }
    | { type: 'SET_SELECTED_JADWAL_LEVEL'; payload: number }
    | { type: 'SET_SELECTED_EXAM_CLASS'; payload: string }
    | { type: 'SET_SELECTED_EXAM_TINGKAT'; payload: string }
    | { type: 'SET_SELECTED_NILAI_CLASS'; payload: string }
    | { type: 'SET_SELECTED_NILAI_SUBJECT'; payload: string }
    | { type: 'SET_SELECTED_NILAI_SEMESTER'; payload: 'Ganjil' | 'Genap' }
    | { type: 'SET_SELECTED_NILAI_STUDENT'; payload: string }
    | { type: 'SET_SELECTED_SAVINGS_STUDENT'; payload: any }
    | { type: 'SET_SELECTED_TUTORING_GROUP'; payload: any }
    | { type: 'SET_SELECTED_DAY_FOR_EXAM_UNIFORM'; payload: string | null }
    | { type: 'SET_SELECTED_DAY_FOR_EXAM_NOTE'; payload: string | null }
    | { type: 'SET_NEW_PERIOD_DATA'; payload: { start: string; end: string } }
    | { type: 'SET_NEW_SEMESTER_NAME'; payload: string }
    | { type: 'SET_NEW_TEACHER'; payload: { nama: string; nip: string; jabatan: string; mapel: string; class: string } }
    | { type: 'SET_NEW_EXAM_DATA'; payload: any }
    | { type: 'SET_NEW_EXAM_TIME'; payload: { start: string; end: string } }
    | { type: 'SET_NEW_TUTORING_SUBJECT'; payload: any }
    | { type: 'SET_NEW_TUTORING_TEACHER'; payload: any }
    | { type: 'SET_NEW_SAVER_ID'; payload: string }
    | { type: 'SET_TEMP_EXAM_UNIFORM'; payload: string }
    | { type: 'SET_TEMP_EXAM_NOTE'; payload: string }
    | { type: 'SET_PLOTTING_TEACHER_ID'; payload: string }
    | { type: 'SET_PLOTTING_CLASS_NAMA'; payload: string }
    | { type: 'SET_PLOTTING_SUBJECT_IDS'; payload: any[] }
    | { type: 'SET_PLOTTING_NIP'; payload: string }
    | { type: 'SET_MAPEL_VIEW_MODE'; payload: 'master' | 'plotting' }
    | { type: 'SET_DRAGGED_ITEM'; payload: { type: string; id: number | string; name: string } | null }
    | { type: 'SET_EXAM_DRAGGED_ITEM'; payload: { subject: string; teacher: string; color: string } | null }
    | { type: 'SET_CONFIRM_MODAL'; payload: { show: boolean; message: string; onConfirm: () => void } }
    | { type: 'RESET_PLOTTING_FORM' }
    | { type: 'RESET_CONFIRM_MODAL' };

// Initial State
const initialState: AdminUIState = {
    activeView: 'dashboard',
    isSidebarOpen: true,
    selectedClass: '1A',
    editItem: null,
    editType: '',
    showGroupModal: false,
    showSubjectModal: false,
    showPositionModal: false,
    showTeacherModal: false,
    showPlottingModal: false,
    showTimeModal: false,
    showSemesterModal: false,
    showExamModal: false,
    showExamTimeModal: false,
    showExamUniformModal: false,
    showExamNoteModal: false,
    showAddSaverModal: false,
    showManageTutoringStudentsModal: false,
    showAddTutoringSubject: false,
    showAddTutoringTeacher: false,
    selectedLevels: [],
    selectedJadwalClass: '1A',
    selectedJadwalLevel: 1,
    selectedExamClass: '1A',
    selectedExamTingkat: '1',
    selectedNilaiClass: '',
    selectedNilaiSubject: '',
    selectedNilaiSemester: 'Ganjil',
    selectedNilaiStudent: '',
    selectedSavingsStudent: null,
    selectedTutoringGroup: null,
    selectedDayForExamUniform: null,
    selectedDayForExamNote: null,
    newPeriodData: { start: '', end: '' },
    newSemesterName: '',
    newTeacher: { nama: '', nip: '', jabatan: 'Guru Mata Pelajaran', mapel: '', class: '' },
    newExamData: null,
    newExamTime: { start: '', end: '' },
    newTutoringSubject: null,
    newTutoringTeacher: null,
    newSaverId: '',
    tempExamUniform: '',
    tempExamNote: '',
    plottingTeacherId: '',
    plottingClassNama: '',
    plottingSubjectIds: [],
    plottingNip: '',
    mapelViewMode: 'plotting',
    draggedItem: null,
    examDraggedItem: null,
    confirmModal: {
        show: false,
        message: '',
        onConfirm: () => {}
    }
};

// Reducer
function adminUIReducer(state: AdminUIState, action: AdminUIAction): AdminUIState {
    switch (action.type) {
        case 'SET_ACTIVE_VIEW':
            return { ...state, activeView: action.payload };
        case 'SET_SIDEBAR_OPEN':
            return { ...state, isSidebarOpen: action.payload };
        case 'SET_SELECTED_CLASS':
            return { ...state, selectedClass: action.payload };
        case 'SET_EDIT_ITEM':
            return { ...state, editItem: action.payload };
        case 'SET_EDIT_TYPE':
            return { ...state, editType: action.payload };
        case 'SET_SHOW_GROUP_MODAL':
            return { ...state, showGroupModal: action.payload };
        case 'SET_SHOW_SUBJECT_MODAL':
            return { ...state, showSubjectModal: action.payload };
        case 'SET_SHOW_POSITION_MODAL':
            return { ...state, showPositionModal: action.payload };
        case 'SET_SHOW_TEACHER_MODAL':
            return { ...state, showTeacherModal: action.payload };
        case 'SET_SHOW_PLOTTING_MODAL':
            return { ...state, showPlottingModal: action.payload };
        case 'SET_SHOW_TIME_MODAL':
            return { ...state, showTimeModal: action.payload };
        case 'SET_SHOW_SEMESTER_MODAL':
            return { ...state, showSemesterModal: action.payload };
        case 'SET_SHOW_EXAM_MODAL':
            return { ...state, showExamModal: action.payload };
        case 'SET_SHOW_EXAM_TIME_MODAL':
            return { ...state, showExamTimeModal: action.payload };
        case 'SET_SHOW_EXAM_UNIFORM_MODAL':
            return { ...state, showExamUniformModal: action.payload };
        case 'SET_SHOW_EXAM_NOTE_MODAL':
            return { ...state, showExamNoteModal: action.payload };
        case 'SET_SHOW_ADD_SAVER_MODAL':
            return { ...state, showAddSaverModal: action.payload };
        case 'SET_SHOW_MANAGE_TUTORING_STUDENTS_MODAL':
            return { ...state, showManageTutoringStudentsModal: action.payload };
        case 'SET_SHOW_ADD_TUTORING_SUBJECT':
            return { ...state, showAddTutoringSubject: action.payload };
        case 'SET_SHOW_ADD_TUTORING_TEACHER':
            return { ...state, showAddTutoringTeacher: action.payload };
        case 'SET_SELECTED_LEVELS':
            return { ...state, selectedLevels: action.payload };
        case 'SET_SELECTED_JADWAL_CLASS':
            return { ...state, selectedJadwalClass: action.payload };
        case 'SET_SELECTED_JADWAL_LEVEL':
            return { ...state, selectedJadwalLevel: action.payload };
        case 'SET_SELECTED_EXAM_CLASS':
            return { ...state, selectedExamClass: action.payload };
        case 'SET_SELECTED_EXAM_TINGKAT':
            return { ...state, selectedExamTingkat: action.payload };
        case 'SET_SELECTED_NILAI_CLASS':
            return { ...state, selectedNilaiClass: action.payload };
        case 'SET_SELECTED_NILAI_SUBJECT':
            return { ...state, selectedNilaiSubject: action.payload };
        case 'SET_SELECTED_NILAI_SEMESTER':
            return { ...state, selectedNilaiSemester: action.payload };
        case 'SET_SELECTED_NILAI_STUDENT':
            return { ...state, selectedNilaiStudent: action.payload };
        case 'SET_SELECTED_SAVINGS_STUDENT':
            return { ...state, selectedSavingsStudent: action.payload };
        case 'SET_SELECTED_TUTORING_GROUP':
            return { ...state, selectedTutoringGroup: action.payload };
        case 'SET_SELECTED_DAY_FOR_EXAM_UNIFORM':
            return { ...state, selectedDayForExamUniform: action.payload };
        case 'SET_SELECTED_DAY_FOR_EXAM_NOTE':
            return { ...state, selectedDayForExamNote: action.payload };
        case 'SET_NEW_PERIOD_DATA':
            return { ...state, newPeriodData: action.payload };
        case 'SET_NEW_SEMESTER_NAME':
            return { ...state, newSemesterName: action.payload };
        case 'SET_NEW_TEACHER':
            return { ...state, newTeacher: action.payload };
        case 'SET_NEW_EXAM_DATA':
            return { ...state, newExamData: action.payload };
        case 'SET_NEW_EXAM_TIME':
            return { ...state, newExamTime: action.payload };
        case 'SET_NEW_TUTORING_SUBJECT':
            return { ...state, newTutoringSubject: action.payload };
        case 'SET_NEW_TUTORING_TEACHER':
            return { ...state, newTutoringTeacher: action.payload };
        case 'SET_NEW_SAVER_ID':
            return { ...state, newSaverId: action.payload };
        case 'SET_TEMP_EXAM_UNIFORM':
            return { ...state, tempExamUniform: action.payload };
        case 'SET_TEMP_EXAM_NOTE':
            return { ...state, tempExamNote: action.payload };
        case 'SET_PLOTTING_TEACHER_ID':
            return { ...state, plottingTeacherId: action.payload };
        case 'SET_PLOTTING_CLASS_NAMA':
            return { ...state, plottingClassNama: action.payload };
        case 'SET_PLOTTING_SUBJECT_IDS':
            return { ...state, plottingSubjectIds: action.payload };
        case 'SET_PLOTTING_NIP':
            return { ...state, plottingNip: action.payload };
        case 'SET_MAPEL_VIEW_MODE':
            return { ...state, mapelViewMode: action.payload };
        case 'SET_DRAGGED_ITEM':
            return { ...state, draggedItem: action.payload };
        case 'SET_EXAM_DRAGGED_ITEM':
            return { ...state, examDraggedItem: action.payload };
        case 'SET_CONFIRM_MODAL':
            return { ...state, confirmModal: action.payload };
        case 'RESET_PLOTTING_FORM':
            return {
                ...state,
                plottingTeacherId: '',
                plottingClassNama: '',
                plottingSubjectIds: [],
                plottingNip: ''
            };
        case 'RESET_CONFIRM_MODAL':
            return {
                ...state,
                confirmModal: {
                    show: false,
                    message: '',
                    onConfirm: () => {}
                }
            };
        default:
            return state;
    }
}

// Custom Hook
export const useAdminUI = () => {
    return useReducer(adminUIReducer, initialState);
};
