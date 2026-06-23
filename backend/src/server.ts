import Fastify from 'fastify'
import cors from '@fastify/cors'

const app = Fastify({
    logger: true
})
const port: number = 3333

app.get('/', async () => {
    return { msg: "Hello World"}
})

try {
    app.listen(({port}), () => {
        console.log(`Servidor rodando em http://localhost:${port}`)
    })
} catch (error) {
    throw new Error()
}