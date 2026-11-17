// Marcas diacríticas que deja la normalización NFD (á -> a + ´).
const DIACRITICS = /[̀-ͯ]/g;
// Cualquier carácter que no sea letra o número Unicode separa palabras.
// Nota: `\b` en JS solo entiende ASCII, así que trataría "á" como un límite de palabra.
const WORD_SEPARATOR = /[^\p{L}\p{N}]+/u;

export function tokenize(text: string): string[] {
  return text
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .split(WORD_SEPARATOR)
    .filter((token) => token.length > 0);
}

function containsPhrase(words: string[], phrase: string[]): boolean {
  if (phrase.length === 0) return false;
  return words.some((_, start) =>
    phrase.every((token, offset) => words[start + offset] === token),
  );
}

/** Devuelve la primera keyword encontrada en el texto como palabra/frase completa, o undefined. */
export function findMatchingKeyword(
  text: string,
  keywords: string[],
): string | undefined {
  const words = tokenize(text);
  return keywords.find((keyword) => containsPhrase(words, tokenize(keyword)));
}
