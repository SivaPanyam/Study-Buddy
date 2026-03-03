
import React, { useState, useEffect } from 'react';
import { generateContent } from '../services/geminiService';
import { useGamificationContext } from '../context/GamificationContext';
import { PenTool, Brain, Save, Loader2, GraduationCap, MessageSquare, Wand2, Trash2, Plus, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

const Notes = () => {
    const { user } = useAuth();
    const [notes, setNotes] = useState([]);
    const [activeNote, setActiveNote] = useState(null);
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [aiResponse, setAiResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState('write'); // 'write' or 'teach'
    const [searchTerm, setSearchTerm] = useState('');
    const { addXP } = useGamificationContext();

    // Load notes from Supabase or localStorage
    useEffect(() => {
        loadNotes();
    }, [user]);

    const loadNotes = async () => {
        if (user?.id) {
            const { data, error } = await supabase
                .from('study_notes')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });

            if (data) setNotes(data);
        } else {
            const saved = localStorage.getItem('studyNotes');
            setNotes(saved ? JSON.parse(saved) : []);
        }
    };

    useEffect(() => {
        if (activeNote) {
            setContent(activeNote.content);
            setTitle(activeNote.title);
            setAiResponse(null);
        } else {
            setContent('');
            setTitle('');
            setAiResponse(null);
        }
    }, [activeNote]);

    const saveNote = async () => {
        if (!title.trim()) {
            alert("Please enter a note title");
            return;
        }

        try {
            if (user?.id) {
                // Save to Supabase
                const noteId = activeNote?.id || crypto.randomUUID();
                
                const { data, error } = await supabase
                    .from('study_notes')
                    .upsert({
                        id: noteId,
                        user_id: user.id,
                        title,
                        content,
                        updated_at: new Date().toISOString()
                    })
                    .select()
                    .single();

                if (error) {
                    console.error("Save error:", error);
                    alert("Failed to save note: " + error.message);
                    return;
                }

                await loadNotes();
                if (data) {
                    setActiveNote(data);
                    addXP(25, 'Note Saved');
                    alert("✅ Note saved successfully!");
                }
            } else {
                // Save locally
                const newNote = {
                    id: activeNote?.id || Date.now(),
                    title,
                    content,
                    updatedAt: new Date().toISOString()
                };

                let newNotes;
                if (activeNote) {
                    newNotes = notes.map(n => n.id === activeNote.id ? newNote : n);
                } else {
                    newNotes = [newNote, ...notes];
                }

                setNotes(newNotes);
                localStorage.setItem('studyNotes', JSON.stringify(newNotes));
                setActiveNote(newNote);
                addXP(25, 'Note Saved');
                alert("✅ Note saved successfully!");
            }
        } catch (err) {
            console.error("Save exception:", err);
            alert("Error saving note: " + err.message);
        }
    };

    const deleteNote = async (noteId) => {
        if (!window.confirm("Delete this note? This cannot be undone.")) return;

        if (user?.id) {
            // Delete from Supabase
            const { error } = await supabase
                .from('study_notes')
                .delete()
                .eq('id', noteId);

            if (!error) {
                await loadNotes();
                if (activeNote?.id === noteId) {
                    setActiveNote(null);
                }
            }
        } else {
            // Delete locally
            const newNotes = notes.filter(n => n.id !== noteId);
            setNotes(newNotes);
            localStorage.setItem('studyNotes', JSON.stringify(newNotes));
            if (activeNote?.id === noteId) {
                setActiveNote(null);
            }
        }
    };

    const handleAiAction = async (action) => {
        if (!content.trim()) return;
        setLoading(true);
        setAiResponse(null);

        try {
            let prompt = '';
            let xpReward = 0;
            let actionLabel = '';
            
            if (action === 'simplify') {
                prompt = `Simplify the following text for a 5-year-old:\n\n${content}`;
                xpReward = 50;
                actionLabel = 'Text Simplified';
            } else if (action === 'quiz') {
                prompt = `Generate 3 quick quiz questions based on this text:\n\n${content}`;
                xpReward = 60;
                actionLabel = 'Quiz Generated';
            } else if (action === 'grade') {
                prompt = `Please review the following explanation. Give constructive feedback on:
                1. Clarity and structure
                2. Depth of understanding
                3. Any missing information
                4. Suggestions for improvement
                
                Finally, provide a letter grade (A, B, C, D, or F) for the explanation.

                Explanation to review:
                ${content}
                `;
                xpReward = 100;
                actionLabel = 'Explanation Graded';
            }

            const response = await generateContent(prompt);
            setAiResponse(response);
            
            if (xpReward > 0) {
                addXP(xpReward, actionLabel);
            }
        } catch (error) {
            console.error(error);
            setAiResponse("AI is having trouble right now. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto pb-20 h-[calc(100vh-2rem)] flex flex-col">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 flex items-center gap-3">
                        <PenTool className="w-8 h-8 text-primary-start" />
                        Smart Notes
                    </h1>
                    <p className="mt-2 text-gray-400">Write, learn, and teach with AI assistance.</p>
                </div>
            </header>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-0">
                {/* Sidebar: Note List - Always Visible */}
                <div className="lg:col-span-1 bg-gray-800/30 border border-gray-800 rounded-2xl p-4 flex flex-col gap-4 overflow-hidden">
                    <div>
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">My Notes ({notes.length})</h2>
                        <button
                            onClick={() => {
                                setActiveNote({ id: null, title: 'New Note', content: '' });
                                setSearchTerm('');
                            }}
                            className="w-full bg-primary-start hover:bg-primary-end text-white p-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors mb-3"
                        >
                            <Plus className="w-4 h-4" /> New Note
                        </button>

                        {/* Search Bar */}
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search notes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-start/50"
                            />
                        </div>
                    </div>

                    {/* Notes List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                        {notes.filter(note => 
                            note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            note.content.toLowerCase().includes(searchTerm.toLowerCase())
                        ).map(note => (
                            <div
                                key={note.id}
                                onClick={() => setActiveNote(note)}
                                className={clsx(
                                    "p-3 rounded-xl cursor-pointer transition-all border text-left",
                                    activeNote?.id === note.id
                                        ? "bg-primary-start/20 border-primary-start text-white"
                                        : "bg-gray-900/50 border-gray-700 text-gray-300 hover:border-gray-500"
                                )}
                            >
                                <h3 className="font-bold text-sm mb-1 truncate">{note.title}</h3>
                                <p className="text-xs text-gray-500 line-clamp-2">
                                    {note.content || "No content"}
                                </p>
                                <div className="flex justify-between items-center mt-2">
                                    <p className="text-xs text-gray-600">
                                        {new Date(note.updated_at || note.updatedAt).toLocaleDateString()}
                                    </p>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteNote(note.id);
                                        }}
                                        className="text-gray-500 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {notes.length === 0 && (
                            <div className="text-center text-gray-500 text-xs py-8">
                                No notes yet. Create one to get started!
                            </div>
                        )}
                    </div>
                </div>

                {/* Editor Area */}
                {activeNote ? (
                    <>
                        <div className="lg:col-span-3 flex flex-col gap-4">
                            <div className="flex gap-2 mb-2 p-1 bg-gray-800/50 rounded-xl w-fit">
                                <button
                                    onClick={() => setMode('write')}
                                    className={clsx(
                                        "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                                        mode === 'write' ? "bg-primary-start text-white shadow-lg" : "text-gray-400 hover:text-white"
                                    )}
                                >
                                    <PenTool className="w-4 h-4" /> Write
                                </button>
                                <button
                                    onClick={() => setMode('teach')}
                                    className={clsx(
                                        "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                                        mode === 'teach' ? "bg-purple-500 text-white shadow-lg" : "text-gray-400 hover:text-white"
                                    )}
                                >
                                    <GraduationCap className="w-4 h-4" /> Teach Me (Feynman)
                                </button>
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Note Title"
                                    className="flex-1 bg-transparent text-2xl font-bold text-white border-none outline-none placeholder-gray-600"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={saveNote}
                                        className="bg-primary-start hover:bg-primary-end text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors"
                                    >
                                        <Save className="w-4 h-4" /> Save
                                    </button>
                                    <button
                                        onClick={() => setActiveNote(null)}
                                        className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-xl transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>

                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder={mode === 'teach' ? "Explain the concept here as if you're teaching it..." : "Start typing your notes..."}
                                className={clsx(
                                    "flex-1 bg-gray-900/50 border border-gray-800 rounded-2xl p-6 text-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-primary-start/50 leading-relaxed font-mono",
                                    mode === 'teach' ? "border-purple-500/20 bg-purple-500/5" : ""
                                )}
                            />
                        </div>

                        {/* AI Sidebar */}
                        <div className="lg:col-span-1 bg-gray-800/30 border border-gray-800 rounded-2xl p-4 flex flex-col gap-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <Brain className="w-4 h-4" /> AI Tutor
                            </h3>

                            {mode === 'write' ? (
                                <div className="space-y-2">
                                    <button
                                        onClick={() => handleAiAction('simplify')}
                                        disabled={loading || !content}
                                        className="w-full bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-xl text-sm font-medium transition-colors text-left flex items-center gap-2 border border-gray-700"
                                    >
                                        <Wand2 className="w-4 h-4 text-primary-start" /> Simplify Text
                                    </button>
                                    <button
                                        onClick={() => handleAiAction('quiz')}
                                        disabled={loading || !content}
                                        className="w-full bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-xl text-sm font-medium transition-colors text-left flex items-center gap-2 border border-gray-700"
                                    >
                                        <MessageSquare className="w-4 h-4 text-green-400" /> Generate Quiz
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl text-sm text-purple-200">
                                        <p className="mb-2"><strong>The Feynman Technique:</strong></p>
                                        <ul className="list-disc pl-4 space-y-1 text-xs opacity-80">
                                            <li>Choose a concept.</li>
                                            <li>Explain it simply.</li>
                                            <li>Identify gaps.</li>
                                            <li>Review and simplify.</li>
                                        </ul>
                                    </div>
                                    <button
                                        onClick={() => handleAiAction('grade')}
                                        disabled={loading || !content}
                                        className="w-full bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Grade My Explanation
                                    </button>
                                </div>
                            )}

                            {/* Response Area */}
                            <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-4 overflow-y-auto custom-scrollbar text-sm text-gray-300">
                                {loading ? (
                                    <div className="flex items-center justify-center h-full text-gray-500 gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" /> Thinking...
                                    </div>
                                ) : aiResponse ? (
                                    <div className="prose prose-invert prose-sm max-w-none">
                                        <div dangerouslySetInnerHTML={{ __html: aiResponse.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }} />
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-600 h-full flex flex-col items-center justify-center">
                                        <p>Select text or write an explanation to get AI feedback.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="lg:col-span-4 flex flex-col items-center justify-center text-gray-500">
                        <PenTool className="w-16 h-16 mb-4 opacity-20" />
                        <p>Select a note from the sidebar or create a new one to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notes;
