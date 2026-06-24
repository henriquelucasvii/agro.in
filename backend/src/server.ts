import Fastify from 'fastify'
import cors from '@fastify/cors'

const app = Fastify()
const port: number = 3333

app.get('/', async () => {
    return { msg: "Hello World"}
})

const start = async () => {
    try {
        await app.listen(({port}), () => {
            console.log(`Servidor rodando em http://localhost:${port}`)
        })
    } catch (error) {
        app.log.error(error)
        process.exit(1)
    }
}

start()