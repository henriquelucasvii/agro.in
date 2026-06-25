import Fastify from 'fastify'
import cors from '@fastify/cors'
import 'dotenv/config'

const app = Fastify({ logger: true })
const port: number = 3333

app.get('/', async () => {
    return { msg: "Hello World" }
})

const start = async () => {
    await app.register(cors)
    await app.listen({ port, host: '0.0.0.0' })
    console.log(`Servidor rodando em http://localhost:${port}`)
}

start().catch((error) => {
    app.log.error(error)
    process.exit(1)
})