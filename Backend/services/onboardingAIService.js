import { GoogleGenAI } from '@google/genai';
import AIUsage from '../models/aiUsage.model.js';

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY2,
});

const AI_TIMEOUT_MS = 30000;
const DAILY_AI_LIMIT = 12;

const ALLOWED_THEME_PRESETS = ['modern', 'classic', 'minimalist', 'rustic'];

const REQUIRED_FIELDS = [
  'storeName',
  'tagline',
  'address.city',
  'address.state',
  'about',
  'theme.preset',
  'seo.metaDescription',
  'seo.keywords',
];

const getMissingFields = (draft) => {
  const missing = [];

  if (!draft.storeName) missing.push('storeName');
  if (!draft.tagline) missing.push('tagline');
  if (!draft.address?.city) missing.push('address.city');
  if (!draft.address?.state) missing.push('address.state');
  if (!draft.about) missing.push('about');
  if (!draft.theme?.preset) missing.push('theme.preset');
  if (!draft.seo?.metaDescription) missing.push('seo.metaDescription');
  if (!draft.seo?.keywords?.length) missing.push('seo.keywords');

  return missing;
};

const inferNextStep = (draft) => {
  if (!draft.storeName) return 'STORE_NAME';
  if (!draft.tagline) return 'TAGLINE';
  if (!draft.address?.city || !draft.address?.state) return 'ADDRESS';
  if (!draft.about) return 'ABOUT';
  if (!draft.theme?.preset) return 'THEME';
  if (!draft.seo?.metaDescription || !draft.seo?.keywords?.length) return 'SEO';
  return 'COMPLETE';
};

const sanitizeUpdates = (updates = {}) => {
  const clean = {};

  if (typeof updates.storeName === 'string') {
    clean.storeName = updates.storeName.trim();
  }

  if (typeof updates.tagline === 'string') {
    clean.tagline = updates.tagline.trim();
  }

  if (updates.address) {
    clean.address = {};
    if (typeof updates.address.city === 'string') {
      clean.address.city = updates.address.city.trim();
    }
    if (typeof updates.address.state === 'string') {
      clean.address.state = updates.address.state.trim();
    }
  }

  if (typeof updates.about === 'string') {
    clean.about = updates.about.trim();
  }

  if (
    updates.theme?.preset &&
    ALLOWED_THEME_PRESETS.includes(updates.theme.preset)
  ) {
    clean.theme = { preset: updates.theme.preset };
  }

  if (updates.seo) {
    clean.seo = {};
    if (typeof updates.seo.metaDescription === 'string') {
      clean.seo.metaDescription = updates.seo.metaDescription.trim();
    }
    if (Array.isArray(updates.seo.keywords)) {
      clean.seo.keywords = updates.seo.keywords
        .filter((k) => typeof k === 'string')
        .map((k) => k.trim())
        .slice(0, 10);
    }
  }

  return clean;
};

export const processOnboardingMessage = async ({
  userId,
  message,
  draft = {},
  language = 'en',
}) => {
  const today = new Date().toISOString().slice(0, 10);

  const usage = await AIUsage.findOneAndUpdate(
    { userId, feature: 'ONBOARDING', date: today },
    { $inc: { count: 1 } },
    { new: true, upsert: true }
  );

  if (usage.count > DAILY_AI_LIMIT) {
    return {
      responseKey: "AI_LIMIT_REACHED",
      response: null,
      updates: {},
      nextStep: inferNextStep(draft),
      missingRequiredFields: getMissingFields(draft),
      isProfileComplete: false,
      requiresManualActions: [],
    };
  }

  const prompt = `
You are an onboarding assistant helping an artisan set up their online store.

Rules:
- Ask ONLY ONE question at a time
- Keep the SAME language as the user (${language})
- Do NOT ask about images or products
- Do NOT invent values
- Do NOT confuse the user's personal name with the store name
- Theme preset must be one of: ${ALLOWED_THEME_PRESETS.join(', ')}
- Return ONLY valid JSON (no markdown)

Required fields to collect in order:
1. storeName (the name of the online store)
2. tagline (a short slogan or tagline for the store)
3. address.city and address.state (location of the store)
4. about (description of the store or artisan)
5. theme.preset (one of: modern, classic, minimalist, rustic)
6. seo.metaDescription and seo.keywords (for SEO)

Current draft:
${JSON.stringify(draft, null, 2)}

User message:
"${message}"

Your task:
- Extract any relevant information from the user message and map it to the appropriate fields in "updates"
- If the user provides information for a field, include it in "updates"
- If no information is provided or it's unclear, leave "updates" empty
- In "response", provide a conversational reply: if you extracted info, acknowledge it and ask the next missing question; if not, ask the current missing question again
- Always ask only one question per response
- If all required fields are filled, say "Great! Your profile is complete. You can now upload a hero image and add products."

Examples:
- User: "My store is called Artisan Crafts"
  Response: "Great! Your store name is Artisan Crafts. Next, what's a short slogan or tagline for your store?"
  Updates: { "storeName": "Artisan Crafts" }

- User: "I'm John"
  Response: "Hello John! What would you like to name your store?"
  Updates: {}

- User: "Delhi, India"
  Response: "Thanks! Your store is in Delhi, India. Now, tell me about your store or yourself."
  Updates: { "address": { "city": "Delhi", "state": "India" } }

- User: "sarees for all"
  Response: "Thanks! Your meta description is 'sarees for all'. Now, what keywords describe your store? (e.g., sarees, traditional, Indian)"
  Updates: { "seo": { "metaDescription": "sarees for all" } }

Return JSON in this exact format:
{
  "response": "string",
  "updates": { }
}
`;

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('AI onboarding timed out')), AI_TIMEOUT_MS)
  );

  try {
    const aiPromise = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const result = await Promise.race([aiPromise, timeoutPromise]);
    const rawText = result.text?.trim();
    if (!rawText) throw new Error('Empty AI response');

    const jsonStart = rawText.indexOf('{');
    const jsonEnd = rawText.lastIndexOf('}');
    const parsed = JSON.parse(rawText.slice(jsonStart, jsonEnd + 1));

    const sanitizedUpdates = sanitizeUpdates(parsed.updates || {});

    const updatedDraft = {
      ...draft,
      ...sanitizedUpdates,
      address: {
        ...draft.address,
        ...sanitizedUpdates.address,
      },
    };

    const missingRequiredFields = getMissingFields(updatedDraft);
    const nextStep = inferNextStep(updatedDraft);
    const isProfileComplete = missingRequiredFields.length === 0;

    return {
      response: parsed.response,
      updates: sanitizedUpdates,
      nextStep,
      missingRequiredFields,
      isProfileComplete,
      requiresManualActions: isProfileComplete
        ? ['UPLOAD_HERO_IMAGE', 'ADD_PRODUCT']
        : [],
    };

  } catch (error) {
    console.error('[OnboardingAI] Failed:', error.message);

    const missingRequiredFields = getMissingFields(draft);
    const nextStep = inferNextStep(draft);

    return {
      responseKey: "AI_GENERIC_ERROR",
      response: null,
      updates: {},
      nextStep,
      missingRequiredFields,
      isProfileComplete: false,
      requiresManualActions: [],
    };
  }
};