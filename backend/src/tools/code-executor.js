/**
 * Code Executor Tool
 * 
 * Executes Python and JavaScript code in a sandboxed environment.
 * Used for data analysis, calculations, and generating visualizations.
 */

const { VM } = require('vm2');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

// Execution timeout in milliseconds
const EXECUTION_TIMEOUT = 30000;
const MAX_OUTPUT_SIZE = 100000; // 100KB max output

/**
 * Execute code in the appropriate sandbox
 */
async function execute(args, context) {
    const { code, language } = args;

    if (language === 'python') {
        return await executePython(code, context);
    } else if (language === 'javascript') {
        return await executeJavaScript(code, context);
    } else {
        throw new Error(`Unsupported language: ${language}`);
    }
}

/**
 * Execute Python code
 */
async function executePython(code, context) {
    const executionId = uuidv4();
    const tempDir = path.join(os.tmpdir(), 'relay-sandbox', executionId);
    const scriptPath = path.join(tempDir, 'script.py');

    try {
        // Create temp directory
        await fs.mkdir(tempDir, { recursive: true });

        // Wrap code with safety imports and output capture
        const wrappedCode = `
import sys
import json
import io

# Capture stdout
_output_buffer = io.StringIO()
_original_stdout = sys.stdout
sys.stdout = _output_buffer

# Common imports
try:
    import pandas as pd
    import numpy as np
except ImportError:
    pass

try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
except ImportError:
    pass

# User code
try:
${code.split('\n').map(line => '    ' + line).join('\n')}
except Exception as e:
    print(f"Error: {e}")

# Restore stdout and get output
sys.stdout = _original_stdout
_result = _output_buffer.getvalue()
print(_result)
`;

        await fs.writeFile(scriptPath, wrappedCode, 'utf8');

        // Execute Python
        const result = await new Promise((resolve, reject) => {
            let stdout = '';
            let stderr = '';

            const proc = spawn('python3', [scriptPath], {
                cwd: tempDir,
                timeout: EXECUTION_TIMEOUT,
                env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
            });

            proc.stdout.on('data', (data) => {
                stdout += data.toString();
                if (stdout.length > MAX_OUTPUT_SIZE) {
                    proc.kill();
                    reject(new Error('Output exceeded maximum size'));
                }
            });

            proc.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            proc.on('close', (code) => {
                if (code === 0) {
                    resolve({ output: stdout.trim(), stderr: stderr.trim() });
                } else {
                    reject(new Error(stderr || `Process exited with code ${code}`));
                }
            });

            proc.on('error', (err) => {
                reject(new Error(`Failed to execute Python: ${err.message}`));
            });

            // Timeout handling
            setTimeout(() => {
                proc.kill();
                reject(new Error('Execution timed out'));
            }, EXECUTION_TIMEOUT);
        });

        return {
            result: {
                output: result.output,
                language: 'python',
                executionTime: Date.now()
            }
        };
    } finally {
        // Cleanup
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        } catch (e) {
            // Ignore cleanup errors
        }
    }
}

/**
 * Execute JavaScript code using vm2
 */
async function executeJavaScript(code, context) {
    try {
        const vm = new VM({
            timeout: EXECUTION_TIMEOUT,
            sandbox: {
                console: {
                    log: (...args) => outputs.push(args.map(String).join(' ')),
                    error: (...args) => outputs.push('[ERROR] ' + args.map(String).join(' ')),
                    warn: (...args) => outputs.push('[WARN] ' + args.map(String).join(' '))
                },
                JSON,
                Math,
                Date,
                Array,
                Object,
                String,
                Number,
                Boolean,
                RegExp,
                Map,
                Set,
                // Add data analysis helpers
                sum: (arr) => arr.reduce((a, b) => a + b, 0),
                mean: (arr) => arr.reduce((a, b) => a + b, 0) / arr.length,
                median: (arr) => {
                    const sorted = [...arr].sort((a, b) => a - b);
                    const mid = Math.floor(sorted.length / 2);
                    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
                },
                min: (arr) => Math.min(...arr),
                max: (arr) => Math.max(...arr),
                std: (arr) => {
                    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
                    return Math.sqrt(arr.reduce((a, b) => a + (b - avg) ** 2, 0) / arr.length);
                }
            }
        });

        const outputs = [];

        // Inject outputs array
        vm.freeze(outputs, 'outputs');

        // Run code
        const result = vm.run(`
      const outputs = [];
      const console = {
        log: (...args) => outputs.push(args.map(String).join(' ')),
        error: (...args) => outputs.push('[ERROR] ' + args.map(String).join(' ')),
        warn: (...args) => outputs.push('[WARN] ' + args.map(String).join(' '))
      };
      
      ${code}
      
      outputs.join('\\n');
    `);

        return {
            result: {
                output: result || outputs.join('\n'),
                language: 'javascript',
                executionTime: Date.now()
            }
        };
    } catch (error) {
        throw new Error(`JavaScript execution error: ${error.message}`);
    }
}

/**
 * Validate code for dangerous operations
 */
function validateCode(code, language) {
    const dangerousPatterns = [
        /import\s+os/i,
        /import\s+subprocess/i,
        /import\s+sys/i,
        /exec\s*\(/i,
        /eval\s*\(/i,
        /__import__/i,
        /open\s*\([^)]*['"](\/|\.\.)/i,
        /require\s*\(\s*['"]child_process/i,
        /require\s*\(\s*['"]fs/i,
        /process\.exit/i,
        /process\.env/i
    ];

    for (const pattern of dangerousPatterns) {
        if (pattern.test(code)) {
            throw new Error('Code contains potentially dangerous operations');
        }
    }

    return true;
}

module.exports = {
    execute,
    executePython,
    executeJavaScript,
    validateCode
};
