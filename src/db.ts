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

const verifyCampaignExists = (campaignName: string): void => {
  if (!getCampaignScenes().hasOwnProperty(cleanName(campaignName))) {
    throw Error(`Invalid campaign: ${campaignName}`)
  }
}

const isScene = (obj: any, campaignName?: string): obj is Scene => {
  let unique = true
  if (campaignName) {
    verifyCampaignExists(campaignName)
    const campaignScenes = getCampaignScenes()
    unique = !campaignScenes[campaignName].find((_) => cleanName(_.name) === cleanName(scene.name))
  }
  const valid = validate(obj, newSceneSchema).valid
  const scene = obj as Scene
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

const getCampaignScenes = (): Record<string, Scene[]> => {
  return JSON.parse(readFileSync(getJsonFilePath(), 'utf8'))
}

const updateScenes = (campaignName: string, scenes: Scene[]) => {
  const campaignScenes = getCampaignScenes()
  writeFileSync(
    getJsonFilePath(),
    JSON.stringify(
      {
        ...campaignScenes,
        [campaignName]: sortBy(scenes, (_) => _.name),
      },
      null,
      2
    )
  )
}

export const listScenes = (): string => {
  return JSON.stringify(getCampaignScenes())
}

export const addScene = (campaignName: string, scene: Scene): string => {
  verifyCampaignExists(campaignName)
  const campaignScenes = getCampaignScenes()
  updateScenes(campaignName, [...campaignScenes[campaignName], scene])
  return JSON.stringify(scene)
}

export const removeScene = (campaignName: string, sceneId: string): string => {
  verifyCampaignExists(campaignName)
  const campaignScenes = getCampaignScenes()
  const scenes = campaignScenes[campaignName]
  if (!scenes.find((_) => _.id === sceneId)) {
    throw Error(`Invalid scene id: ${sceneId}`)
  }
  updateScenes(
    campaignName,
    scenes.filter((_) => _.id !== sceneId)
  )
  return '{}'
}

export const addCampaign = (campaignName: string) => {
  try {
    verifyCampaignExists(campaignName)
    throw Error(`Campaign named "${campaignName}" already exists`)
  } catch {
    updateScenes(cleanName(campaignName), [])
    return { campaignName: cleanName(campaignName) }
  }
}
