const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const pdfParse = require('pdf-parse');
const xlsx = require('xlsx');

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');

/**
 * Main handler for format conversion
 */
async function convertFile(args, context) {
    const { file_id, target_format, options = {} } = args;
    const userId = context.userId || 'anonymous';

    // Resolve input path
    const inputPath = await resolveFilePath(file_id, userId);
    const inputExt = path.extname(inputPath).toLowerCase();
    const fileName = path.basename(inputPath, inputExt);
    const outputFileName = `${fileName}_converted_${Date.now()}.${target_format}`;
    const outputPath = path.join(path.dirname(inputPath), outputFileName);

    try {
        let result;

        // Conversion logic
        if (inputExt === '.pdf' && target_format === 'docx') {
            result = await convertPdfToDocx(inputPath, outputPath);
        } else if (inputExt === '.csv' && (target_format === 'xlsx' || target_format === 'xls')) {
            result = await convertCsvToExcel(inputPath, outputPath);
        } else if ((inputExt === '.xlsx' || inputExt === '.xls') && target_format === 'csv') {
            result = await convertExcelToCsv(inputPath, outputPath);
        } else if (target_format === 'txt' || target_format === 'text') {
            result = await convertToText(inputPath, outputPath);
        } else {
            // Fallback for unknown conversions - try using Python if available
            result = await convertWithPython(inputPath, outputPath, target_format);
        }

        return {
            result: {
                message: `Successfully converted ${inputExt} to ${target_format}`,
                output_file_id: outputFileName,
                output_path: `/uploads/${userId}/${outputFileName}`,
                details: result
            }
        };
    } catch (error) {
        console.error('Conversion error:', error);
        throw new Error(`Failed to convert file: ${error.message}`);
    }
}

/**
 * Convert PDF to DOCX using Python's pdf2docx
 */
async function convertPdfToDocx(inputPath, outputPath) {
    const script = `
from pdf2docx import Converter
import sys

try:
    cv = Converter("${inputPath}")
    cv.convert("${outputPath}", start=0, end=None)
    cv.close()
    print("Success")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
`;
    return await runPythonScript(script);
}

/**
 * Convert CSV to Excel
 */
async function convertCsvToExcel(inputPath, outputPath) {
    const workbook = xlsx.readFile(inputPath);
    xlsx.writeFile(workbook, outputPath);
    return "Excel file created";
}

/**
 * Convert Excel to CSV
 */
async function convertExcelToCsv(inputPath, outputPath) {
    const workbook = xlsx.readFile(inputPath);
    const sheetName = workbook.SheetNames[0];
    const csv = xlsx.utils.sheet_to_csv(workbook.Sheets[sheetName]);
    await fs.writeFile(outputPath, csv);
    return "CSV file created";
}

/**
 * Extract text from any supported file
 */
async function convertToText(inputPath, outputPath) {
    const ext = path.extname(inputPath).toLowerCase();
    let text = "";

    if (ext === '.pdf') {
        const buffer = await fs.readFile(inputPath);
        const data = await pdfParse(buffer);
        text = data.text;
    } else {
        text = await fs.readFile(inputPath, 'utf8');
    }

    await fs.writeFile(outputPath, text);
    return "Text extracted";
}

/**
 * Generic Python-based conversion runner
 */
async function runPythonScript(script) {
    return new Promise((resolve, reject) => {
        const py = spawn('python3', ['-c', script]);
        let stdout = '';
        let stderr = '';

        py.stdout.on('data', (data) => stdout += data.toString());
        py.stderr.on('data', (data) => stderr += data.toString());

        py.on('close', (code) => {
            if (code === 0) resolve(stdout.trim());
            else reject(new Error(stderr || stdout || `Process exited with code ${code}`));
        });
    });
}

/**
 * Internal helper to resolve file path
 */
async function resolveFilePath(fileId, userId) {
    const userDir = path.join(UPLOADS_DIR, userId);
    const filePath = path.join(userDir, fileId);

    try {
        await fs.access(filePath);
        return filePath;
    } catch (e) {
        // Try root dir if not in user dir
        const rootPath = path.join(UPLOADS_DIR, fileId);
        await fs.access(rootPath);
        return rootPath;
    }
}

module.exports = {
    convertFile
};
