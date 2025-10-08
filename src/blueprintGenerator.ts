// WordPress Playground Blueprint Generator
// Creates JSON blueprints for instant WordPress Playground testing

export interface PlaygroundBlueprint {
  $schema: string;
  landingPage: string;
  preferredVersions: {
    php: string;
    wp: string;
  };
  phpExtensionBundles: string[];
  features: {
    networking: boolean;
  };
  steps: PlaygroundStep[];
}

export interface PlaygroundStep {
  step: string;
  [key: string]: any;
}

/**
 * Generates a WordPress Playground blueprint for testing the plugin
 * @param pluginZipUrl - Public URL to the plugin ZIP file
 * @param pluginSlug - The plugin directory name/slug
 */
export function generatePlaygroundBlueprint(
  pluginZipUrl: string,
  pluginSlug: string,
  pluginName: string
): PlaygroundBlueprint {
  
  return {
    $schema: "https://playground.wordpress.net/blueprint-schema.json",
    landingPage: "/wp-admin/plugins.php",
    preferredVersions: {
      php: "8.2",
      wp: "latest"
    },
    phpExtensionBundles: ["kitchen-sink"],
    features: {
      networking: true
    },
    steps: [
      // Step 1: Login as admin
      {
        step: "login",
        username: "admin",
        password: "password"
      },
      
      // Step 2: Install plugin from URL
      {
        step: "installPlugin",
        pluginData: {
          resource: "url",
          url: pluginZipUrl
        },
        options: {
          activate: true
        }
      }
    ]
  };
}

/**
 * Generates a more advanced blueprint with demo content
 */
export function generateAdvancedBlueprint(
  pluginZipUrl: string,
  pluginSlug: string,
  pluginName: string,
  hasShortcode: boolean = false,
  shortcodeName?: string
): PlaygroundBlueprint {
  
  const blueprint = generatePlaygroundBlueprint(pluginZipUrl, pluginSlug, pluginName);
  
  // Add demo content if plugin uses shortcodes
  if (hasShortcode && shortcodeName) {
    blueprint.steps.push(
      // Create a demo page with the shortcode
      {
        step: "runPHP",
        code: `<?php
$page_id = wp_insert_post(array(
    'post_title'   => '${pluginName} Demo',
    'post_content' => '<h2>Plugin Demo Page</h2><p>This page demonstrates the plugin functionality.</p>[${shortcodeName}]',
    'post_status'  => 'publish',
    'post_type'    => 'page'
));

if ($page_id) {
    update_option('${pluginSlug}_demo_page_id', $page_id);
}
?>`
      },
      
      // Navigate to the demo page
      {
        step: "runPHP",
        code: `<?php
$demo_page_id = get_option('${pluginSlug}_demo_page_id');
if ($demo_page_id) {
    $permalink = get_permalink($demo_page_id);
    if ($permalink) {
        wp_redirect($permalink);
        exit;
    }
}
?>`
      }
    );
  }
  
  return blueprint;
}

/**
 * Generates a minimal blueprint for quick testing
 */
export function generateQuickTestBlueprint(pluginZipUrl: string): PlaygroundBlueprint {
  return {
    $schema: "https://playground.wordpress.net/blueprint-schema.json",
    landingPage: "/wp-admin/",
    preferredVersions: {
      php: "8.2",
      wp: "latest"
    },
    phpExtensionBundles: ["kitchen-sink"],
    features: {
      networking: true
    },
    steps: [
      {
        step: "login",
        username: "admin",
        password: "password"
      },
      {
        step: "installPlugin",
        pluginData: {
          resource: "url",
          url: pluginZipUrl
        },
        options: {
          activate: true
        }
      }
    ]
  };
}

/**
 * Generates blueprint URL for WordPress Playground
 */
export function generatePlaygroundUrl(blueprintJson: PlaygroundBlueprint): string {
  const playgroundBaseUrl = 'https://playground.wordpress.net/';
  
  // Convert blueprint to base64-encoded JSON
  const blueprintString = JSON.stringify(blueprintJson);
  const blueprintBase64 = btoa(blueprintString);
  
  // Use the blueprint query parameter (inline blueprint)
  return `${playgroundBaseUrl}#${blueprintBase64}`;
}

/**
 * Alternative: Generate playground URL using hosted blueprint URL
 */
export function generatePlaygroundUrlFromHosted(blueprintUrl: string): string {
  const playgroundBaseUrl = 'https://playground.wordpress.net/';
  const url = new URL(playgroundBaseUrl);
  url.searchParams.set('blueprint-url', blueprintUrl);
  return url.toString();
}

