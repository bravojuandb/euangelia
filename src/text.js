export function toRomanNumeral(number) {
  const numerals = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];

  let value = number;
  let result = "";

  for (const [arabic, roman] of numerals) {
    while (value >= arabic) {
      result += roman;
      value -= arabic;
    }
  }

  return result || String(number);
}

export function toGreekNumeral(number) {
  const ones = ["", "α", "β", "γ", "δ", "ε", "ϛ", "ζ", "η", "θ"];
  const tens = ["", "ι", "κ", "λ", "μ", "ν", "ξ", "ο", "π", "ϟ"];
  const hundreds = ["", "ρ", "σ", "τ", "υ", "φ", "χ", "ψ", "ω", "ϡ"];

  if (!Number.isInteger(number) || number <= 0 || number >= 1000) {
    return String(number);
  }

  const h = hundreds[Math.floor(number / 100)];
  const t = tens[Math.floor((number % 100) / 10)];
  const o = ones[number % 10];

  return `${h}${t}${o}ʹ`;
}

// The Latin edition puts a space before : ; ? (French style). A no-break
// space keeps the mark from starting a new line.
export function bindPunctuation(text) {
  return text.replace(/ ([:;!?])/g, " $1");
}

// Parses "3", "3:16", "3.16", "3,16" or "3 16" into { chapter, verse }.
export function parseReference(input) {
  const match = /^\s*(\d{1,3})\s*(?:[:.,\s]\s*(\d{1,3}))?\s*$/.exec(input);
  if (!match) {
    return null;
  }

  const chapter = Number(match[1]);
  const verse = match[2] ? Number(match[2]) : null;
  if (chapter === 0 || verse === 0) {
    return null;
  }
  return { chapter, verse };
}
