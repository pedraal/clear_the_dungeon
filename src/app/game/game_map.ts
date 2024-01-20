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
      x: 5 * this.cellSide,
      y: 1,
      z: 2 * this.cellSide,
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
    for (let x = this.xBoundings[0]; x <= this.xBoundings[1]; x++) {
      for (let z = this.zBoundings[0]; z <= this.zBoundings[1]; z++) {
        this.pushProp(x, -0.3, z, (x, y, z) => {
          return new Mapping({
            engine: this.engine,
            name: Mappings.Floor_Dirt,
            position: { y, ...this.convertMapPosition(x, z) },
          })
        })
      }
    }

    this.pushProp(6, 0, 4, (x, y, z) => {
      return new Mapping({
        engine: this.engine,
        name: Mappings.target_stand_A,
        orientation: 1,
        shape: 'trimesh',
        position: { y, ...this.convertMapPosition(x, z) },
      })
    })

    this.pushProp(5, 0, 4, (x, y, z) => {
      return new Mapping({
        engine: this.engine,
        name: Mappings.Cube_Prototype_Small,
        shape: 'trimesh',
        position: { y, ...this.convertMapPosition(x, z) },
      })
    })

    this.pushProp(4, 0, 4, (x, y, z) => {
      return new Mapping({
        engine: this.engine,
        name: Mappings.Cube_Prototype_Large_A,
        shape: 'trimesh',
        position: { y, ...this.convertMapPosition(x, z) },
      })
    })

    this.pushProp(3, 0, 4, (x, y, z) => {
      return new Mapping({
        engine: this.engine,
        name: Mappings.Primitive_Slope,
        shape: 'trimesh',
        orientation: 0.5,
        position: { y, ...this.convertMapPosition(x, z) },
      })
    })

    this.pushProp(2, 0, 4, (x, y, z) => {
      return new Mapping({
        engine: this.engine,
        name: Mappings.Primitive_Stairs,
        shape: 'convex',
        orientation: 0.5,
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
