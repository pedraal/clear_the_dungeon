import { Engine, Params as EngineParams } from '../engine'
import { Character } from '../props/character'
import { OverlordControls } from '../controls/overlord_controls'
import { Mapping, Mappings } from '../props/mapping'
import { Sphere } from '../props/sphere'
import { Box } from '../props/box'
import { ShowcaseStateMachine } from './showcase_state_machine'

interface Params {
  engine?: EngineParams
  box?: boolean
  sphere?: boolean
}

export class Showcase {
  params: Params
  engine: Engine
  stateMachine: ShowcaseStateMachine
  controls: OverlordControls

  rowLength = 8
  cellSize = 6

  constructor(params: Params) {
    this.params = params
    this.engine = new Engine(this.params.engine || {})
    this.controls = new OverlordControls(this.engine)
    this.engine.camera.position.set(60, 30, 60)
    this.stateMachine = new ShowcaseStateMachine(this)
    this.stateMachine.setState('loading')
  }

  init() {
    const rowLength = 9
    const cellSize = 6

    const firstCellX = 0
    const firstCellZ = 0
    const lastCellX = (rowLength - 1) * cellSize

    let x = firstCellX
    let z = firstCellZ

    for (const name of [...Object.values(Mappings)]) {
      new Mapping({ engine: this.engine, name, position: { x, y: 0, z }, mass: 0, orientation: 0 })

      if (this.params.sphere)
        new Sphere({engine: this.engine, radius: 0.5, position: { x, y: 8, z }})
      else if (this.params.box)
        new Box({engine: this.engine, side: 0.5, position: { x, y: 8, z }})

      if (x === lastCellX) {
        x = firstCellX
        z += cellSize
      }
      else {
        x += cellSize
      }
    }
  }

  tick() {
    this.engine.tick((dt, et) => {})
  }
}



//   static mappingShowcase(index: number, options: { sphere?: boolean, box?: true, shapeAlgorithm?: Mapping['shapeAlgorithm'] }) {
//   new Mapping(Mapping.models[index], { position: { x: 0, y: 2, z: 0 }, mass: 0, orientation: 0, shapeAlgorithm: options.shapeAlgorithm })
//   let y = 6
//   for (const z of [-1.5, 0, 1.5]) {
//     for (const x of [-1.5, 0, 1.5]) {
//       if (options.sphere)
//         new Sphere(0.5, { x, y, z })
//       else if (options.box)
//         new Box(0.5, { x, y, z })

//       y += 2
//     }
//   }
// }
