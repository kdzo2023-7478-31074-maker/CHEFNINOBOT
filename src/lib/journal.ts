export interface JournalEntry {
  id: string;
  userId: string;
  type: 'message' | 'conversation';
  title: string;
  content: string; // The markdown recipe or summary content
  messages?: any[]; // If conversation, the list of messages
  cuisineType?: string;
  mealType?: string;
  savedAt: string;
}

const getUserId = async (): Promise<string> => {
  try {
    const data = localStorage.getItem('sb-placeholder-auth-token') || '';
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed?.user?.id) return parsed.user.id;
    }
  } catch (e) {
    // Ignore
  }
  return 'local-user';
};

export const getJournalEntries = async (userId?: string): Promise<JournalEntry[]> => {
  const uid = userId || await getUserId();
  const key = `nino_journal_${uid}`;
  const data = localStorage.getItem(key);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Error parsing journal entries:', e);
    return [];
  }
};

export const saveMessageToJournal = async (message: any, title?: string): Promise<JournalEntry> => {
  const uid = await getUserId();
  const entries = await getJournalEntries(uid);
  
  // Extract a nice title if none is provided
  let finalTitle = title || '';
  if (!finalTitle) {
    // Extract first few words, or use standard title
    const cleanContent = message.content.replace(/[#*`\-—]/g, '').trim();
    finalTitle = cleanContent.split('\n')[0].substring(0, 40);
    if (finalTitle.length === 40) finalTitle += '...';
    if (!finalTitle || finalTitle.startsWith('//')) {
      finalTitle = `Saved Recipe ${new Date().toLocaleDateString()}`;
    }
  }

  const entry: JournalEntry = {
    id: `journal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId: uid,
    type: 'message',
    title: finalTitle,
    content: message.content,
    cuisineType: message.cuisine_type || undefined,
    mealType: message.meal_type || undefined,
    savedAt: new Date().toISOString()
  };

  entries.unshift(entry);
  localStorage.setItem(`nino_journal_${uid}`, JSON.stringify(entries));
  return entry;
};

export const saveConversationToJournal = async (session: any, messages: any[], title?: string): Promise<JournalEntry> => {
  const uid = await getUserId();
  const entries = await getJournalEntries(uid);

  // Generate a nice consolidated markdown summary of the whole conversation
  let consolidatedContent = `# ${session.title || 'Conversation'}\n*Saved from Chef Nino Session on ${new Date().toLocaleDateString()}*\n\n---\n\n`;
  messages.forEach(msg => {
    const roleLabel = (msg.role === 'assistant' || msg.role === 'bot' || msg.role === 'model') ? 'Chef Nino' : 'User';
    consolidatedContent += `### **${roleLabel}:**\n${msg.content}\n\n`;
  });

  const entry: JournalEntry = {
    id: `journal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId: uid,
    type: 'conversation',
    title: title || session.title || `Conversation - ${new Date().toLocaleDateString()}`,
    content: consolidatedContent,
    messages: messages,
    savedAt: new Date().toISOString()
  };

  entries.unshift(entry);
  localStorage.setItem(`nino_journal_${uid}`, JSON.stringify(entries));
  return entry;
};

export const deleteJournalEntry = async (id: string, userId?: string): Promise<void> => {
  const uid = userId || await getUserId();
  const entries = await getJournalEntries(uid);
  const remaining = entries.filter(e => e.id !== id);
  localStorage.setItem(`nino_journal_${uid}`, JSON.stringify(remaining));
};

export const updateJournalEntryNotes = async (id: string, updatedTitle: string, updatedContent: string, userId?: string): Promise<JournalEntry | null> => {
  const uid = userId || await getUserId();
  const entries = await getJournalEntries(uid);
  const index = entries.findIndex(e => e.id === id);
  if (index === -1) return null;

  entries[index] = {
    ...entries[index],
    title: updatedTitle,
    content: updatedContent
  };
  localStorage.setItem(`nino_journal_${uid}`, JSON.stringify(entries));
  return entries[index];
};
