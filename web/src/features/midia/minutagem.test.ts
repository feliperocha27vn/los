import { describe, it, expect } from 'vitest';
import { formatMarcador, formatMinutagem, parseMinutagem } from './minutagem';

describe('formatMinutagem', () => {
  it('mostra zero como 0:00', () => {
    expect(formatMinutagem(0)).toBe('0:00');
  });

  it('não zera à esquerda os minutos abaixo de dez', () => {
    expect(formatMinutagem(330)).toBe('5:30');
  });

  it('zera à esquerda os segundos', () => {
    expect(formatMinutagem(1440)).toBe('24:00');
    expect(formatMinutagem(1445)).toBe('24:05');
  });

  it('inclui a hora quando passa de 59:59', () => {
    expect(formatMinutagem(3930)).toBe('1:05:30');
    expect(formatMinutagem(3600)).toBe('1:00:00');
  });

  it('trata negativo como zero', () => {
    expect(formatMinutagem(-10)).toBe('0:00');
  });
});

describe('parseMinutagem', () => {
  it('lê número solto como minutos', () => {
    expect(parseMinutagem('24')).toBe(1440);
    expect(parseMinutagem('0')).toBe(0);
  });

  it('lê mm:ss', () => {
    expect(parseMinutagem('24:30')).toBe(1470);
    expect(parseMinutagem('05:30')).toBe(330);
  });

  it('lê h:mm:ss', () => {
    expect(parseMinutagem('1:05:30')).toBe(3930);
  });

  it('ignora espaços em volta', () => {
    expect(parseMinutagem('  24:30  ')).toBe(1470);
  });

  it('recusa entrada vazia', () => {
    expect(parseMinutagem('')).toBeNull();
    expect(parseMinutagem('   ')).toBeNull();
  });

  it('recusa segundos acima de 59', () => {
    expect(parseMinutagem('24:60')).toBeNull();
  });

  it('recusa minutos acima de 59 quando há hora', () => {
    expect(parseMinutagem('1:60:00')).toBeNull();
  });

  it('recusa texto que não é número', () => {
    expect(parseMinutagem('abc')).toBeNull();
    expect(parseMinutagem('12:ab')).toBeNull();
    expect(parseMinutagem('-5')).toBeNull();
    expect(parseMinutagem('1.5')).toBeNull();
  });

  it('recusa campo incompleto', () => {
    expect(parseMinutagem('24:')).toBeNull();
    expect(parseMinutagem(':30')).toBeNull();
  });

  it('recusa mais de três campos', () => {
    expect(parseMinutagem('1:2:3:4')).toBeNull();
  });

  it('recusa 24h ou mais, o limite que a API aceita', () => {
    expect(parseMinutagem('23:59:59')).toBe(86_399);
    expect(parseMinutagem('24:00:00')).toBeNull();
  });

  it('faz ida e volta com formatMinutagem', () => {
    for (const seconds of [0, 59, 330, 1440, 3930, 86_399]) {
      expect(parseMinutagem(formatMinutagem(seconds))).toBe(seconds);
    }
  });
});

describe('formatMarcador', () => {
  it('escreve temporada e episódio', () => {
    expect(formatMarcador(3, 8)).toBe('T3 · E8');
  });
});
