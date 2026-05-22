import { useState, useRef, useEffect } from 'react';
import { runNlpPipeline, NlpAnalysis } from '../lib/nlp';
import { supabase, saveMessage, getMessages, createSession, getSessions, deleteSession, renameSession } from '../lib/supabase';
import { MessageBubble } from './MessageBubble';
import { InputArea } from './InputArea';
import { TokenPanel } from './TokenPanel';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, ChevronDown, ChevronUp, Plus, Trash2, Edit3, Check, X, BookOpen } from 'lucide-react';
import { saveConversationToJournal } from '../lib/journal';

export function ChatInterface() {
  const [messages, setMessages] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTokens, setShowTokens] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<NlpAnalysis | null>(null);
  const [conversationSaved, setConversationSaved] = useState(false);
  const [deleteConfirmSessionId, setDeleteConfirmSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadSessionsList = async (userId: string) => {
    const { data } = await getSessions(userId);
    if (data) {
      setSessions(data);
      return data;
    }
    return [];
  };

  useEffect(() => {
    const initChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const userSessions = await loadSessionsList(user.id);

      if (userSessions && userSessions.length > 0) {
        // Load the first (newest) session automatically
        setSession(userSessions[0]);
        const { data: msgs } = await getMessages(userSessions[0].id);
        if (msgs) setMessages(msgs);
      } else {
        const { data: newSess } = await createSession(user.id, "Nino's Kitchen Session");
        if (newSess) {
          setSession(newSess);
          await loadSessionsList(user.id);
        }
      }
    };
    initChat();
  }, []);

  const handleSelectSession = async (sess: any) => {
    if (loading) return;
    setSession(sess);
    setLastAnalysis(null);
    setShowTokens(false);
    setConversationSaved(false);
    
    setLoading(true);
    try {
      const { data: msgs } = await getMessages(sess.id);
      if (msgs) {
        setMessages(msgs);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error("Error loading chat session messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEntireConversation = async () => {
    if (!session || messages.length === 0) return;
    try {
      await saveConversationToJournal(session, messages);
      setConversationSaved(true);
      setTimeout(() => setConversationSaved(false), 3000);
    } catch (e) {
      console.error("Failed to save entire conversation:", e);
    }
  };

  const handleCreateSession = async () => {
    if (loading) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setLoading(true);
    try {
      const title = `Prep Table ${sessions.length + 1}`;
      const { data: newSess } = await createSession(user.id, title);
      if (newSess) {
        setSession(newSess);
        setMessages([]);
        setLastAnalysis(null);
        setShowTokens(false);
        await loadSessionsList(user.id);
      }
    } catch (err) {
      console.error("Error creating new session:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (deleteConfirmSessionId !== sessionId) {
      setDeleteConfirmSessionId(sessionId);
      return;
    }

    try {
      await deleteSession(sessionId);
      setDeleteConfirmSessionId(null);
      const remainingSessions = await loadSessionsList(user.id);
      
      if (session?.id === sessionId) {
        if (remainingSessions && remainingSessions.length > 0) {
          handleSelectSession(remainingSessions[0]);
        } else {
          const { data: newSess } = await createSession(user.id, "Main Prep Table");
          if (newSess) {
            setSession(newSess);
            setMessages([]);
            setLastAnalysis(null);
            setShowTokens(false);
            await loadSessionsList(user.id);
          }
        }
      }
    } catch (err) {
      console.error("Error purging session:", err);
    }
  };

  const startRename = (e: React.MouseEvent, sess: any) => {
    e.stopPropagation();
    setEditingSessionId(sess.id);
    setEditingTitle(sess.title);
  };

  const handleRename = async (sessionId: string) => {
    if (!editingTitle.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data: updated } = await renameSession(sessionId, editingTitle);
      if (updated) {
        if (session?.id === sessionId) {
          setSession(updated);
        }
        await loadSessionsList(user.id);
      }
    } catch (err) {
      console.error("Error renaming session:", err);
    } finally {
      setEditingSessionId(null);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !session) return;

    // 1. Run NLP pipeline on user input
    const analysis = runNlpPipeline(text);
    setLastAnalysis(analysis);
    setShowTokens(true);

    const userMessage = {
      session_id: session.id,
      user_id: session.user_id,
      role: 'user',
      content: text,
      sentiment: analysis.sentiment,
      sentiment_score: analysis.sentimentScore,
      tokens: analysis.tokens.map(t => t.text),
      keywords: analysis.allKeywords,
      cuisine_type: analysis.cuisine,
      meal_type: analysis.mealType
    };

    // Optimistic update
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      // 2. Save user message to Supabase
      await saveMessage(userMessage);

      // 3. Get response from Gemini via our server
      const chatHistory = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text, 
          history: chatHistory,
          nlpAnalysis: analysis 
        })
      });

      let data: any = {};
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await res.json();
        } catch (jsonErr) {
          console.error("Failed to parse JSON response:", jsonErr);
        }
      } else {
        const textPayload = await res.text();
        console.warn("Received non-JSON response payload:", textPayload);
      }
      
      if (!res.ok) {
        const errMsg = data.error || `Prep Station Interruption\n\nChef Nino encountered an unexpected cooking interruption (Status code: ${res.status}).`;
        const errorMessage = {
          session_id: session.id,
          user_id: session.user_id,
          role: 'bot',
          content: errMsg,
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
        return;
      }
      
      const botMessage = {
        session_id: session.id,
        user_id: session.user_id,
        role: 'bot',
        content: data.response || "No response received",
        created_at: new Date().toISOString()
      };

      // 4. Save bot message and update state
      await saveMessage(botMessage);
      setMessages(prev => [...prev, botMessage]);

    } catch (err: any) {
      console.error("Chat error:", err);
      const errorMessage = {
        session_id: session.id,
        user_id: session.user_id,
        role: 'bot',
        content: `Pantry Network Offline\n\nA network ripple interrupted Chef Nino. Please ensure the kitchen is active.`,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-row overflow-hidden bg-[#0a0908]">
      {/* Sessions Sidebar Column */}
      <div className="hidden lg:flex w-72 border-r border-[#5e503f] bg-[#0a0908] flex-col h-full overflow-hidden shrink-0">
        <div className="p-6 border-b border-[#5e503f]">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#a9927d] mb-4 font-bold">Prep Stations on Duty</div>
          <button
            onClick={handleCreateSession}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 bg-[#49111c] text-[#f2f4f3] border border-[#5e503f] py-3 text-[11px] font-bold uppercase tracking-[0.2em] transition-all hover:bg-[#5e503f] active:scale-[0.98] disabled:opacity-50"
          >
            <Plus size={14} />
            Open New Prep Table
          </button>
        </div>
        
        {/* Scrollable Sessions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sessions.map((sess) => {
            const isActive = session?.id === sess.id;
            const isEditing = editingSessionId === sess.id;
            
            return (
              <div
                key={sess.id}
                onClick={() => !isEditing && handleSelectSession(sess)}
                className={`group relative flex flex-col p-4 border transition-all cursor-pointer ${
                  isActive 
                    ? 'border-[#49111c] bg-[#49111c]/10 text-[#f2f4f3]' 
                    : 'border-[#5e503f]/30 hover:border-[#a9927d] hover:bg-[#5e503f]/5 text-[#a9927d]'
                }`}
              >
                {isEditing ? (
                  <div className="flex items-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRename(sess.id)}
                      className="bg-[#0a0908] border border-[#5e503f] text-xs px-2 py-1 flex-1 text-[#f2f4f3] outline-none"
                      autoFocus
                    />
                    <button onClick={() => handleRename(sess.id)} className="text-[#f2f4f3] hover:text-[#a9927d]">
                      <Check size={14} />
                    </button>
                    <button onClick={() => setEditingSessionId(null)} className="text-[#a9927d] hover:text-rose-500">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-serif font-light truncate">{sess.title}</div>
                      <div className="text-[9px] font-mono mt-1 opacity-50">
                        {sess.started_at ? new Date(sess.started_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Unknown'}
                      </div>
                    </div>
                    
                    {/* Action buttons with increased accessibility (visible at 40% normally, 100% on interaction) */}
                    <div className="flex items-center gap-1.5 shrink-0 select-none">
                      <button
                        onClick={(e) => startRename(e, sess)}
                        className="p-1 text-[#a9927d] hover:text-[#f2f4f3] opacity-40 hover:opacity-100 transition-opacity"
                        title="Rename Prep Table"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteSession(e, sess.id)}
                        className={`p-1 flex items-center justify-center rounded transition-all ${
                          deleteConfirmSessionId === sess.id
                            ? 'text-rose-400 bg-rose-500/15 border border-rose-500/30 px-1 text-[8px] font-bold uppercase tracking-wider'
                            : 'text-rose-500 hover:text-rose-400 opacity-40 hover:opacity-100'
                        }`}
                        title={deleteConfirmSessionId === sess.id ? 'Click again to confirm purge' : 'Scrap Prep Table'}
                        onMouseLeave={() => {
                          if (deleteConfirmSessionId === sess.id) setDeleteConfirmSessionId(null);
                        }}
                      >
                        {deleteConfirmSessionId === sess.id ? 'SURE?' : <Trash2 size={12} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Conversation Pane */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Desktop Active Session Header */}
        <div className="hidden lg:flex items-center justify-between border-b border-[#5e503f] bg-[#0a0908] px-10 py-5 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#a9927d]">ACTIVE PREP STATION</span>
            <span className="h-3 w-px bg-[#5e503f]"></span>
            <span className="font-serif italic text-sm text-[#f2f4f3]">{session?.title}</span>
          </div>
          {session && messages.length > 0 && (
            <button
              onClick={handleSaveEntireConversation}
              className={`flex items-center gap-2 border px-4 py-2 text-[9px] font-bold uppercase tracking-[0.2em] transition-all ${
                conversationSaved 
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' 
                  : 'border-[#5e503f] hover:border-[#a9927d] text-[#a9927d] hover:text-[#f2f4f3]'
              }`}
            >
              <BookOpen size={12} />
              {conversationSaved ? 'CONVERSATION_SAVED' : 'SAVE_CONVERSATION'}
            </button>
          )}
        </div>

        {/* Mobile session indicator / selector */}
        <div className="lg:hidden flex items-center justify-between border-b border-[#5e503f] bg-[#0a0908] p-4 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#a9927d]">Prep Table:</span>
            <div className="flex items-center gap-1.5">
              <select
                value={session?.id || ''}
                onChange={(e) => {
                  const selected = sessions.find(s => s.id === e.target.value);
                  if (selected) handleSelectSession(selected);
                }}
                className="bg-[#0a0908] border border-[#5e503f] text-[#f2f4f3] text-xs px-2 py-1 outline-none font-serif font-mono uppercase"
              >
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
              {session && (
                <button
                  onClick={(e) => handleDeleteSession(e, session.id)}
                  className={`p-1 px-1.5 border rounded-sm active:scale-95 transition-all text-xs flex items-center gap-1 ${
                    deleteConfirmSessionId === session.id
                      ? 'border-rose-500 bg-rose-500/20 text-rose-400 font-bold uppercase tracking-wider text-[9px]'
                      : 'border-[#5e503f] bg-rose-950/20 text-rose-500 hover:text-rose-400'
                  }`}
                  title={deleteConfirmSessionId === session.id ? 'Click again to confirm purge' : 'Scrap Prep Table'}
                  onMouseLeave={() => {
                    if (deleteConfirmSessionId === session.id) setDeleteConfirmSessionId(null);
                  }}
                >
                  {deleteConfirmSessionId === session.id ? 'SURE?' : <Trash2 size={12} />}
                </button>
              )}
              {session && messages.length > 0 && (
                <button
                  onClick={handleSaveEntireConversation}
                  className={`p-1 px-1.5 border rounded-sm flex items-center gap-1.5 active:scale-95 transition-all ${
                    conversationSaved 
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' 
                      : 'border-[#5e503f] bg-[#0a0908] text-[#a9927d] hover:text-[#f2f4f3]'
                  }`}
                  title="Save entire session to Recipe Journal"
                >
                  <BookOpen size={12} />
                  <span className="text-[9px] uppercase tracking-wider hidden sm:inline">
                    {conversationSaved ? 'Saved' : 'Save Session'}
                  </span>
                </button>
              )}
            </div>
          </div>
          <button
            onClick={handleCreateSession}
            disabled={loading}
            className="flex items-center gap-1 bg-[#49111c] text-[#f2f4f3] border border-[#5e503f] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider"
          >
            <Plus size={10} />
            New
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 px-6 sm:p-8" ref={scrollRef}>
          <div className="mx-auto max-w-4xl space-y-6">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                 <motion.div
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   className="mb-8"
                 >
                   <ChefHat size={48} className="text-[#a9927d] opacity-20" />
                 </motion.div>
                 <h3 className="font-serif text-5xl font-light tracking-tighter text-[#f2f4f3]">Chef Nino</h3>
                 <p className="mt-4 max-w-sm text-[11px] font-bold uppercase tracking-[0.3em] text-[#5e503f] mb-12">
                    Culinary Cognition Station
                 </p>
                 
                 {/* Interactive Prompt Suggestion Chips */}
                 <div className="w-full max-w-2xl">
                   <div className="text-[10px] uppercase tracking-[0.3em] text-[#5e503f] font-mono mb-4 text-center font-bold">
                     Chef Nino's Suggested Specials
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4">
                     {[
                       { prompt: "Cheer me up with a comforting high-protein recipe! 🥹", label: "Cheer Me Up", icon: "🍜" },
                       { prompt: "Recommend a gourmet Japanese style pork belly adobo 🍱", label: "Fusion Classic", icon: "🍣" },
                       { prompt: "I only have tofu, mushroom, garlic, and vinegar. Suggest something! 🍲", label: "Pantry Cleanout", icon: "🧅" },
                       { prompt: "What are some fast 15-minute healthy snack bites? ⏱️", label: "Under 15 Mins", icon: "⚡" }
                     ].map((item, i) => (
                       <button
                         key={i}
                         onClick={() => handleSendMessage(item.prompt)}
                         className="flex flex-col items-start p-4 border border-[#5e503f]/20 bg-[#0a0908] text-left hover:border-[#a9927d] hover:bg-[#5e503f]/5 cursor-pointer group transition-all duration-300"
                       >
                         <span className="text-[9px] uppercase tracking-[0.2em] text-[#a9927d] font-mono font-bold mb-1.5 flex items-center gap-1.5">
                           <span>{item.icon}</span>
                           {item.label}
                         </span>
                         <span className="text-[12px] text-[#f2f4f3] font-light font-sans group-hover:text-white transition-colors">
                           "{item.prompt}"
                         </span>
                       </button>
                     ))}
                   </div>
                 </div>
              </div>
            )}
            
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <MessageBubble 
                  key={idx} 
                  message={msg} 
                  analysis={idx === messages.length - 1 && msg.role === 'user' ? lastAnalysis : null} 
                />
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
              className="flex items-center gap-2 text-[#a9927d]"
              >
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#49111c]" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#49111c]" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#49111c]" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs font-medium italic">Chef Nino is simmering...</span>
              </motion.div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {lastAnalysis && showTokens && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-[#5e503f] bg-[#0a0908] px-10"
            >
              <div className="mx-auto max-w-4xl py-6">
                 <div className="mb-4 flex items-center justify-between">
                   <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#a9927d]">Recipe Ingredients Breakdown</span>
                   <button onClick={() => setShowTokens(false)} className="text-[#a9927d] hover:text-[#f2f4f3]">
                      <ChevronDown size={14} />
                   </button>
                 </div>
                 <TokenPanel analysis={lastAnalysis} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!showTokens && lastAnalysis && (
           <div className="flex h-10 items-center justify-center border-t border-[#5e503f] bg-[#0a0908]">
              <button onClick={() => setShowTokens(true)} className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.4em] text-[#5e503f] hover:text-[#a9927d]">
                 Reveal Chef's Prep Details <ChevronUp size={12} />
              </button>
           </div>
        )}

        {/* Input Area */}
        <div className="border-t border-[#5e503f] bg-[#0a0908] p-6 px-10">
          <div className="mx-auto max-w-4xl">
            <InputArea onSendMessage={handleSendMessage} disabled={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline ChefHat for convenience or import
function ChefHat(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M6 13.8V21a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-7.2" />
            <path d="M6 13h12" />
            <path d="M6 13c0-3.3 2.7-6 6-6s6 2.7 6 6" />
            <path d="M12 7V2" />
            <path d="M9 2h6" />
        </svg>
    )
}
