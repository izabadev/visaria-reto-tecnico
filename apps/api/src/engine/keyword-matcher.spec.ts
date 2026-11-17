import { findMatchingKeyword } from './keyword-matcher.js';

describe('findMatchingKeyword', () => {
  it('casa una keyword como palabra completa', () => {
    expect(findMatchingKeyword('quiero info', ['info'])).toBe('info');
  });

  it('no casa una keyword dentro de una palabra mas larga', () => {
    expect(findMatchingKeyword('información', ['info'])).toBeUndefined();
  });

  it('ignora mayusculas y tildes', () => {
    expect(findMatchingKeyword('Información', ['informacion'])).toBe('informacion');
  });

  it('ignora tambien mayusculas y tildes en la keyword', () => {
    expect(findMatchingKeyword('cual es el precio', ['PRÉCIO'])).toBe('PRÉCIO');
  });

  it('casa junto a signos de puntuacion', () => {
    expect(findMatchingKeyword('¿precio?', ['precio'])).toBe('precio');
  });

  it('casa keywords de varias palabras como frase consecutiva', () => {
    expect(findMatchingKeyword('dame el precio final ya', ['precio final'])).toBe('precio final');
    expect(findMatchingKeyword('precio y final', ['precio final'])).toBeUndefined();
  });

  it('ignora keywords vacias o en blanco', () => {
    expect(findMatchingKeyword('hola', ['', '   '])).toBeUndefined();
  });
});
