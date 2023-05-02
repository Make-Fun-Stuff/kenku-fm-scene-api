import { readFileSync, writeFileSync } from 'fs'
import { sortBy } from 'lodash'
import { validate } from 'jsonschema'
import { v4 as uuidv4 } from 'uuid'
import assert from 'assert'

export interface Scene {
  id: string
  name: string
  playlistId?: string
  soundboardIds?: string[]
}

const newSceneSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
    },
    playlistId: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
    },
    soundboardIds: {
      type: 'array',
      minLength: 1,
      maxLength: 100,
      items: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
      },
    },
  },
  required: ['name'],
  additionalProperties: true,
}

const cleanName = (name: string): string => {
  return name.trim().toUpperCase()
}

const isScene = (obj: any): obj is Scene => {
  const valid = validate(obj, newSceneSchema).valid
  const scene = obj as Scene
  const unique = !getScenes().find((_) => cleanName(_.name) === cleanName(scene.name))
  const notEmpty = !!scene.playlistId || !!scene.soundboardIds
  return valid && unique && notEmpty
}

export const getJsonFilePath = () => {
  assert(process.env.SCENES_DB_DIR, `process.env.SCENES_DB_DIR not set`)
  return `${process.env.SCENES_DB_DIR}/scenes.json`
}

export const toScene = (obj: any): Scene => {
  if (isScene(obj)) {
    const scene = obj as Scene
    return {
      id: uuidv4(),
      name: cleanName(scene.name),
      playlistId: scene.playlistId,
      soundboardIds: scene.soundboardIds,
    }
  }
  throw Error('Invalid Scene')
}

const getScenes = (): Scene[] => {
  const scenes = JSON.parse(readFileSync(getJsonFilePath(), 'utf8'))
  return sortBy(scenes, (_) => _.name)
}

const updateScenes = (scenes: Scene[]) => {
  writeFileSync(
    getJsonFilePath(),
    JSON.stringify(
      sortBy(scenes, (_) => _.name),
      null,
      2
    )
  )
}

export const listScenes = (): string => {
  return JSON.stringify(getScenes())
}

export const addScene = (scene: Scene): string => {
  updateScenes([...getScenes(), scene])
  return JSON.stringify(scene)
}

export const removeScenes = (id: string): string => {
  const scenes = getScenes()
  if (!scenes.find((_) => _.id === id)) {
    throw Error(`Invalid id: ${id}`)
  }
  updateScenes(scenes.filter((_) => _.id !== id))
  return '{}'
}
