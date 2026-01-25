import React from 'react';
import Pengaturan from '../../../Pengaturan';

interface SettingsViewProps {
    schoolSettings: any;
    setSchoolSettings: React.Dispatch<React.SetStateAction<any>>;
}

const SettingsView: React.FC<SettingsViewProps> = ({ schoolSettings, setSchoolSettings }) => {
    return (
        <div className="bg-white rounded-[2.5rem] p-6 h-full shadow-sm animate-in fade-in overflow-y-auto custom-scrollbar">
            <Pengaturan schoolSettings={schoolSettings} setSchoolSettings={setSchoolSettings} />
        </div>
    );
};

export default SettingsView;
