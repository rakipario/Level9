/**
 * File Upload Route
 * 
 * Handles file uploads with:
 * - 10MB limit
 * - Multiple file support
 * - User-specific storage
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../utils/auth');

const router = express.Router();

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB for regular files
const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB for audio files

// Allowed file types
const ALLOWED_TYPES = {
    documents: ['.csv', '.xlsx', '.xls', '.json', '.txt', '.md', '.pdf', '.zip'],
    images: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff', '.ico'],
    audio: ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm', '.ogg', '.flac']
};

// Ensure uploads directory exists
fs.mkdir(UPLOADS_DIR, { recursive: true }).catch(() => { });

// Configure multer
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const userId = req.user?.id || 'anonymous';
        const userDir = path.join(UPLOADS_DIR, userId);
        await fs.mkdir(userDir, { recursive: true }).catch(() => { });
        cb(null, userDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = `${uuidv4()}${ext}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allAllowed = [...ALLOWED_TYPES.documents, ...ALLOWED_TYPES.images, ...ALLOWED_TYPES.audio];

    if (allAllowed.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`File type not allowed: ${ext}. Allowed: documents, images, audio files`), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_AUDIO_SIZE // Use higher limit, we'll check per-file
    }
});

/**
 * Upload single file
 */
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const ext = path.extname(req.file.originalname).toLowerCase();
        const isAudio = ALLOWED_TYPES.audio.includes(ext);
        const maxSize = isAudio ? MAX_AUDIO_SIZE : MAX_FILE_SIZE;

        if (req.file.size > maxSize) {
            // Delete the uploaded file
            await fs.unlink(req.file.path).catch(() => { });
            return res.status(400).json({
                error: `File too large. Maximum size: 20MB`
            });
        }

        res.json({
            success: true,
            file: {
                id: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
                type: ext.slice(1),
                isAudio,
                path: req.file.path
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Upload multiple files
 */
router.post('/upload-multiple', authenticateToken, upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const results = [];
        const errors = [];

        for (const file of req.files) {
            const ext = path.extname(file.originalname).toLowerCase();
            const isAudio = ALLOWED_TYPES.audio.includes(ext);
            const maxSize = isAudio ? MAX_AUDIO_SIZE : MAX_FILE_SIZE;

            if (file.size > maxSize) {
                await fs.unlink(file.path).catch(() => { });
                errors.push({
                    name: file.originalname,
                    error: `File too large (max ${isAudio ? '25MB' : '20MB'})`
                });
            } else {
                results.push({
                    id: file.filename,
                    originalName: file.originalname,
                    size: file.size,
                    type: ext.slice(1),
                    isAudio
                });
            }
        }

        res.json({
            success: true,
            uploaded: results.length,
            files: results,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * List user's files
 */
router.get('/files', authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id || 'anonymous';
        const userDir = path.join(UPLOADS_DIR, userId);

        try {
            const files = await fs.readdir(userDir);
            const fileInfos = await Promise.all(
                files.map(async (filename) => {
                    const filePath = path.join(userDir, filename);
                    const stats = await fs.stat(filePath);
                    const ext = path.extname(filename).toLowerCase();

                    return {
                        id: filename,
                        name: filename,
                        size: stats.size,
                        type: ext.slice(1),
                        isAudio: ALLOWED_TYPES.audio.includes(ext),
                        created: stats.birthtime
                    };
                })
            );

            res.json({ files: fileInfos });
        } catch {
            res.json({ files: [] });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Delete a file
 */
router.delete('/files/:fileId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id || 'anonymous';
        const filePath = path.join(UPLOADS_DIR, userId, req.params.fileId);

        await fs.unlink(filePath);
        res.json({ success: true });
    } catch (error) {
        res.status(404).json({ error: 'File not found' });
    }
});

/**
 * Transcribe audio file
 */
router.post('/transcribe/:fileId', authenticateToken, async (req, res) => {
    try {
        const { fileId } = req.params;
        const { language } = req.body;

        const speechTool = require('../tools/speech');

        const result = await speechTool.transcribe(
            { file_id: fileId, language },
            { userId: req.user?.id }
        );

        res.json(result);
    } catch (error) {
        console.error('Transcription error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get supported file types
 */
router.get('/supported-types', (req, res) => {
    res.json({
        documents: ALLOWED_TYPES.documents,
        images: ALLOWED_TYPES.images,
        audio: ALLOWED_TYPES.audio,
        limits: {
            documents: '20MB',
            images: '20MB',
            audio: '25MB'
        }
    });
});

module.exports = router;
