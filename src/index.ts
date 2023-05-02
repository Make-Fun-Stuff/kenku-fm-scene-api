import express from 'express'
import { existsSync, writeFileSync } from 'fs'
import { getJsonFilePath, addScene, toScene, listScenes, removeScenes } from './db'
import { rateLimit } from 'express-rate-limit'
import cors from 'cors'

const PORT = 5003

if (!existsSync(getJsonFilePath())) {
  writeFileSync(getJsonFilePath(), '{}')
}

const app = express()
app.disable('etag')
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
)
app.use(express.json())

const limiter = rateLimit({
  windowMs: 3000,
  max: 1,
  standardHeaders: false,
  legacyHeaders: false,
})

app
  .get('/', (_req, res) => {
    res.send(listScenes())
  })
  .post('/', limiter, (req, res) => {
    const body = req.body
    try {
      res.send(addScene(toScene(body)))
    } catch (error) {
      res
        .status(400)
        .send(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }))
    }
  })
  .delete('/:id', limiter, (req, res) => {
    const id = req.params.id
    try {
      res.send(removeScenes(id))
    } catch (error) {
      res
        .status(400)
        .send(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }))
    }
  })

console.log(`Running on port ${PORT}`)
console.log(`Scenes stored in ${getJsonFilePath()}\n`)
app.listen(PORT)
