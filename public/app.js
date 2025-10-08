// WordPress Plugin Generator - Frontend Logic
// Handles file tree display, code preview, syntax highlighting, and playground integration

const WORKER_URL = window.location.origin + '/';

// DOM Elements
const form = document.getElementById('generator-form');
const promptInput = document.getElementById('prompt-input');
const statusMessage = document.getElementById('status-message');
const generateButton = document.getElementById('generate-button');
const loadingOverlay = document.getElementById('loading-overlay');
const fileExplorer = document.getElementById('file-explorer');
const codePreview = document.getElementById('code-preview');
const currentFileName = document.getElementById('current-file-name');
const pluginInfo = document.getElementById('plugin-info');
const pluginNameDisplay = document.getElementById('plugin-name-display');
const downloadLink = document.getElementById('download-link');
const playgroundLink = document.getElementById('playground-link');
const copyFileBtn = document.getElementById('copy-file-btn');
const copyAllBtn = document.getElementById('copy-all-btn');
const expandAllBtn = document.getElementById('expand-all-btn');
const collapseAllBtn = document.getElementById('collapse-all-btn');

// State
let currentPlugin = null;
let currentFileContent = null;

// Initialize
if (form) {
    form.addEventListener('submit', handleGenerate);
}

if (copyFileBtn) {
    copyFileBtn.addEventListener('click', copyCurrentFile);
}

if (copyAllBtn) {
    copyAllBtn.addEventListener('click', copyAllCode);
}

if (expandAllBtn) {
    expandAllBtn.addEventListener('click', () => toggleAllFolders(true));
}

if (collapseAllBtn) {
    collapseAllBtn.addEventListener('click', () => toggleAllFolders(false));
}

// Main generation handler
async function handleGenerate(event) {
    event.preventDefault();
    
    const prompt = promptInput.value.trim();
    if (!prompt) {
        showStatus('error', 'Please describe your plugin');
        return;
    }

    // Show loading state
    showLoading(true);
    showStatus('loading', 'Generating your WordPress plugin...');
    generateButton.disabled = true;
    pluginInfo.style.display = 'none';
    
    // Clear previous results
    fileExplorer.innerHTML = '<div class="empty-state"><div class="spinner-small"></div><p>Generating...</p></div>';
    codePreview.innerHTML = '<div class="empty-state"><div class="spinner-small"></div><p>Please wait...</p></div>';

    try {
        const response = await fetch(WORKER_URL + 'api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt }),
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            throw new Error(data.error || data.message || `API returned status: ${response.status}`);
        }

        // Store plugin data
        currentPlugin = data;
        
        // Update UI
        showStatus('success', '✅ Plugin generated successfully!');
        displayPluginInfo(data);
        displayFileTree(data.files, data.pluginSlug);
        
        // Auto-select main PHP file
        const mainFile = data.files.find(f => f.path.endsWith('.php') && !f.path.includes('/'));
        if (mainFile) {
            displayFileContent(mainFile);
        }

    } catch (error) {
        showStatus('error', `❌ Generation Failed: ${error.message}`);
        fileExplorer.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><p>Generation failed. Please try again.</p></div>';
        codePreview.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><p>No code to display</p></div>';
    } finally {
        showLoading(false);
        generateButton.disabled = false;
    }
}

// Display plugin information
function displayPluginInfo(data) {
    pluginNameDisplay.textContent = data.pluginName || 'Generated Plugin';
    downloadLink.href = data.downloadUrl;
    downloadLink.download = `${data.pluginSlug}.zip`;
    playgroundLink.href = data.playgroundUrl;
    pluginInfo.style.display = 'block';
}

// Display file tree
function displayFileTree(files, pluginSlug) {
    // Build directory structure
    const tree = buildFileTree(files, pluginSlug);
    
    // Render tree
    const treeHtml = renderFileTree(tree);
    fileExplorer.innerHTML = treeHtml;
    
    // Add click handlers
    const fileItems = fileExplorer.querySelectorAll('.file-item');
    fileItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const filePath = item.dataset.path;
            const file = files.find(f => f.path === filePath);
            if (file) {
                // Remove active class from all items
                fileItems.forEach(i => i.classList.remove('active'));
                // Add active class to clicked item
                item.classList.add('active');
                displayFileContent(file);
            }
        });
    });
    
    // Add folder toggle handlers
    const folderHeaders = fileExplorer.querySelectorAll('.folder-header');
    folderHeaders.forEach(header => {
        header.addEventListener('click', (e) => {
            e.stopPropagation();
            const folderItem = header.parentElement;
            folderItem.classList.toggle('collapsed');
        });
    });
}

// Build hierarchical file tree
function buildFileTree(files, pluginSlug) {
    const root = {
        name: pluginSlug,
        type: 'folder',
        children: {}
    };
    
    files.forEach(file => {
        const parts = file.path.split('/');
        let current = root.children;
        
        parts.forEach((part, index) => {
            if (index === parts.length - 1) {
                // It's a file
                current[part] = {
                    name: part,
                    type: 'file',
                    path: file.path,
                    fileType: file.type
                };
            } else {
                // It's a folder
                if (!current[part]) {
                    current[part] = {
                        name: part,
                        type: 'folder',
                        children: {}
                    };
                }
                current = current[part].children;
            }
        });
    });
    
    return root;
}

// Render file tree HTML
function renderFileTree(node, level = 0) {
    if (node.type === 'file') {
        const icon = getFileIcon(node.fileType);
        return `<div class="file-item" data-path="${node.path}" style="padding-left: ${level * 16}px;">
            <span class="file-icon">${icon}</span>
            <span class="file-name">${node.name}</span>
        </div>`;
    }
    
    // Folder
    const folderIcon = '📁';
    const children = Object.values(node.children)
        .sort((a, b) => {
            // Folders first, then files
            if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
            return a.name.localeCompare(b.name);
        })
        .map(child => renderFileTree(child, level + 1))
        .join('');
    
    if (level === 0) {
        // Root folder
        return `<div class="folder-item">
            <div class="folder-header" style="padding-left: ${level * 16}px;">
                <span class="folder-toggle">▼</span>
                <span class="folder-icon">${folderIcon}</span>
                <span class="folder-name">${node.name}/</span>
            </div>
            <div class="folder-children">${children}</div>
        </div>`;
    }
    
    return `<div class="folder-item">
        <div class="folder-header" style="padding-left: ${level * 16}px;">
            <span class="folder-toggle">▼</span>
            <span class="folder-icon">${folderIcon}</span>
            <span class="folder-name">${node.name}/</span>
        </div>
        <div class="folder-children">${children}</div>
    </div>`;
}

// Get file icon based on type
function getFileIcon(type) {
    const icons = {
        'php': '🐘',
        'css': '🎨',
        'js': '📜',
        'txt': '📄',
        'md': '📝',
        'json': '⚙️'
    };
    return icons[type] || '📄';
}

// Display file content with syntax highlighting
function displayFileContent(file) {
    currentFileContent = file.content;
    currentFileName.textContent = file.path;
    copyFileBtn.style.display = 'block';
    
    // Detect language for syntax highlighting
    const language = getLanguageFromType(file.type);
    
    if (file.type === 'txt' || file.type === 'md') {
        // Plain text display
        codePreview.innerHTML = `<pre><code>${escapeHtml(file.content)}</code></pre>`;
    } else {
        // Syntax highlighted code
        const highlightedCode = hljs.highlight(file.content, { language }).value;
        codePreview.innerHTML = `<pre><code class="hljs language-${language}">${highlightedCode}</code></pre>`;
    }
}

// Get language for highlight.js
function getLanguageFromType(type) {
    const languageMap = {
        'php': 'php',
        'js': 'javascript',
        'css': 'css',
        'json': 'json',
        'md': 'markdown',
        'txt': 'plaintext'
    };
    return languageMap[type] || 'plaintext';
}

// Copy current file content to clipboard
async function copyCurrentFile() {
    if (!currentFileContent) return;
    
    try {
        await navigator.clipboard.writeText(currentFileContent);
        showTemporaryTooltip(copyFileBtn, 'Copied!');
    } catch (err) {
        showTemporaryTooltip(copyFileBtn, 'Failed to copy');
    }
}

// Copy all plugin code to clipboard
async function copyAllCode() {
    if (!currentPlugin || !currentPlugin.files) return;
    
    const allCode = currentPlugin.files
        .map(file => `// ========================================\n// File: ${file.path}\n// ========================================\n\n${file.content}\n\n`)
        .join('\n');
    
    try {
        await navigator.clipboard.writeText(allCode);
        showTemporaryTooltip(copyAllBtn, 'All code copied!');
    } catch (err) {
        showTemporaryTooltip(copyAllBtn, 'Failed to copy');
    }
}

// Toggle all folders
function toggleAllFolders(expand) {
    const folderItems = fileExplorer.querySelectorAll('.folder-item');
    folderItems.forEach(folder => {
        if (expand) {
            folder.classList.remove('collapsed');
        } else {
            folder.classList.add('collapsed');
        }
    });
}

// Show status message
function showStatus(type, message) {
    const iconMap = {
        'loading': '⏳',
        'success': '✅',
        'error': '❌',
        'info': '💡'
    };
    
    const statusIcon = statusMessage.querySelector('.status-icon');
    const statusText = statusMessage.querySelector('.status-text');
    
    statusIcon.textContent = iconMap[type] || '💡';
    statusText.textContent = message;
    statusMessage.className = `status-message ${type}`;
}

// Show/hide loading overlay
function showLoading(show) {
    loadingOverlay.style.display = show ? 'flex' : 'none';
}

// Show temporary tooltip
function showTemporaryTooltip(element, message) {
    const originalText = element.textContent;
    element.textContent = message;
    element.style.opacity = '0.7';
    
    setTimeout(() => {
        element.textContent = originalText;
        element.style.opacity = '1';
    }, 2000);
}

// Escape HTML for safe display
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
