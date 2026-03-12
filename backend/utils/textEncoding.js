/**
 * Pattern to quickly detect likely mojibake sequences that indicate
 * UTF-8 bytes were misinterpreted as single-byte encodings.
 */
const MOJIBAKE_PATTERN = /(?:Ã.|Â.|â.|ð.)/;

const CP1252_BYTE_BY_CODE_POINT = new Map([
  [0x20AC, 0x80],
  [0x201A, 0x82],
  [0x0192, 0x83],
  [0x201E, 0x84],
  [0x2026, 0x85],
  [0x2020, 0x86],
  [0x2021, 0x87],
  [0x02C6, 0x88],
  [0x2030, 0x89],
  [0x0160, 0x8A],
  [0x2039, 0x8B],
  [0x0152, 0x8C],
  [0x017D, 0x8E],
  [0x2018, 0x91],
  [0x2019, 0x92],
  [0x201C, 0x93],
  [0x201D, 0x94],
  [0x2022, 0x95],
  [0x2013, 0x96],
  [0x2014, 0x97],
  [0x02DC, 0x98],
  [0x2122, 0x99],
  [0x0161, 0x9A],
  [0x203A, 0x9B],
  [0x0153, 0x9C],
  [0x017E, 0x9E],
  [0x0178, 0x9F],
]);

/**
 * Try to map Unicode codepoints back to single-byte CP1252 values.
 * Returns a Buffer of byte values when mapping succeeds, or null
 * when the string contains codepoints that cannot be mapped.
 *
 * This is conservative: if mapping is incomplete we won't attempt
 * a repair to avoid introducing corruption.
 *
 * @param {string} value
 * @returns {Buffer|null}
 */
const encodeStringAsSingleByteBuffer = (value) => {
  const bytes = [];

  for (const char of value) {
    const codePoint = char.codePointAt(0);
    if (codePoint <= 0xFF) {
      bytes.push(codePoint);
      continue;
    }

    const cp1252Byte = CP1252_BYTE_BY_CODE_POINT.get(codePoint);
    if (cp1252Byte === undefined) {
      return null;
    }

    bytes.push(cp1252Byte);
  }

  return Buffer.from(bytes);
};

const scoreMojibake = (value) => {
  if (typeof value !== "string" || !value) {
    return 0;
  }

  const matches = value.match(/(?:Ã.|Â.|â.|ð.)/g);
  return matches ? matches.length : 0;
};

/**
 * Attempt to repair a string suffering from common mojibake where
 * UTF-8 byte sequences were decoded using a single-byte encoding
 * such as Latin-1 or CP1252. If repair looks better (fewer
 * mojibake markers) we return the repaired string; otherwise we
 * return the original unmodified value.
 *
 * @param {string} value
 * @returns {string}
 */
const repairStringEncoding = (value) => {
  if (typeof value !== "string" || !value.trim() || !MOJIBAKE_PATTERN.test(value)) {
    return value;
  }

  const encodedBuffer = encodeStringAsSingleByteBuffer(value);
  if (!encodedBuffer) {
    return value;
  }

  const repaired = encodedBuffer.toString("utf8");
  if (!repaired || repaired.includes("\uFFFD")) {
    return value;
  }

  return scoreMojibake(repaired) < scoreMojibake(value) ? repaired : value;
};

const repairTextEncodingDeep = (value) => {
  if (typeof value === "string") {
    return repairStringEncoding(value);
  }

  if (Array.isArray(value)) {
    return value.map(repairTextEncodingDeep);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        repairTextEncodingDeep(nestedValue),
      ]),
    );
  }

  return value;
};

module.exports = {
  repairStringEncoding,
  repairTextEncodingDeep,
};