/**
 * Utility functions for MAC Address handling and normalization
 */

/**
 * Normalizes a MAC address string by removing all non-hex characters and converting to uppercase.
 * Example: "00:1a:2b:3c:4d:5e" -> "001A2B3C4D5E"
 * @param {string} raw
 * @returns {string}
 */
export function normalizeMac(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
}

/**
 * Formats a normalized or partially normalized MAC address into standard AA:BB:CC:DD:EE:FF
 * @param {string} raw
 * @returns {string}
 */
export function formatMac(raw) {
  const clean = normalizeMac(raw);
  if (!clean) return '';
  const chunks = [];
  for (let i = 0; i < clean.length && i < 12; i += 2) {
    chunks.push(clean.substring(i, i + 2));
  }
  return chunks.join(':');
}

/**
 * Checks if a string is a valid complete 12-character MAC address
 * @param {string} raw
 * @returns {boolean}
 */
export function isValidMac(raw) {
  const clean = normalizeMac(raw);
  return clean.length === 12 && /^[0-9A-F]{12}$/.test(clean);
}

/**
 * Scans OCR text output for potential MAC addresses.
 * Prioritizes lines containing "MAC" or "WAN MAC" or "LAN MAC".
 * @param {string} text
 * @returns {string|null} Formatted MAC if found, otherwise null
 */
export function extractMacFromOcrText(text) {
  if (!text || typeof text !== 'string') return null;

  // Patterns for standard MAC representations:
  // 1. Colons / hyphens: AA:BB:CC:DD:EE:FF or AA-BB-CC-DD-EE-FF
  const colonHyphenPattern = /\b([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})\b/g;
  // 2. Cisco dot format: AAAA.BBBB.CCCC
  const dotPattern = /\b([0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4})\b/g;
  // 3. Raw 12-hex string near word MAC (case-insensitive)
  const macKeywordPattern = /MAC(?:\s*(?:ADDR|ADDRESS)?)?\s*[:\-\s]?\s*([0-9A-Fa-f]{12})/i;

  // First check if explicit MAC label pattern exists
  const macLabelMatch = text.match(macKeywordPattern);
  if (macLabelMatch && macLabelMatch[1]) {
    return formatMac(macLabelMatch[1]);
  }

  // Next check standard formatted MAC addresses
  const formattedMatches = text.match(colonHyphenPattern);
  if (formattedMatches && formattedMatches.length > 0) {
    return formatMac(formattedMatches[0]);
  }

  // Next check dot pattern
  const dotMatches = text.match(dotPattern);
  if (dotMatches && dotMatches.length > 0) {
    return formatMac(dotMatches[0]);
  }

  // Fallback: look for any 12-character contiguous hex string
  const rawHexMatches = text.match(/\b([0-9A-Fa-f]{12})\b/g);
  if (rawHexMatches && rawHexMatches.length > 0) {
    return formatMac(rawHexMatches[0]);
  }

  return null;
}
