import { processOnboardingMessage } from '../services/onboardingAIService.js';

const onboardingChat = async (req, res) => {
  try {
    
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { message, draft, language } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        message: 'Invalid request: "message" must be a non-empty string',
      });
    }

    if (draft && typeof draft !== 'object') {
      return res.status(400).json({
        message: 'Invalid request: "draft" must be an object',
      });
    }

    const result = await processOnboardingMessage({
      message: message.trim(),
      draft: draft || {},
      language: language || 'en',
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('[OnboardingController] Error:', error);
    return res.status(500).json({
      message: 'Server error during onboarding',
    });
  }
};

export { onboardingChat };