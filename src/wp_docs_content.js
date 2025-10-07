// D:\cloudflare_worker_app\wp-ai-generator\src\wp_docs_content.js

export const WP_DOCS = [
    "WordPress Plugin Header: A plugin file must start with a comment block containing Plugin Name, Version, Author, and License. Example: /* Plugin Name: My Awesome Plugin... */",
    "WordPress Actions: Use add_action() to execute a function at a specific point in WordPress execution. Common actions include 'init' and 'wp_enqueue_scripts'.",
    "WordPress Filters: Use add_filter() to modify data. The function must return the modified value. Example: add_filter('the_content', 'modify_content');",
    "Security: Always use functions like sanitize_text_field() or esc_html() to clean user input and use nonces (wp_nonce_field()) for form submissions to prevent CSRF.",
    "Database interaction: Use the $wpdb global variable for database queries, never direct SQL injection. Always prepare queries using $wpdb->prepare().",
];