export default defineBackground(() => {
  // Intentionally minimal. The background never makes network requests.
  // Later steps: action badge states (running / paused / stopped-orange).
  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason !== 'install') return;
    void (async () => {
      const flag = await browser.storage.local.get('unboxing-opened');
      if (flag['unboxing-opened']) return;
      await browser.storage.local.set({ 'unboxing-opened': true });
      // Local patch: open the settings page (the Workshop) instead of the welcome tour.
      await browser.runtime.openOptionsPage();
    })();
  });

  browser.runtime.onMessage.addListener((message: unknown) => {
    if ((message as { type?: string } | null)?.type === 'open-workshop') {
      void browser.runtime.openOptionsPage();
    }
  });
});
