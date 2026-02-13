/**
 * Vision Tool
 * 
 * Uses OpenAI GPT-4o Vision to analyze images and extract information.
 */

const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');

async function analyzeImage(args, context) {
    const { file_id, prompt = "Describe this image in detail. Extract any text you see. If there are charts or tables, describe the data." } = args;
    const userId = context.userId || 'anonymous';

    // Resolve file path
    const filePath = path.join(UPLOADS_DIR, userId, file_id);

    try {
        await fs.access(filePath);
    } catch (e) {
        throw new Error(`File not found: ${file_id}`);
    }

    // Read file and convert to base64
    const imageBuffer = await fs.readFile(filePath);
    const base64Image = imageBuffer.toString('base64');
    const extension = path.extname(filePath).slice(1) || 'png';
    const mimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:${mimeType};base64,${base64Image}`
                            }
                        }
                    ]
                }
            ],
            max_tokens: 1000
        });

        return {
            result: {
                analysis: response.choices[0].message.content,
                model: "gpt-4o-vision",
                fileId: file_id
            }
        };
    } catch (error) {
        console.error('Vision API error:', error);
        throw new Error(`Vision analysis failed: ${error.message}`);
    }
}

module.exports = {
    analyzeImage
};
