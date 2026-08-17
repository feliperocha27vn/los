/**
 * Minutagem: o tempo decorrido dentro do episódio apontado pelo Marcador.
 *
 * A API guarda segundos inteiros (`positionSeconds`, 0..86399). O usuário pensa
 * e digita em minutos, então a conversão mora aqui — nunca na tela.
 */

export const MAX_POSITION_SECONDS = 86_399;

/** Formata segundos para exibição: `5:30`, `24:00`, `1:05:30`. */
export function formatMinutagem(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${minutes}:${pad(seconds)}`;
}

/**
 * Interpreta o que o usuário digitou.
 *
 * Um número solto é lido como MINUTOS — o campo se chama Minutagem, e ninguém
 * anota "parei aos 1440 segundos". `24` vira 1440.
 *
 * Aceita `24`, `24:30` e `1:05:30`. Devolve `null` para entrada inválida, para
 * a tela conseguir distinguir "vazio/errado" de "zero".
 */
export function parseMinutagem(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === '') return null;

  const parts = trimmed.split(':');
  if (parts.length > 3) return null;
  if (parts.some((part) => part === '' || !/^\d+$/.test(part))) return null;

  const numbers = parts.map(Number);

  let totalSeconds: number;
  if (numbers.length === 1) {
    totalSeconds = numbers[0] * 60;
  } else if (numbers.length === 2) {
    const [minutes, seconds] = numbers;
    if (seconds > 59) return null;
    totalSeconds = minutes * 60 + seconds;
  } else {
    const [hours, minutes, seconds] = numbers;
    if (minutes > 59 || seconds > 59) return null;
    totalSeconds = hours * 3600 + minutes * 60 + seconds;
  }

  if (totalSeconds > MAX_POSITION_SECONDS) return null;
  return totalSeconds;
}

/**
 * Como o Marcador é lido na tela. Minutagem zero significa episódio ainda não
 * aberto — e é o caso mais comum, já que o Avanço sempre zera.
 */
export function formatMarcador(season: number, episode: number): string {
  return `T${season} · E${episode}`;
}
