import { GoogleAuth } from 'google-auth-library';
import cloudinary from "../config/cloudinary.js";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class VeoVideoService {
    constructor() {
        this.PROJECT_ID = process.env.PROJECT_ID;
        this.LOCATION_ID = process.env.LOCATION_ID || 'us-central1';
        this.MODEL_ID = process.env.MODEL_ID || 'veo-3.1-fast-generate-preview';
        this.API_ENDPOINT = process.env.API_ENDPOINT || 'us-central1-aiplatform.googleapis.com';
        this.GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'karigar-mart';
        this.ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
        this.ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';

        const serviceAccount = this.decryptServiceAccount();

        this.auth = new GoogleAuth({
            credentials: serviceAccount,
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });
    }

    decryptServiceAccount() {
        try {
            const encPath = path.join(process.cwd(), "service-account.json.enc");
            const password = process.env.ENCRYPT_PASSWORD;

            if (!password) {
                throw new Error("ENCRYPT_PASSWORD not set in .env");
            }

            const encryptedData = fs.readFileSync(encPath);
            const iv = encryptedData.slice(0, 16);
            const ciphertext = encryptedData.slice(16);

            const key = crypto.scryptSync(password, "salt", 32);
            const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
            const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

            return JSON.parse(decrypted.toString("utf-8"));
        } catch (error) {
            console.error("[VEO] Failed to decrypt service account:", error.message);
            throw new Error("Service account decryption failed. Check ENCRYPT_PASSWORD and file path.");
        }
    }

    async getAccessToken() {
        const client = await this.auth.getClient();
        const tokenResponse = await client.getAccessToken();
        if (!tokenResponse?.token) throw new Error("Failed to get access token");
        return tokenResponse.token;
    }

    async generateVideoPrompt(product, imageUrl) {
        console.log("Latest script testing 2!!!!!!!!!!");
        const { title, description, categoryId } = product;
        const categoryName = categoryId?.name || 'artisan craft';

        try {
            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) {
                throw new Error(`Failed to fetch image: ${imageResponse.status}`);
            }

            const buffer = await imageResponse.arrayBuffer();
            const base64Image = Buffer.from(buffer).toString("base64");
            if (!base64Image || base64Image.length === 0) {
                throw new Error("Image conversion to base64 failed - empty result");
            }

            console.log(`[AI] Base64 image length: ${base64Image.length} characters`);

            const finalPrompt = `
You are an expert creative director.

Analyze the product image and metadata to produce a cinematic 8-second marketing video prompt.

Product Title: ${title}
Category: ${categoryName}
Description: ${description}

Your task:
- Accurately describe the product based on the image
- Mention material, textures, finish, colors, branding
- Suggest perfect background setting (gym / home / table / nature / workspace / kitchen etc.)
- Define camera moves (orbit, slow pan, hero shot, dolly, macro reveal)
- Define lighting (soft studio, warm natural light, golden hour, reflective highlights)
- Add subtle dynamic motions (light movement, rotating shadows, small scene actions)
- Keep tone aspirational, premium, clean
- Must be suitable for Instagram Reel style
Limit to ~120–150 words.
Return ONLY the final prompt text.
        `;

            const { GoogleGenAI } = await import("@google/genai");
            const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [
                    {
                        inlineData: {  
                            mimeType: "image/jpeg",  
                            data: base64Image
                        }
                    },
                    { text: finalPrompt }  
                ]
            });

            const generatedText = response.text;
            console.log(`[AI] Generated prompt: ${generatedText.substring(0, 100)}...`);
            return generatedText;

        } catch (error) {
            console.error("[AI] Prompt generation failed:", error.message);
            console.error("[AI] Full error:", JSON.stringify(error, null, 2));
            return this.getDefaultPrompt(product);
        }
    }

    getDefaultPrompt(product) {
        const { title, categoryId } = product;
        const categoryName = categoryId?.name || 'artisan product';

        return `A cinematic close-up of ${title}, a handcrafted ${categoryName}. Camera slowly orbits, revealing intricate details. Warm natural lighting, shallow depth of field, artisan workshop background. Golden hour ambiance, professional and aspirational.`;
    }

    async generateProductDescription(productTitle, categoryName) {
        const prompt = `Write a 2-3 sentence product description for "${productTitle}" (${categoryName}). Highlight handcrafted quality, uniqueness, and craftsmanship. Warm tone.`;

        try {
            const { GoogleGenAI } = await import("@google/genai");
            const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt
            });

            return response.text || `Handcrafted ${productTitle} with traditional techniques.`;
        } catch (error) {
            console.error("[AI] Description generation failed:", error.message);
            return `Handcrafted ${productTitle} with traditional techniques.`;
        }
    }

    async generateAudioScript(product, imageUrl) {
        const { title, description, categoryId } = product;
        const categoryName = categoryId?.name || 'artisan craft';

        try {
            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) {
                throw new Error(`Failed to fetch image: ${imageResponse.status}`);
            }

            const buffer = await imageResponse.arrayBuffer();
            const base64Image = Buffer.from(buffer).toString("base64");

            // Verify base64 is not empty
            if (!base64Image || base64Image.length === 0) {
                throw new Error("Image conversion to base64 failed - empty result");
            }

            console.log(`[AI] Base64 image length: ${base64Image.length} characters`);

            const scriptPrompt = `
You are creating a short, high-converting 8-second voice-over script for a handmade product crafted by a local artisan in India.

Write a warm, simple, human script (20–22 words) that:
- focuses mainly on the product’s beauty and usefulness
- highlights the handmade detail in a subtle, natural way
- feels authentic, emotional, and inviting
- avoids corporate or fancy English
- avoids saying “made by a local artisan”
- creates a feeling of care, quality, and uniqueness
- gently encourages the listener to bring the product home

Tone:
- warm, human, simple English
- emotional but not dramatic
- aspirational but grounded

Product Info:
Title: ${title}
Category: ${categoryName}
Description: ${description}

Return ONLY the final script text, no quotes, no extra formatting.
`;

            const { GoogleGenAI } = await import("@google/genai");
            const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [
                    {
                        inlineData: {  
                            mimeType: "image/jpeg",
                            data: base64Image
                        }
                    },
                    { text: scriptPrompt }
                ]
            });

            const generatedScript = response.text.trim();
            console.log(`[AI] Generated script: ${generatedScript}`);
            return generatedScript;

        } catch (error) {
            console.error("[AI] Audio script generation failed:", error.message);
            console.error("[AI] Full error:", JSON.stringify(error, null, 2));
            return `Discover ${title}. Handcrafted with care, designed to inspire. Make it yours today.`;
        }
    }

    async generateAudioWithElevenLabs(scriptText, productId, timestamp) {
        if (!this.ELEVENLABS_API_KEY) {
            console.warn("[ELEVENLABS] API key not configured, skipping audio generation");
            return null;
        }

        try {
            console.log(`[ELEVENLABS] Generating audio for script: "${scriptText.substring(0, 50)}..."`);

            const response = await fetch(
                `https://api.elevenlabs.io/v1/text-to-speech/${this.ELEVENLABS_VOICE_ID}`,
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'audio/mpeg',
                        'Content-Type': 'application/json',
                        'xi-api-key': this.ELEVENLABS_API_KEY
                    },
                    body: JSON.stringify({
                        text: scriptText,
                        model_id: "eleven_turbo_v2_5",
                        voice_settings: {
                            stability: 0.5,
                            similarity_boost: 0.75,
                            style: 0.5,
                            use_speaker_boost: true
                        }
                    })
                }
            );

            if (response.status === 429) {
                throw new Error("ElevenLabs rate limit hit — upgrade plan or slow down requests");
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType !== 'audio/mpeg') {
                const errorMsg = await response.text();
                throw new Error(`ElevenLabs returned non-audio response: ${errorMsg}`);
            }

            const audioBuffer = await response.arrayBuffer();
            const tempDir = path.join(__dirname, '../temp');

            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const audioPath = path.join(tempDir, `audio-${productId}-${timestamp}.mp3`);
            fs.writeFileSync(audioPath, Buffer.from(audioBuffer));

            console.log(`[ELEVENLABS] ✅ Audio generated: ${audioPath}`);
            return audioPath;

        } catch (error) {
            console.error("[ELEVENLABS] Audio generation failed:", error.message);
            return null;
        }
    }

    async uploadAudioToCloudinary(audioPath, productTitle, productId, artisanId, timestamp) {
        try {
            const folder = `karigar-mart/artisans/${artisanId}/product-audio`;
            const publicId = `${productTitle.replace(/\s+/g, '-').toLowerCase()}-${productId}-${timestamp}`;

            const result = await cloudinary.uploader.upload(audioPath, {
                resource_type: "video",
                folder: folder,
                public_id: publicId,
                overwrite: false
            });

            if (fs.existsSync(audioPath)) {
                fs.unlinkSync(audioPath);
            }

            return result.secure_url;
        } catch (error) {
            console.error("[CLOUDINARY] Audio upload failed:", error.message);
            throw new Error(`Audio upload failed: ${error.message}`);
        }
    }

    extractPublicId(cloudinaryUrl) {
        try {
            const match = cloudinaryUrl.match(/\/upload\/(?:v\d+\/)?(.+?)\.\w+$/);

            if (!match) {
                console.error("[CLOUDINARY] Could not extract public ID from:", cloudinaryUrl);
                return null;
            }

            const publicId = match[1];
            console.log(`[CLOUDINARY] Extracted public ID (raw): ${publicId}`);
            return publicId;

        } catch (error) {
            console.error("[CLOUDINARY] Failed to extract public ID:", error);
            return null;
        }
    }

    formatPublicIdForOverlay(cloudinaryUrl) {
        try {
            const match = cloudinaryUrl.match(/\/upload\/(?:v\d+\/)?(.+?)\.\w+$/);

            if (!match) {
                console.error("[CLOUDINARY] Could not extract public ID from:", cloudinaryUrl);
                return null;
            }

            const publicId = match[1].replace(/\//g, ':');
            console.log(`[CLOUDINARY] Formatted public ID for overlay: ${publicId}`);
            return publicId;

        } catch (error) {
            console.error("[CLOUDINARY] Failed to format public ID:", error);
            return null;
        }
    }

    async generateMarketingVideo(product, imageUrl, artisanId, options = {}) {
        let gcsUri = null;
        let tempAudioPath = null;

        try {
            console.log(`[VEO] Starting video generation for: ${product._id || product.title}`);

            const {
                aspectRatio = "9:16",
                resolution = "720p",
                durationSeconds = 8,
                includeAudio = true
            } = options;

            const timestamp = Date.now();
            const GCS_OUTPUT_URI = `gs://${this.GCS_BUCKET_NAME}/localartist-temp/${timestamp}/`;

            // STEP 1: Generate audio
            let audioUrl = null;
            let audioScript = null;

            if (includeAudio) {
                console.log(`[AUDIO] Generating script...`);
                audioScript = await this.generateAudioScript(product, imageUrl);
                console.log(`[AUDIO] Script: "${audioScript}"`);

                tempAudioPath = await this.generateAudioWithElevenLabs(
                    audioScript,
                    product._id,
                    timestamp
                );

                if (tempAudioPath) {
                    audioUrl = await this.uploadAudioToCloudinary(
                        tempAudioPath,
                        product.title,
                        product._id,
                        artisanId,
                        timestamp
                    );
                    console.log(`[AUDIO] ✅ Uploaded to Cloudinary: ${audioUrl}`);

                    if (fs.existsSync(tempAudioPath)) {
                        fs.unlinkSync(tempAudioPath);
                    }
                }
            }

            // STEP 2: Generate video from Veo
            console.log(`[VEO] Fetching image from Cloudinary...`);
            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) throw new Error(`Image fetch failed: ${imageResponse.statusText}`);

            const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
            const mimeType = contentType.startsWith('image/') ? contentType : 'image/jpeg';

            const imageBuffer = await imageResponse.arrayBuffer();
            const imageBytes = Buffer.from(imageBuffer).toString('base64');

            const videoPrompt = await this.generateVideoPrompt(product, imageUrl);
            console.log(`[VEO] Generated prompt (${videoPrompt.length} chars)`);

            const token = await this.getAccessToken();
            console.log(`[VEO] Calling Vertex AI (${this.MODEL_ID})...`);

            const requestBody = {
                instances: [{
                    prompt: videoPrompt,
                    image: {
                        bytesBase64Encoded: imageBytes,
                        mimeType: mimeType
                    }
                }],
                parameters: {
                    aspectRatio: aspectRatio,
                    durationSeconds: parseInt(durationSeconds),
                    generateAudio: false,
                    personGeneration: "allow_all",
                    resolution: resolution,
                    enhancePrompt: true,
                    sampleCount: 1,
                    addWatermark: true,
                    storageUri: GCS_OUTPUT_URI
                }
            };

            const startResponse = await fetch(
                `https://${this.API_ENDPOINT}/v1/projects/${this.PROJECT_ID}/locations/${this.LOCATION_ID}/publishers/google/models/${this.MODEL_ID}:predictLongRunning`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                }
            );

            if (!startResponse.ok) {
                const errorData = await startResponse.json();
                throw new Error(`Vertex AI error: ${JSON.stringify(errorData)}`);
            }

            const startData = await startResponse.json();
            const operationName = startData.name;
            console.log(`[VEO] Video generation started (60-90 seconds)...`);

            // STEP 3: Poll for video completion
            gcsUri = await this.pollForResult(operationName, token);
            const gcsUrl = gcsUri.replace('gs://', 'https://storage.googleapis.com/');
            console.log(`[VEO] ✅ Video generated in GCS`);

            // STEP 4: Upload base video to Cloudinary
            console.log(`[VEO] Uploading video to Cloudinary...`);
            const cloudinaryVideoUrl = await this.uploadVideoToCloudinary(
                gcsUrl,
                product.title,
                product._id,
                artisanId,
                timestamp
            );
            console.log(`[VEO] ✅ Base video uploaded: ${cloudinaryVideoUrl}`);

            // STEP 5: Generate transformation URL with audio overlay
            let playbackUrl = cloudinaryVideoUrl;

            if (audioUrl && includeAudio) {
                console.log(`[VEO] Generating merged playback URL...`);

                const videoPublicId = this.extractPublicId(cloudinaryVideoUrl);
                const audioPublicIdForOverlay = this.formatPublicIdForOverlay(audioUrl);

                if (!videoPublicId || !audioPublicIdForOverlay) {
                    console.error("[VEO] Failed to extract public IDs, falling back to base video");
                } else {
                    playbackUrl = cloudinary.url(videoPublicId, {
                        resource_type: "video",
                        transformation: [
                            { audio_codec: "none" },
                            { overlay: `video:${audioPublicIdForOverlay}` },
                            { flags: "layer_apply" },
                            { audio_codec: "aac" },
                            { quality: "auto" },
                            { fetch_format: "mp4" }
                        ]
                    });

                    console.log(`[VEO] ✅ Transformation URL generated`);
                    console.log(`[VEO] Final playback URL: ${playbackUrl}`);
                }
            }


            // STEP 6: Clean up GCS
            try {
                await this.deleteFromGCS(gcsUri, token);
                console.log(`[VEO] ✅ Cleaned up GCS temp file`);
            } catch (cleanupError) {
                console.warn(`[VEO] ⚠️ GCS cleanup failed:`, cleanupError.message);
            }

            console.log(`[VEO] ✅✅✅ COMPLETE`);

            return {
                success: true,
                videoUrl: cloudinaryVideoUrl,
                videoUrlWithAudio: playbackUrl,
                audioUrl: audioUrl,
                audioScript: audioScript,
                videoPrompt: videoPrompt
            };

        } catch (error) {
            console.error(`[VEO] ❌ Error:`, error);

            if (gcsUri) {
                try {
                    const token = await this.getAccessToken();
                    await this.deleteFromGCS(gcsUri, token);
                } catch { }
            }

            if (tempAudioPath && fs.existsSync(tempAudioPath)) {
                fs.unlinkSync(tempAudioPath);
            }

            return {
                success: false,
                error: error.message
            };
        }
    }

    async pollForResult(operationName, token) {
        let attempts = 0;
        const maxAttempts = 60;

        while (attempts < maxAttempts) {
            console.log(`[VEO] Polling... ${attempts + 1}/${maxAttempts}`);

            const response = await fetch(
                `https://${this.API_ENDPOINT}/v1/projects/${this.PROJECT_ID}/locations/${this.LOCATION_ID}/publishers/google/models/${this.MODEL_ID}:fetchPredictOperation`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ operationName }),
                }
            );

            const data = await response.json();

            if (data.done) {
                const gcsUri = data.response?.videos?.[0]?.gcsUri;
                if (gcsUri) return gcsUri;

                if (data.error) {
                    throw new Error(`Video generation failed: ${data.error.message}`);
                }

                throw new Error("Operation completed, but no video URI found");
            }

            await new Promise((resolve) => setTimeout(resolve, 10000));
            attempts++;
        }

        throw new Error("Video generation timeout");
    }

    async uploadVideoToCloudinary(gcsUrl, productTitle, productId, artisanId, timestamp) {
        try {
            const folder = `karigar-mart/artisans/${artisanId}/product-videos`;
            const publicId = `${productTitle.replace(/\s+/g, '-').toLowerCase()}-${productId}-${timestamp}`;

            const result = await cloudinary.uploader.upload(gcsUrl, {
                resource_type: "video",
                folder: folder,
                public_id: publicId,
                overwrite: false,
                transformation: [
                    { quality: "auto" },
                    { fetch_format: "mp4" }
                ]
            });

            return result.secure_url;
        } catch (error) {
            console.error("[CLOUDINARY] Upload failed:", error.message);
            throw new Error(`Cloudinary upload failed: ${error.message}`);
        }
    }

    async deleteFromGCS(gcsUri, token) {
        try {
            const match = gcsUri.match(/gs:\/\/([^\/]+)\/(.*)/);
            if (!match) throw new Error(`Invalid GCS URI: ${gcsUri}`);

            const [, bucket, objectPath] = match;
            const deleteUrl = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodeURIComponent(objectPath)}`;

            const response = await fetch(deleteUrl, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error(`GCS delete failed: ${response.status}`);
            }

            return true;
        } catch (error) {
            throw new Error(`GCS cleanup failed: ${error.message}`);
        }
    }
}

export default new VeoVideoService();