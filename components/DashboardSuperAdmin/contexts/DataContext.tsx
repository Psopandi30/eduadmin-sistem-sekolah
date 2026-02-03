import React, { createContext, useContext, ReactNode } from 'react';
import { useStudents } from '../hooks/useStudents';
import { useTeachers } from '../hooks/useTeachers';
import { useClasses } from '../hooks/useClasses';
import { useSubjects } from '../hooks/useSubjects';

interface DataContextType {
    // Students
    students: ReturnType<typeof useStudents>['students'];
    setStudents: ReturnType<typeof useStudents>['setStudents'];
    addNewStudent: ReturnType<typeof useStudents>['addNewStudent'];
    updateStudent: ReturnType<typeof useStudents>['updateStudent'];
    updateStudents: ReturnType<typeof useStudents>['updateStudents'];
    selectedStudent: ReturnType<typeof useStudents>['selectedStudent'];
    setSelectedStudent: ReturnType<typeof useStudents>['setSelectedStudent'];
    showAddStudentModal: ReturnType<typeof useStudents>['showAddStudentModal'];
    setShowAddStudentModal: ReturnType<typeof useStudents>['setShowAddStudentModal'];
    modalMode: ReturnType<typeof useStudents>['modalMode'];
    setModalMode: ReturnType<typeof useStudents>['setModalMode'];
    handleViewStudent: ReturnType<typeof useStudents>['handleViewStudent'];
    handleAddStudent: ReturnType<typeof useStudents>['handleAddStudent'];
    handleEditStudent: ReturnType<typeof useStudents>['handleEditStudent'];
    handleDelete: ReturnType<typeof useStudents>['handleDelete'];
    handleDownloadTemplate: ReturnType<typeof useStudents>['handleDownloadTemplate'];
    handleUploadClick: ReturnType<typeof useStudents>['handleUploadClick'];
    handleSaveData: ReturnType<typeof useStudents>['handleSaveData'];

    // Teachers
    teachers: ReturnType<typeof useTeachers>['teachers'];
    setTeachers: ReturnType<typeof useTeachers>['setTeachers'];
    addTeacher: ReturnType<typeof useTeachers>['addTeacher'];
    deleteTeacher: ReturnType<typeof useTeachers>['deleteTeacher'];
    updateTeacher: ReturnType<typeof useTeachers>['updateTeacher'];
    handleDownloadTemplateTeacher: ReturnType<typeof useTeachers>['handleDownloadTemplate'];
    handleUploadClickTeacher: ReturnType<typeof useTeachers>['handleUploadClick'];
    handleSaveDataTeacher: ReturnType<typeof useTeachers>['handleSaveData'];

    // Classes
    classes: ReturnType<typeof useClasses>['classes'];
    setClasses: ReturnType<typeof useClasses>['setClasses'];
    showAddClassModal: ReturnType<typeof useClasses>['showAddClassModal'];
    setShowAddClassModal: ReturnType<typeof useClasses>['setShowAddClassModal'];
    handleAddClass: ReturnType<typeof useClasses>['handleAddClass'];
    handleDeleteClass: ReturnType<typeof useClasses>['handleDeleteClass'];
    handleSaveClasses: ReturnType<typeof useClasses>['handleSaveClasses'];

    // Subjects
    subjectGroups: ReturnType<typeof useSubjects>['subjectGroups'];
    setSubjectGroups: ReturnType<typeof useSubjects>['setSubjectGroups'];
    subjects: ReturnType<typeof useSubjects>['subjects'];
    setSubjects: ReturnType<typeof useSubjects>['setSubjects'];

    // Derived Data (Memoized)
    kelasData: Array<{
        id: string | number;
        kode: string;
        nama: string;
        tingkat: string;
        paralel: string;
        wali: string;
        waliNip: string;
    }>;
    stafList: Array<{
        no: number;
        noPegawai: string;
        nama: string;
        jabatan: string;
        username: string;
        password: string;
    }>;
    mapelData: Array<{
        no: number;
        nama: string;
        kode: string;
        kelas: string;
        kelompok: string;
    }>;
    studentsDataByClass: Record<string, Array<{
        no: number;
        nis: string;
        nama: string;
        gender: string;
    }>>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Use all hooks
    const studentsHook = useStudents();
    const teachersHook = useTeachers();
    const classesHook = useClasses();
    const subjectsHook = useSubjects();

    // Derived data (memoized)
    const kelasData = React.useMemo(() => 
        classesHook.classes.map((c: any) => ({
            id: c.id,
            kode: `KLS-${c.nama}`,
            nama: isNaN(parseInt(c.nama[0])) ? c.nama : `Kelas ${c.nama}`,
            tingkat: c.tingkat.toString(),
            paralel: c.paralel,
            wali: teachersHook.teachers.find((t: any) => t.wali === c.nama)?.nama || 'Belum Ditentukan',
            waliNip: teachersHook.teachers.find((t: any) => t.wali === c.nama)?.nip || '-'
        })), 
        [classesHook.classes, teachersHook.teachers]
    );

    const stafList = React.useMemo(() => 
        teachersHook.teachers.map((t: any, idx: number) => ({
            no: idx + 1,
            noPegawai: t.nip,
            nama: t.nama,
            jabatan: t.jabatan,
            username: t.username,
            password: t.password
        })), 
        [teachersHook.teachers]
    );

    const mapelData = React.useMemo(() => 
        subjectsHook.subjects.map((s: any, idx: number) => ({
            no: idx + 1,
            nama: s.name,
            kode: s.code,
            kelas: s.level ? s.level.replace('Kelas ', '') : '-',
            kelompok: s.group
        })), 
        [subjectsHook.subjects]
    );

    const studentsDataByClass = React.useMemo(() => {
        const data: Record<string, any[]> = {};
        studentsHook.students.forEach((s: any) => {
            const className = s.kelas || 'Tanpa Kelas';
            if (!data[className]) data[className] = [];
            data[className].push({ 
                no: data[className].length + 1, 
                nis: s.nis, 
                nama: s.nama, 
                gender: s.gender || 'L' 
            });
        });
        return data;
    }, [studentsHook.students]);

    const value: DataContextType = {
        // Students
        students: studentsHook.students,
        setStudents: studentsHook.setStudents,
        addNewStudent: studentsHook.addNewStudent,
        updateStudent: studentsHook.updateStudent,
        updateStudents: studentsHook.updateStudents,
        selectedStudent: studentsHook.selectedStudent,
        setSelectedStudent: studentsHook.setSelectedStudent,
        showAddStudentModal: studentsHook.showAddStudentModal,
        setShowAddStudentModal: studentsHook.setShowAddStudentModal,
        modalMode: studentsHook.modalMode,
        setModalMode: studentsHook.setModalMode,
        handleViewStudent: studentsHook.handleViewStudent,
        handleAddStudent: studentsHook.handleAddStudent,
        handleEditStudent: studentsHook.handleEditStudent,
        handleDelete: studentsHook.handleDelete,
        handleDownloadTemplate: studentsHook.handleDownloadTemplate,
        handleUploadClick: studentsHook.handleUploadClick,
        handleSaveData: studentsHook.handleSaveData,

        // Teachers
        teachers: teachersHook.teachers,
        setTeachers: teachersHook.setTeachers,
        addTeacher: teachersHook.addTeacher,
        deleteTeacher: teachersHook.deleteTeacher,
        updateTeacher: teachersHook.updateTeacher,
        handleDownloadTemplateTeacher: teachersHook.handleDownloadTemplate,
        handleUploadClickTeacher: teachersHook.handleUploadClick,
        handleSaveDataTeacher: teachersHook.handleSaveData,

        // Classes
        classes: classesHook.classes,
        setClasses: classesHook.setClasses,
        showAddClassModal: classesHook.showAddClassModal,
        setShowAddClassModal: classesHook.setShowAddClassModal,
        handleAddClass: classesHook.handleAddClass,
        handleDeleteClass: classesHook.handleDeleteClass,
        handleSaveClasses: classesHook.handleSaveClasses,

        // Subjects
        subjectGroups: subjectsHook.subjectGroups,
        setSubjectGroups: subjectsHook.setSubjectGroups,
        subjects: subjectsHook.subjects,
        setSubjects: subjectsHook.setSubjects,

        // Derived Data
        kelasData,
        stafList,
        mapelData,
        studentsDataByClass
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

export const useDataContext = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useDataContext must be used within DataProvider');
    }
    return context;
};
