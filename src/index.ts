import express from 'express'
import { existsSync, writeFileSync } from 'fs'
import { getJsonFilePath, addScene, toScene, listScenes, removeScene, addCampaign } from './db'
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
  windowMs: 1000,
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
      res.send(addCampaign(body.campaignName))
    } catch (error) {
      res
        .status(400)
        .send(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }))
    }
  })
  .post('/:campaignName', limiter, (req, res) => {
    const body = req.body
    try {
      res.send(addScene(req.params.campaignName, toScene(body)))
    } catch (error) {
      res
        .status(400)
        .send(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }))
    }
  })
  .delete('/:campaignName/:sceneId', limiter, (req, res) => {
    try {
      res.send(removeScene(req.params.campaignName, req.params.sceneId))
    } catch (error) {
      res
        .status(400)
        .send(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }))
    }
  })

console.log(`Running on port ${PORT}`)
console.log(`Scenes stored in ${getJsonFilePath()}\n`)
app.listen(PORT)
