import { Engine } from '../engine'
import { Mapping, Mappings } from '../mapping'

export class GameMap {
  cellSide = 4
  xBoundings = [0, 10]
  zBoundings = [0, 12]
  spawn: { x: number; y: number; z: number }
  engine: Engine
  definition: Map<number, Map<number, Mapping[]>>

  constructor(engine: Engine) {
    this.engine = engine
    this.spawn = {
      x: 0 * this.cellSide,
      y: 1,
      z: 0 * this.cellSide,
    }
    this.initDefinition()
  }

  initDefinition() {
    this.definition = new Map<number, Map<number, Mapping[]>>()
    for (let i = this.xBoundings[0]; i <= this.xBoundings[1]; i++) {
      this.definition.set(i, new Map<number, Mapping[]>())
      for (let j = this.zBoundings[0]; j <= this.zBoundings[1]; j++) {
        this.definition.get(i)?.set(j, [])
      }
    }
  }

  generate() {
    this.pushProp(0, 0, 0, (x, y, z) => {
      return new Mapping({
        engine: this.engine,
        name: Mappings.floor_dirt_large,
        position: { y, ...this.convertMapPosition(x, z) },
      })
    })
  }

  pushProp(x: number, y: number, z: number, block: (x: number, y: number, z: number) => Mapping) {
    const prop = block(x, y, z)
    this.getCell(x, z)?.push(prop)
    return prop
  }

  getCell(x: number, z: number) {
    return this.definition.get(x)?.get(z)
  }

  convertMapPosition(x: number, z: number) {
    return {
      x: x * this.cellSide,
      z: z * this.cellSide,
    }
  }
}
