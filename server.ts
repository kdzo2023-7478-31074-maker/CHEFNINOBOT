import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
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

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "placeholder";
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
app.get("/api/health", (req, res) => {
    res.json({ 
        status: "ok", 
        hasSupabase: !!process.env.SUPABASE_URL,
        env: process.env.NODE_ENV || "development",
        message: "Supabase recipe search agent is active."
    });
});

app.post("/api/chat", async (req, res) => {
    console.log("POST /api/chat received - Dynamic Interactive Gemini mode");
    try {
        const { message, history, nlpAnalysis } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const hasRealSupabase = process.env.SUPABASE_URL && 
                              process.env.SUPABASE_URL !== "https://placeholder.supabase.co" && 
                              process.env.SUPABASE_ANON_KEY && 
                              process.env.SUPABASE_ANON_KEY !== "placeholder";

        const allKeywords = extractKeywords(message);
        const dietaryTags = extractDietaryRestrictions(message);
        
        // Remove dietary tags from keywords to avoid redundant search
        const keywords = allKeywords
            .filter(kw => !dietaryTags.some(dt => dt.includes(kw) || kw.includes(dt)))
            .slice(0, 5); 

        console.log(`Searching recipes. Keywords: ${keywords.join(", ")}, Dietary: ${dietaryTags.join(", ")}`);

        let recipes: any[] = [];
        
        if (hasRealSupabase && (keywords.length > 0 || dietaryTags.length > 0)) {
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
    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
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
