// D:\cloudflare_worker_app\wp-ai-generator\public\app.js

// IMPORTANT: The URL MUST BE YOUR DEPLOYED URL!
const WORKER_URL = '[https://wp-ai-generator.saoud-panizai.workers.dev](https://wp-ai-generator.saoud-panizai.workers.dev)'; 

const form = document.getElementById('generator-form');
const promptInput = document.getElementById('prompt-input');
const statusMessage = document.getElementById('status-message');
const codeOutput = document.getElementById('code-output');
const downloadLink = document.getElementById('download-link');
const generateButton = document.getElementById('generate-button');

if (form) {
    form.addEventListener('submit', handleGenerate);
}

async function handleGenerate(event) {
    event.preventDefault(); 
    
    const prompt = promptInput.value.trim();
    if (!prompt) return;

    // --- State: Loading ---
    statusMessage.textContent = 'Generating... Calling Workers AI...';
    statusMessage.className = 'status loading';
    generateButton.disabled = true;
    codeOutput.style.display = 'none';
    downloadLink.style.display = 'none';
    codeOutput.textContent = ''; 

    try {
        // --- Core Fetch Request (POST) ---
        const response = await fetch(WORKER_URL, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt }),
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            throw new Error(data.error || data.message || `API returned status: ${response.status}`);
        }

        // --- State: Success ---
        statusMessage.textContent = '✅ Plugin code generated successfully!';
        statusMessage.className = 'status success';
        
        codeOutput.textContent = data.code;
        codeOutput.style.display = 'block';

        // Set the download link using the URL provided by the worker
        downloadLink.href = WORKER_URL + data.downloadUrl; 
        downloadLink.style.display = 'block';

    } catch (error) {
        // --- State: Error ---
        statusMessage.textContent = `❌ Generation Failed. Error: ${error.message}`;
        statusMessage.className = 'status error';
        codeOutput.style.display = 'block';
        codeOutput.textContent = `Check live Worker logs for backend issues.`;
    } finally {
        generateButton.disabled = false;
    }
}