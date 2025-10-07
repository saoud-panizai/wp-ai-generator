// D:\cloudflare_worker_app\wp-ai-generator\public\app.js

// IMPORTANT: After your first deployment, Cloudflare will assign a live URL.
// REPLACE THIS PLACEHOLDER URL with your actual live URL (e.g., https://wp-ai-generator.saoud-panizai.workers.dev)
const WORKER_URL = 'https://wp-ai-generator.saoud-panizai.workers.dev/'; 

const form = document.getElementById('generator-form');
const promptInput = document.getElementById('prompt-input');
const statusMessage = document.getElementById('status-message');
const codeOutput = document.getElementById('code-output');
const downloadLink = document.getElementById('download-link');
const generateButton = document.getElementById('generate-button');

// Ensure the listener is attached to prevent the default GET request
if (form) {
    form.addEventListener('submit', handleGenerate);
}

async function handleGenerate(event) {
    event.preventDefault(); // <-- CRITICAL: Prevents default GET form submission
    
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
        // --- Core Fetch Request (MUST be POST) ---
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

        // Set the download link (will be the live Worker URL + /download/filename.zip)
        downloadLink.href = data.downloadUrl; 
        downloadLink.style.display = 'block';

    } catch (error) {
        // --- State: Error ---
        statusMessage.textContent = `❌ Generation Failed. Ensure Worker URL is correct and deployed. Error: ${error.message}`;
        statusMessage.className = 'status error';
        codeOutput.style.display = 'block';
        codeOutput.textContent = `Check live Worker logs for backend issues.`;
    } finally {
        generateButton.disabled = false;
    }
}