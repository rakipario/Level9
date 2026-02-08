/**
 * Enhanced File Processor Tool
 * 
 * Supports: CSV, Excel, PDF (with OCR), JSON, text, ZIP archives
 * File size limit: 10MB
 */

const xlsx = require('xlsx');
const csvParse = require('csv-parse/sync');
const fs = require('fs').promises;
const path = require('path');
const AdmZip = require('adm-zip');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

// Ensure uploads directory exists
fs.mkdir(UPLOADS_DIR, { recursive: true }).catch(() => { });

/**
 * Resolve file path from ID
 */
async function resolveFilePath(fileId, userId) {
    // Try user-specific directory first
    const userDir = path.join(UPLOADS_DIR, userId || 'anonymous');
    const userPath = path.join(userDir, fileId);

    try {
        await fs.access(userPath);
        return userPath;
    } catch { }

    // Try direct path (for absolute paths)
    if (path.isAbsolute(fileId)) {
        try {
            await fs.access(fileId);
            return fileId;
        } catch { }
    }

    // Try uploads root
    const rootPath = path.join(UPLOADS_DIR, fileId);
    try {
        await fs.access(rootPath);
        return rootPath;
    } catch { }

    throw new Error(`File not found: ${fileId}`);
}

/**
 * Read and parse a file
 */
async function readFile(args, context) {
    let { file_id, options = {} } = args;

    // If file_id looks like an original filename and we have context with files,
    // try to find the actual file_id (UUID) from the context
    if (file_id && context.files) {
        const fileFromContext = context.files.find(f =>
            f.originalName === file_id || f.originalName.includes(file_id) || file_id.includes(f.originalName)
        );
        if (fileFromContext) {
            file_id = fileFromContext.id;
        }
    }

    const filePath = await resolveFilePath(file_id, context.userId);
    const stats = await fs.stat(filePath);

    if (stats.size > MAX_FILE_SIZE) {
        throw new Error(`File exceeds maximum size of 10MB`);
    }

    const extension = path.extname(filePath).toLowerCase();

    switch (extension) {
        case '.csv':
            return await readCSV(filePath, options);
        case '.xlsx':
        case '.xls':
            return await readExcel(filePath, options);
        case '.json':
            return await readJSON(filePath);
        case '.txt':
        case '.md':
        case '.log':
            return await readText(filePath, options);
        case '.pdf':
            return await readPDF(filePath, options);
        case '.zip':
            return await readZip(filePath, options);
        default:
            // Try reading as text
            return await readText(filePath, options);
    }
}

/**
 * Read CSV file
 */
async function readCSV(filePath, options) {
    const content = await fs.readFile(filePath, 'utf8');
    const records = csvParse.parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
        ...options
    });

    const limitedRecords = options.limit_rows
        ? records.slice(0, options.limit_rows)
        : records;

    return {
        result: {
            type: 'csv',
            rowCount: records.length,
            columns: Object.keys(records[0] || {}),
            data: limitedRecords,
            preview: limitedRecords.slice(0, 5)
        }
    };
}

/**
 * Read Excel file
 */
async function readExcel(filePath, options) {
    const buffer = await fs.readFile(filePath);
    const workbook = xlsx.read(buffer, { type: 'buffer' });

    const sheetName = options.sheet || workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
        throw new Error(`Sheet not found: ${sheetName}. Available: ${workbook.SheetNames.join(', ')}`);
    }

    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    const headers = data[0] || [];
    const rows = data.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, i) => {
            obj[header] = row[i];
        });
        return obj;
    });

    const limitedRows = options.limit_rows
        ? rows.slice(0, options.limit_rows)
        : rows;

    return {
        result: {
            type: 'excel',
            sheets: workbook.SheetNames,
            currentSheet: sheetName,
            rowCount: rows.length,
            columns: headers,
            data: limitedRows,
            preview: limitedRows.slice(0, 5)
        }
    };
}

/**
 * Read JSON file
 */
async function readJSON(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(content);

    return {
        result: {
            type: 'json',
            data,
            isArray: Array.isArray(data),
            length: Array.isArray(data) ? data.length : Object.keys(data).length
        }
    };
}

/**
 * Read text file
 */
async function readText(filePath, options) {
    const encoding = options.encoding || 'utf8';
    const content = await fs.readFile(filePath, encoding);

    return {
        result: {
            type: 'text',
            content,
            lineCount: content.split('\n').length,
            charCount: content.length
        }
    };
}

/**
 * Read PDF file with OCR fallback for scanned documents
 */
async function readPDF(filePath, options) {
    const buffer = await fs.readFile(filePath);

    try {
        // First try standard PDF parsing
        const data = await pdfParse(buffer);
        const text = data.text.trim();

        // If text is very short or empty, it might be a scanned document
        if (text.length < 50 && !options.skip_ocr) {
            console.log('PDF appears to be scanned, attempting OCR...');
            return await readPDFWithOCR(filePath, options);
        }

        return {
            result: {
                type: 'pdf',
                pages: data.numpages,
                text: text,
                charCount: text.length,
                metadata: data.info || {},
                method: 'text_extraction'
            }
        };
    } catch (error) {
        // If PDF parsing fails, try OCR
        console.log('PDF parsing failed, attempting OCR...');
        return await readPDFWithOCR(filePath, options);
    }
}

/**
 * Read PDF using OCR (for scanned documents)
 */
async function readPDFWithOCR(filePath, options) {
    try {
        // Convert PDF pages to images and OCR
        // Note: This requires poppler-utils to be installed for pdf-to-image conversion
        // For now, we'll use a simpler approach with direct OCR on the PDF buffer

        const worker = await Tesseract.createWorker();
        await worker.loadLanguage('eng+fra+deu+spa+ita+por+nld+rus+ara+chi_sim+jpn+kor');
        await worker.initialize('eng');

        // Set detection to auto for multi-language support
        await worker.setParameters({
            tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        });

        const { data: { text } } = await worker.recognize(filePath);
        await worker.terminate();

        return {
            result: {
                type: 'pdf',
                text: text.trim(),
                charCount: text.length,
                method: 'ocr',
                note: 'Extracted using OCR - accuracy may vary'
            }
        };
    } catch (error) {
        throw new Error(`PDF OCR failed: ${error.message}`);
    }
}

/**
 * Read and extract ZIP archive
 */
async function readZip(filePath, options) {
    const zip = new AdmZip(filePath);
    const entries = zip.getEntries();

    const fileList = entries.map(entry => ({
        name: entry.entryName,
        size: entry.header.size,
        isDirectory: entry.isDirectory,
        compressed: entry.header.compressedSize
    }));

    // If extract requested, extract specific file
    if (options.extract_file) {
        const entry = entries.find(e => e.entryName === options.extract_file);
        if (!entry) {
            throw new Error(`File not found in archive: ${options.extract_file}`);
        }

        const content = entry.getData();
        const ext = path.extname(options.extract_file).toLowerCase();

        // Parse based on extension
        if (ext === '.csv') {
            const csvContent = content.toString('utf8');
            const records = csvParse.parse(csvContent, { columns: true, skip_empty_lines: true });
            return { result: { type: 'csv', data: records, fromZip: true } };
        } else if (ext === '.json') {
            return { result: { type: 'json', data: JSON.parse(content.toString('utf8')), fromZip: true } };
        } else {
            return { result: { type: 'text', content: content.toString('utf8'), fromZip: true } };
        }
    }

    // If extract_from_zip is true, extract all readable files
    if (options.extract_from_zip) {
        const extractedFiles = [];

        for (const entry of entries) {
            if (entry.isDirectory) continue;

            const ext = path.extname(entry.entryName).toLowerCase();
            if (['.csv', '.json', '.txt', '.md'].includes(ext)) {
                try {
                    const content = entry.getData().toString('utf8');
                    extractedFiles.push({
                        name: entry.entryName,
                        type: ext.slice(1),
                        preview: content.slice(0, 500)
                    });
                } catch { }
            }
        }

        return {
            result: {
                type: 'zip',
                totalFiles: entries.length,
                extractedFiles,
                files: fileList
            }
        };
    }

    return {
        result: {
            type: 'zip',
            totalFiles: entries.length,
            files: fileList,
            hint: 'Use extract_file option with a filename to extract specific file'
        }
    };
}

/**
 * List uploaded files for a user
 */
async function listFiles(args, context) {
    const userDir = path.join(UPLOADS_DIR, context.userId || 'anonymous');

    try {
        const files = await fs.readdir(userDir);
        const fileInfos = await Promise.all(
            files.map(async (file) => {
                const filePath = path.join(userDir, file);
                const stats = await fs.stat(filePath);
                return {
                    id: file,
                    name: file,
                    size: stats.size,
                    created: stats.birthtime,
                    type: path.extname(file).slice(1) || 'unknown'
                };
            })
        );

        return {
            result: {
                files: fileInfos,
                count: fileInfos.length,
                directory: userDir
            }
        };
    } catch {
        return { result: { files: [], count: 0 } };
    }
}

/**
 * Perform statistical analysis on data
 */
async function analyzeData(args, context) {
    const { data, analysis_type, columns } = args;

    if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Data must be a non-empty array');
    }

    const numericColumns = columns || Object.keys(data[0]).filter(key => {
        return typeof data[0][key] === 'number' || !isNaN(parseFloat(data[0][key]));
    });

    const analysis = {};

    // Summary statistics
    if (analysis_type === 'summary' || analysis_type === 'full') {
        analysis.summary = {};
        for (const col of numericColumns) {
            const values = data.map(row => parseFloat(row[col])).filter(v => !isNaN(v));
            if (values.length === 0) continue;

            analysis.summary[col] = {
                count: values.length,
                sum: values.reduce((a, b) => a + b, 0),
                mean: values.reduce((a, b) => a + b, 0) / values.length,
                min: Math.min(...values),
                max: Math.max(...values),
                std: calculateStd(values)
            };
        }
    }

    // Distribution
    if (analysis_type === 'distribution' || analysis_type === 'full') {
        analysis.distribution = {};
        for (const col of numericColumns) {
            const values = data.map(row => parseFloat(row[col])).filter(v => !isNaN(v));
            if (values.length === 0) continue;

            analysis.distribution[col] = {
                quartiles: calculateQuartiles(values),
                histogram: createHistogram(values, 10)
            };
        }
    }

    // Correlation
    if (analysis_type === 'correlation' || analysis_type === 'full') {
        if (numericColumns.length >= 2) {
            analysis.correlation = calculateCorrelationMatrix(data, numericColumns);
        }
    }

    // Trends
    if (analysis_type === 'trends' || analysis_type === 'full') {
        analysis.trends = {};
        for (const col of numericColumns) {
            const values = data.map(row => parseFloat(row[col])).filter(v => !isNaN(v));
            if (values.length < 2) continue;
            analysis.trends[col] = detectTrend(values);
        }
    }

    return {
        result: {
            type: 'analysis',
            rowCount: data.length,
            columnsAnalyzed: numericColumns,
            ...analysis
        }
    };
}

// Helper functions
function calculateStd(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}

function calculateQuartiles(values) {
    const sorted = [...values].sort((a, b) => a - b);
    return {
        q1: sorted[Math.floor(sorted.length * 0.25)],
        median: sorted[Math.floor(sorted.length * 0.5)],
        q3: sorted[Math.floor(sorted.length * 0.75)]
    };
}

function createHistogram(values, bins) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binWidth = (max - min) / bins || 1;

    const histogram = Array(bins).fill(0);
    for (const v of values) {
        const binIndex = Math.min(Math.floor((v - min) / binWidth), bins - 1);
        histogram[binIndex]++;
    }

    return histogram.map((count, i) => ({
        range: `${(min + i * binWidth).toFixed(2)} - ${(min + (i + 1) * binWidth).toFixed(2)}`,
        count
    }));
}

function calculateCorrelationMatrix(data, columns) {
    const matrix = {};
    for (const col1 of columns) {
        matrix[col1] = {};
        for (const col2 of columns) {
            const values1 = data.map(row => parseFloat(row[col1])).filter(v => !isNaN(v));
            const values2 = data.map(row => parseFloat(row[col2])).filter(v => !isNaN(v));
            matrix[col1][col2] = calculateCorrelation(values1, values2);
        }
    }
    return matrix;
}

function calculateCorrelation(x, y) {
    const n = Math.min(x.length, y.length);
    if (n === 0) return 0;

    const sumX = x.slice(0, n).reduce((a, b) => a + b, 0);
    const sumY = y.slice(0, n).reduce((a, b) => a + b, 0);
    const sumXY = x.slice(0, n).reduce((a, b, i) => a + b * y[i], 0);
    const sumX2 = x.slice(0, n).reduce((a, b) => a + b * b, 0);
    const sumY2 = y.slice(0, n).reduce((a, b) => a + b * b, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
}

function detectTrend(values) {
    if (values.length < 2) return { direction: 'insufficient_data' };

    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((a, b, i) => a + b * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const change = values[0] !== 0
        ? ((values[values.length - 1] - values[0]) / values[0]) * 100
        : 0;

    return {
        direction: slope > 0.01 ? 'increasing' : slope < -0.01 ? 'decreasing' : 'stable',
        slope: slope,
        intercept: intercept,
        percentChange: change.toFixed(2) + '%'
    };
}

module.exports = {
    readFile,
    analyzeData,
    listFiles,
    readCSV,
    readExcel,
    readJSON,
    readText,
    readPDF,
    readPDFWithOCR,
    readZip,
    MAX_FILE_SIZE
};
