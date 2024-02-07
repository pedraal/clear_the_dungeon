import { MapDefinition, MapParser } from '../map_parser'
import { Mappings } from '../mapping'
import { defaultRoom } from './rooms/default'
import { hHallway } from './rooms/h_hallway'
import { vHallway } from './rooms/v_hallway'

const entrance = structuredClone(defaultRoom)
MapParser.roomModifier(entrance, 'wall', 'north', (mapping) => {
  mapping.mapping = Mappings.wall_doorway
})

const hub = structuredClone(defaultRoom)
MapParser.roomModifier(hub, 'wall', 'south', (mapping) => {
  mapping.mapping = Mappings.wall_doorway
})
MapParser.roomModifier(hub, 'wall', 'west', (mapping) => {
  mapping.mapping = Mappings.wall_doorway
})
MapParser.roomModifier(hub, 'wall', 'east', (mapping) => {
  mapping.mapping = Mappings.wall_doorway
})

const refectory = structuredClone(defaultRoom)
MapParser.roomModifier(refectory, 'wall', 'west', (mapping) => {
  mapping.mapping = Mappings.wall_doorway
})

const storage = structuredClone(defaultRoom)
MapParser.roomModifier(storage, 'wall', 'east', (mapping) => {
  mapping.mapping = Mappings.wall_doorway
})

export const alphaMap: MapDefinition = {
  name: 'Alpha',
  cellSize: 4,
  spawn: {
    x: 3,
    y: 1,
    z: 3,
  },
  rooms: [
    MapParser.roomGenerator(entrance, { x: 0, y: 0, z: 0 }),
    MapParser.roomGenerator(vHallway, { x: 2, y: 0, z: 7 }),
    MapParser.roomGenerator(hub, { x: 0, y: 0, z: 10 }),
    MapParser.roomGenerator(hHallway, { x: 7, y: 0, z: 12 }),
    MapParser.roomGenerator(refectory, { x: 10, y: 0, z: 10 }),
    MapParser.roomGenerator(hHallway, { x: -3, y: 0, z: 12 }),
    MapParser.roomGenerator(storage, { x: -10, y: 0, z: 10 }),
  ],
}
