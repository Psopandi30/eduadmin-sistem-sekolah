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
                        type: a.category === 'Keuangan' ? 'success' : a.category === 'Akademik' ? 'info' : 'alert',
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
        <div className="bg-white/90 backdrop-blur-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-white overflow-hidden animate-in slide-in-from-right duration-500 flex flex-col h-full">
            {/* Header / Title inside the card */}
            <div className="p-5 sm:p-8 border-b border-slate-100 flex items-center gap-3 sm:gap-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 shrink-0">
                <button
                    onClick={onBack}
                    className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white shadow-md rounded-xl sm:rounded-2xl text-slate-400 hover:text-blue-600 hover:scale-110 transition-all active:scale-95"
                >
                    <ChevronLeft size={20} sm:size={24} strokeWidth={3} />
                </button>
                <div className="flex-1">
                    <h3 className="font-black text-slate-800 text-base sm:text-xl tracking-tight">Notifikasi Sekolah</h3>
                    <p className="text-[8px] sm:text-xs font-bold text-indigo-600/60 uppercase tracking-widest mt-0.5">Pengumuman & Informasi Terbaru</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-10 scrollbar-hide">
                {notifications.map((notif) => (
                    <div
                        key={notif.id}
                        className={`p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border-2 transition-all hover:shadow-xl hover:shadow-blue-900/5 cursor-pointer relative overflow-hidden group active:scale-[0.98] ${notif.isPinned
                            ? 'bg-blue-50/50 border-blue-200'
                            : 'bg-white border-slate-50'
                            }`}
                    >
                        {notif.isPinned && (
                            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[7px] sm:text-[9px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest shadow-sm">
                                Pinned
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white shadow-inner border border-slate-100 group-hover:bg-blue-50 transition-colors`}>
                                    {getIcon(notif.category)}
                                </div>
                                <div>
                                    <p className="text-[7px] sm:text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">{notif.category}</p>
                                    <h3 className={`font-black text-[11px] sm:text-base text-slate-800 uppercase tracking-tight leading-tight group-hover:text-[#004AAD] transition-colors`}>
                                        {notif.title}
                                    </h3>
                                </div>
                            </div>
                        </div>

                        <p className="text-[10px] sm:text-sm text-slate-600 leading-relaxed mb-4 line-clamp-2 uppercase font-extrabold tracking-tight">
                            {notif.message}
                        </p>

                        <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                            <div className="flex items-center gap-1.5 text-[8px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                <Clock size={12} sm:size={14} />
                                {notif.date}
                            </div>
                            <div className="flex items-center gap-1 text-[8px] sm:text-[10px] text-[#004AAD] font-black uppercase tracking-widest group-hover:underline">
                                LIHAT DETAIL <ChevronRight size={12} sm:size={14} />
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
