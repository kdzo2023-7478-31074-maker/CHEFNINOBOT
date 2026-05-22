// ============================================================
// src/lib/nlp.ts — NLP Processing Module
// Implements all 7 required NLP features
// ============================================================

export interface Token {
    text: string;
    isStopWord: boolean;
    type: 'word' | 'punctuation';
}

export interface NlpAnalysis {
    tokens: Token[];
    tokenCount: number;
    contentWords: string[];
    sentiment: string;
    sentimentScore: number;
    ingredients: string[];
    cuisine: string | null;
    mealType: string | null;
    dietary: string[];
    allKeywords: string[];
    skillLevel: string;
    queryType: string;
    processingMs: number;
    ingredientCategories: Record<string, string[]>;
    requestCategory: string;
    dishType: string;
}

const STOP_WORDS = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'and', 'or', 'but', 'not', 'it',
    'its', 'i', 'me', 'my', 'we', 'us', 'you', 'he', 'she', 'they',
    'what', 'which', 'who', 'this', 'that', 'these', 'those'
]);

const SENTIMENT_LEXICON = {
    excited: ['amazing', 'awesome', 'love', 'great', 'wonderful', 'fantastic', 'delicious',
              'yummy', 'excellent', 'perfect', 'best', 'enjoy', 'excited', 'happy', 'glad'],
    hungry:  ['hungry', 'starving', 'craving', 'want', 'need', 'eat', 'food', 'appetite',
              'stomach', 'famished', 'snack', 'meal', 'dinner', 'lunch', 'breakfast'],
    frustrated: ['hate', 'terrible', 'awful', 'worst', 'annoying', 'bad', 'disgusting',
                 'failed', 'burned', 'ruined', 'wrong', 'problem', 'issue', 'broken'],
    stressed: ['stressed', 'tired', 'busy', 'rushed', 'quick', 'fast', 'hurry', 'deadline',
               'late', 'no time', 'easy', 'simple', 'help', 'overwhelmed'],
};

const INGREDIENT_LIST = [
    'chicken', 'pork', 'beef', 'fish', 'shrimp', 'eggs', 'tofu', 'mushroom',
    'rice', 'pasta', 'bread', 'noodles', 'potatoes', 'carrots', 'onion',
    'garlic', 'tomatoes', 'eggplant', 'kangkong', 'cabbage', 'spinach',
    'cheese', 'butter', 'milk', 'cream', 'soy sauce', 'vinegar', 'sugar',
    'salt', 'pepper', 'oil', 'lemon', 'lime', 'ginger', 'chili', 'herbs'
];

const TYPO_MAP: Record<string, string> = {
    'toamto': 'tomato', 'tomatoe': 'tomato', 'chiken': 'chicken',
    'garlick': 'garlic', 'noodle': 'noodles', 'shrip': 'shrimp',
    'egplant': 'eggplant', 'potatoe': 'potato', 'brocolli': 'broccoli'
};

const CUISINE_KEYWORDS = {
    'Filipino': ['adobo', 'sinigang', 'kare-kare', 'lechon', 'pinakbet', 'nilaga', 'tinola', 'filipino', 'pinoy'],
    'Asian': ['asian', 'chinese', 'japanese', 'korean', 'thai', 'stir-fry', 'ramen', 'sushi', 'dim sum'],
    'Western': ['pasta', 'burger', 'steak', 'pizza', 'sandwich', 'soup', 'western', 'american', 'italian'],
    'Mediterranean': ['hummus', 'falafel', 'shawarma', 'greek', 'olive', 'mediterranean'],
};

const MEAL_KEYWORDS = {
    'Breakfast': ['breakfast', 'morning', 'brunch', 'cereal', 'pancake', 'oatmeal', 'eggs'],
    'Lunch':     ['lunch', 'midday', 'noon'],
    'Dinner':    ['dinner', 'supper', 'evening', 'tonight'],
    'Snack':     ['snack', 'merienda', 'light bite', 'small'],
    'Dessert':   ['dessert', 'sweet', 'cake', 'ice cream', 'pastry', 'pudding']
};

const DIETARY_KEYWORDS = {
    'vegan': ['vegan', 'plant-based', 'no animal'],
    'vegetarian': ['vegetarian', 'no meat', 'meatless'],
    'halal': ['halal'],
    'keto': ['keto', 'low carb', 'no sugar', 'ketogenic'],
    'diabetic-friendly': ['diabetic', 'sugar-free', 'low sugar']
};

export function tokenize(text: string) {
    const raw = text.toLowerCase().trim();
    const wordTokens = raw.match(/\b[a-z']+\b/g) || [];
    const punctTokens = raw.match(/[.,!?;:]/g) || [];

    const tokens: Token[] = wordTokens.map(word => ({
        text: word,
        isStopWord: STOP_WORDS.has(word),
        type: 'word' as 'word'
    }));

    punctTokens.forEach(p => tokens.push({ text: p, isStopWord: false, type: 'punctuation' as 'punctuation' }));

    return {
        tokens,
        count: tokens.length,
        contentWords: tokens.filter(t => !t.isStopWord && t.type === 'word').map(t => t.text)
    };
}

export function analyzeSentiment(text: string) {
    const lower = text.toLowerCase();
    const scores: Record<string, number> = { excited: 0, hungry: 0, frustrated: 0, stressed: 0, neutral: 0 };

    Object.entries(SENTIMENT_LEXICON).forEach(([sentiment, words]) => {
        words.forEach(word => {
            if (lower.includes(word)) scores[sentiment] += 1;
        });
    });

    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    const dominantArr = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const dominant = total === 0 ? 'neutral' : dominantArr[0][0];
    const score = total > 0 ? scores[dominant] / total : 0.5;

    return {
        sentiment: dominant,
        score: parseFloat(score.toFixed(3))
    };
}

export function extractKeywords(text: string) {
    let normalizedText = text.toLowerCase();

    Object.entries(TYPO_MAP).forEach(([typo, correct]) => {
        normalizedText = normalizedText.replace(new RegExp(typo, 'gi'), correct);
    });

    const ingredients = INGREDIENT_LIST.filter(ing => normalizedText.includes(ing));

    const cuisine = (Object.entries(CUISINE_KEYWORDS)
        .find(([, words]) => words.some(w => normalizedText.includes(w)))?.[0] || null) as string | null;

    const mealType = (Object.entries(MEAL_KEYWORDS)
        .find(([, words]) => words.some(w => normalizedText.includes(w)))?.[0] || null) as string | null;

    const dietary = Object.entries(DIETARY_KEYWORDS)
        .filter(([, words]) => words.some(w => normalizedText.includes(w)))
        .map(([tag]) => tag);

    return {
        ingredients,
        cuisine,
        mealType,
        dietary,
        allKeywords: Array.from(new Set([...ingredients, ...(cuisine ? [cuisine] : []), ...(mealType ? [mealType] : [])]))
    };
}

export function classifyText(text: string, keywords: any) {
    const lower = text.toLowerCase();

    let queryType = 'ingredient-based';
    if (lower.match(/craving|feel like|in the mood/)) queryType = 'craving-based';
    else if (lower.match(/\d+\s*(min|hour|minute)/)) queryType = 'time-based';
    else if (lower.match(/cheap|budget|affordable|inexpensive/)) queryType = 'budget-based';

    let skillLevel = 'beginner';
    if (lower.match(/advanced|complex|gourmet|sophisticated/)) skillLevel = 'advanced';
    else if (lower.match(/intermediate|moderate|some experience/)) skillLevel = 'intermediate';

    return {
        cuisine: keywords.cuisine,
        mealType: keywords.mealType,
        dietary: keywords.dietary,
        skillLevel,
        queryType
    };
}

export function classifyIngredients(ingredients: string[]): Record<string, string[]> {
    const categories: Record<string, string[]> = {
        'Proteins & Mains': [],
        'Vegetables & Mushrooms': [],
        'Grains & Carbs': [],
        'Dairy & Fats': [],
        'Seasonings & Herbs': []
    };

    ingredients.forEach(ing => {
        const lower = ing.toLowerCase();
        if (['chicken', 'pork', 'beef', 'fish', 'shrimp', 'eggs', 'tofu'].includes(lower)) {
            categories['Proteins & Mains'].push(ing);
        } else if (['mushroom', 'carrots', 'onion', 'garlic', 'tomatoes', 'eggplant', 'kangkong', 'cabbage', 'spinach', 'chili', 'ginger'].includes(lower)) {
            categories['Vegetables & Mushrooms'].push(ing);
        } else if (['rice', 'pasta', 'bread', 'noodles', 'potatoes'].includes(lower)) {
            categories['Grains & Carbs'].push(ing);
        } else if (['cheese', 'butter', 'milk', 'cream', 'oil'].includes(lower)) {
            categories['Dairy & Fats'].push(ing);
        } else {
            categories['Seasonings & Herbs'].push(ing);
        }
    });

    const filtered: Record<string, string[]> = {};
    Object.entries(categories).forEach(([key, val]) => {
        if (val.length > 0) {
            filtered[key] = val;
        }
    });

    return filtered;
}

export function determineRequestClassification(text: string): string {
    const lower = text.toLowerCase();
    
    if (lower.match(/recipe|make|prep|cook|bake|fry|how\s+to|prepare|create|stew|dish/)) {
        return 'Recipe Request';
    }
    if (lower.match(/substitute|replace|alternative|instead\s+of|nutrition|carb|healthy|diet|allergy|allergic|gluten|vegan|calories/)) {
        return 'Dietary & Substitutions';
    }
    if (lower.match(/how\s+long|temp|whisk|pan|boil|storage|keep|expire|fridge|kitchen|tip|advice/)) {
        return 'Kitchen Tips & Advice';
    }
    if (lower.match(/hi|hello|hey|greetings|how\s+are\s+you|who\s+are\s+you|introduce|nino/)) {
        return 'Conversational Turn';
    }
    return 'General Assistance';
}

export function determineDishTypeClassification(text: string): string {
    const lower = text.toLowerCase();

    if (lower.match(/stir-fry|sauté|sizzling|fry|wok|scramble/)) {
        return 'Stir-Fry & Sauté';
    }
    if (lower.match(/soup|stew|sinigang|nilaga|tinola|liquid|broth|ramen|baba|curry|sauce/)) {
        return 'Soup, Sauce & Stew';
    }
    if (lower.match(/bake|roast|cake|cookie|bread|pastry|oven|casserole/)) {
        return 'Bake & Oven-Roast';
    }
    if (lower.match(/salad|fresh|raw|wrap/)) {
        return 'Salad & Cold Prep';
    }
    if (lower.match(/dessert|sweet|chocolate|pudding|ice cream/)) {
        return 'Dessert & Confectionery';
    }
    if (lower.match(/snack|appetizer|sandwich|chips|merienda|finger/)) {
        return 'Snack & Appetizer';
    }
    if (lower.match(/adobo|kare-kare|lechon|steak|burger|chicken|beef|pork|fish|shrimp/)) {
        return 'Protein Mains';
    }
    return 'Anytime Culinary Dish';
}

export function runNlpPipeline(text: string): NlpAnalysis {
    const start = performance.now();
    const tokenResult = tokenize(text);
    const sentResult = analyzeSentiment(text);
    const kwResult = extractKeywords(text);
    const classResult = classifyText(text, kwResult);

    const ingredientCategories = classifyIngredients(kwResult.ingredients);
    const requestCategory = determineRequestClassification(text);
    const dishType = determineDishTypeClassification(text);

    return {
        tokens: tokenResult.tokens,
        tokenCount: tokenResult.count,
        contentWords: tokenResult.contentWords,
        sentiment: sentResult.sentiment,
        sentimentScore: sentResult.score,
        ingredients: kwResult.ingredients,
        cuisine: kwResult.cuisine,
        mealType: kwResult.mealType,
        dietary: kwResult.dietary,
        allKeywords: kwResult.allKeywords,
        skillLevel: classResult.skillLevel,
        queryType: classResult.queryType,
        ingredientCategories,
        requestCategory,
        dishType,
        processingMs: Math.round(performance.now() - start)
    };
}
