/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { supabase, getUser, reconcileDatabaseState, initSupabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { ChatInterface } from './components/ChatInterface';
import { RecipeJournal } from './components/RecipeJournal';
import { ChefHat, Book } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'saved'>('chat');

  useEffect(() => {
    let active = true;
    let subscription: any = null;

    // Check current session and initialize client dynamically
    const initAuth = async () => {
      await initSupabase();
      
      if (!active) return;

      const currentUser = await getUser();
      setUser(currentUser);
      setLoading(false);

      // Listen for auth changes on the fully configured model client
      const authChange = supabase.auth.onAuthStateChange((_event: any, session: any) => {
        if (active) {
          setUser(session?.user ?? null);
        }
      });
      subscription = authChange.data.subscription;
    };
    initAuth();

    // Custom tab switcher listener
    const handleSwitchTab = (e: any) => {
      if (e.detail && active) {
        setActiveTab(e.detail);
      }
    };
    window.addEventListener('nino-switch-tab', handleSwitchTab);

    return () => {
      active = false;
      if (subscription) {
        subscription.unsubscribe();
      }
      window.removeEventListener('nino-switch-tab', handleSwitchTab);
    };
  }, []);

  const handleRefresh = async () => {
    if (user) {
      await reconcileDatabaseState('refresh', user.id);
      window.location.reload();
    }
  };

  const handleSignOut = async () => {
    await reconcileDatabaseState('logout', user?.id);
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0908]">
        <motion.div
           animate={{ scale: [1, 1.1, 1], opacity: [0.3, 1, 0.3] }}
           transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChefHat className="h-12 w-12 text-[#f2f4f3]" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="flex h-screen flex-col bg-[#0a0908] font-sans text-[#f2f4f3] select-none">
      {/* Header - Editorial Style */}
      <header className="flex h-20 items-center justify-between border-b border-[#5e503f] bg-[#0a0908] px-10 flex-shrink-0">
        <div className="flex items-center gap-6">
          <div className="text-[10px] uppercase tracking-[0.4em] font-medium text-[#a9927d]">Chef Nino | Kitchen Headquarters</div>
          <div className="h-4 w-px bg-[#5e503f]" />
          <h1 className="font-serif italic text-xl tracking-tight">Digital Kitchen</h1>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-[#49111c] shadow-[0_0_8px_#49111c]"></div>
             <span className="text-[10px] font-mono tracking-wider opacity-60 uppercase">Chef on Duty: {user.user_metadata?.username || 'Active'}</span>
          </div>

          <button 
            onClick={handleRefresh}
            className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a9927d] hover:text-[#f2f4f3] transition-colors"
          >
            Reset Station (Refresh)
          </button>

          <span className="h-4 w-px bg-[#5e503f]" />

          <button 
            onClick={handleSignOut}
            className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a9927d] hover:text-[#f2f4f3] transition-colors"
          >
            Douse Fire (Leave)
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <nav className="flex w-64 flex-col border-r border-[#5e503f] bg-[#0a0908] p-8">
           <div className="mb-12">
             <div className="text-[10px] uppercase tracking-[0.3em] text-[#5e503f] mb-6 font-bold">Kitchen Stations</div>
             <div className="space-y-4">
               <button
                 onClick={() => setActiveTab('chat')}
                 className={`flex w-full items-center gap-3 text-[11px] font-bold uppercase tracking-widest transition-all ${
                   activeTab === 'chat' ? 'text-[#f2f4f3] border-l-2 border-[#49111c] pl-2' : 'text-[#a9927d] hover:text-[#f2f4f3] border-l-2 border-transparent pl-2'
                 }`}
               >
                 <ChefHat className="h-4 w-4" />
                 <span>Chef Nino</span>
               </button>
               
               <button
                 onClick={() => setActiveTab('saved')}
                 className={`flex w-full items-center gap-3 text-[11px] font-bold uppercase tracking-widest transition-all ${
                   activeTab === 'saved' ? 'text-[#f2f4f3] border-l-2 border-[#49111c] pl-2' : 'text-[#a9927d] hover:text-[#f2f4f3] border-l-2 border-transparent pl-2'
                 }`}
               >
                 <Book className="h-4 w-4" />
                 <span>Recipe Journal</span>
               </button>
             </div>
           </div>

           <div className="mt-auto pt-6 border-t border-[#5e503f]">
             <div className="text-[9px] uppercase tracking-widest text-[#5e503f] leading-relaxed">
               © 2026 Nino's Pantry<br/>
               Service v1.0.4
             </div>
           </div>
        </nav>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-[#0a0908]">
           <AnimatePresence mode="wait">
             {activeTab === 'chat' ? (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <ChatInterface />
                </motion.div>
             ) : (
                <motion.div
                  key="saved"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                   <RecipeJournal />
                </motion.div>
             )}
           </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
