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
        // Vertex AI configuration
        this.PROJECT_ID = process.env.PROJECT_ID;
        this.LOCATION_ID = process.env.LOCATION_ID || 'us-central1';
        this.MODEL_ID = process.env.MODEL_ID || 'veo-3.1-fast-generate-preview';
        this.API_ENDPOINT = process.env.API_ENDPOINT || 'us-central1-aiplatform.googleapis.com';

        // ✅ GCS configuration (temporary storage only)
        this.GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'karigar-mart';

        // Decrypt and load service account
        const serviceAccount = this.decryptServiceAccount();

        // Initialize Google Auth
        this.auth = new GoogleAuth({
            credentials: serviceAccount,
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });
    }

    /**
     * Decrypt service account file
     */
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

    /**
     * Get access token for Vertex AI
     */
    async getAccessToken() {
        const client = await this.auth.getClient();
        const tokenResponse = await client.getAccessToken();
        if (!tokenResponse?.token) throw new Error("Failed to get access token");
        return tokenResponse.token;
    }

    /**
     * Generate AI video prompt
     */
    async generateVideoPrompt(product) {
        const { title, description, categoryId } = product;
        const categoryName = categoryId?.name || 'artisan craft';

        const promptRequest = `Create a compelling 8-second video prompt for ${title}, a ${categoryName}.

Description: ${description}

Create a cinematic prompt that:
- Shows the product in lifestyle context
- Includes camera movement (dolly/pan/zoom)
- Specifies lighting (golden hour/natural)
- Emphasizes handcrafted quality
- Perfect for Instagram Reels/TikTok
- Under 150 words

Return ONLY the prompt text.`;

        try {
            const { GoogleGenAI } = await import("@google/genai");
            const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: promptRequest
            });

            return response.text || this.getDefaultPrompt(product);
        } catch (error) {
            console.error("[AI] Prompt generation failed:", error.message);
            return this.getDefaultPrompt(product);
        }
    }

    /**
     * Fallback prompt
     */
    getDefaultPrompt(product) {
        const { title, categoryId } = product;
        const categoryName = categoryId?.name || 'artisan product';

        return `A cinematic close-up of ${title}, a handcrafted ${categoryName}. Camera slowly orbits, revealing intricate details. Warm natural lighting, shallow depth of field, artisan workshop background. Golden hour ambiance, professional and aspirational.`;
    }

    /**
     * Generate AI description
     */
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

    /**
     * Generate marketing video with Veo via Vertex AI
     * Flow: Image → Veo → GCS (temp) → Cloudinary (permanent) → Delete from GCS
     */
    async generateMarketingVideo(product, imageUrl, artisanId, options = {}) {
        let gcsUri = null; // Track for cleanup

        try {
            console.log(`[VEO] Starting video for product: ${product._id || product.title}`);

            const {
                aspectRatio = "9:16",
                resolution = "720p",
                durationSeconds = 8
            } = options;

            // ✅ IMPORTANT: Use different folder than your friend's project
            // Friend uses: video-outputs/
            // You use: localartist-temp/
            const timestamp = Date.now();
            const GCS_OUTPUT_URI = `gs://${this.GCS_BUCKET_NAME}/localartist-temp/${timestamp}/`;

            console.log(`[VEO] Temp GCS path: ${GCS_OUTPUT_URI}`);

            // Step 1: Fetch image from Cloudinary
            console.log(`[VEO] Fetching image from Cloudinary...`);
            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) throw new Error(`Image fetch failed: ${imageResponse.statusText}`);

            const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
            const mimeType = contentType.startsWith('image/') ? contentType : 'image/jpeg';

            const imageBuffer = await imageResponse.arrayBuffer();
            const imageBytes = Buffer.from(imageBuffer).toString('base64');

            // Step 2: Generate AI prompt
            const videoPrompt = await this.generateVideoPrompt(product);
            console.log(`[VEO] Generated prompt (${videoPrompt.length} chars)`);

            // Step 3: Get access token
            const token = await this.getAccessToken();

            // Step 4: Call Vertex AI with ALL required parameters
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
                    generateAudio: true,           // ✅ From working project
                    personGeneration: "allow_all", // ✅ From working project
                    resolution: resolution,
                    enhancePrompt: true,           // ✅ From working project
                    sampleCount: 1,
                    addWatermark: true,            // ✅ From working project
                    storageUri: GCS_OUTPUT_URI     // ✅ CRITICAL: Tell Vertex where to save
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
            console.log(`[VEO] Video generation started (this takes ~60-90 seconds)...`);

            // Step 5: Poll for completion (wait for video to be generated)
            gcsUri = await this.pollForResult(operationName, token);
            const gcsUrl = gcsUri.replace('gs://', 'https://storage.googleapis.com/');

            console.log(`[VEO] ✅ Video generated in GCS (temporary)`);

            // Step 6: Upload to YOUR Cloudinary (permanent storage)
            console.log(`[VEO] Uploading to YOUR Cloudinary...`);
            const cloudinaryUrl = await this.uploadVideoToCloudinary(
                gcsUrl,
                product.title,
                product._id,
                artisanId
            );

            console.log(`[VEO] ✅ Video stored in YOUR Cloudinary!`);

            // Step 7: Clean up GCS (delete temporary file)
            try {
                await this.deleteFromGCS(gcsUri, token);
                console.log(`[VEO] ✅ Cleaned up temp file from GCS`);
            } catch (cleanupError) {
                console.warn(`[VEO] ⚠️ GCS cleanup failed (non-critical):`, cleanupError.message);
            }

            console.log(`[VEO] ✅✅✅ COMPLETE: ${cloudinaryUrl}`);

            return {
                success: true,
                videoUrl: cloudinaryUrl,  // ✅ This goes to MongoDB
                prompt: videoPrompt
            };

        } catch (error) {
            console.error(`[VEO] ❌ Error:`, error);

            // Try to cleanup even if failed
            if (gcsUri) {
                try {
                    const token = await this.getAccessToken();
                    await this.deleteFromGCS(gcsUri, token);
                    console.log(`[VEO] Cleaned up failed video from GCS`);
                } catch (cleanupError) {
                    // Ignore cleanup errors
                }
            }

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Poll for video generation completion
     */
    async pollForResult(operationName, token) {
        let attempts = 0;
        const maxAttempts = 60; // 10 minutes max

        while (attempts < maxAttempts) {
            console.log(`[VEO] Polling... ${attempts + 1}/${maxAttempts} (checking every 10s)`);

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
                if (gcsUri) {
                    return gcsUri;
                }

                if (data.error) {
                    throw new Error(`Video generation failed: ${data.error.message}`);
                }

                throw new Error("Operation completed, but no video URI found in response");
            }

            await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
            attempts++;
        }

        throw new Error("Video generation timeout (exceeded 10 minutes)");
    }

    /**
     * Upload video from GCS to YOUR Cloudinary (permanent storage)
     */
    async uploadVideoToCloudinary(gcsUrl, productTitle, productId, artisanId) {
        try {
            const folder = `karigar-mart/artisans/${artisanId}/product-videos`;
            const publicId = `${productTitle.replace(/\s+/g, '-').toLowerCase()}-${productId}`;

            // ✅ Cloudinary uploads directly from GCS public URL
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

    /**
     * Delete temporary video from GCS after uploading to Cloudinary
     */
    async deleteFromGCS(gcsUri, token) {
        try {
            // Parse GCS URI: gs://bucket-name/path/to/file.mp4
            const match = gcsUri.match(/gs:\/\/([^\/]+)\/(.*)/);
            if (!match) {
                throw new Error(`Invalid GCS URI: ${gcsUri}`);
            }

            const [, bucket, objectPath] = match;

            // Use Google Cloud Storage API to delete
            const deleteUrl = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodeURIComponent(objectPath)}`;

            const response = await fetch(deleteUrl, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (!response.ok) {
                throw new Error(`GCS delete failed: ${response.status} ${response.statusText}`);
            }

            return true;
        } catch (error) {
            throw new Error(`GCS cleanup failed: ${error.message}`);
        }
    }
}

export default new VeoVideoService();