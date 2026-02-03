import React, { useState, useEffect } from 'react';
import { ChevronLeft, MessageCircle, User } from 'lucide-react';
import { broadcastsDataGlobal, multimediaSettingsGlobal } from '../data/sharedData';
import { supabase, isSupabaseConfigured } from '../src/lib/supabase';

interface ChannelSekolahSiswaProps {
    onBack: () => void;
}

const ChannelSekolahSiswa: React.FC<ChannelSekolahSiswaProps> = ({ onBack }) => {
    const [broadcasts, setBroadcasts] = useState<any[]>(broadcastsDataGlobal);
    const [settings, setSettings] = useState<any>(multimediaSettingsGlobal);
    const [loading, setLoading] = useState(true);
    const [viewerCount, setViewerCount] = useState(124);

    useEffect(() => {
        const loadChannelData = async () => {
            if (!isSupabaseConfigured()) {
                setLoading(false);
                setBroadcasts(broadcastsDataGlobal);
                setSettings(multimediaSettingsGlobal);
                return;
            }

            try {
                // 1. Load Broadcasts
                const { data: bRes } = await supabase.from('app_settings').select('value').eq('key', 'broadcasts_data_v10').maybeSingle();
                if (bRes?.value) {
                    const parsed = typeof bRes.value === 'string' ? JSON.parse(bRes.value) : bRes.value;
                    setBroadcasts(Array.isArray(parsed) ? parsed : broadcastsDataGlobal);
                } else {
                    setBroadcasts(broadcastsDataGlobal);
                }

                // 2. Load Settings
                const { data: sRes } = await supabase.from('app_settings').select('value').eq('key', 'multimedia_settings_v10').maybeSingle();
                if (sRes?.value) {
                    const parsed = typeof sRes.value === 'string' ? JSON.parse(sRes.value) : sRes.value;
                    setSettings(parsed);
                } else {
                    setSettings(multimediaSettingsGlobal);
                }
            } catch (err) {
                console.error("Failed to load channel data from cloud", err);
                setBroadcasts(broadcastsDataGlobal);
                setSettings(multimediaSettingsGlobal);
            } finally {
                setLoading(false);
            }
        };

        loadChannelData();
    }, []);

    // Simulate viewer count fluctuation
    useEffect(() => {
        const interval = setInterval(() => {
            setViewerCount(prev => prev + Math.floor(Math.random() * 5) - 2);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const activeBroadcast = broadcasts.find(b => b.status === 'Active') || broadcasts[0];

    // Helper to get YouTube ID
    const getYoutubeId = (url: string) => {
        if (!url) return 'jfKfPfyJRdk';
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : 'jfKfPfyJRdk';
    };

    const VIDEO_ID = getYoutubeId(activeBroadcast?.url);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-white rounded-[2.5rem]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-white/90 backdrop-blur-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-white overflow-hidden animate-in slide-in-from-right duration-500 h-full flex flex-col">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center gap-3 shrink-0 bg-slate-900 text-white relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 animate-pulse"></div>
                <button
                    onClick={onBack}
                    className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl transition-all active:scale-90"
                >
                    <ChevronLeft size={20} sm:size={24} strokeWidth={3} />
                </button>
                <div className="flex-1 flex items-center gap-3 min-w-0">
                    <div className="relative flex h-2 w-2 sm:h-3 sm:w-3 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 sm:h-3 sm:w-3 bg-red-500"></span>
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-black text-xs sm:text-base leading-tight tracking-tight uppercase truncate">
                            {settings?.name || 'Channel Sekolah'}
                        </h3>
                        <p className="text-[7px] sm:text-[10px] text-red-400 font-extrabold tracking-widest uppercase">
                            {viewerCount} Live Viewers
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Main Content: Video Player */}
                <div className="flex-1 bg-black flex flex-col overflow-y-auto relative custom-scrollbar">
                    <div className="w-full aspect-video bg-black shadow-lg relative z-20 shrink-0 sticky top-0 group">
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=${settings?.autoplay ? 1 : 0}&rel=0&modestbranding=1`}
                            title="Live Stream Sekolah"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>

                    <div className="p-5 sm:p-8 bg-white min-h-[300px]">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="px-2 py-0.5 bg-red-600 text-white text-[8px] sm:text-[10px] font-black rounded uppercase tracking-widest">ON AIR</span>
                            <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">{activeBroadcast?.category || 'MULTIMEDIA'}</span>
                        </div>
                        <h1 className="text-lg sm:text-2xl font-black text-slate-900 leading-tight mb-4 uppercase tracking-tight">{activeBroadcast?.title || 'Menyiapkan Siaran...'}</h1>

                        <div className="flex items-center gap-3 text-xs text-slate-500 mb-6 border-b border-slate-50 pb-6">
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden shadow-sm">
                                        <User size={12} className="text-slate-300" />
                                    </div>
                                ))}
                            </div>
                            <span className="font-black text-[9px] sm:text-xs text-slate-400 uppercase tracking-widest">Penyiar: Staff Multimedia Sekolah</span>
                        </div>

                        <div className="relative">
                            <div className="absolute left-0 top-0 w-1 h-full bg-blue-100 rounded-full"></div>
                            <div className="pl-4">
                                <h4 className="font-black text-[10px] sm:text-xs text-[#004AAD] uppercase tracking-widest mb-2">Informasi Siaran</h4>
                                <p className="text-slate-600 leading-relaxed font-bold text-[10px] sm:text-sm uppercase tracking-tight">
                                    {activeBroadcast?.description || 'Terima kasih telah bergabung di channel sekolah kami. Silakan saksikan tayangan edukasi dan liputan kegiatan sekolah terbaru.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar: YouTube Live Chat Embed */}
                <div className="lg:w-80 w-full bg-slate-50 border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col h-[450px] lg:h-auto shrink-0 relative">
                    <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
                        <span className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <MessageCircle size={14} className="text-blue-600" /> Live Chat
                        </span>
                    </div>
                    <div className="flex-1 bg-white relative">
                        <iframe
                            src={`https://www.youtube.com/live_chat?v=${VIDEO_ID}&embed_domain=${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}`}
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            className="absolute inset-0 w-full h-full"
                        ></iframe>
                        <div className="absolute inset-0 flex flex-col items-center justify-center -z-10 text-center p-8 bg-slate-50">
                            <MessageCircle size={32} className="text-slate-200 mb-4" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                Membuat Koneksi Chat...<br />
                                <span className="lowercase font-medium text-slate-300 mt-2 block">(Fitur Chat membutuhkan domain yang terverifikasi di YouTube Console)</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChannelSekolahSiswa;
