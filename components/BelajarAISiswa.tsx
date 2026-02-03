import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, Send, Bot, User, RefreshCw, Clock, MessageSquare, Plus, Trash2, Sparkles, AlertCircle, ArrowLeft } from 'lucide-react';
import { sendToGemini, generateChatTitle, type GeminiMessage } from '../utils/geminiService';

interface BelajarAISiswaProps {
    onBack: () => void;
    user: any;
    title?: string;
    welcomeMessage?: string;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface ChatSession {
    id: string;
    title: string;
    date: Date;
}

const BelajarAISiswa: React.FC<BelajarAISiswaProps> = ({
    onBack,
    user,
    title = "Teman Belajar",
    welcomeMessage = "Halo! Saya asisten AI Anda. Ada yang bisa saya bantu hari ini?"
}) => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: welcomeMessage,
            timestamp: new Date()
        }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const [chatHistory, setChatHistory] = useState<GeminiMessage[]>([]);
    const [history, setHistory] = useState<ChatSession[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('ai_chat_history_v10');
            if (saved) return JSON.parse(saved);
        }
        return [
            { id: '1', title: 'Belajar Rumus Pythagoras', date: new Date(Date.now() - 86400000) },
            { id: '2', title: 'Ide Cerita Pendek Hewan', date: new Date(Date.now() - 172800000) },
        ];
    });
    const [showHistory, setShowHistory] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    useEffect(() => {
        localStorage.setItem('ai_chat_history_v10', JSON.stringify(history));
    }, [history]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsTyping(true);

        // Jika ini pesan pertama setelah reset, buat session baru
        if (chatHistory.length === 0 && messages.length === 2) { // 2 karena welcome message + user message
            handleNewChat(currentInput);
        }

        try {
            // Panggil Google Gemini API
            const aiResponseText = await sendToGemini(currentInput, chatHistory);

            // Update chat history untuk Gemini
            const newHistory: GeminiMessage[] = [
                ...chatHistory,
                { role: 'user', parts: currentInput },
                { role: 'model', parts: aiResponseText }
            ];
            setChatHistory(newHistory);

            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: aiResponseText,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiResponse]);
        } catch (error) {
            console.error('Error in handleSend:', error);

            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Maaf, terjadi kesalahan saat memproses pesan Anda. Silakan coba lagi.',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleNewChat = (firstMessage?: string) => {
        const title = firstMessage ? generateChatTitle(firstMessage) : 'Belajar Bersama AI';

        setMessages([
            {
                id: Date.now().toString(),
                role: 'assistant',
                content: 'Halo! Sesi baru dimulai. Apa yang ingin kamu pelajari sekarang?',
                timestamp: new Date()
            }
        ]);
        setChatHistory([]); // Reset chat history untuk Gemini
        setShowHistory(false);

        // Tambahkan ke history jika ada firstMessage
        if (firstMessage) {
            const newSession: ChatSession = {
                id: Date.now().toString(),
                title: title,
                date: new Date()
            };
            setHistory(prev => [newSession, ...prev]);
        }
    };

    const handleDeleteSession = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setHistory(prev => prev.filter(s => s.id !== id));
    };

    const handleClearHistory = () => {
        if (confirm("Hapus semua riwayat percakapan?")) {
            setHistory([]);
            localStorage.removeItem('ai_chat_history_v10');
        }
    };

    const loadSession = (session: ChatSession) => {
        // Mock loading - in real app would fetch messages for this session
        setMessages([
            { id: '1', role: 'assistant', content: `Memuat sesi: ${session.title}...`, timestamp: new Date() },
            { id: '2', role: 'user', content: 'Halo, saya ingin lanjut belajar.', timestamp: new Date() },
            { id: '3', role: 'assistant', content: 'Tentu! Mari kita lanjutkan pembahasan kita sebelumnya.', timestamp: new Date() }
        ]);
        setShowHistory(false);
    };

    // Fungsi Render Content untuk Format Teks AI
    const renderContent = (content: string) => {
        return content.split('\n').map((line, i) => {
            // Deteksi Bold (**teks**)
            const parts = line.split(/(\*\*.*?\*\*)/g);
            return (
                <p key={i} className={line.trim() === '' ? 'h-3' : 'mb-2 last:mb-0'}>
                    {parts.map((part, j) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={j} className="font-black text-slate-900">{part.slice(2, -2)}</strong>;
                        }
                        return part;
                    })}
                </p>
            );
        });
    };

    const isTeacher = user?.role === 'guru' || user?.role === 'wali_kelas' || user?.role === 'bimbel';

    const quickPrompts = isTeacher ? [
        "Ide metode mengajar interaktif",
        "Buat draft pesan untuk orang tua",
        "Bantu susun materi pelajaran",
        "Tips menangani siswa kurang fokus"
    ] : [
        "Tips mendampingi anak belajar",
        "Tanya seputar kegiatan sekolah",
        "Cara memotivasi anak di rumah",
        "Draft izin tidak masuk sekolah"
    ];

    return (
        <div className="bg-white shadow-2xl overflow-hidden animate-in slide-in-from-right duration-500 flex flex-col md:flex-row h-full relative z-10 rounded-t-[2.5rem] rounded-b-none md:rounded-[2.5rem]">
            {/* Sidebar History (Drawer on mobile, Sidebar on desktop) */}
            <div className={`
                fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 md:hidden
                ${showHistory ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            `} onClick={() => setShowHistory(false)}></div>

            <div className={`
                fixed md:relative inset-y-0 left-0 z-50 w-72 bg-white md:bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 transition-transform duration-300 transform
                ${showHistory ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-[#004AAD] md:bg-transparent">
                    <h3 className="font-black text-white md:text-slate-700 text-sm flex items-center gap-2 uppercase tracking-widest">
                        <Clock size={16} /> Riwayat Chat
                    </h3>
                    <button onClick={() => setShowHistory(false)} className="md:hidden text-white/80">
                        <ArrowLeft size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                            <MessageSquare size={32} className="opacity-20 mb-2" />
                            <p className="text-[10px] font-bold">Belum ada riwayat</p>
                        </div>
                    ) : (
                        history.map(session => (
                            <div
                                key={session.id}
                                onClick={() => loadSession(session)}
                                className="w-full text-left p-4 rounded-2xl hover:bg-slate-200/50 md:hover:bg-white md:hover:shadow-sm border border-transparent hover:border-slate-100 transition-all cursor-pointer group relative"
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-slate-700 text-xs truncate mb-1 uppercase tracking-tight">{session.title}</p>
                                        <p className="text-[9px] font-bold text-slate-400">
                                            {new Date(session.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteSession(e, session.id)}
                                        className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors md:opacity-0 md:group-hover:opacity-100"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-slate-200">
                    <button
                        onClick={handleClearHistory}
                        className="w-full flex items-center justify-center gap-2 text-rose-500 text-[10px] font-black p-3 hover:bg-rose-50 rounded-2xl transition-all border border-dashed border-rose-200"
                    >
                        <Trash2 size={14} /> BERSIHKAN SEMUA
                    </button>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-white">
                {/* Header Chat - More Premium & Compact */}
                <div className="px-5 py-4 md:px-6 md:py-5 border-b border-slate-200/50 flex items-center justify-between shrink-0 bg-white/50 backdrop-blur-md sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2.5 hover:bg-slate-100 rounded-full transition-colors">
                            <ArrowLeft size={22} className="text-slate-600" />
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 transform -rotate-3 group relative overflow-hidden">
                                <Bot size={28} className="text-white relative z-10" />
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 text-[10px] md:text-sm uppercase tracking-[0.2em]">{title}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-black tracking-widest uppercase">ACTIVE • GEMINI PRO</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* User profile on the right - Request fulfilled */}
                        <div className="hidden sm:flex flex-col items-end mr-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Sesi Anda</p>
                            <p className="text-[11px] font-extrabold text-slate-700 truncate max-w-[100px] leading-none">{user?.nama || 'Pengguna'}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full border-2 border-blue-50 p-0.5 shadow-sm">
                            {user?.avatar ? (
                                <img src={user.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                    <User size={18} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50/50">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            {/* Avatar */}
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'assistant'
                                ? 'bg-gradient-to-tr from-[#004AAD] to-blue-600 text-white shadow-blue-500/20'
                                : 'bg-white border border-slate-200 text-slate-400' // User avatar placeholder
                                }`}>
                                {msg.role === 'assistant' ? <Sparkles size={16} /> : <User size={16} />}
                            </div>

                            {/* Bubble */}
                            <div className={`flex flex-col max-w-[88%] sm:max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`px-5 py-4 rounded-[1.5rem] shadow-sm text-sm leading-relaxed ${msg.role === 'user'
                                    ? 'bg-gradient-to-br from-[#004AAD] to-blue-700 text-white rounded-tr-none'
                                    : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                                    }`}>
                                    {renderContent(msg.content)}
                                </div>
                                <span className="text-[9px] font-black text-slate-400 mt-1 px-3 uppercase tracking-tighter opacity-60">
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex gap-4 animate-pulse">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#004AAD] to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                                <Sparkles size={18} className="text-white" />
                            </div>
                            <div className="bg-white border border-slate-100 px-6 py-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-75"></div>
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-150"></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area - Adjusted for Immersive Mode and Mobile Keyboards */}
                <div className="p-4 md:p-8 bg-white border-t border-slate-50 pb-8 md:pb-8 relative z-30">
                    {/* Quick Prompts - Interactive */}
                    {messages.length <= 1 && !isTyping && (
                        <div className="flex flex-wrap gap-2 mb-6 justify-center animate-in fade-in slide-in-from-bottom-3 duration-700">
                            {quickPrompts.map((prompt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setInput(prompt);
                                    }}
                                    className="px-4 py-2 bg-slate-50 hover:bg-blue-600 text-slate-600 hover:text-white border border-slate-200 hover:border-blue-600 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 group"
                                >
                                    <Sparkles size={10} className="text-blue-400 group-hover:text-white transition-colors" />
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="relative max-w-4xl mx-auto flex items-end gap-3 bg-slate-50/80 p-2 rounded-[2.5rem] border border-slate-200/60 shadow-inner focus-within:bg-white focus-within:border-blue-200 focus-within:shadow-lg transition-all duration-300">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Tanya apapun ke AI..."
                            className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none outline-none text-slate-800 font-semibold placeholder:text-slate-400 py-3 px-6 max-h-40 min-h-[48px] text-sm md:text-base"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isTyping}
                            className="w-12 h-12 bg-gradient-to-br from-[#004AAD] to-blue-700 text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all shadow-lg shadow-blue-500/10 shrink-0"
                        >
                            {isTyping ? <RefreshCw size={20} className="animate-spin" /> : <Send size={20} className="ml-1" />}
                        </button>
                    </div>
                    <p className="text-center text-[8px] font-black text-slate-300 mt-4 uppercase tracking-[0.2em]">
                        CERDAS • AMAN • AKURAT (POWERED BY EDUADMIN AI)
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BelajarAISiswa;
