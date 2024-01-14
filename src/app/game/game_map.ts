import * as THREE from 'three'
import { Engine } from '../engine'
import { Mapping, Mappings } from '../props/mapping'
import { Sphere } from '../props/sphere'

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
      y: 0,
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
        this.injectMapping(x, -0.5, z, Mappings.Floor_Dirt, 'box')
      }
    }

    this.injectMapping(5, 0, 4, Mappings.Cube_Prototype_Large_B, 'box')
    this.injectMapping(7, 0, 4, Mappings.Cube_Prototype_Small, 'box')
    // this.definition
    //   .get(7)
    //   ?.get(6)
    //   ?.push(
    //     new Sphere({ radius: 1, position: { x: 6 * this.cellSide, y: 1, z: 4 * this.cellSide }, engine: this.engine }),
    //   )
  }

  injectMapping(x: number, y: number, z: number, mappingName: Mappings, shapeAlgorithm?: Mapping['shapeAlgorithm']) {
    this.getCell(x, z)?.push(
      new Mapping({
        engine: this.engine,
        name: mappingName,
        position: { y, ...this.convertMapPosition(x, z) },
        shapeAlgorithm,
      }),
    )
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
