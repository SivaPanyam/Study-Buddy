import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY?.trim();
const MODEL_NAME = "gemini-2.5-flash";

if (!API_KEY) {
    console.warn("VITE_GEMINI_API_KEY is not set in environment variables.");
}

let genAI = null;

const getClient = () => {
    if (!API_KEY) {
        throw new Error("Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your environment variables.");
    }

    if (!genAI) {
        genAI = new GoogleGenerativeAI(API_KEY);
    }

    return genAI;
};

const getModel = () => getClient().getGenerativeModel({ model: MODEL_NAME });

/**
 * Helper to call Gemini with exponential backoff on 429
 */
const callWithRetry = async (fn, maxRetries = 3, initialDelay = 1000) => {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            const errorStr = error.toString();
            const isQuotaError = errorStr.includes("429") || errorStr.includes("QUOTA_EXCEEDED");

            if (isQuotaError && i < maxRetries - 1) {
                const delay = initialDelay * Math.pow(2, i);
                console.warn(`Gemini: Quota hit. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw error;
        }
    }
    throw lastError;
};

const extractRetrySeconds = (message = "") => {
    const retryInMatch = message.match(/retry in\s+([\d.]+)s/i);
    if (retryInMatch?.[1]) return Math.ceil(Number(retryInMatch[1]));

    const retryDelayMatch = message.match(/"retryDelay":"(\d+)s"/i);
    if (retryDelayMatch?.[1]) return Number(retryDelayMatch[1]);

    return null;
};

const normalizeGeminiError = (error) => {
    const message = error?.message || error?.toString?.() || "Unknown Gemini API error.";
    const lower = message.toLowerCase();

    if (message.includes("429") || lower.includes("quota")) {
        const retrySeconds = extractRetrySeconds(message);
        if (retrySeconds) {
            return `Gemini API quota reached. Please retry in about ${retrySeconds}s, or check API billing/quota settings.`;
        }
        return "Gemini API quota reached. Please retry shortly, or check API billing/quota settings.";
    }

    if (lower.includes("api key")) {
        return "Gemini API key is missing or invalid. Set VITE_GEMINI_API_KEY in .env and restart the app.";
    }

    if (lower.includes("safety")) {
        return "Content was blocked by Gemini safety filters. Try rephrasing the request.";
    }

    return message;
};

/**
 * Generates text content from a given prompt and optional image parts.
 */
export const generateContent = async (prompt, imageParts = []) => {
    try {
        console.log("Gemini: Generating content...");

        const model = getModel();
        const result = await callWithRetry(() => model.generateContent([prompt, ...imageParts]));
        const response = await result.response;
        const text = response.text();
        return text;
    } catch (error) {
        handleGeminiError(error, "generateContent");
        throw new Error(normalizeGeminiError(error));
    }
};

/**
 * Generates valid JSON content from a given prompt and optional image parts.
 */
export const generateJSON = async (prompt, imageParts = []) => {
    try {
        console.log("Gemini: Generating JSON...");

        const jsonModel = getClient().getGenerativeModel({
            model: MODEL_NAME,
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.2
            }
        });

        const result = await callWithRetry(() => jsonModel.generateContent([prompt, ...imageParts]));
        const response = await result.response;
        const text = response.text();

        const cleanedText = cleanJSONString(text);

        try {
            return JSON.parse(cleanedText);
        } catch {
            console.error("JSON Parse Error. Cleaned text was:", cleanedText);
            // Attempt a fallback regex match if simple parsing fails
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error("The AI response was not in a valid format. Please try again.");
        }
    } catch (error) {
        handleGeminiError(error, "generateJSON");
        throw new Error(normalizeGeminiError(error));
    }
};

/**
 * Common error handler for Gemini
 */
const handleGeminiError = (error, source) => {
    const errorMsg = error.message || error.toString();
    console.error(`Gemini API Error (${source}):`, error);
    return errorMsg;
};

/**
 * Helper to clean Markdown code blocks from JSON string
 */
const cleanJSONString = (text) => {
    return text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
};
