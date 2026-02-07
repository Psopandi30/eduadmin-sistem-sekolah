import React, { useState } from 'react';
import { ArrowLeft, StickyNote, Plus, Trash2, ChevronLeft } from 'lucide-react';

interface NotepadGuruProps {
    onBack: () => void;
}

const NotepadGuru: React.FC<NotepadGuruProps> = ({ onBack }) => {
    const [notes, setNotes] = useState(() => {
        const saved = localStorage.getItem('guru_notes_v1');
        return saved ? JSON.parse(saved) : [];
    });
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newNoteTitle, setNewNoteTitle] = useState('');
    const [newNoteContent, setNewNoteContent] = useState('');

    React.useEffect(() => {
        localStorage.setItem('guru_notes_v1', JSON.stringify(notes));
    }, [notes]);

    const openAddModal = () => {
        setNewNoteTitle('');
        setNewNoteContent('');
        setIsAddModalOpen(true);
    };

    const handleSaveNote = () => {
        if (!newNoteTitle.trim() || !newNoteContent.trim()) {
            // Optional: Add toast error here if desired
            return;
        }

        const newNote = {
            id: Date.now(),
            title: newNoteTitle,
            content: newNoteContent,
            color: ['bg-yellow-100', 'bg-blue-100', 'bg-green-100', 'bg-red-100'][Math.floor(Math.random() * 4)],
            date: new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
        };
        setNotes([newNote, ...notes]);
        setIsAddModalOpen(false);
    };

    const deleteNote = (id: number) => {
        if (confirm('Hapus catatan ini?')) {
            setNotes(notes.filter((n: any) => n.id !== id));
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-right duration-300 flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-100 flex items-center gap-3 md:gap-4 shrink-0 bg-white sticky top-0 z-30">
                <button
                    onClick={onBack}
                    className="p-2 md:p-2.5 bg-white border border-slate-100 text-slate-500 rounded-xl md:rounded-2xl transition-all hover:bg-slate-50 shrink-0 shadow-sm"
                >
                    <ArrowLeft size={20} className="md:w-[22px]" />
                </button>
                <div className="min-w-0 flex-1">
                    <h2 className="text-base md:text-2xl font-black text-slate-800 tracking-tight leading-tight truncate">
                        Notepad Guru
                    </h2>
                    <p className="text-slate-400 text-[10px] md:text-sm font-medium">Catatan pribadi tugas & administrasi.</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="p-2.5 md:p-3 bg-amber-500 text-white rounded-xl md:rounded-2xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-200 active:scale-95"
                    title="Tambah Catatan"
                >
                    <Plus size={20} />
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/20">

                {/* Info Card - Consistent Style */}
                <div className="bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 p-5 md:p-6 rounded-3xl text-white shadow-xl shadow-amber-100 flex items-center gap-4 border border-white/10 mb-6 font-sans">
                    <div className="p-3 bg-white/15 backdrop-blur-xl rounded-2xl shrink-0 hidden sm:block">
                        <StickyNote size={24} className="text-amber-100" />
                    </div>
                    <div>
                        <h3 className="font-black text-sm md:text-lg uppercase tracking-wide">Papan Catatan Guru</h3>
                        <p className="text-[10px] md:text-xs text-amber-100/90 leading-relaxed mt-0.5 italic">
                            Tuliskan ide, rencana, atau tugas administratif yang perlu Anda selesaikan di sini agar tidak lupa.
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {notes.map((note) => (
                        <div key={note.id} className={`${note.color} p-5 rounded-2xl shadow-sm relative group hover:-translate-y-1 transition-transform duration-300`}>
                            <h3 className="font-bold text-slate-800 mb-2">{note.title}</h3>
                            <p className="text-sm text-slate-700 leading-relaxed min-h-[60px]">{note.content}</p>
                            <div className="mt-4 pt-3 border-t border-black/5 flex justify-between items-center text-xs text-slate-500">
                                <span>{note.date}</span>
                                <button onClick={() => deleteNote(note.id)} className="p-1.5 hover:bg-white/50 rounded text-red-500 opacity-100 transition-opacity">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Add New Placeholder */}
                    <button onClick={openAddModal} className="border-2 border-dashed border-slate-300 rounded-2xl p-5 flex flex-col items-center justify-center text-slate-400 gap-2 hover:border-amber-400 hover:text-amber-500 hover:bg-amber-50 transition-all min-h-[150px]">
                        <Plus size={32} />
                        <span className="font-bold text-sm">Tambah Catatan Baru</span>
                    </button>
                </div>
            </div>

            {/* Add Note Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-amber-500 p-6 text-white flex justify-between items-center">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <StickyNote size={24} />
                                Catatan Baru
                            </h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                                <ChevronLeft size={20} className="rotate-180" /> {/* Using ChevronLeft as close icon alternative or just replace with X if imported */}
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-700">Judul Catatan</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-bold text-slate-700"
                                    placeholder="Contoh: Ide Lomba Kelas"
                                    value={newNoteTitle}
                                    onChange={(e) => setNewNoteTitle(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-700">Isi Catatan</label>
                                <textarea
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all min-h-[150px] resize-none text-slate-600"
                                    placeholder="Tulis detail catatan Anda di sini..."
                                    value={newNoteContent}
                                    onChange={(e) => setNewNoteContent(e.target.value)}
                                ></textarea>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-white hover:text-red-500 transition-all"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSaveNote}
                                disabled={!newNoteTitle.trim() || !newNoteContent.trim()}
                                className="px-6 py-2.5 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Simpan Catatan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotepadGuru;
