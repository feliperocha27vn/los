import { EnsureSeedUseCase } from '../src/use-cases/ensure-seed'

const useCase = new EnsureSeedUseCase()
const result = await useCase.execute({
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD,
  pin: process.env.ADMIN_PIN,
  name: process.env.ADMIN_NAME,
})

if (result.seeded) {
  console.log(`[seed] user created: ${result.email}`)
  console.log('[seed] password: see ADMIN_PASSWORD env var or default 12345678')
  console.log('[seed] cofre pin: see ADMIN_PIN env var or default 123456')
  console.log('[seed] 2 sample notes created')
} else {
  console.log(`[seed] user already exists (${result.email}), skipped`)
}
process.exit(0)
