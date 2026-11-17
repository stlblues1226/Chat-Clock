import { defineConfig } from 'wxt';

// NOTE: Display brand ("AI-Watch") lives in src/shared/brand.ts and is used
// inside the UI (popup title, alt text). The manifest name/description below
// are the store-facing listing text (Chrome Web Store / AMO) — finalized
// 20 July 2026 as "AI-Watch Clock" to avoid a name collision with an
// unrelated Android app and an unrelated April 2026 trademark filing.
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte'],
  manifest: {
    name: 'Chat Clock',
    // Fixed ID so Firefox keeps saved settings between loads and for signing.
    browser_specific_settings: {
      gecko: {
        id: '{37ee4a6b-3aa3-4670-8191-0142cb005366}',
        strict_min_version: '140.0',
        // Required by Mozilla for new add-ons: this add-on collects no data.
        data_collection_permissions: { required: ['none'] },
      },
    },
    description:
      'Adds the current date and time to the messages you send to an AI chat, so it knows when you wrote them. It does not track or check your usage or usage limits, and nothing leaves your computer.',
    // Step 2: "storage" only (settings + per-site session state, all local).
    // host access comes from the content script matches, nothing broader.
    permissions: ['storage', 'activeTab', 'scripting'],
    // The Free Wrist: no broad host access. Each origin is granted one by
    // one, by the user, at the moment they "offer this AI a watch".
    optional_host_permissions: ['https://*/*', 'http://*/*'],
  },
});
