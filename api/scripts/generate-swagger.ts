import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createApp } from '../src/app'
import { InMemoryUsersRepository } from '../src/in-memory/in-memory-users-repository'

const usersRepository = new InMemoryUsersRepository()

const app = createApp(usersRepository)

await app.ready()

const spec = JSON.stringify(app.swagger(), null, 2)
const specFile = resolve(import.meta.dirname!, '..', 'swagger.json')

await writeFile(specFile, spec)

console.log('swagger.json generated')

await app.close()
