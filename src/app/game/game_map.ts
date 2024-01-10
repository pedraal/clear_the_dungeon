import { Engine } from '../engine'
import { Mapping, Mappings } from '../props/mapping'

export class GameMap {
  cellSide = 4
  xBoundings = [-5, 5]
  zBoundings = [-2, 10]
  engine: Engine

  constructor(engine: Engine) {
    this.engine = engine
  }

  generateFloor() {
    for (let i = this.xBoundings[0]; i <= this.xBoundings[1]; i++) {
      for (let j = this.zBoundings[0]; j <= this.zBoundings[1]; j++) {
        new Mapping({
          engine: this.engine,
          name: Mappings.Floor_Dirt,
          position: { x: i * this.cellSide, y: -1, z: j * this.cellSide },
        })
      }
    }
  }
}
