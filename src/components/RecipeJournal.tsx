import { useState, useEffect } from 'react';
import { getJournalEntries, deleteJournalEntry, updateJournalEntryNotes, JournalEntry } from '../lib/journal';
import { Book, Trash2, Edit3, Check, X, Search, Calendar, ChefHat, MessageSquare, BookOpen, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

export function RecipeJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [filter, setFilter] = useState<'all' | 'message' | 'conversation'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadEntries = async () => {
    const data = await getJournalEntries();
    setEntries(data);
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      return;
    }
    
    await deleteJournalEntry(id);
    setDeleteConfirmId(null);
    if (selectedEntry?.id === id) {
      setSelectedEntry(null);
      setIsEditing(false);
    }
    await loadEntries();
  };

  const handleStartEdit = () => {
    if (!selectedEntry) return;
    setIsEditing(true);
    setEditTitle(selectedEntry.title);
    setEditContent(selectedEntry.content);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedEntry) return;
    const updated = await updateJournalEntryNotes(selectedEntry.id, editTitle, editContent);
    if (updated) {
      setSelectedEntry(updated);
      setIsEditing(false);
      await loadEntries();
    }
  };

  const handleSendToChatbot = () => {
    if (!selectedEntry) return;
    
    let promptText = "";
    if (selectedEntry.type === 'message') {
      promptText = `Hi Chef Nino, I would like to discuss this saved recipe from my journal:\n\n### ${selectedEntry.title}\n\n${selectedEntry.content}\n\nCan you suggest some modifications or pairings for this?`;
    } else {
      promptText = `Hi Chef Nino, let's resume our discussion from this saved conversation:\n\n${selectedEntry.content}\n\nWhat other tips can you give me about this?`;
    }

    // Dispatch custom events to prefill chat and trigger tab change
    window.dispatchEvent(new CustomEvent('nino-prefill-chat', { detail: promptText }));
    window.dispatchEvent(new CustomEvent('nino-switch-tab', { detail: 'chat' }));
  };

  const filteredEntries = entries.filter(entry => {
    const matchesFilter = filter === 'all' || entry.type === filter;
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          entry.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex h-full flex-col lg:flex-row overflow-hidden bg-[#0a0908] p-6 lg:p-10 select-none">
      {/* Sidebar - Entries List */}
      <div className="flex w-full lg:w-96 flex-col border-b lg:border-b-0 lg:border-r border-[#5e503f]/50 bg-[#0a0908] pb-6 lg:pb-0 lg:pr-8 h-full overflow-hidden shrink-0">
        <div className="mb-6">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#5e503f] font-mono mb-4 font-bold">SAVED ENTRIES LOG</div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-[#5e503f]" />
            <input
              type="text"
              placeholder="Search saved recipes & chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0a0908] border border-[#5e503f]/40 py-3 pl-10 pr-4 text-xs text-[#f2f4f3] placeholder-[#5e503f] focus:border-[#a9927d] transition-all outline-none rounded-none"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 border-b border-[#5e503f]/20 pb-2">
            {(['all', 'message', 'conversation'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`text-[9px] uppercase tracking-wider font-bold transition-all px-2.5 py-1.5 border ${
                  filter === t 
                    ? 'border-[#49111c] bg-[#49111c]/10 text-[#f2f4f3]' 
                    : 'border-transparent text-[#a9927d] hover:text-[#f2f4f3]'
                }`}
              >
                {t === 'all' ? 'All Entries' : t === 'message' ? 'Recipes' : 'Conversations'}
              </button>
            ))}
          </div>
        </div>

        {/* Entries scroll container */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border border-[#5e503f]/20 rounded-sm">
              <Book className="h-6 w-6 text-[#5e503f] mb-3 opacity-60" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#a9927d]">Empty Archive</span>
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const worksAsSelected = selectedEntry?.id === entry.id;
              return (
                <div
                  key={entry.id}
                  onClick={() => {
                    setSelectedEntry(entry);
                    setIsEditing(false);
                  }}
                  className={`group relative flex flex-col p-4 border transition-all cursor-pointer ${
                    worksAsSelected 
                      ? 'border-[#49111c] bg-[#49111c]/10 text-[#f2f4f3]' 
                      : 'border-[#5e503f]/30 hover:border-[#a9927d] hover:bg-[#5e503f]/5 text-[#a9927d]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[8px] font-mono tracking-wider opacity-60 uppercase border border-current px-1 py-0.5 shrink-0 scale-95">
                          {entry.type === 'message' ? 'RECIPE' : 'CONV'}
                        </span>
                        <span className="text-[9px] font-mono opacity-50">
                          {new Date(entry.savedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-xs font-serif font-light truncate leading-snug">{entry.title}</h4>
                    </div>
                    
                    <button
                      onClick={(e) => handleDelete(e, entry.id)}
                      className={`p-1 flex items-center justify-center rounded transition-all ${
                        deleteConfirmId === entry.id
                          ? 'text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider'
                          : 'text-rose-500 hover:text-rose-400 opacity-40 hover:opacity-100'
                      }`}
                      title={deleteConfirmId === entry.id ? 'Click again to confirm purge' : 'Delete Entry'}
                      onMouseLeave={() => {
                        if (deleteConfirmId === entry.id) setDeleteConfirmId(null);
                      }}
                    >
                      {deleteConfirmId === entry.id ? 'SURE?' : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main detail view */}
      <div className="flex-1 flex flex-col h-full overflow-hidden mt-6 lg:mt-0 lg:pl-10">
        {selectedEntry ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a0908] border border-[#5e503f]/30 p-6 lg:p-8">
            {isEditing ? (
              /* EDIT MODE */
              <div className="flex-1 flex flex-col h-full gap-4">
                <div className="flex items-center justify-between border-b border-[#5e503f]/30 pb-4">
                  <span className="text-[10px] font-mono text-[#a9927d] uppercase tracking-[0.3em]">EDITING RECIPE NOTE</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleSaveEdit}
                      className="flex items-center gap-1 bg-[#49111c] text-[#f2f4f3] px-3.5 py-1.5 text-[9px] font-bold uppercase tracking-widest border border-[#5e503f] hover:bg-[#5e503f]"
                    >
                      <Check size={12} /> Save
                    </button>
                    <button 
                      onClick={handleCancelEdit}
                      className="flex items-center gap-1 bg-[#0a0908] text-[#a9927d] px-3.5 py-1.5 text-[9px] font-bold uppercase tracking-widest border border-[#5e503f] hover:text-[#f2f4f3]"
                    >
                      <X size={12} /> Cancel
                    </button>
                  </div>
                </div>

                <div className="space-y-4 flex-1 flex flex-col">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-[#a9927d] mb-1.5">Recipe / Entry Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-[#0a0908] border border-[#5e503f]/50 p-2.5 text-xs text-[#f2f4f3] focus:border-[#a9927d] outline-none"
                    />
                  </div>

                  <div className="flex-1 flex flex-col minimum-h-0">
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-[#a9927d] mb-1.5">Recipe & Discussion Content (Markdown format supported)</label>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="flex-1 w-full bg-[#0a0908] border border-[#5e503f]/50 p-3 text-xs text-[#f2f4f3] font-sans leading-relaxed focus:border-[#a9927d] outline-none resize-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* VIEW MODE */
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Header controls for detail view */}
                <div className="flex items-center justify-between border-b border-[#5e503f]/30 pb-4 shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-[#a9927d] uppercase tracking-wider">
                      {selectedEntry.type === 'message' ? 'SINGLE RECIPE' : 'FULL DISCUSSION CONVERSATION'}
                    </span>
                    <span className="h-3.5 w-px bg-[#5e503f]" />
                    <span className="text-[9px] font-mono text-[#5e503f]">{new Date(selectedEntry.savedAt).toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleSendToChatbot}
                      className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-all text-[9.5px] font-semibold uppercase tracking-widest mr-1.5"
                    >
                      <ChefHat size={13} /> Discuss with Chef
                    </button>
                    <span className="h-3 w-px bg-[#5e503f]" />
                    <button 
                      onClick={handleStartEdit}
                      className="flex items-center gap-1.5 hover:text-[#f2f4f3] text-[#a9927d] transition-all text-[9.5px] font-semibold uppercase tracking-widest"
                    >
                      <Edit3 size={13} /> Edit Entry
                    </button>
                    <span className="h-3 w-px bg-[#5e503f]" />
                    <button 
                      onClick={(e) => handleDelete(e, selectedEntry.id)}
                      className={`flex items-center gap-1.5 transition-all text-[9.5px] font-semibold uppercase tracking-widest ${
                        deleteConfirmId === selectedEntry.id
                          ? 'text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2.5 py-1 rounded'
                          : 'hover:text-rose-400 text-rose-500'
                      }`}
                      title={deleteConfirmId === selectedEntry.id ? 'Click again to confirm purge' : 'Purge Entry'}
                      onMouseLeave={() => {
                        if (deleteConfirmId === selectedEntry.id) setDeleteConfirmId(null);
                      }}
                    >
                      <Trash2 size={13} /> {deleteConfirmId === selectedEntry.id ? 'SURE (PURGE)?' : 'Purge'}
                    </button>
                  </div>
                </div>

                {/* Scroller Content */}
                <div className="flex-1 overflow-y-auto py-6 pr-2 select-text">
                  <h3 className="font-serif text-3xl font-light tracking-tight text-[#f2f4f3] mb-6 border-b border-[#49111c]/30 pb-4">
                    {selectedEntry.title}
                  </h3>

                  <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown 
                      components={{
                        strong: ({node, ...props}) => <strong className="text-white border-b border-white pb-0.5" {...props} />,
                        p: ({node, ...props}) => <p className="mb-4 last:mb-0 leading-relaxed font-light text-[#f2f4f3]/90" {...props} />,
                        li: ({node, ...props}) => <li className="pl-0 before:content-['—'] before:mr-3 before:text-[#5e503f]" {...props} />,
                        h3: ({node, ...props}) => <h3 className="font-serif text-lg text-[#a9927d] mt-8 mb-4 border-l-2 border-[#49111c] pl-3" {...props} />
                      }}
                    >
                      {selectedEntry.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* NO ENTRY SELECTED STATE */
          <div className="flex-grow flex flex-col items-center justify-center border border-dashed border-[#5e503f]/30 p-16 rounded-sm text-center">
            <BookOpen className="h-10 w-10 text-[#5e503f] mb-4 opacity-40" />
            <h3 className="font-serif text-2xl font-light italic text-[#a9927d] mb-2">Chef Nino's Recipe Journal</h3>
            <p className="max-w-xs text-[11px] leading-relaxed text-[#5e503f] font-sans uppercase tracking-[0.1em]">
              Select an item from the sidebar to inspect saved recipes, cooking guides, and chat histories with Chef Nino.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
