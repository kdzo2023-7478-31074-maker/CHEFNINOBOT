/**
 * Chef Nino's Decoupled Rule-Based Culinary Cognition Engine
 * Completely offline, super-fast, and highly interactive!
 * Fits NLP parameters, state contexts, and real database results.
 */

interface Recipe {
    title: string;
    description?: string;
    ingredients?: any;
    steps?: any;
    instructions?: any;
    cuisine_type?: string;
    meal_type?: string;
    dietary_tags?: string[];
}

interface NlpAnalysis {
    tokens?: any[];
    tokenCount?: number;
    contentWords?: string[];
    sentiment: string;
    sentimentScore?: number;
    ingredients: string[];
    cuisine: string | null;
    mealType: string | null;
    dietary: string[];
    allKeywords: string[];
    skillLevel: string;
    queryType: string;
}

// Playful Chef Nino puns and transitions
const CHEF_NINO_PUNS = [
    "That is absolutely souper! 🥣",
    "Let's get this culinary whisk rolling! 🍳",
    "Seasoned to absolute perfection! 🧂",
    "Grated minds think alike! 🧀",
    "Sizzling hot and ready to go! 🔥",
    "We are cooking with gas now! 💨",
    "Lettuce celebrate this amazing choice! 🥬",
    "This is ofish-ally going to be delicious! 🐟",
    "A pinch of passion makes every dish perfect! ✨"
];

const CHEF_SEC_TIPS = [
    "**Chef's Private Secret:** Always bloom your dry spices (like curry powder, paprika, or oregano) in warm oil for 30 seconds before adding any liquids. This awakens the essential oils and multiplies the delicious fragrance and flavor by ten! 🤫🌿",
    "**Chef Nino's Sizzle Tip:** When frying tofu or chicken, make sure the pan has adequate space. Crowding the pan traps steam, making everything soggy instead of getting that gorgeous, golden-crisp exterior we love! 🍗🥢",
    "**Chef's Secret Booster:** Feeling like the dish is missing 'something' right at the end? Avoid dumping more salt! Instead, add a tiny splash of acid—like fresh lime juice, lemon, or vinegar. It brightens the flavors instantly! 🍋✨",
    "**Garlic Alert:** Never add garlic to a dry, burning-hot pan. It burns in seconds and turns bitter. Heat your oil first, toss the garlic in, and let it stay on medium-low heat until it smells incredibly heavenly (about 45 seconds)! 🧄🔥",
    "**Perfect Pasta Tip:** Always save 1/2 cup of your starchy pasta cooking water before draining. Tossing this salty liquid back into your noodles along with the sauce creates a beautiful, thick emulsion that hugs every single strand perfectly! 🍝💧"
];

const SWEET_SIDE_BARS: Record<string, string> = {
    Pasta: "A crisp toasted slice of garlic-herb sourdough bread and a glass of refreshing chilled lemon-basil iced tea! 🥖🥤",
    Curry: "A side of steaming aromatic jasmine rice, a scoop of cooling cucumber yogurt raita, or a sweet ripe mango smoothie! 🍛🥭",
    Salad: "A small warm bowl of rustic vegetable soup and a handful of toasted pumpkin seeds for that perfect, crunchy texture! 🥣🌻",
    Tofu: "A light, crunchy asian sesame cucumber salad and a comforting cup of warm green tea! 🥒🍵",
    Salmon: "Some sweet charred asparagus stalks, creamy whipped mashed potatoes, or a light zesty Sauvignon Blanc! 🥦🍷",
    Beef: "A serving of golden roasted fingerling potatoes, crisp garden salad with vinaigrette, or a full-bodied red wine! 🥔🍷",
    Adobo: "A mountain of garlic-sinangag fried rice and a cold glass of sweet calamansi juice! Oh, pure heaven! 🍚🍋",
    Dessert: "A hot, freshly brewed cup of black robust coffee or a splash of fresh whipped cold coconut cream! ☕🥥"
};

// Procedural Recipe Database to create realistic recipes on-the-fly when pantry is empty
const PROCEDURAL_RECIPES: Record<string, { title: string, desc: string, ing: string[], steps: string[], cuisine: string, meal: string }> = {
    salmon: {
        title: "Chef Nino's Majestic Garlic Butter Herb Salmon 🐟✨",
        desc: "A gorgeous, golden-crusted salmon fillet basted thoroughly in a velvety lemon-garlic butter glaze. Absolutely melt-in-your-mouth tender!",
        ing: ["2 fresh Salmon Fillets (skin-on for crispiness)", "3 cloves of fresh Garlic (finely minced)", "2 tbsp unsalted Butter (or olive oil)", "1 medium Citrus Lemon (juiced & sliced)", "1 sprig of rosemary or dill", "Sea salt and cracked black pepper to taste"],
        steps: [
            "Pat the salmon dry with paper towels (moisture is the enemy of a crispy sear!) and season both sides generously with sea salt and cracked pepper.",
            "Heat a drop of oil in a medium skillet over medium-high heat. Place salmon skin-side down and let it sizzle undisturbed for 4-5 minutes until the skin is beautifully crispy.",
            "Carefully flip the fish. Drop the butter, minced garlic, and rosemary/dill into the pan. Let the butter melt and bloom.",
            "Spoon the hot, foaming garlic butter over the top of the salmon repeatedly (basting!) for 2-3 more minutes.",
            "Squeeze in half the lemon juice right as you turn off the stove. Serve immediately with lemon wheels!"
        ],
        cuisine: "Western",
        meal: "Dinner"
    },
    chicken: {
        title: "Nino's Comforting Fragrant Coconut Chicken Curry 🍛",
        desc: "A warm, mildly spiced curry cooked slow with creamy coconut milk, tender chicken thigh chunks, and sweet root vegetables.",
        ing: ["500g Chicken thighs (cut into bite-sized pieces)", "1 cup Creamy Coconut Milk", "1 tbsp Golden Curry Powder", "1 medium Red Onion & 3 cloves Garlic", "1 small Carrot & 1 medium Potato (cubed)", "1 tsp grated fresh Ginger", "1 tsp fish sauce or salt"],
        steps: [
            "Heat oil in a heavy-bottomed pot and sauté the onion, garlic, and ginger until soft and highly fragrant.",
            "Add the curry powder, stirring constantly for 30 seconds to bloom the spices in the hot oil.",
            "Add the poultry pieces and cook until browned on all sides, about 5 minutes.",
            "Pour in the creamy coconut milk and bring to a gentle bubble. Toss in the potato and carrots.",
            "Simmer on medium-low for 15-20 minutes until the sauce is beautifully thick and the vegetables are fork-tender. Season with salt or fish sauce!"
        ],
        cuisine: "Asian",
        meal: "Dinner"
    },
    tofu: {
        title: "Chef Nino's Crispy Golden Herb-Glazed Tofu 🍲",
        desc: "Ultra-crispy tofu cubes tossed in a light, sweet-and-savory garlic vinegar glaze. High protein and absolutely addictive!",
        ing: ["1 block of Firm Tofu (pressed and cubed)", "2 tbsp Cornstarch (for maximum crunch)", "3 cloves Garlic (finely chopped)", "2 tbsp Soy sauce or Tamari", "1 tbsp White vinegar or Apple cider vinegar", "1 tbsp Brown sugar or maple syrup", "1 chopped Green onion for garnish"],
        steps: [
            "Gently press the tofu block using a kitchen towel to squeeze out excess moisture, then cut into bite-sized cubes.",
            "Toss the tofu cubes in cornstarch until lightly and evenly coated on all sides.",
            "Heat oil in a non-stick skillet and sear the tofu cubes over medium-high heat, turning occasionally, until all sides are golden-crisp (about 8 mins). Move tofu to a plate.",
            "In the same skillet, reduce heat and briefly brown the minced garlic. Pour in the soy sauce, vinegar, and sugar. Let it bubble and thicken into a shiny glaze (1-2 mins).",
            "Return the crispy tofu to the skillet, toss rapidly to coat, and garnish with chopped green onions!"
        ],
        cuisine: "Asian",
        meal: "Lunch"
    },
    mushroom: {
        title: "Nino's Savory Garlic Herb Mushroom Medley 🍄",
        desc: "Caramelized wild mushrooms sautéed to perfection with rich garlic, melted butter, and a pinch of rustic herbs. A gorgeous side dish or main topping!",
        ing: ["300g Fresh Mushrooms (button, cremini, or shiitake), sliced", "4 cloves Garlic (minced)", "1.5 tbsp Butter or Olive oil", "2 sprigs fresh Thyme or Rosemary", "1 tbsp soy sauce", "Salt and freshly ground black pepper to taste"],
        steps: [
            "Wipe the mushrooms dry with a cloth (never wash under a tap, they act like sponges!). Slice them evenly.",
            "Heat butter and oil in a wild pan over high heat. Toss in the mushrooms in a single layer and let them sear without stirring for 3 minutes to get rich carmelization.",
            "Stir the mushrooms, then add the minced garlic and thyme leaves.",
            "Sauté on medium weight for another 3 minutes until the garlic is fragrant and the mushrooms are golden.",
            "Drizzle with soy sauce, season with a pinch of fresh salt/pepper, and serve warm!"
        ],
        cuisine: "Western",
        meal: "Snack"
    },
    pasta: {
        title: "Nino's Cozy Rustic Tomato Garlic Herb Pasta 🍝",
        desc: "A glorious, traditional Italian pan pasta featuring sweet burst cherry tomatoes, thin toasted garlic slices, and continuous dynamic herb notes.",
        ing: ["200g Spaghetti (or any dry pasta)", "1 cup Cherry Tomatoes (halved)", "4 cloves Garlic (thinly sliced)", "3 tbsp extra-virgin Olive oil", "Fresh Basil leaves", "Grated Parmesan cheese (optional)", "Pinch of chili flakes for contrast"],
        steps: [
            "Boil pasta in a pot of heavily salted water until 'al dente'. Remember to scoop out 1/2 cup of pasta water before draining!",
            "In a large pan, heat olive oil on medium heat. Sauté the garlic slices and chili flakes slowly until light golden.",
            "Toss in the cherry tomatoes and cook for 5-6 minutes until they burst, releasing their sweet natural juices into the oil.",
            "Add the cooked pasta and the saved pasta water to the pan, turning up the heat to high. Toss vigorously so the oil and starch emulsify into a silky sauce.",
            "Stir in fresh basil, drizzle with a touch of raw olive oil, and shower with sparkling parmesan!"
        ],
        cuisine: "Western",
        meal: "Dinner"
    },
    cookie: {
        title: "Chef Nino's Warm Decadent Skillet Chocolate Cookie 🍪🍫",
        desc: "A single large chocolate chip cookie with a gooey center, crispy edges, and melting channels of delicious dark chocolate.",
        ing: ["1/2 cup All-purpose flour", "2 tbsp melted Butter", "2 tbsp Brown sugar & 1 tbsp White sugar", "1 tbsp Milk (any kind)", "1/4 tsp baking soda & a pinch of salt", "3 tbsp Chocolate chips or chunks"],
        steps: [
            "Preheat a mini cast-iron skillet or grease a small oven-safe bowl.",
            "In a mixing bowl, stir melted butter with both brown and white sugars until well combined.",
            "Stir in the milk, then fold in the flour, baking soda, and salt to form a soft cookie dough.",
            "Fold in most of your chocolate chips, saving a few to press into the top.",
            "Press the dough into your skillet or bowl, bake at 180°C (350°F) for 10-12 minutes until the edges are beautifully golden, leaving the core soft and gooey!"
        ],
        cuisine: "Western",
        meal: "Dessert"
    },
    egg: {
        title: "Nino's Fluffy French Style Herb Scrambled Eggs 🍳",
        desc: "Silky, custardy, cloud-like scrambled eggs whisked with fine fresh herbs and slowly stirred over low heat, buttery perfection!",
        ing: ["3 Fresh eggs", "1 tbsp unsalted Butter", "1 tbsp fresh chives or parsley (chopped)", "Pinch of salt and white pepper", "1 slice of toasted bread"],
        steps: [
            "Crack the eggs into a bowl, season with salt and white pepper, and whisk vigorously with a fork until perfectly uniform.",
            "Place a small pan over low heat and add the butter, letting it melt slowly without sizzling.",
            "Pour in the eggs. Using a silicone spatula, constantly stir in small concentric circles, sweeping the edges regularly.",
            "As small curds form, keep stirring over gentle low heat until the eggs look creamy and soft (about 3-4 minutes).",
            "Remove from heat while they are still slightly glossy; they will finish cooking off the stove! Fold in fresh chives and slide onto hot toast."
        ],
        cuisine: "Western",
        meal: "Breakfast"
    }
};

const DEFAULT_GENERIC_RECIPE = {
    title: "Chef Nino's Surprise Kitchen-Sink Pantry Sauté 🥘",
    desc: "A masterful, highly-flexible sauté using whatever fresh items are available in your kitchen drawer. Fast, nutritious, and absolutely delightful!",
    ing: ["Assorted proteins (tofu / chicken / egg)", "Pantry vegetables (onion, garlic, greens)", "1 tbsp seasoning sauce (soy sauce/vinegar)", "1 tbsp stir-fry oil"],
    steps: [
        "Cut your proteins and vegetables into uniform bite-sized pieces so they cook evenly.",
        "Heat oil in your favorite skillet on high heat and sear the protein until color develops.",
        "Toss in garlic, onions, and harder vegetables, cooking for 3 minutes.",
        "Add leafy greens and season with soy sauce, vinegar, salt, and pepper.",
        "Toss continuously until hot, flavorful, and beautifully aromatic!"
    ],
    cuisine: "Asian",
    meal: "Lunch"
};

function isCulinaryQuery(msg: string): boolean {
    const lower = msg.toLowerCase().trim();
    
    // Explicitly allow numeric inputs, cancel commands, and info requests so they are not rejected
    if (/^\d+$/.test(lower) || ["cancel", "stop", "back", "yes", "no", "ok", "okay", "sure", "next", "prev", "previous", "info", "details", "more", "help"].includes(lower)) {
        return true;
    }
    
    // Explicit culinary words
    const culinaryKeywords = [
        "recipe", "cook", "bake", "fry", "sauté", "roast", "boil", "steam", "simmer", "grill", "stew",
        "food", "dish", "meal", "breakfast", "lunch", "dinner", "supper", "snack", "dessert", "brunch",
        "pantry", "fridge", "refrigerator", "kitchen", "kettle", "pan", "skillet", "pot", "oven", "stove",
        "knife", "knives", "whisk", "cutting board", "utensil", "ingredient", "diet", "vegan", "vegetarian",
        "keto", "halal", "kosher", "gluten", "allergy", "allergic", "protein", "carbs", "calories",
        "oil", "butter", "season", "salt", "pepper", "garlic", "onion", "ginger", "spice", "herb",
        "chicken", "pork", "beef", "fish", "shrimp", "seafood", "tofu", "mushroom", "rice", "pasta",
        "noodles", "vegetable", "fruit", "sauce", "soup", "salad", "adobo", "sinigang", "curry",
        "chocolate", "cookie", "cake", "bread", "cheese", "milk", "cream", "egg", "shimeji", "soy sauce",
        "vinegar", "sugar", "citrus", "lemon", "lime", "calamansi", "parsley", "basil", "thyme", "rosemary",
        "sauvignon", "wine", "beverage", "drink", "juice", "tea", "coffee", "smoothie", "menu", "taste",
        "yummy", "delicious", "hungry", "starving", "appetite", "sizzle", "culinary", "chef", "sous", "nino",
        "pork", "poultry", "meat", "shrimp", "seafood", "crab", "lobster", "salmon", "tuna", "tomato", "potato",
        "carrot", "cabbage", "spinach", "eggplant", "banana", "apple", "berry", "strawberry", "coconut",
        "sweet", "sour", "bitter", "savory", "umami", "salty", "spicy", "hot", "dine", "eat", "pantry", "vault",
        "baste", "glaze", "toast", "whipping", "mashed", "seared", "crispy"
    ];

    const hasCulinaryWord = culinaryKeywords.some(root => lower.includes(root));
    if (hasCulinaryWord) {
        return true;
    }

    // If it's a short greeting / simple conversational turn with no culinary words
    const simpleGreetings = [
        "hi", "hello", "hey", "hola", "greetings", "good morning", "good afternoon", "good evening",
        "who are you", "what can you do", "introduce yourself", "how are you", "yo"
    ];
    if (simpleGreetings.includes(lower) || simpleGreetings.some(greet => lower === greet + "?")) {
        return true;
    }

    // Default to false for everything else
    return false;
}

/**
 * Main response generation router.
 * Inspects local metadata context, user's query, and retrieved database recipes.
 */
export function generateInteractiveResponse(
    message: string,
    recipes: Recipe[],
    nlp: NlpAnalysis
): string {
    if (!isCulinaryQuery(message)) {
        return "### 👨‍🍳 Chef's Private Station Alert! 🚫✨\n\nApologies, but this is out of my reach! As Chef Nino, my culinary cognition is strictly calibrated to assist you with cooking recipes, dietary options, kitchen tips, and tasty meal preparations. Let's cook up something delicious instead! 👨‍🍳🥄✨";
    }

    const sentiment = nlp.sentiment || "neutral";
    const skillLevel = nlp.skillLevel || "beginner";
    const queryType = nlp.queryType || "ingredient-based";
    const dietaryTags = nlp.dietary || [];
    const mealType = nlp.mealType || null;

    let text = "";

    // SECTION 1: CUSTOM ENTHUSIASTIC OPENERS BASED ON EMOTIONAL SENTIMENT
    if (sentiment === "frustrated") {
        text += "### 👨‍🍳 Chef Nino's Kitchen Rescue Protocol! 🥖✨\n\n";
        text += "Deep breaths, my friend! 🧘‍♂️ Take a load off-I've got you covered. Cooking should never be a chore, and kitchen mishaps are just secret paths to tasty discoveries! Let us lower the heat, simplify our steps, and whip up something incredibly easy, soothing, and stress-free. No complicated maneuvers, just pure, cozy comfort food coming right up! 💕\n\n";
    } else if (sentiment === "stressed") {
        text += "### 👨‍🍳 Chef Nino's Quick & Cozy Express! ⏱️✨\n\n";
        text += "Oh, I hear you! Time is flying and stress is high. Let's keep things super straightforward, fast, and satisfying! ⚡ I am choosing a path with absolutely **minimal prep work** and **one-pan cleanup** so you can refuel, recharge, and get on with your day with standard, simple pantry components. Let's get down to the fun part!\n\n";
    } else if (sentiment === "hungry") {
        text += "### 👨‍🍳 Chef Nino's High-Energy Sizzle Station! 🍽️🔥\n\n";
        text += "Oh boy, delicious news! 🤤 I can hear your stomach rumbled all the way from my pantry side of the web! When you are craving real cooking, we don't hold back. Let us get this kitchen whisk rolling, heat up the pans, and put together something bold, colorful, and sensory-perfect! Think incredible sizzles, crispy edges, and rich, savory aromas filling the room! Let's eat! 🍗💥\n\n";
    } else if (sentiment === "excited") {
        text += "### 👨‍🍳 Chef Nino's Culinary Celebration! 🎉✨\n\n";
        text += "That's exactly what I like to hear! Sizzle, spice, and everything nice! 🌟 Your enthusiastic energy is a chef's absolute dream! Let's channel that amazing vibe and whip up something genuinely spectacular today! We'll throw in some playful ingredients, elevate the plating, and make this a delightful culinary adventure. Ready when you are! 🧀✨\n\n";
    } else {
        text += "### 👨‍🍳 Chef Nino's Recipe Pantry! 🍳📖\n\n";
        text += "Hello there, fellow home chef! Sifting through our ingredients is my absolute favorite pastime. Let's dig in and make something warm, wholesome, and delicious together! 🥖\n\n";
    }

    // SECTION 2: PUN INCLUSION (NATURAL AND JOYFUL)
    const randomPun = CHEF_NINO_PUNS[Math.floor(Math.random() * CHEF_NINO_PUNS.length)];
    text += `*Chef's Note: ${randomPun}*\n\n`;

    // SECTION 3: RECONCILING WITH SUPABASE RESULTS (OR GENERATING PROCEDURALLY ON-THE-FLY)
    let selectedCoreMealCategory = "Pasta"; // for sweet side-bars

    if (recipes && recipes.length > 0) {
        text += "#### 🗄️ From Our Database Pantry Archives:\n";
        text += "I've whisked through our live recipe vault and found these perfect matching cards in our collection! Settle in, because these are absolute culinary gems:\n\n";

        recipes.forEach((recipe, index) => {
            text += `---\n\n`;
            text += `### 📌 ${index + 1}. ${recipe.title}\n`;
            if (recipe.cuisine_type || recipe.meal_type) {
                text += `*Category: **${recipe.cuisine_type || "Global"}** // **${recipe.meal_type || "Anytime"}*** \n\n`;
            }
            if (recipe.description) {
                text += `> *${recipe.description}*\n\n`;
            }

            // Capture category for sidebars
            const safeTitle = (recipe.title || "").toLowerCase();
            if (safeTitle.includes("curry")) selectedCoreMealCategory = "Curry";
            else if (safeTitle.includes("salad")) selectedCoreMealCategory = "Salad";
            else if (safeTitle.includes("tofu")) selectedCoreMealCategory = "Tofu";
            else if (safeTitle.includes("salmon")) selectedCoreMealCategory = "Salmon";
            else if (safeTitle.includes("adobo")) selectedCoreMealCategory = "Adobo";

            // Ingredients list
            text += `**🛒 Pantry Checklist:**\n`;
            let ingList: string[] = [];
            if (recipe.ingredients) {
                if (Array.isArray(recipe.ingredients)) {
                    ingList = recipe.ingredients.map((ing: any) => {
                        if (typeof ing === 'string') return ing;
                        if (typeof ing === 'object' && ing !== null) {
                            if (ing.original) return ing.original;
                            let label = ing.name || '';
                            if (ing.amount) label = `${ing.amount} ${label}`;
                            if (ing.notes) label = `${label} (${ing.notes})`;
                            return label || JSON.stringify(ing);
                        }
                        return String(ing);
                    });
                } else if (typeof recipe.ingredients === 'string') {
                    ingList = recipe.ingredients.split(",").map((i: string) => i.trim());
                }
            }

            if (ingList.length > 0) {
                ingList.forEach(ing => {
                    text += `- [ ] ${ing}\n`;
                });
            } else {
                text += `- [ ] Ingredients are customizable! Just use your primary options.\n`;
            }
            text += `\n`;

            // Steps
            const steps = recipe.steps || recipe.instructions;
            if (steps) {
                text += `**🔪 Step-by-Step Guidance:**\n`;
                if (Array.isArray(steps)) {
                    steps.forEach((step, stepIdx) => {
                        const stepText = typeof step === 'string' ? step : (step.text || step.instruction || JSON.stringify(step));
                        text += `${stepIdx + 1}. ${stepText}\n`;
                    });
                } else {
                    text += `${steps}\n`;
                }
                text += `\n`;
            }
            text += `---\n\n`;
        });
    } else {
        // NO SUPABASE RECIPES FOUND - DYNAMICALLY CRAFT CUSTOM ONE ON-THE-FLY
        text += "#### 🤫 Sizzling Secret: Custom Notebook Creation!\n";
        text += "While our main database card index doesn't have an exact matching file card, I've flipped over my personal secret chef's diary to whip up a customized, professional dish right now! This is the beauty of cooking-creating magic out of what we have!\n\n";

        // Determine which category fits best based on keywords in message
        const lowerMsg = message.toLowerCase();
        let matchedKey = "";
        if (lowerMsg.includes("salmon") || lowerMsg.includes("fish")) matchedKey = "salmon";
        else if (lowerMsg.includes("chicken") || lowerMsg.includes("poultry") || lowerMsg.includes("meat")) matchedKey = "chicken";
        else if (lowerMsg.includes("tofu")) matchedKey = "tofu";
        else if (lowerMsg.includes("mushroom") || lowerMsg.includes("shimeji") || lowerMsg.includes("button")) matchedKey = "mushroom";
        else if (lowerMsg.includes("pasta") || lowerMsg.includes("spaghetti") || lowerMsg.includes("noodle") || lowerMsg.includes("sauce")) matchedKey = "pasta";
        else if (lowerMsg.includes("cookie") || lowerMsg.includes("cake") || lowerMsg.includes("chocolate") || lowerMsg.includes("dessert")) matchedKey = "cookie";
        else if (lowerMsg.includes("egg") || lowerMsg.includes("scramble") || lowerMsg.includes("breakfast")) matchedKey = "egg";

        // Sift items
        const selectedRec = matchedKey ? PROCEDURAL_RECIPES[matchedKey] : null;

        if (selectedRec) {
            selectedCoreMealCategory = matchedKey.charAt(0).toUpperCase() + matchedKey.slice(1);
            text += `---\n\n`;
            text += `### ⭐ ${selectedRec.title}\n`;
            text += `*Category: **${selectedRec.cuisine}** // **${selectedRec.meal}*** \n\n`;
            text += `> *${selectedRec.desc}*\n\n`;

            text += `**🛒 Custom Ingredients Checklist:**\n`;
            selectedRec.ing.forEach(i => {
                text += `- [ ] ${i}\n`;
            });
            text += `\n`;

            text += `**🔪 Sizzling Steps:**\n`;
            selectedRec.steps.forEach((st, sIdx) => {
                text += `${sIdx + 1}. ${st}\n`;
            });
            text += `\n`;
            text += `---\n\n`;
        } else {
            // Ultimate procedural fallback using keywords detected
            const detectedIngredients = nlp.ingredients && nlp.ingredients.length > 0 ? nlp.ingredients : ["fresh vegetables", "aromatics", "pinch of kitchen love"];
            text += `---\n\n`;
            text += `### 🌟 Chef Nino's Dynamic ${detectedIngredients[0].toUpperCase()} Stir-Fry Supreme 🥘\n`;
            text += `*Category: **Asian** // **All-Purpose Lunch/Dinner***\n\n`;
            text += `> *A beautiful, fast-cooking skillet dish built procedurally just for your query! Deliciously dynamic and highly adjustable.*\n\n`;

            text += `**🛒 Ingredients checklist:**\n`;
            detectedIngredients.forEach(ing => {
                text += `- [ ] 150g ${ing} (sliced or prepped)\n`;
            });
            text += `- [ ] 2 cloves Garlic (crushed)\n`;
            text += `- [ ] 1 red Onion (sliced)\n`;
            text += `- [ ] 2 tbsp Soy Sauce & 1 tsp brown sugar for glaze\n`;
            text += `- [ ] 1 tbsp butter or vegetable oil\n`;
            text += `\n`;

            text += `**🔪 Simple Steps:**\n`;
            text += `1. Heat oil or butter in your favorite frying pan over a medium-high flame.\n`;
            text += `2. Toss in the sliced onions and crushed garlic, frying until they are gloriously soft and sweet.\n`;
            text += `3. Lower your selected ingredients (like ${detectedIngredients.join(", ")}) into the skillet. Sauté dynamically for 5-6 minutes until soft but still holding their lively colors.\n`;
            text += `4. Pour in the soy sauce and sprinkle brown sugar. Stir constantly until the glaze heats up, bubbles, and clings to every single morsel!\n`;
            text += `5. Serve hot with a big happy smile! Customize as you see fit!\n\n`;
            text += `---\n\n`;
        }
        
        text += "✨ **Bonus Action:** Sizzled this dynamic recipe up beautifully? Write it down! Click the **SAVE_TO_JOURNAL** button on the bottom of the recipe block to write this custom masterpiece directly into your Recipe Journal file database! 📖💖\n\n";
    }

    // SECTION 4: INJECT SKILL LEVEL STYLINGS
    text += "#### 🛠️ Chef's Skill Level Guidance:\n";
    if (skillLevel === "beginner") {
        text += "- **Keep It Steady:** Focus entirely on controlling your temperature! Do not rush the cooking steps. Keep a medium-low heat setting so you can monitor progress, smell the aromas changing, and prevent anything from burning. Patience beats cooking speed! 🐌🍳\n";
    } else if (skillLevel === "intermediate") {
        text += "- **Pre-heat with Confidence:** Make sure your frying pan is thoroughly hot *before* food drops in. Listen closely to the sizzle sound when the food touches the metal; if it doesn't sing, turn the heat up a tiny bit! 🎶🔥\n";
    } else {
        text += "- **Culinary Mastery Focus:** Keep an eye out for the *Maillard reaction*! Get those rich golden browning lines on your protein surface. Deglaze your pan using a tiny splash of sauce, wine, or vinegar to scrape up those caramelized browned bits (suc) from the bottom—that's pure concentrated flavour! 🍇🍷\n";
    }
    text += "\n";

    // SECTION 5: INJECT DIETARY RESTRICTIONS SWAPS
    if (dietaryTags.length > 0) {
        text += "#### 🌱 Certified Dietary Customizations:\n";
        dietaryTags.forEach(tag => {
            if (tag === "vegan" || tag === "vegetarian") {
                text += `- **${tag.toUpperCase()} CERTIFIED:** We are skipping any heavy meat fats! Swap animal broth with deep vegetable stocks, use rich coconut fat or high-quality cold-pressed olive oils, and use nutritional yeast or plant-based proteins to retain maximum umami savoriness! 🥦🥑\n`;
            } else if (tag === "keto") {
                text += `- **KETO CERTIFIED:** Keep that carbohydrate meter locked! Swap any white sugars with natural pure monkfruit extract or stevia, and replace heavy noodles or rice beds with spiralized crisp zucchini ribbons, shredded cauliflower, or fresh butter-lettuce cups! 🥩🧀\n`;
            } else if (tag === "diabetic-friendly") {
                text += `- **DIABETIC FRIENDLY:** Absolutely healthy! Avoid raw processed carbohydrates and simple sugars. Utilize fiber-rich legumes, leafy greens, and substitute processed white rice with wild black rice, quinoa, or roasted mashed cauliflower. 🌳🥗\n`;
            } else {
                text += `- **${tag.toUpperCase()} CUSTOMIZATION:** Our kitchen aligns perfectly with your preferences! Always double check package labels, and focus on fresh, unrefined, whole-food options to keep things wholesome and healthy. 🌟\n`;
            }
        });
        text += "\n";
    }

    // SECTION 6: INJECT THE PRIVATE CHEF'S SECRET & beverage / side combinations
    const randomSecret = CHEF_SEC_TIPS[Math.floor(Math.random() * CHEF_SEC_TIPS.length)];
    text += `#### 💡 Private Chef Nino's Hot Tip:\n${randomSecret}\n\n`;

    const sideDish = SWEET_SIDE_BARS[selectedCoreMealCategory] || SWEET_SIDE_BARS["Pasta"];
    text += `#### 🥖 Recommended Side Kick & Drink Pairing:\nWhy not enjoy this fabulous dish alongside **${sideDish}** It adds an extra layer of delicious harmony to your home table!\n\n`;

    // SECTION 7: STIMULATING INTERACTIVE QUESTIONS AT THE FOOTER
    text += "---\n\n";
    text += "#### 👩‍🍳 Let's Chat! Nino's Interactive Questions:\n";
    if (sentiment === "frustrated" || sentiment === "stressed") {
        text += "1. Should we trim down the ingredients to just 3 simple elements to keep it super cozy and sweat-free?\n";
        text += "2. Would you like me to share a neat kitchen trick to wash your cutting board in 10 seconds flat?\n";
    } else {
        text += "1. How does this sound to you? Do we need to do some cool swaps (like keeping it vegetarian, dairy-free, or extra spicy)?\n";
        text += "2. Do you have all these ingredients lying around in your fridge, or should we substitute one of them right now?\n";
    }
    text += "\nLet me know, and let's turn this meal into a masterpiece! Ready, set, whisk! 👨‍🍳🥄✨";

    return text;
}
