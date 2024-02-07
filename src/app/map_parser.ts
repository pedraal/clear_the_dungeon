import { Engine } from './engine'
import { Mapping, Mappings } from './mapping'

interface MappingDefinition {
  mod_type?: string
  mod_id?: string
  mapping: Mappings
  position?: { x?: number; z?: number; y?: number }
  orientation?: number
  shape?: Mapping['shape']
}

export type CellDefinition = MappingDefinition[]

export interface RoomDefinition {
  position: { x: number; y: number; z: number }
  cells: (CellDefinition | null)[][]
}

export interface MapDefinition {
  name: string
  cellSize: number
  spawn: { x: number; y: number; z: number }
  rooms: RoomDefinition[]
}

interface Params {
  definition: MapDefinition
  engine: Engine
}

export class MapParser {
  params: Params
  definition: MapDefinition
  engine: Engine
  spawn: { x: number; y: number; z: number }
  exit: { x: number; y: number; z: number }

  constructor(params: Params) {
    this.params = params
    this.definition = this.params.definition
    this.engine = this.params.engine

    this.spawn = Object.entries(this.definition.spawn).reduce(
      (acc, cur) => {
        acc[cur[0]] = cur[1] * this.definition.cellSize
        return acc
      },
      {} as MapParser['spawn'],
    )
  }

  generate() {
    this.propsIterator((coordinates, prop) => {
      // if (prop.mapping === Mappings.wall || prop.mapping === Mappings.wall_corner) return
      new Mapping({
        engine: this.engine,
        name: prop.mapping,
        position: {
          x: coordinates.x + (prop.position?.x || 0) * this.definition.cellSize,
          y: coordinates.y + (prop.position?.y || 0) * this.definition.cellSize,
          z: coordinates.z + (prop.position?.z || 0) * this.definition.cellSize,
        },
        orientation: prop.orientation || 0,
        shape: prop.shape || 'trimesh',
      })
    })
  }

  mappingsSet() {
    const mappings: Set<Mappings> = new Set()
    this.propsIterator((_, prop) => {
      mappings.add(prop.mapping)
    })
    return mappings
  }

  roomsIterator(iteration: (room: RoomDefinition) => void) {
    for (const room of this.definition.rooms) {
      iteration(room)
    }
  }

  roomCellsIterator(iteration: (coordinates: { x: number; y: number; z: number }, cell: CellDefinition) => void) {
    this.roomsIterator((room) => {
      for (let z = 0; z < room.cells.length; z++) {
        for (let x = 0; x < room.cells[z].length; x++) {
          const cell = room.cells[z][x]
          if (!cell) continue
          const coordinates = {
            x: x * this.definition.cellSize + room.position.x * this.definition.cellSize,
            y: 0,
            z: z * this.definition.cellSize + room.position.z * this.definition.cellSize,
          }
          iteration(coordinates, cell)
        }
      }
    })
  }

  propsIterator(iteration: (coordinates: { x: number; y: number; z: number }, prop: MappingDefinition) => void) {
    this.roomCellsIterator((coordinates, cell) => {
      for (const prop of cell) {
        iteration(coordinates, prop)
      }
    })
  }

  static roomGenerator(cells: RoomDefinition['cells'], position: RoomDefinition['position']) {
    return {
      position,
      cells,
    }
  }

  static roomModifier(
    cells: RoomDefinition['cells'],
    type: string,
    id: string | string[],
    modifier: (mapping: MappingDefinition) => void,
  ) {
    for (const row of cells) {
      for (const cell of row) {
        if (cell) {
          const mapping = cell.find((definition) => definition.mod_type === type && definition.mod_id === id)
          if (mapping) {
            modifier(mapping)
          }
        }
      }
    }
  }
}
