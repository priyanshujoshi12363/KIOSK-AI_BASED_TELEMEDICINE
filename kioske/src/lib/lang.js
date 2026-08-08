export function detectLanguage(text) {
  if (!text) return "hi";
  if (/[ഀ-ൿ]/.test(text)) return "ml";
  if (/[઀-૿]/.test(text)) return "gu";
  if (/[ऀ-ॿ]/.test(text)) return "hi";
  return "en";
}
