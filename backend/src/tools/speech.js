/**
 * Speech-to-Text Tool
 * 
 * Uses OpenAI Whisper API for transcription
 * Supports 90+ languages with auto-detection
 * 
 * Required: OpenAI API key (same as for chat)
 */

const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const { createReadStream } = require('fs');

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Supported audio formats by Whisper
const SUPPORTED_FORMATS = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm', '.ogg', '.flac'];
const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB (Whisper API limit)

/**
 * Transcribe audio file to text
 */
async function transcribe(args, context) {
    const { file_id, language } = args;

    // Resolve file path
    const userDir = path.join(UPLOADS_DIR, context.userId || 'anonymous');
    let filePath = path.join(userDir, file_id);

    // Try alternate paths if not found
    if (!fs.existsSync(filePath)) {
        filePath = path.join(UPLOADS_DIR, file_id);
    }
    if (!fs.existsSync(filePath) && path.isAbsolute(file_id)) {
        filePath = file_id;
    }

    if (!fs.existsSync(filePath)) {
        throw new Error(`Audio file not found: ${file_id}`);
    }

    // Validate format
    const ext = path.extname(filePath).toLowerCase();
    if (!SUPPORTED_FORMATS.includes(ext)) {
        throw new Error(`Unsupported audio format: ${ext}. Supported: ${SUPPORTED_FORMATS.join(', ')}`);
    }

    // Check file size
    const stats = fs.statSync(filePath);
    if (stats.size > MAX_AUDIO_SIZE) {
        throw new Error(`Audio file too large. Maximum size is 25MB.`);
    }

    // Initialize OpenAI
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });

    try {
        // Use Whisper API for transcription
        const transcriptionOptions = {
            file: createReadStream(filePath),
            model: 'whisper-1',
            response_format: 'verbose_json'
        };

        // Add language hint if provided
        if (language) {
            transcriptionOptions.language = language;
        }

        console.log(`Transcribing audio: ${file_id}...`);
        const transcription = await openai.audio.transcriptions.create(transcriptionOptions);

        return {
            result: {
                text: transcription.text,
                language: transcription.language || 'auto-detected',
                duration: transcription.duration,
                segments: transcription.segments?.map(s => ({
                    start: s.start,
                    end: s.end,
                    text: s.text
                })),
                words: transcription.words?.length || null,
                confidence: 'high',
                model: 'whisper-1'
            }
        };
    } catch (error) {
        console.error('Transcription error:', error);
        throw new Error(`Transcription failed: ${error.message}`);
    }
}

/**
 * Get supported languages
 */
function getSupportedLanguages() {
    // Whisper supports 90+ languages
    return {
        languages: [
            'af', 'ar', 'hy', 'az', 'be', 'bs', 'bg', 'ca', 'zh', 'hr',
            'cs', 'da', 'nl', 'en', 'et', 'fi', 'fr', 'gl', 'de', 'el',
            'he', 'hi', 'hu', 'is', 'id', 'it', 'ja', 'kn', 'kk', 'ko',
            'lv', 'lt', 'mk', 'ms', 'mr', 'mi', 'ne', 'no', 'fa', 'pl',
            'pt', 'ro', 'ru', 'sr', 'sk', 'sl', 'es', 'sw', 'sv', 'tl',
            'ta', 'th', 'tr', 'uk', 'ur', 'vi', 'cy'
        ],
        note: 'Auto-detection works for most languages. Specify language code for better accuracy.',
        supportedFormats: SUPPORTED_FORMATS,
        maxFileSize: '25MB'
    };
}

module.exports = {
    transcribe,
    getSupportedLanguages,
    SUPPORTED_FORMATS,
    MAX_AUDIO_SIZE
};
