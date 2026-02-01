import React, { useState, useEffect } from 'react';
import { Bell, Clock, ChevronLeft, CheckCircle, Megaphone, Info, AlertCircle, BookOpen, DollarSign } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../src/lib/supabase';

interface NotifikasiProps {
    onBack: () => void;
    user: any;
}

const NotifikasiSiswa: React.FC<NotifikasiProps> = ({ onBack, user }) => {
    // --- DATA ---
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadNotifications = async () => {
            if (!isSupabaseConfigured()) {
                setLoading(false);
                return;
            }

            try {
                const { data } = await supabase.from('app_settings').select('value').eq('key', 'announcements_data_v10').single();
                if (data?.value) {
                    const allAnnouncements = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;

                    // Filter for specific class or 'Semua' or 'Orang Tua'
                    const userClass = user?.kelas || user?.studentClass;
                    const filtered = allAnnouncements.filter((a: any) =>
                        a.status === 'Terbit' &&
                        (a.target === 'Semua' || a.target === 'Orang Tua') &&
                        (a.targetClass === 'Semua Kelas' || a.targetClass === userClass)
                    ).map((a: any) => ({
                        id: a.id,
                        title: a.title,
                        message: a.content,
                        date: a.publishDate,
                        time: 'Official',
                        type: a.category === 'Keuangan' ? 'success' : a.category === 'Akadenik' ? 'info' : 'alert',
                        read: false,
                        isPinned: a.isPinned,
                        category: a.category
                    }));

                    // Sort by pinned then date
                    filtered.sort((a: any, b: any) => {
                        if (a.isPinned && !b.isPinned) return -1;
                        if (!a.isPinned && b.isPinned) return 1;
                        return new Date(b.date).getTime() - new Date(a.date).getTime();
                    });

                    setNotifications(filtered);
                }
            } catch (err) {
                console.error("Failed to load notifications from cloud", err);
            } finally {
                setLoading(false);
            }
        };

        loadNotifications();
    }, [user]);

    const getIcon = (category: string) => {
        switch (category) {
            case 'Keuangan': return <DollarSign size={16} className="text-emerald-500" />;
            case 'Akademik': return <BookOpen size={16} className="text-blue-500" />;
            default: return <Megaphone size={16} className="text-purple-500" />;
        }
    };

    return (
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-white/50 rounded-full transition-colors"
                >
                    <ChevronLeft size={24} className="text-slate-600" />
                </button>
                <div>
                    <h2 className="font-bold text-slate-800 text-xl flex items-center gap-2">
                        <Bell className="text-[#004AAD]" />
                        Notifikasi Pengumuman
                    </h2>
                    {loading && <p className="text-[10px] text-blue-500 animate-pulse font-bold">Sinkronisasi Cloud...</p>}
                </div>
            </div>

            {/* List Notifikasi */}
            <div className="space-y-4 overflow-y-auto pr-2 pb-20 custom-scrollbar">
                {notifications.map((notif) => (
                    <div
                        key={notif.id}
                        className={`p-4 rounded-2xl border transition-all hover:scale-[1.01] cursor-pointer relative overflow-hidden ${notif.isPinned
                            ? 'bg-blue-50/80 border-blue-200 shadow-sm'
                            : 'bg-white border-slate-100 shadow-sm hover:border-blue-100'
                            }`}
                    >
                        {notif.isPinned && (
                            <div className="absolute top-0 right-0 bg-blue-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-widest">
                                Pinned
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-lg bg-white shadow-sm border border-slate-100`}>
                                    {getIcon(notif.category)}
                                </div>
                                <h3 className={`font-bold text-sm text-slate-800`}>
                                    {notif.title}
                                </h3>
                            </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed mb-3 line-clamp-3">
                            {notif.message}
                        </p>

                        <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-1">
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                <Clock size={12} />
                                {notif.date} • {notif.category}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-[#004AAD] font-bold">
                                LIHAT DETAIL <ChevronLeft size={10} className="rotate-180" />
                            </div>
                        </div>
                    </div>
                ))}

                {!loading && notifications.length === 0 && (
                    <div className="text-center py-20 text-slate-400">
                        <Bell size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="font-medium">Belum ada pengumuman untuk Anda</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotifikasiSiswa;
