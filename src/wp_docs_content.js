// D:\cloudflare_worker_app\wp-ai-generator\src\wp_docs_content.js

export const WP_DOCS = [
    // Plugin Structure & Headers
    "WordPress Plugin Header: Every plugin must start with a comment block containing: Plugin Name, Plugin URI, Description, Version, Requires at least, Requires PHP, Author, Author URI, License, License URI, Text Domain, Domain Path. Example: /* Plugin Name: My Plugin\nDescription: Does something\nVersion: 1.0.0\nAuthor: Your Name\nLicense: GPL v2 or later\nText Domain: my-plugin */. Always prevent direct access with: if (!defined('ABSPATH')) exit;",
    
    // Shortcodes
    "WordPress Shortcodes: Register shortcodes with add_shortcode('shortcode_name', 'callback_function'). Shortcode functions must RETURN content, not echo it. Use shortcode_atts() for default attributes: $atts = shortcode_atts(array('title' => 'Default'), $atts, 'shortcode_name'). Document shortcode usage in plugin comments with examples like [shortcode_name title='Custom'].",
    
    // Security Best Practices
    "WordPress Security: ALWAYS sanitize inputs and escape outputs. Input sanitization: sanitize_text_field(), sanitize_email(), sanitize_textarea_field(), wp_kses_post(). Output escaping: esc_html(), esc_attr(), esc_url(), esc_js(). Forms need nonces: wp_nonce_field('action_name', 'nonce_name') and verify with wp_verify_nonce($_POST['nonce_name'], 'action_name'). Check capabilities: current_user_can('manage_options'). Database queries: always use $wpdb->prepare('SELECT * FROM table WHERE id = %d', $id).",
    
    // Actions and Filters
    "WordPress Hooks: Actions execute functions at specific points: add_action('init', 'function_name'). Common actions: init, admin_init, admin_menu, wp_enqueue_scripts, admin_enqueue_scripts, save_post, wp_ajax_*, wp_ajax_nopriv_*. Filters modify data and must return value: add_filter('the_content', 'modify_content'). Use proper priority (default 10) and accepted_args parameter.",
    
    // Admin Interface & Settings
    "WordPress Admin Menus & Settings: Create admin pages with add_menu_page('Page Title', 'Menu Title', 'manage_options', 'menu-slug', 'callback', 'icon', position) or add_submenu_page(). Use Settings API: register_setting('option_group', 'option_name'), add_settings_section(), add_settings_field(). Get options with get_option('option_name', 'default'). Update with update_option('option_name', $value). Display settings with settings_fields() and do_settings_sections().",
    
    // Enqueuing Scripts & Styles
    "WordPress Enqueue Scripts/Styles: Enqueue CSS with wp_enqueue_style('handle', plugin_dir_url(__FILE__) . 'style.css', array(), '1.0'). Enqueue JS with wp_enqueue_script('handle', plugin_dir_url(__FILE__) . 'script.js', array('jquery'), '1.0', true). Hook to wp_enqueue_scripts for frontend, admin_enqueue_scripts for admin. Localize scripts with wp_localize_script() for AJAX. Use plugin_dir_path(__FILE__) for file paths, plugin_dir_url(__FILE__) for URLs.",
    
    // Database Operations
    "WordPress Database: Access with global $wpdb. Query: $wpdb->get_results($wpdb->prepare('SELECT * FROM table WHERE col = %s', $value)). Insert: $wpdb->insert($table, array('col' => $value), array('%s')). Update: $wpdb->update($table, array('col' => $new), array('id' => $id), array('%s'), array('%d')). Delete: $wpdb->delete($table, array('id' => $id), array('%d')). Get prefix: $wpdb->prefix. Custom tables: CREATE TABLE IF NOT EXISTS {$wpdb->prefix}table_name.",
    
    // AJAX Handling
    "WordPress AJAX: Register actions: add_action('wp_ajax_action_name', 'callback') for logged-in users, add_action('wp_ajax_nopriv_action_name', 'callback') for guests. In JS, post to ajaxurl with action parameter. In PHP callback, verify nonce, process data, use wp_send_json_success($data) or wp_send_json_error($data), then wp_die(). Localize ajaxurl: wp_localize_script('handle', 'ajax_object', array('ajax_url' => admin_url('admin-ajax.php'), 'nonce' => wp_create_nonce('nonce_action'))).",
    
    // Custom Post Types & Taxonomies
    "WordPress Custom Post Types: Register with register_post_type('post_type', $args) on init hook. Args include: labels, public, has_archive, supports, menu_icon, rewrite. Supports: title, editor, thumbnail, excerpt, custom-fields. For taxonomies: register_taxonomy('taxonomy', 'post_type', $args). Always flush rewrite rules on activation: flush_rewrite_rules(). Use get_posts(), WP_Query for queries.",
    
    // User Capabilities & Roles
    "WordPress User Capabilities: Check with current_user_can('capability'). Common capabilities: manage_options (admin), edit_posts, publish_posts, edit_others_posts, read. Get current user: wp_get_current_user(). Check if logged in: is_user_logged_in(). Add capability to role: get_role('role')->add_cap('capability'). Create custom role: add_role('role_name', 'Display Name', array('read' => true, 'custom_cap' => true)).",
    
    // Plugin Activation & Deactivation
    "WordPress Activation/Deactivation Hooks: register_activation_hook(__FILE__, 'activation_function') runs on plugin activation. Use for: creating tables, adding default options, flushing rewrite rules. register_deactivation_hook(__FILE__, 'deactivation_function') runs on deactivation. Clean up in uninstall.php, not deactivation. Check if function exists: if (!function_exists('function_name')). Check WordPress version: global $wp_version; if (version_compare($wp_version, '5.0', '>=')).",
    
    // Translation & Internationalization
    "WordPress Translation (i18n): Make plugins translation-ready. Load text domain: load_plugin_textdomain('text-domain', false, dirname(plugin_basename(__FILE__)) . '/languages'). Translate strings: __('String', 'text-domain') for return, _e('String', 'text-domain') for echo. Variables: printf(__('Hello %s', 'text-domain'), $name). Plurals: _n('%d item', '%d items', $count, 'text-domain'). Context: _x('Post', 'noun', 'text-domain').",
    
    // Error Handling & Debugging
    "WordPress Error Handling: Use WP_Error for errors: $error = new WP_Error('error_code', 'Error message'). Check: is_wp_error($result). Get message: $error->get_error_message(). Log errors: error_log('Debug message'). Display admin notices: add_action('admin_notices', 'notice_function') then echo '<div class=\"notice notice-error\"><p>Message</p></div>'. For debugging: define('WP_DEBUG', true) in wp-config.php.",
    
    // Widgets & Sidebars
    "WordPress Widgets: Create by extending WP_Widget class. Register with register_widget('Widget_Class_Name'). Implement widget(), form(), update() methods. Register sidebars: register_sidebar(array('name' => 'Sidebar Name', 'id' => 'sidebar-id', 'before_widget' => '<div>', 'after_widget' => '</div>')). Display: dynamic_sidebar('sidebar-id'). Check if active: is_active_sidebar('sidebar-id').",
    
    // REST API & Modern WordPress
    "WordPress REST API: Register routes: register_rest_route('namespace/v1', '/endpoint', array('methods' => 'GET', 'callback' => 'callback_function', 'permission_callback' => 'permission_check')). Use WP_REST_Request, WP_REST_Response. Add fields to existing endpoints: register_rest_field(). Access: /wp-json/namespace/v1/endpoint. Check permissions in permission_callback. Register on rest_api_init hook.",
];