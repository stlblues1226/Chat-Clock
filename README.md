# Chat Clock

Adds the current date and time to the messages you send to an AI chat, so the
AI knows when you wrote them and doesn't treat a days-old comment as recent.

It does **not** track or check your usage or usage limits. Everything runs
locally in your browser, makes no network requests, and collects no data.

Works with ChatGPT, Claude, Gemini, Mistral, Perplexity and Grok, plus other
AI sites you choose to allow.

## Credit

Chat Clock is a modified fork of [AI-Watch](https://github.com/Alcaviggia/ai-watch)
by Alain Caviggia, used under the MIT license (see `LICENSE`). All credit for the
original design and code goes to him. This is an independent project and is not
affiliated with or endorsed by the original author.

The fixes and changes were made with help from Claude AI (Anthropic).

## What is different from the original

- Fix: every other message was sent without a timestamp (the re-send guard
  was never cleared after a button click).
- The date is written as MM/DD/YYYY (the time is 24-hour).
- The always-visible clock next to the message box is removed.
- The "What To Display" text box is the only place that decides what is sent;
  the confusing on/off checkboxes in the popup are gone.
- Plain-English settings (Clock Face, What To Display Timestamp Info, When To
  Display Timestamp Info, Data Sharing Disclosure) instead of watchmaking terms.
- The "Open settings" button in the popup, and new icon and artwork (the
  original logo and artwork are not included).

## Build from source

Requires Node.js 22 or newer.

```bash
npm ci
npm test
npm run zip:firefox     # output: .output/chat-clock-<version>-firefox.zip
```

To try it without installing: in Firefox open `about:debugging`, choose
"This Firefox" > "Load Temporary Add-on", and select `manifest.json` from
`.output/firefox-mv2/` after running `npm run build:firefox`.

## Privacy

No data collection, no network requests, nothing leaves your device.

## License

MIT. The original copyright notice (Alain Caviggia) is kept in `LICENSE`.
