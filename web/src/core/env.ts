import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().default(''),
});

// Faz a validação de import.meta.env, que contém as variáveis injetadas pelo Vite
export const env = envSchema.parse(import.meta.env);
