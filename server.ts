import express from "express";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { generateInteractiveResponse } from "./chefEngine";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

/**
 * Recipe Table Schema Recommendation:
 * 
 * Table: recipes
 * - id: uuid (primary key)
 * - title: text
 * - description: text
 * - ingredients: text (comma separated) or text[]
 * - instructions: text
 * - cuisine_type: text
 * - meal_type: text
 * - created_at: timestamptz
 */

const sanitizeEnvVar = (val: string | undefined): string => {
    if (!val) return "";
    return val.trim().replace(/^['"““”\s]+|['"““”\s]+$/g, "");
};

// Initialize Supabase
const supabaseUrl = sanitizeEnvVar(process.env.SUPABASE_URL) || "https://placeholder.supabase.co";
const supabaseKey = sanitizeEnvVar(process.env.SUPABASE_ANON_KEY) || "placeholder";
const supabase = createClient(supabaseUrl, supabaseKey);

const CHEF_NINO_INTRO = "Hello! I'm Chef Nino, your cheerful digital kitchen assistant! 👨‍🍳✨";

// Helper to extract keywords from message
function extractKeywords(message: string): string[] {
    const commonWords = ["a", "the", "with", "and", "is", "for", "please", "recipe", "show", "me", "how", "to", "make", "cook", "can", "you", "find", "some", "any", "give"];
    return message
        .toLowerCase()
        .replace(/[^\w\s]/gi, " ")
        .split(/\s+/)
        .filter(word => word.length > 2 && !commonWords.includes(word));
}

// Helper to extract dietary restrictions
function extractDietaryRestrictions(message: string): string[] {
    const dietaryOptions = ["vegan", "vegetarian", "gluten-free", "dairy-free", "keto", "paleo", "low-carb", "halal", "kosher", "low-fat", "sugar-free"];
    const normalized = message.toLowerCase();
    return dietaryOptions.filter(option => normalized.includes(option));
}

// API Routes
app.get(["/api/health", "/health", "/api"], (req, res) => {
    res.json({ 
        status: "ok", 
        hasSupabase: !!sanitizeEnvVar(process.env.SUPABASE_URL),
        env: process.env.NODE_ENV || "development",
        message: "Supabase recipe search agent is active."
    });
});

app.post(["/api/chat", "/chat", "/api", "/"], async (req, res) => {
    console.log("POST /api/chat (or compatible route) received - Dynamic Interactive Gemini mode");
    try {
        const { message, history, nlpAnalysis } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const realSupabaseUrl = sanitizeEnvVar(process.env.SUPABASE_URL);
        const realSupabaseKey = sanitizeEnvVar(process.env.SUPABASE_ANON_KEY);
        const hasRealSupabase = realSupabaseUrl && 
                              realSupabaseUrl !== "https://placeholder.supabase.co" && 
                              realSupabaseKey && 
                              realSupabaseKey !== "placeholder";

        const lowerMessage = message.trim().toLowerCase();

        // 1. Direct Cancel/Stop command handling
        if (lowerMessage === "cancel" || lowerMessage === "stop") {
            return res.json({
                response: "### ⏸️ Cook's Timeout!\n\nNo problem! I have cleared our active recipe card and paused the skillet. 🍳 Let's start fresh. What would you like to search in our live database pantry next? Just name any ingredient, cuisine (like *Filipino*, *Asian*, *Western*), or dietary tags (like *vegan*, *gluten-free*)!"
            });
        }

        // 2. Direct Info/Help command handling
        if (lowerMessage === "info" || lowerMessage === "help") {
            return res.json({
                response: "### 👨‍🍳 Chef Nino's Handy Kitchen Directory 📖✨\n\nWelcome to your direct Supabase recipe dashboard! Here is how we can cook up a storm together:\n\n1. **Search with Ingredients/Dishes:** Simply type any ingredient (like *chicken*, *shrimp*, *mushroom*) or a dish name (like *adobo*, *pasta*) to search the database.\n2. **Filter by Cooking Skill:** I'll tailor my guidance to your skill level (*beginner*, *intermediate*, *advanced*).\n3. **View Recipe Details:** When I present search results, simply reply with the number corresponding to the recipe (e.g. `1` or `2`) to view the complete instructions and pantry list!\n4. **Reset/Cancel:** Type `cancel` anytime to reset the current prep session and start searching fresh.\n\nNow, let's fire up the stove—what are we cooking? 🍛🥄"
            });
        }

        // 3. Selection indexing regex
        const numericMatch = message.match(/\b(1|2|3|4|5|one|two|three|four|five|first|second|third|fourth|fifth)\b/i);
        let selectedIndex = -1;
        if (numericMatch) {
            const word = numericMatch[1].toLowerCase();
            if (word === "1" || word === "one" || word === "first") selectedIndex = 0;
            else if (word === "2" || word === "two" || word === "second") selectedIndex = 1;
            else if (word === "3" || word === "three" || word === "third") selectedIndex = 2;
            else if (word === "4" || word === "four" || word === "fourth") selectedIndex = 3;
            else if (word === "5" || word === "five" || word === "fifth") selectedIndex = 4;
        }

        let recipes: any[] = [];
        let queryMessage = message;
        let dietaryTags = extractDietaryRestrictions(message);
        let keywords = extractKeywords(message);

        if (selectedIndex !== -1 && hasRealSupabase) {
            // Find what the last query text was from history to query database for the same list
            let lastRealQuery = "";
            if (history && Array.isArray(history)) {
                for (let i = history.length - 1; i >= 0; i--) {
                    const hMsg = history[i];
                    const text = hMsg.parts?.[0]?.text || hMsg.content || "";
                    const lowerText = text.toLowerCase().trim();
                    if (text && 
                        !lowerText.match(/^\d+$/) && 
                        !["cancel", "stop", "info", "help", "2", "1", "3", "4", "5", "second", "first", "third", "fourth", "fifth"].includes(lowerText)) {
                        lastRealQuery = text;
                        break;
                    }
                }
            }

            console.log(`User numerical choice detected: indices row ${selectedIndex}. Last query: "${lastRealQuery}"`);
            
            // Search or retrieve matching subset
            let baseQuery = supabase.from("recipes").select("*");
            let targetKeywords = lastRealQuery ? extractKeywords(lastRealQuery) : [];
            let targetDietary = lastRealQuery ? extractDietaryRestrictions(lastRealQuery) : [];

            if (targetDietary.length > 0) {
                baseQuery = baseQuery.overlaps("dietary_tags", targetDietary);
            }

            const filterParts: string[] = [];
            targetKeywords.forEach(kw => {
                const safeKw = kw.replace(/['%_]/g, "");
                if (safeKw) {
                    filterParts.push(`title.ilike.%${safeKw}%`);
                    filterParts.push(`description.ilike.%${safeKw}%`);
                }
            });

            try {
                let matches: any[] = [];
                if (filterParts.length > 0) {
                    const { data } = await baseQuery.or(filterParts.join(",")).limit(5);
                    if (data) matches = data;
                } else if (targetDietary.length > 0) {
                    const { data } = await baseQuery.limit(5);
                    if (data) matches = data;
                }

                // If nothing matches or no target, fetch default recipe items directly
                if (matches.length === 0) {
                    const { data } = await supabase.from("recipes").select("*").limit(5);
                    if (data) matches = data;
                }

                if (matches && matches[selectedIndex]) {
                    recipes = [matches[selectedIndex]];
                    console.log(`Directly matched Supabase recipe: "${recipes[0].title}"`);
                }
            } catch (err) {
                console.error("Supabase recipe indexing selection query failed:", err);
            }
        } else if (hasRealSupabase) {
            // Remove dietary tags from keywords to avoid redundant search
            keywords = keywords
                .filter(kw => !dietaryTags.some(dt => dt.includes(kw) || kw.includes(dt)))
                .slice(0, 5); 

            console.log(`Searching recipes. Keywords: ${keywords.join(", ")}, Dietary: ${dietaryTags.join(", ")}`);

            // Build query
            let query = supabase.from("recipes").select("*");
            
            // Apply dietary filter if present (using overlaps for array column)
            if (dietaryTags.length > 0) {
                query = query.overlaps("dietary_tags", dietaryTags);
            }

            // Build or filters for keywords across text columns
            const filterParts: string[] = [];
            if (keywords.length > 0) {
                keywords.forEach(kw => {
                    const safeKw = kw.replace(/['%_]/g, "");
                    if (safeKw) {
                        filterParts.push(`title.ilike.%${safeKw}%`);
                        filterParts.push(`description.ilike.%${safeKw}%`);
                    }
                });
            }
            
            if (filterParts.length > 0) {
                try {
                    const { data, error } = await query.or(filterParts.join(",")).limit(3);
                    if (!error && data) {
                        recipes = data;
                    } else if (error) {
                        console.error("Supabase query error (Details):", error);
                    }
                } catch (err) {
                    console.error("Supabase query error:", err);
                }
            } else if (dietaryTags.length > 0) {
                try {
                    const { data, error } = await query.limit(3);
                    if (!error && data) {
                        recipes = data;
                    }
                } catch (err) {
                    console.error("Supabase query error:", err);
                }
            } else {
                // Fetch default recipes instead of empty list so we directly access Supabase for content
                try {
                    const { data, error } = await supabase.from("recipes").select("*").limit(3);
                    if (!error && data) {
                        recipes = data;
                    }
                } catch (err) {
                    console.error("Supabase default query error:", err);
                }
            }
        }

        // Process response interactively with Chef Nino's Decoupled Cognition Engine
        const responseText = generateInteractiveResponse(message, recipes, nlpAnalysis || {
            sentiment: "neutral",
            ingredients: [],
            cuisine: null,
            mealType: null,
            dietary: dietaryTags,
            allKeywords: keywords,
            skillLevel: "beginner",
            queryType: "ingredient-based"
        });

        res.json({ response: responseText });
    } catch (error: any) {
        console.error("Chat error details:", error.message || error);
        if (error.stack) console.error(error.stack);
        res.status(500).json({ error: "Chef Nino is having trouble accessing the pantry right now. Please check back in a bit!" });
    }
});

// Vite middleware for development
async function setupVite() {
    if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
        try {
            const { createServer: createViteServer } = await import("vite");
            const vite = await createViteServer({
                server: { middlewareMode: true },
                appType: "spa",
            });
            app.use(vite.middlewares);
        } catch (viteError) {
            console.error("Failed to load Vite server:", viteError);
        }
    } else {
        const distPath = path.join(process.cwd(), "dist");
        app.use(express.static(distPath));
        app.get("*", (req, res) => {
            res.sendFile(path.join(distPath, "index.html"));
        });
    }

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

if (!process.env.VERCEL) {
    setupVite();
}

export default app;
