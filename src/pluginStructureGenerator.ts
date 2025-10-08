// Plugin Structure Generator - Creates complete WordPress plugin with best practices

export interface PluginFile {
  path: string;
  content: string;
  type: 'php' | 'css' | 'js' | 'txt' | 'md' | 'json';
}

export interface PluginStructure {
  pluginSlug: string;
  pluginName: string;
  files: PluginFile[];
}

/**
 * Generates a complete WordPress plugin structure with all necessary files
 */
export async function generatePluginStructure(
  mainPhpCode: string, 
  userPrompt: string,
  geminiApiKey: string
): Promise<PluginStructure> {
  
  // Extract plugin metadata from the generated PHP code
  const pluginName = extractPluginName(mainPhpCode) || 'Custom WordPress Plugin';
  const pluginSlug = pluginName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const version = extractVersion(mainPhpCode) || '1.0.0';
  const description = extractDescription(mainPhpCode) || 'A custom WordPress plugin';
  const author = extractAuthor(mainPhpCode) || 'Plugin Author';
  
  const files: PluginFile[] = [];
  
  // 1. Main Plugin PHP File
  files.push({
    path: `${pluginSlug}.php`,
    content: mainPhpCode,
    type: 'php'
  });
  
  // 2. README.txt (WordPress.org standard)
  files.push({
    path: 'readme.txt',
    content: generateReadmeTxt(pluginName, pluginSlug, description, version, author),
    type: 'txt'
  });
  
  // 3. Uninstall.php (cleanup script)
  files.push({
    path: 'uninstall.php',
    content: generateUninstallPhp(pluginSlug),
    type: 'php'
  });
  
  // 4. LICENSE.txt
  files.push({
    path: 'LICENSE.txt',
    content: generateLicense(author),
    type: 'txt'
  });
  
  // 5. Admin CSS (if admin interface detected)
  if (mainPhpCode.includes('add_menu_page') || mainPhpCode.includes('add_submenu_page')) {
    files.push({
      path: 'admin/css/admin-style.css',
      content: generateAdminCss(pluginSlug),
      type: 'css'
    });
    
    files.push({
      path: 'admin/js/admin-script.js',
      content: generateAdminJs(pluginSlug),
      type: 'js'
    });
  }
  
  // 6. Frontend Assets (if shortcode or frontend functionality detected)
  if (mainPhpCode.includes('add_shortcode') || mainPhpCode.includes('wp_enqueue_style')) {
    files.push({
      path: 'assets/css/frontend-style.css',
      content: generateFrontendCss(pluginSlug),
      type: 'css'
    });
    
    files.push({
      path: 'assets/js/frontend-script.js',
      content: generateFrontendJs(pluginSlug),
      type: 'js'
    });
  }
  
  // 7. README.md (GitHub/Developer documentation)
  files.push({
    path: 'README.md',
    content: generateReadmeMd(pluginName, description, mainPhpCode),
    type: 'md'
  });
  
  // 8. .gitignore
  files.push({
    path: '.gitignore',
    content: generateGitignore(),
    type: 'txt'
  });
  
  // 9. index.php files (security - prevent directory listing)
  const directories = ['admin', 'admin/css', 'admin/js', 'assets', 'assets/css', 'assets/js', 'includes'];
  directories.forEach(dir => {
    files.push({
      path: `${dir}/index.php`,
      content: '<?php\n// Silence is golden.\n',
      type: 'php'
    });
  });
  
  return {
    pluginSlug,
    pluginName,
    files
  };
}

// Helper functions to extract metadata from generated PHP code
function extractPluginName(code: string): string | null {
  const match = code.match(/\* Plugin Name:\s*(.+)/i);
  return match ? match[1].trim() : null;
}

function extractVersion(code: string): string | null {
  const match = code.match(/\* Version:\s*(.+)/i);
  return match ? match[1].trim() : null;
}

function extractDescription(code: string): string | null {
  const match = code.match(/\* Description:\s*(.+)/i);
  return match ? match[1].trim() : null;
}

function extractAuthor(code: string): string | null {
  const match = code.match(/\* Author:\s*(.+)/i);
  return match ? match[1].trim() : null;
}

// Generate readme.txt (WordPress.org standard)
function generateReadmeTxt(
  pluginName: string, 
  pluginSlug: string, 
  description: string, 
  version: string, 
  author: string
): string {
  return `=== ${pluginName} ===
Contributors: ${author.toLowerCase().replace(/\s+/g, '')}
Tags: wordpress, plugin, custom
Requires at least: 5.0
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: ${version}
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

${description}

== Description ==

${description}

This plugin was generated using AI to provide custom WordPress functionality.

== Installation ==

1. Upload the plugin files to the \`/wp-content/plugins/${pluginSlug}\` directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the 'Plugins' screen in WordPress
3. Configure the plugin settings (if applicable) through the WordPress admin menu

== Frequently Asked Questions ==

= How do I use this plugin? =

After activation, refer to the plugin's admin page or check the README.md file for detailed usage instructions.

= Where can I report bugs? =

Please report any bugs or issues through the WordPress support forums.

== Changelog ==

= ${version} =
* Initial release

== Upgrade Notice ==

= ${version} =
Initial release.
`;
}

// Generate uninstall.php
function generateUninstallPhp(pluginSlug: string): string {
  const prefix = pluginSlug.replace(/-/g, '_');
  
  return `<?php
/**
 * Uninstall Script
 * 
 * This file runs when the plugin is deleted via WordPress admin.
 * It cleans up all plugin data from the database.
 */

// Exit if accessed directly or not uninstalling
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

// Remove plugin options
delete_option('${prefix}_settings');
delete_option('${prefix}_version');

// For multisite installations
if (is_multisite()) {
    global $wpdb;
    $blog_ids = $wpdb->get_col("SELECT blog_id FROM {$wpdb->blogs}");
    
    foreach ($blog_ids as $blog_id) {
        switch_to_blog($blog_id);
        delete_option('${prefix}_settings');
        delete_option('${prefix}_version');
        restore_current_blog();
    }
}

// Remove any custom database tables if created
// global $wpdb;
// $table_name = $wpdb->prefix . '${prefix}_table';
// $wpdb->query("DROP TABLE IF EXISTS {$table_name}");

// Clear any cached data
wp_cache_flush();
`;
}

// Generate LICENSE.txt
function generateLicense(author: string): string {
  const year = new Date().getFullYear();
  
  return `GNU GENERAL PUBLIC LICENSE
Version 2, June 1991

Copyright (C) ${year} ${author}

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License along
with this program; if not, write to the Free Software Foundation, Inc.,
51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
`;
}

// Generate Admin CSS
function generateAdminCss(pluginSlug: string): string {
  const prefix = pluginSlug.replace(/-/g, '_');
  
  return `/**
 * Admin Stylesheet
 * Styles for the WordPress admin interface
 */

.${prefix}-admin-wrapper {
    max-width: 1200px;
    margin: 20px 0;
}

.${prefix}-admin-header {
    background: #fff;
    border-left: 4px solid #2271b1;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 1px 1px rgba(0,0,0,.04);
}

.${prefix}-admin-header h1 {
    margin: 0 0 10px 0;
    font-size: 23px;
    font-weight: 400;
    line-height: 1.3;
}

.${prefix}-admin-section {
    background: #fff;
    border: 1px solid #ccd0d4;
    padding: 20px;
    margin-bottom: 20px;
}

.${prefix}-form-table {
    width: 100%;
}

.${prefix}-form-table th {
    width: 200px;
    padding: 15px 10px 15px 0;
    text-align: left;
    font-weight: 600;
}

.${prefix}-form-table td {
    padding: 15px 0;
}

.${prefix}-button-primary {
    background: #2271b1;
    border-color: #2271b1;
    color: #fff;
    text-decoration: none;
    padding: 8px 12px;
    border-radius: 3px;
    cursor: pointer;
}

.${prefix}-button-primary:hover {
    background: #135e96;
    border-color: #135e96;
}

.${prefix}-notice {
    padding: 12px;
    margin: 15px 0;
    background: #fff;
    border-left: 4px solid;
}

.${prefix}-notice.success {
    border-left-color: #00a32a;
}

.${prefix}-notice.error {
    border-left-color: #d63638;
}

.${prefix}-notice.warning {
    border-left-color: #dba617;
}
`;
}

// Generate Admin JS
function generateAdminJs(pluginSlug: string): string {
  const prefix = pluginSlug.replace(/-/g, '_');
  
  return `/**
 * Admin JavaScript
 * Handles admin interface interactions
 */

(function($) {
    'use strict';
    
    $(document).ready(function() {
        
        // Admin form handling
        $('.${prefix}-admin-form').on('submit', function(e) {
            // Form validation can be added here
            console.log('${pluginSlug}: Admin form submitted');
        });
        
        // Settings save confirmation
        $('.${prefix}-save-settings').on('click', function() {
            // Show loading state
            $(this).prop('disabled', true).text('Saving...');
        });
        
        // Tab navigation (if using tabs)
        $('.${prefix}-tab-link').on('click', function(e) {
            e.preventDefault();
            
            var tabId = $(this).data('tab');
            
            // Hide all tabs
            $('.${prefix}-tab-content').hide();
            $('.${prefix}-tab-link').removeClass('active');
            
            // Show selected tab
            $('#' + tabId).show();
            $(this).addClass('active');
        });
        
        // Color picker (if using WordPress color picker)
        if ($.fn.wpColorPicker) {
            $('.${prefix}-color-picker').wpColorPicker();
        }
        
    });
    
})(jQuery);
`;
}

// Generate Frontend CSS
function generateFrontendCss(pluginSlug: string): string {
  const prefix = pluginSlug.replace(/-/g, '_');
  
  return `/**
 * Frontend Stylesheet
 * Styles for the public-facing site
 */

.${prefix}-container {
    max-width: 100%;
    margin: 20px 0;
    padding: 0;
}

.${prefix}-wrapper {
    background: #ffffff;
    border: 1px solid #e1e1e1;
    border-radius: 4px;
    padding: 20px;
    margin-bottom: 20px;
}

.${prefix}-title {
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 15px 0;
    color: #333;
}

.${prefix}-content {
    line-height: 1.6;
    color: #555;
}

.${prefix}-button {
    display: inline-block;
    background: #0073aa;
    color: #fff;
    padding: 10px 20px;
    text-decoration: none;
    border-radius: 4px;
    transition: background 0.3s ease;
}

.${prefix}-button:hover {
    background: #005177;
    color: #fff;
}

.${prefix}-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin: 20px 0;
}

.${prefix}-card {
    background: #f9f9f9;
    border: 1px solid #e1e1e1;
    border-radius: 4px;
    padding: 15px;
}

/* Responsive Design */
@media (max-width: 768px) {
    .${prefix}-grid {
        grid-template-columns: 1fr;
    }
    
    .${prefix}-wrapper {
        padding: 15px;
    }
}
`;
}

// Generate Frontend JS
function generateFrontendJs(pluginSlug: string): string {
  const prefix = pluginSlug.replace(/-/g, '_');
  
  return `/**
 * Frontend JavaScript
 * Handles public-facing functionality
 */

(function($) {
    'use strict';
    
    $(document).ready(function() {
        
        // Initialize plugin functionality
        init${prefix.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}();
        
    });
    
    function init${prefix.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}() {
        
        // Example: Handle button clicks
        $('.${prefix}-button').on('click', function(e) {
            e.preventDefault();
            console.log('${pluginSlug}: Button clicked');
            
            // Add your custom functionality here
        });
        
        // Example: AJAX request
        $('.${prefix}-ajax-trigger').on('click', function(e) {
            e.preventDefault();
            
            $.ajax({
                url: ajax_object.ajax_url, // WordPress AJAX URL
                type: 'POST',
                data: {
                    action: '${prefix}_ajax_action',
                    nonce: ajax_object.nonce
                },
                success: function(response) {
                    console.log('AJAX Success:', response);
                },
                error: function(error) {
                    console.error('AJAX Error:', error);
                }
            });
        });
        
    }
    
})(jQuery);
`;
}

// Generate README.md
function generateReadmeMd(pluginName: string, description: string, phpCode: string): string {
  const hasShortcode = phpCode.includes('add_shortcode');
  const hasAdminMenu = phpCode.includes('add_menu_page') || phpCode.includes('add_submenu_page');
  
  let shortcodeInfo = '';
  if (hasShortcode) {
    const shortcodeMatch = phpCode.match(/add_shortcode\s*\(\s*['"]([^'"]+)['"]/);
    const shortcodeName = shortcodeMatch ? shortcodeMatch[1] : 'custom_shortcode';
    shortcodeInfo = `\n## Shortcodes\n\nThis plugin provides the following shortcode:\n\n\`\`\`\n[${shortcodeName}]\n\`\`\`\n\nUse this shortcode in any post, page, or widget to display the plugin functionality.\n`;
  }
  
  let adminInfo = '';
  if (hasAdminMenu) {
    adminInfo = `\n## Admin Interface\n\nAfter activation, you can access the plugin settings through the WordPress admin menu.\n`;
  }
  
  return `# ${pluginName}

${description}

## Description

This WordPress plugin was generated using AI to provide custom functionality tailored to your specific needs.

## Installation

1. Download the plugin ZIP file
2. Go to WordPress Admin → Plugins → Add New
3. Click "Upload Plugin" and select the ZIP file
4. Click "Install Now" and then "Activate"

## Usage
${shortcodeInfo}${adminInfo}

## Requirements

- WordPress 5.0 or higher
- PHP 7.4 or higher

## Features

- Built with WordPress best practices
- Secure coding standards (sanitization, escaping, nonces)
- Clean, well-documented code
- Follows WordPress Coding Standards

## Support

For issues or questions, please refer to the plugin documentation or contact the plugin author.

## License

This plugin is licensed under the GPL v2 or later.

## Credits

Generated with AI-powered WordPress Plugin Generator
`;
}

// Generate .gitignore
function generateGitignore(): string {
  return `# WordPress
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.sublime-project
*.sublime-workspace

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Dependencies
/node_modules/
/vendor/

# Environment
.env
.env.local

# Build
/build/
/dist/
`;
}

