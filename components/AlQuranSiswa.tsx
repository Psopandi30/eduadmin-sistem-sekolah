import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Search, PlayCircle, PauseCircle, ArrowLeft, BookOpen, AlertCircle } from 'lucide-react';
import { quranSurahsGlobal } from './data/quranStaticData';

interface AlQuranSiswaProps {
    onBack: () => void;
}

interface Surah {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: string;
}

interface Ayah {
    number: number;
    text: string; // Arabic or Translation depending on edition
    numberInSurah: number;
    audio?: string;
    translation?: string;
}

const AlQuranSiswa: React.FC<AlQuranSiswaProps> = ({ onBack }) => {
    // List Surah menggunakan Data Statis (quranStaticData.ts) -> Selalu 114 Surat, Online/Offline sama.
    const [surahs, setSurahs] = useState<Surah[]>(quranSurahsGlobal);
    const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
    const [ayahs, setAyahs] = useState<Ayah[]>([]);
    const [loading, setLoading] = useState(false); // Hanya untuk detail surat
    const [error, setError] = useState<string | null>(null); // Hanya untuk detail surat
    const [searchQuery, setSearchQuery] = useState('');

    // Audio State
    const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
    const [playingAyah, setPlayingAyah] = useState<number | null>(null); // global ayah number

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (currentAudio) {
                currentAudio.pause();
            }
        };
    }, [currentAudio]);

    // Fetch Surah Details (Arabic, Translation, Audio) dengan Multiple Fallback APIs + Caching
    const handleSelectSurah = async (surah: Surah, retryCount = 0) => {
        if (retryCount === 0) {
            setSelectedSurah(surah);
            setLoading(true);
            setAyahs([]);
            setPlayingAyah(null);
            setError(null);

            // Check cache first (7 days validity)
            try {
                const cachedData = localStorage.getItem(`quran_surah_${surah.number}`);
                if (cachedData) {
                    const parsed = JSON.parse(cachedData);
                    const cacheAge = Date.now() - parsed.timestamp;
                    // Cache valid for 7 days
                    if (cacheAge < 7 * 24 * 60 * 60 * 1000) {
                        console.log(`✓ Loading Surah ${surah.number} from cache`);
                        setAyahs(parsed.data);
                        setLoading(false);
                        return;
                    }
                }
            } catch (e) {
                console.warn('Cache read error:', e);
            }
        }

        if (currentAudio) currentAudio.pause();

        // API Fallback Strategy - 3 Different APIs for Maximum Reliability
        const apis = [
            // API 1: Al-Quran Cloud (Primary - Most Complete)
            {
                name: 'AlQuran.cloud',
                fetch: async () => {
                    const response = await fetch(
                        `https://api.alquran.cloud/v1/surah/${surah.number}/editions/quran-uthmani,id.indonesian,ar.alafasy`,
                        { 
                            mode: 'cors', 
                            credentials: 'omit',
                            headers: {
                                'Accept': 'application/json',
                            }
                        }
                    );
                    if (!response.ok) throw new Error('API Error');
                    const data = await response.json();
                    
                    if (data.code === 200 && data.data.length === 3) {
                        const arabicData = data.data[0].ayahs;
                        const transData = data.data[1].ayahs;
                        const audioData = data.data[2].ayahs;

                        return arabicData.map((ayah: any, index: number) => {
                            let cleanText = ayah.text;
                            if (surah.number !== 1 && ayah.numberInSurah === 1) {
                                const bismillah = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
                                if (cleanText.startsWith(bismillah)) cleanText = cleanText.replace(bismillah, "").trim();
                            }

                            return {
                                number: ayah.number,
                                numberInSurah: ayah.numberInSurah,
                                text: cleanText,
                                translation: transData[index].text,
                                audio: audioData[index].audio
                            };
                        });
                    }
                    throw new Error('Incomplete data');
                }
            },
            // API 2: EQuran.id (Indonesian Server - Faster for Indonesia)
            {
                name: 'EQuran.id',
                fetch: async () => {
                    const response = await fetch(
                        `https://equran.id/api/v2/surat/${surah.number}`,
                        { 
                            mode: 'cors', 
                            credentials: 'omit',
                            headers: {
                                'Accept': 'application/json',
                            }
                        }
                    );
                    if (!response.ok) throw new Error('API Error');
                    const data = await response.json();

                    if (data.code === 200 && data.data.ayat) {
                        return data.data.ayat.map((a: any) => {
                            let cleanText = a.teksArab;
                            if (surah.number !== 1 && a.nomorAyat === 1) {
                                const bismillah = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
                                if (cleanText.startsWith(bismillah)) cleanText = cleanText.replace(bismillah, "").trim();
                            }

                            return {
                                number: a.nomorAyat,
                                numberInSurah: a.nomorAyat,
                                text: cleanText,
                                translation: a.teksIndonesia,
                                audio: a.audio['05'] || a.audio['01'] || Object.values(a.audio)[0]
                            };
                        });
                    }
                    throw new Error('Incomplete data');
                }
            },
            // API 3: Quran.com API (Global CDN - Very Reliable)
            {
                name: 'Quran.com',
                fetch: async () => {
                    // Fetch Arabic text
                    const arabicRes = await fetch(
                        `https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${surah.number}`,
                        { 
                            mode: 'cors', 
                            credentials: 'omit',
                            headers: {
                                'Accept': 'application/json',
                            }
                        }
                    );
                    // Fetch Indonesian translation (ID: 134)
                    const transRes = await fetch(
                        `https://api.quran.com/api/v4/quran/translations/134?chapter_number=${surah.number}`,
                        { 
                            mode: 'cors', 
                            credentials: 'omit',
                            headers: {
                                'Accept': 'application/json',
                            }
                        }
                    );

                    if (!arabicRes.ok || !transRes.ok) throw new Error('API Error');
                    
                    const arabicData = await arabicRes.json();
                    const transData = await transRes.json();

                    if (arabicData.verses && transData.translations) {
                        return arabicData.verses.map((ayah: any, index: number) => {
                            let cleanText = ayah.text_uthmani;
                            if (surah.number !== 1 && ayah.verse_key.endsWith(':1')) {
                                const bismillah = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
                                if (cleanText.startsWith(bismillah)) cleanText = cleanText.replace(bismillah, "").trim();
                            }

                            return {
                                number: ayah.id,
                                numberInSurah: ayah.verse_number,
                                text: cleanText,
                                translation: transData.translations[index]?.text || '',
                                audio: `https://verses.quran.com/Abdul_Basit/Murattal/mp3/${ayah.verse_key.replace(':', '_')}.mp3`
                            };
                        });
                    }
                    throw new Error('Incomplete data');
                }
            }
        ];

        // Try each API in sequence
        for (let i = 0; i < apis.length; i++) {
            const api = apis[i];
            try {
                console.log(`🔄 Trying ${api.name}...`);
                const ayahsData = await api.fetch();
                
                // Success! Cache the data for offline use
                try {
                    localStorage.setItem(`quran_surah_${surah.number}`, JSON.stringify({
                        data: ayahsData,
                        timestamp: Date.now()
                    }));
                } catch (e) {
                    console.warn('Cache write error:', e);
                }

                setAyahs(ayahsData);
                setLoading(false);
                console.log(`✅ Successfully loaded from ${api.name}`);
                return;
            } catch (err) {
                console.error(`❌ ${api.name} failed:`, err);
                // Continue to next API
            }
        }

        // All APIs failed - retry once more after delay
        if (retryCount < 1) {
            console.log('⏳ All APIs failed, retrying in 2 seconds...');
            setTimeout(() => handleSelectSurah(surah, retryCount + 1), 2000);
        } else {
            setError('Tidak dapat memuat data Al-Qur\'an. Silakan periksa koneksi internet Anda dan coba lagi.');
            setLoading(false);
        }
    };

    const handlePlayAudio = (url: string, globalAyahNumber: number) => {
        if (currentAudio) {
            currentAudio.pause();
        }

        if (playingAyah === globalAyahNumber) {
            // If clicking the same ayah that is playing, just stop it (toggle pause behavior or stop)
            setPlayingAyah(null);
            setCurrentAudio(null);
        } else {
            const audio = new Audio(url);
            audio.play();
            audio.onended = () => setPlayingAyah(null);
            setCurrentAudio(audio);
            setPlayingAyah(globalAyahNumber);
        }
    };

    // Filter Surahs
    const filteredSurahs = surahs.filter(s =>
        s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.name.includes(searchQuery) ||
        s.englishNameTranslation.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // --- RENDER SURAH DETAIL ---
    if (selectedSurah) {
        return (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-right duration-300 flex flex-col h-full">
                {/* Header Detail */}
                <div className="p-6 border-b border-slate-100 flex items-center gap-3 shrink-0 bg-[#004AAD] text-white">
                    <button onClick={() => setSelectedSurah(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex-1 text-center pr-10">
                        <h3 className="font-bold text-xl font-serif">{selectedSurah.name}</h3>
                        <p className="text-xs opacity-80">{selectedSurah.englishName} • {selectedSurah.numberOfAyahs} Ayat</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 relative">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004AAD]"></div>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-red-500 gap-3">
                            <AlertCircle size={32} />
                            <p className="font-bold text-center px-4">{error}</p>
                            <button
                                onClick={() => handleSelectSurah(selectedSurah)}
                                className="px-6 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors"
                            >
                                Coba Lagi
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 max-w-3xl mx-auto">
                            {/* Bismillah for all surahs except At-Tawbah (9) */}
                            {selectedSurah.number !== 9 && (
                                <div className="text-center py-6 font-serif text-3xl text-slate-800 mb-4">
                                    بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                                </div>
                            )}

                            {ayahs.map((ayah) => (
                                <div key={ayah.number} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative group hover:shadow-md transition-shadow">
                                    {/* Action Bar */}
                                    <div className="flex items-center justify-between mb-6 bg-slate-50 rounded-xl p-2 px-4">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 flex items-center justify-center bg-[#004AAD] text-white text-xs font-bold rounded-full">
                                                {ayah.numberInSurah}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => ayah.audio && handlePlayAudio(ayah.audio, ayah.number)}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${playingAyah === ayah.number ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
                                        >
                                            {playingAyah === ayah.number ? (
                                                <>
                                                    <PauseCircle size={16} /> Stop
                                                </>
                                            ) : (
                                                <>
                                                    <PlayCircle size={16} /> Putar Audio
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {/* Arabic Text */}
                                    <p className="text-right font-serif text-3xl leading-[2.5] text-slate-800 mb-6" dir="rtl">
                                        {ayah.text}
                                    </p>

                                    {/* Translation */}
                                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                        {ayah.translation}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // --- RENDER SURAH LIST ---
    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-right duration-300 flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 shrink-0">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ChevronRight className="rotate-180" size={24} />
                </button>
                <div className="flex-1">
                    <h3 className="font-bold text-slate-800 text-lg">Al-Qur'an Digital</h3>
                </div>
            </div>

            {/* Search Bar */}
            <div className="px-6 pt-6 pb-2">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Cari Surat (e.g., Al-Fatihah)..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:border-transparent transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredSurahs.map((surah) => (
                        <button
                            key={surah.number}
                            onClick={() => handleSelectSurah(surah)}
                            className="flex items-center p-4 border border-slate-100 rounded-2xl hover:border-[#BFDBFE] hover:bg-blue-50/30 transition-all text-left group"
                        >
                            <div className="w-10 h-10 flex items-center justify-center bg-slate-50 text-[#004AAD] font-bold rounded-lg mr-4 border border-slate-200 group-hover:border-blue-200 group-hover:bg-blue-100 transition-colors">
                                {surah.number}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-0.5">
                                    <h4 className="font-bold text-slate-800">{surah.englishName}</h4>
                                    <span className="text-[#004AAD] font-serif font-bold text-lg">{surah.name}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-slate-500">
                                    <span>{surah.englishNameTranslation}</span>
                                    <span>{surah.numberOfAyahs} Ayat</span>
                                </div>
                            </div>
                        </button>
                    ))}
                    {filteredSurahs.length === 0 && (
                        <div className="col-span-full text-center py-10 text-slate-400">
                            Tidak ada surat yang ditemukan.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AlQuranSiswa;
