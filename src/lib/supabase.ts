// ============================================================
// src/lib/supabase.ts — Supabase client singleton
// ============================================================
import { createClient } from '@supabase/supabase-js';

const sanitizeEnvVar = (val: string | undefined): string => {
    if (!val) return "";
    return val.trim().replace(/^['"““”\s]+|['"““”\s]+$/g, "");
};

const getSafeEnvVar = (name: string): string => {
    const viteKey = `VITE_${name}`;
    const metaCast = import.meta as any;
    if (typeof import.meta !== 'undefined' && metaCast && metaCast.env && metaCast.env[viteKey]) {
        return metaCast.env[viteKey];
    }
    if (typeof process !== 'undefined' && process.env && process.env[name]) {
        return process.env[name] || "";
    }
    return "";
};

const SUPABASE_URL = sanitizeEnvVar(getSafeEnvVar('SUPABASE_URL'));
const SUPABASE_ANON_KEY = sanitizeEnvVar(getSafeEnvVar('SUPABASE_ANON_KEY'));

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase credentials missing. Check your .env file or production setup.');
}

export let isSupabaseConfigured = !!SUPABASE_URL && 
                           SUPABASE_URL !== 'https://placeholder.supabase.co' && 
                           !!SUPABASE_ANON_KEY && 
                           SUPABASE_ANON_KEY !== 'placeholder';

let activeClient = createClient(SUPABASE_URL || 'https://placeholder.supabase.co', SUPABASE_ANON_KEY || 'placeholder');

export const supabase = new Proxy({} as any, {
    get(target, prop) {
        if (!activeClient) {
            activeClient = createClient(SUPABASE_URL || 'https://placeholder.supabase.co', SUPABASE_ANON_KEY || 'placeholder');
        }
        const val = Reflect.get(activeClient, prop);
        if (typeof val === 'function') {
            return val.bind(activeClient);
        }
        return val;
    }
});

export const initSupabase = async () => {
    try {
        const res = await fetch('/api/config');
        if (res.ok) {
            const data = await res.json();
            if (data.supabaseUrl && data.supabaseAnonKey) {
                const url = sanitizeEnvVar(data.supabaseUrl);
                const key = sanitizeEnvVar(data.supabaseAnonKey);
                if (url && url !== 'https://placeholder.supabase.co' && key && key !== 'placeholder') {
                    activeClient = createClient(url, key);
                    isSupabaseConfigured = true;
                    console.log("Supabase client initialized via dynamic server config!");
                    return;
                }
            }
        }
    } catch (e) {
        console.warn("Unable to fetch dynamic server configuration, standard environment defaults active:", e);
    }
};

// Auto-run if inside window context, so fallback is ready
if (typeof window !== 'undefined') {
    initSupabase();
}

// Types
export interface Profile {
    id: string;
    username: string;
    display_name: string;
    dietary_preferences: string[];
    allergies: string[];
    cooking_skill: 'beginner' | 'intermediate' | 'advanced';
}

export interface ChatSession {
    id: string;
    user_id: string;
    title: string;
    started_at: string;
    is_active: boolean;
}

export interface Message {
    id: string;
    session_id: string;
    user_id: string;
    role: 'user' | 'assistant' | 'bot' | 'model';
    content: string;
    sentiment?: string;
    sentiment_score?: number;
    tokens?: string[];
    keywords?: string[];
    cuisine_type?: string;
    meal_type?: string;
    created_at: string;
}

export interface Recipe {
    id: string;
    title: string;
    description: string;
    ingredients: any;
    steps: any;
    cuisine_type: string;
    meal_type: string;
    dietary_tags: string[];
    cooking_skill: string;
    prep_time_minutes: number;
    cook_time_minutes: number;
    servings: number;
    calories_per_serving: number;
}

// Auth helpers
export const signUp = async (email: string, password: string, username: string) => {
    return await supabase.auth.signUp({
        email, password,
        options: { data: { username, display_name: username } }
    });
};

export const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
};

export const signOut = async () => supabase.auth.signOut();

export const getUser = async () => {
    if (!isSupabaseConfigured) return { id: 'local-user', user_metadata: { username: 'Guest' } };
    const { data: { user } } = await supabase.auth.getUser();
    return user;
};

// LocalStorage helpers for offline persistence fallback
const getLocalSessions = (userId: string): ChatSession[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(`nino_sessions_${userId}`);
    if (data) {
        try {
            return JSON.parse(data);
        } catch (e) {
            console.error("Failed to parse local sessions:", e);
        }
    }
    // Default initial session
    const defaultSess: ChatSession = {
        id: 'local-session-default',
        user_id: userId,
        title: 'Main Prep Table',
        is_active: true,
        started_at: new Date().toISOString()
    };
    const initial = [defaultSess];
    try {
        localStorage.setItem(`nino_sessions_${userId}`, JSON.stringify(initial));
    } catch (e) {
        console.error("Failed to save local sessions:", e);
    }
    return initial;
};

const saveLocalSessions = (userId: string, sessions: ChatSession[]) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(`nino_sessions_${userId}`, JSON.stringify(sessions));
    } catch (e) {
        console.error("Failed to save local sessions:", e);
    }
};

const getLocalMessages = (sessionId: string): Message[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(`nino_messages_${sessionId}`);
    if (data) {
        try {
            return JSON.parse(data);
        } catch (e) {
            console.error("Failed to parse local messages:", e);
        }
    }
    return [];
};

const saveLocalMessages = (sessionId: string, messages: Message[]) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(`nino_messages_${sessionId}`, JSON.stringify(messages));
    } catch (e) {
        console.error("Failed to save local messages:", e);
    }
};

const deleteLocalMessages = (sessionId: string) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(`nino_messages_${sessionId}`);
    } catch (e) {
        console.error("Failed to delete local messages:", e);
    }
};

// Chat Session helpers
export const createSession = async (userId: string, title: string = 'New Session') => {
    if (!isSupabaseConfigured) {
        const sessions = getLocalSessions(userId);
        const newSess: ChatSession = {
            id: `local-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            user_id: userId,
            title,
            is_active: true,
            started_at: new Date().toISOString()
        };
        sessions.unshift(newSess);
        saveLocalSessions(userId, sessions);
        return { data: newSess, error: null };
    }
    return await supabase
        .from('chat_sessions')
        .insert({ user_id: userId, title })
        .select()
        .single();
};

export const getSessions = async (userId: string) => {
    if (!isSupabaseConfigured) {
        const sessions = getLocalSessions(userId);
        return { data: sessions, error: null };
    }
    return await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false });
};

export const deleteSession = async (sessionId: string) => {
    if (!isSupabaseConfigured) {
        // Look inside all nino_sessions_* keys to find and remove this session
        if (typeof window !== 'undefined') {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('nino_sessions_')) {
                    try {
                        const userId = key.replace('nino_sessions_', '');
                        const sessions = JSON.parse(localStorage.getItem(key) || '[]');
                        const filtered = sessions.filter((s: any) => s.id !== sessionId);
                        if (filtered.length !== sessions.length) {
                            saveLocalSessions(userId, filtered);
                        }
                    } catch (e) {
                        console.error("Failed to delete local session in loop:", e);
                    }
                }
            }
        }
        deleteLocalMessages(sessionId);
        return { error: null };
    }
    // Delete messages associated with session first to prevent integrity errors
    await supabase.from('messages').delete().eq('session_id', sessionId);
    return await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);
};

export const renameSession = async (sessionId: string, title: string) => {
    if (!isSupabaseConfigured) {
        let updatedSess: any = null;
        if (typeof window !== 'undefined') {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('nino_sessions_')) {
                    try {
                        const userId = key.replace('nino_sessions_', '');
                        const sessions = JSON.parse(localStorage.getItem(key) || '[]');
                        const matchIdx = sessions.findIndex((s: any) => s.id === sessionId);
                        if (matchIdx !== -1) {
                            sessions[matchIdx].title = title;
                            updatedSess = sessions[matchIdx];
                            saveLocalSessions(userId, sessions);
                            break;
                        }
                    } catch (e) {
                        console.error("Failed to rename local session in loop:", e);
                    }
                }
            }
        }
        return { data: updatedSess || { id: sessionId, title, user_id: 'local-user' }, error: null };
    }
    return await supabase
        .from('chat_sessions')
        .update({ title })
        .eq('id', sessionId)
        .select()
        .single();
};

// Helper to generate a valid UUIDv4
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// Helper to check if a string is a valid UUID
const isUUID = (str: string) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

// Message helpers
export const saveMessage = async (messageData: any) => {
    const sessionId = messageData.session_id;
    
    // Ensure the message has a valid compliant UUID format
    const hasValidMsgId = messageData.id && isUUID(messageData.id);
    const resolvedMsgId = hasValidMsgId ? messageData.id : generateUUID();

    const preparedMsg = {
        ...messageData,
        id: resolvedMsgId,
        created_at: messageData.created_at || new Date().toISOString()
    };

    if (sessionId) {
        try {
            const localMessages = getLocalMessages(sessionId);
            // Deduplicate local message saves
            const isDuplicate = localMessages.some((m: any) => 
                m.content === preparedMsg.content && 
                m.role === preparedMsg.role && 
                m.created_at === preparedMsg.created_at
            );
            if (!isDuplicate) {
                localMessages.push(preparedMsg);
                saveLocalMessages(sessionId, localMessages);
            }
        } catch (localErr) {
            console.error("Local storage sync error:", localErr);
        }
    }

    // Only save to Supabase if Supabase is configured and the session is a real UUID session.
    // Offline/local sessions use local storage exclusively to prevent database foreign key crashes.
    const canSaveToSupabase = isSupabaseConfigured && sessionId && isUUID(sessionId) && isUUID(resolvedMsgId);

    if (!canSaveToSupabase) {
        return { data: preparedMsg, error: null };
    }

    try {
        let { data, error } = await supabase
            .from('messages')
            .insert(preparedMsg)
            .select()
            .single();
        
        if (error) {
            // Self-healing database role check-constraint query recovery
            if (error.code === '23514' && preparedMsg.role !== 'user') {
                console.log(`Supabase insert failed with check constraint. Retrying with 'bot'...`);
                const retryMsg = { ...preparedMsg, role: 'bot' };
                const retryRes = await supabase
                    .from('messages')
                    .insert(retryMsg)
                    .select()
                    .single();
                
                if (retryRes.error) {
                    if (retryRes.error.code === '23514') {
                        console.log(`Supabase insert failed with 'bot'. Retrying with 'model'...`);
                        const finalMsg = { ...preparedMsg, role: 'model' };
                        const finalRes = await supabase
                            .from('messages')
                            .insert(finalMsg)
                            .select()
                            .single();
                        
                        if (finalRes.error) {
                            console.warn("Supabase message insert failed for all roles (assistant, bot, model), using local storage copy:", finalRes.error);
                            return { data: preparedMsg, error: null };
                        }
                        return { data: finalRes.data, error: null };
                    } else {
                        console.warn("Supabase message insert failed with role 'bot', using local storage copy:", retryRes.error);
                        return { data: preparedMsg, error: null };
                    }
                }
                return { data: retryRes.data, error: null };
            }

            console.warn("Supabase message insert failed, using local storage copy:", error);
            return { data: preparedMsg, error: null };
        }
        return { data, error: null };
    } catch (err: any) {
        console.warn("Exception during Supabase message insert, using local storage copy:", err);
        return { data: preparedMsg, error: null };
    }
};

export const getMessages = async (sessionId: string) => {
    const localMessages = getLocalMessages(sessionId);

    if (!isSupabaseConfigured) {
        return { data: localMessages, error: null };
    }

    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });
        
        if (error) {
            console.warn("Supabase load messages failed, falling back to local storage:", error);
            return { data: localMessages, error: null };
        }

        if (data && data.length > 0) {
            // Update local storage with fresh server content
            saveLocalMessages(sessionId, data);
            return { data, error: null };
        }
        return { data: localMessages, error: null };
    } catch (err: any) {
        console.warn("Exception loading messages from Supabase, falling back to local storage:", err);
        return { data: localMessages, error: null };
    }
};

// Recipe helpers
export const searchRecipes = async (params: { 
    cuisine?: string; 
    mealType?: string; 
    skill?: string; 
    dietary?: string[]; 
    ingredients?: string[];
    text?: string;
    keywords?: string[];
}) => {
    if (!isSupabaseConfigured) return { data: [], error: null };
    let query = supabase.from('recipes').select('*');
    
    if (params.cuisine) query = query.eq('cuisine_type', params.cuisine);
    if (params.mealType) query = query.eq('meal_type', params.mealType);
    if (params.skill) query = query.eq('cooking_skill', params.skill);
    
    // Exact match for dietary tags (array overlap)
    if (params.dietary?.length) {
        query = query.overlaps('dietary_tags', params.dietary);
    }
    
    // Text search if keywords are provided
    if (params.keywords?.length) {
        const filterParts: string[] = [];
        params.keywords.forEach(kw => {
            const safeKw = kw.replace(/['%_]/g, "");
            if (safeKw) {
                filterParts.push(`title.ilike.%${safeKw}%`);
                filterParts.push(`description.ilike.%${safeKw}%`);
            }
        });
        
        if (filterParts.length > 0) {
            query = query.or(filterParts.join(","));
        }
    } else if (params.text) {
        const safeText = params.text.replace(/['%_]/g, "");
        query = query.or(`title.ilike.%${safeText}%,description.ilike.%${safeText}%`);
    }

    return await query.limit(5);
};

export const saveRecipe = async (userId: string, recipeId: string, notes: string = '') => {
    if (!isSupabaseConfigured) return { data: null, error: null };
    return await supabase
        .from('saved_recipes')
        .upsert({ user_id: userId, recipe_id: recipeId, notes });
};

export const getSavedRecipes = async (userId: string) => {
    if (!isSupabaseConfigured) return { data: [], error: null };
    return await supabase
        .from('saved_recipes')
        .select('*, recipes(*)')
        .eq('user_id', userId);
};

// Reconcile database state on 'refresh' or 'logout' to ensure persistent storage matches actual database records
export const reconcileDatabaseState = async (action: 'refresh' | 'logout', userId?: string) => {
    console.log(`Reconciling database state on ${action} for user: ${userId || 'unknown'}`);
    
    // 1. Explicitly clear or reset local storage entries for active/all sessions
    if (typeof window !== 'undefined') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                // If it's a logout, clear all nino_ sessions, messages and journal
                if (action === 'logout') {
                    if (key.startsWith('nino_sessions_') || key.startsWith('nino_messages_') || key.startsWith('nino_journal_')) {
                        keysToRemove.push(key);
                    }
                } else if (action === 'refresh') {
                    // If it's a refresh, clear sessions and messages to fetch fresh ones from the database
                    if (key.startsWith('nino_messages_') || key.startsWith('nino_sessions_')) {
                        keysToRemove.push(key);
                    }
                }
            }
        }
        keysToRemove.forEach(key => {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.error(`Failed to remove key ${key}:`, e);
            }
        });
    }

    // 2. Clear or reset database entries for active sessions if online
    if (isSupabaseConfigured && userId) {
        try {
            if (action === 'logout' || action === 'refresh') {
                // Mark active sessions of user as closed (inactive) to match database records
                await supabase
                    .from('chat_sessions')
                    .update({ is_active: false })
                    .eq('user_id', userId)
                    .eq('is_active', true);
            }
        } catch (dbErr) {
            console.error("Error setting active sessions status in Supabase during state reconciliation:", dbErr);
        }
    }
};
