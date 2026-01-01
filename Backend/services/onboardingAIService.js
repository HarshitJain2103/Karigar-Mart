import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY1,
});

const AI_TIMEOUT_MS = 30000;

const ALLOWED_THEME_PRESETS = ['modern', 'classic', 'minimalist', 'rustic'];

const REQUIRED_FIELDS = [
  'storeName',
  'address.city',
  'address.state',
  'about',
];

const getMissingFields = (draft) => {
  const missing = [];

  if (!draft.storeName) missing.push('storeName');
  if (!draft.address?.city) missing.push('address.city');
  if (!draft.address?.state) missing.push('address.state');
  if (!draft.about) missing.push('about');

  return missing;
};

const inferNextStep = (draft) => {
  if (!draft.storeName) return 'STORE_NAME';
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
  message,
  draft = {},
  language = 'en',
}) => {
  const nextStep = inferNextStep(draft);
  const missingFields = getMissingFields(draft);

  const prompt = `
You are an onboarding assistant helping an artisan set up their online store.

Rules:
- Ask ONLY ONE question at a time
- Keep the SAME language as the user (${language})
- Do NOT ask about images or products
- Do NOT invent values
- Theme preset must be one of: ${ALLOWED_THEME_PRESETS.join(', ')}
- Return ONLY valid JSON (no markdown)

Current step: ${nextStep}
Missing required fields: ${missingFields.join(', ')}

Current draft:
${JSON.stringify(draft, null, 2)}

User message:
"${message}"

Return JSON in this exact format:
{
  "response": "string",
  "updates": { },
  "nextStep": "string"
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
    const updatedDraft = { ...draft, ...sanitizedUpdates };

    const stillMissing = getMissingFields(updatedDraft);
    const isProfileComplete = stillMissing.length === 0;

    return {
      response: parsed.response,
      updates: sanitizedUpdates,
      nextStep: parsed.nextStep || inferNextStep(updatedDraft),
      missingRequiredFields: stillMissing,
      isProfileComplete,
      requiresManualActions: isProfileComplete
        ? ['UPLOAD_HERO_IMAGE', 'ADD_PRODUCT']
        : [],
    };
  } catch (error) {
    console.error('[OnboardingAI] Failed:', error.message);
    return {
      response:
        'Sorry, I had trouble understanding that. Could you please try again?',
      updates: {},
      nextStep,
      missingRequiredFields: missingFields,
      isProfileComplete: false,
      requiresManualActions: [],
    };
  }
};