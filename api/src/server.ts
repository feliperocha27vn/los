import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createApp } from './app'
import { env } from './env'

const app = createApp()

app
  .listen({
    port: env.PORT,
    host: '0.0.0.0',
  })
  .then(() => {
    console.log(`HTTP server running on port ${env.PORT}`)
    console.log(`Documentation: http://localhost:${env.PORT}/docs`)
  })

if (env.NODE_ENV === 'development') {
  const specFile = resolve(process.cwd(), 'swagger.json')
  app.ready().then(() => {
    const spec = JSON.stringify(app.swagger(), null, 2)
    writeFile(specFile, spec).then(() => {
      console.log('Swagger spec generated → swagger.json')
    })
  })
}
