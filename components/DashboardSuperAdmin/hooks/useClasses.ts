import { useState, useEffect } from 'react';
import { classesDataGlobal } from '../../../data/sharedData';

export interface Class {
    id: number;
    nama: string;
    tingkat: number;
    paralel: string;
}

export const useClasses = () => {
    const [classes, setClasses] = useState<Class[]>(() => {
        const saved = localStorage.getItem('classes_data_v10');
        return saved ? JSON.parse(saved) : classesDataGlobal;
    });

    useEffect(() => {
        localStorage.setItem('classes_data_v10', JSON.stringify(classes));
    }, [classes]);

    const [showAddClassModal, setShowAddClassModal] = useState(false);

    const handleAddClass = (tingkat: string, paralel: string, customName?: string) => {
        const nama = customName || `${tingkat}${paralel}`;
        if (tingkat && paralel) {
            setClasses(prev => [...prev, { id: Date.now(), nama, tingkat: parseInt(tingkat), paralel }]);
            setShowAddClassModal(false);
            return true;
        }
        return false;
    };

    const handleDeleteClass = (id: number) => {
        if (confirm("Hapus kelas ini?")) {
            setClasses(prev => prev.filter(c => c.id !== id));
        }
    };

    return {
        classes,
        setClasses,
        showAddClassModal,
        setShowAddClassModal,
        handleAddClass,
        handleDeleteClass
    };
};
