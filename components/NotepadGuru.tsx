import React, { useState, useEffect } from 'react';
import { ArrowLeft, StickyNote, Plus, Trash2, ChevronLeft } from 'lucide-react';

interface NotepadGuruProps {
    onBack: () => void;
}

interface Note {
    id: number;
    title: string;
    content: string;
    color: string;
    date: string;
}

const NotepadGuru: React.FC<NotepadGuruProps> = ({ onBack }) => {
    // 1. Initial State for Notes
    const [notes, setNotes] = useState<Note[]>(() => {
        try {
            const saved = localStorage.getItem('guru_notes_v1');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error("Failed to load notes:", error);
            return [];
        }
    });

    // 2. UI Control States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState<number | null>(null);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [newNoteTitle, setNewNoteTitle] = useState('');
    const [newNoteContent, setNewNoteContent] = useState('');

    // 3. Persist to LocalStorage
    useEffect(() => {
        localStorage.setItem('guru_notes_v1', JSON.stringify(notes));
    }, [notes]);

    // 4. Action Handlers
    const openAddModal = () => {
        setNewNoteTitle('');
        setNewNoteContent('');
        setIsAddModalOpen(true);
    };

    const handleSaveNote = () => {
        if (!newNoteTitle.trim() || !newNoteContent.trim()) return;

        const newNote: Note = {
            id: Date.now(),
            title: newNoteTitle,
            content: newNoteContent,
            color: ['bg-yellow-100', 'bg-blue-100', 'bg-green-100', 'bg-red-100'][Math.floor(Math.random() * 4)],
            date: new Date().toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        };

        setNotes(prev => [newNote, ...prev]);
        setIsAddModalOpen(false);
    };

    const openDeleteModal = (id: number) => {
        setNoteToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (noteToDelete !== null) {
            setNotes(prev => prev.filter(n => n.id !== noteToDelete));
            setIsDeleteModalOpen(false);
            setNoteToDelete(null);
        }
    };

    const openViewModal = (note: Note) => {
        setSelectedNote(note);
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full animate-in slide-in-from-right duration-300">
            {/* --- HEADER --- */}
            <div className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-100 flex items-center gap-4 shrink-0 bg-white sticky top-0 z-30">
                <button
                    onClick={onBack}
                    className="p-2 md:p-2.5 bg-white border border-slate-100 text-slate-500 rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="min-w-0 flex-1">
                    <h2 className="text-lg md:text-2xl font-black text-slate-800 tracking-tight leading-tight truncate">
                        Notepad Guru
                    </h2>
                    <p className="text-slate-400 text-[10px] md:text-sm font-medium">Catatan pribadi tugas & administrasi.</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="p-2.5 md:p-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-100 active:scale-95"
                >
                    <Plus size={20} />
                </button>
            </div>

            {/* --- CONTENT --- */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/20">

                {/* Info Card */}
                <div className="bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 p-5 md:p-6 rounded-3xl text-white shadow-xl flex items-center gap-4 border border-white/10 mb-6">
                    <div className="p-3 bg-white/15 backdrop-blur-xl rounded-2xl hidden sm:block">
                        <StickyNote size={24} className="text-amber-100" />
                    </div>
                    <div>
                        <h3 className="font-black text-sm md:text-lg uppercase tracking-wide">Papan Catatan Guru</h3>
                        <p className="text-[10px] md:text-xs text-amber-100/90 leading-relaxed mt-0.5 italic">
                            Simpan ide, rencana, atau tugas administratif yang perlu Anda selesaikan di sini.
                        </p>
                    </div>
                </div>

                {/* Notes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {notes.map((note) => (
                        <div
                            key={note.id}
                            onClick={() => openViewModal(note)}
                            className={`${note.color} p-5 rounded-3xl shadow-sm relative group hover:-translate-y-1.5 transition-all duration-300 cursor-pointer border border-black/5`}
                        >
                            <h3 className="font-bold text-slate-800 mb-2 truncate pr-6">{note.title}</h3>
                            <p className="text-sm text-slate-700 line-clamp-4 min-h-[80px] leading-relaxed">
                                {note.content}
                            </p>
                            <div className="mt-4 pt-4 border-t border-black/5 flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                <span>{note.date}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openDeleteModal(note.id);
                                    }}
                                    className="p-2 bg-white/50 hover:bg-red-500 hover:text-white rounded-xl text-red-500 transition-all"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Add New Placeholder */}
                    <button
                        onClick={openAddModal}
                        className="border-2 border-dashed border-slate-300 rounded-3xl p-6 flex flex-col items-center justify-center text-slate-400 gap-3 hover:border-amber-400 hover:text-amber-500 hover:bg-amber-50/50 transition-all min-h-[180px] group"
                    >
                        <div className="p-3 bg-slate-100 rounded-2xl group-hover:bg-amber-100 transition-colors">
                            <Plus size={32} />
                        </div>
                        <span className="font-bold text-sm">Buat Catatan Baru</span>
                    </button>
                </div>
            </div>

            {/* --- MODALS --- */}

            {/* Add Note Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-amber-500 p-6 text-white flex justify-between items-center">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Plus size={24} />
                                Catatan Baru
                            </h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                                <ChevronLeft size={20} className="rotate-180" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Judul</label>
                                <input
                                    type="text"
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all font-bold text-slate-700"
                                    placeholder="Contoh: Rapat Kurikulum"
                                    value={newNoteTitle}
                                    onChange={(e) => setNewNoteTitle(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Isi Catatan</label>
                                <textarea
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all min-h-[180px] resize-none text-slate-600 leading-relaxed"
                                    placeholder="Tulis detail catatan Anda di sini..."
                                    value={newNoteContent}
                                    onChange={(e) => setNewNoteContent(e.target.value)}
                                ></textarea>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="px-6 py-3 rounded-2xl text-slate-600 font-bold hover:bg-white transition-all"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSaveNote}
                                disabled={!newNoteTitle.trim() || !newNoteContent.trim()}
                                className="px-8 py-3 bg-amber-500 text-white rounded-2xl font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-200 disabled:opacity-50 disabled:scale-100"
                            >
                                Simpan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-xs overflow-hidden p-8 text-center animate-in zoom-in-95 duration-200">
                        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Trash2 size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Hapus Catatan?</h3>
                        <p className="text-sm text-slate-500 mb-8 leading-relaxed">Catatan yang dihapus tidak dapat dipulihkan kembali.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 py-3.5 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 shadow-lg shadow-red-200"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Note Details Modal */}
            {selectedNote && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className={`${selectedNote.color} p-6 md:p-8 border-b border-black/5 flex justify-between items-center`}>
                            <h3 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-3">
                                <StickyNote size={28} />
                                {selectedNote.title}
                            </h3>
                            <button
                                onClick={() => setSelectedNote(null)}
                                className="p-2 md:p-3 bg-white/40 hover:bg-white/60 rounded-full transition-colors"
                            >
                                <ChevronLeft size={20} className="rotate-180" />
                            </button>
                        </div>
                        <div className="p-8 md:p-10">
                            <p className="text-slate-700 leading-relaxed text-lg whitespace-pre-wrap font-medium">
                                {selectedNote.content}
                            </p>
                            <div className="mt-10 pt-6 border-t border-slate-100 flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-widest">
                                <span>Dibuat Pada</span>
                                <span>{selectedNote.date}</span>
                            </div>
                        </div>
                        <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedNote(null)}
                                className="px-10 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotepadGuru;
