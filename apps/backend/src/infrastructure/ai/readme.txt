Add tokenise classes for both Anthropic and for Google Gemini
https://www.propelcode.ai/blog/token-counting-tiktoken-anthropic-gemini-guide-2025
tokeniseGemini.ts

Also create a class for converting data into different formats before passing it in:

const asXML = DATA.map(
  (item) =>
    `<item url="${item.url}" title="${item.title}"></item>`,
).join('\n');

const asJSON = JSON.stringify(DATA, null, 2);

const asMarkdown = DATA.map(
  (item) => `- [${item.title}](${item.url})`,
).join('\n');

MARKDOWN files are ALWAYS more effecient than XML or JSON for token usage.

