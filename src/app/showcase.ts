import { OrbitControls } from './controls/orbit_controls'
import { Engine, Params as EngineParams } from './engine'
import { Mapping, Mappings } from './mapping'
import { State, StateMachine } from './utils/state_machine'

interface Params {
  engine?: EngineParams
  box?: boolean
  sphere?: boolean
}

export class Showcase {
  params: Params
  engine: Engine
  stateMachine: ShowcaseStateMachine
  controls: OrbitControls

  rowLength = 8
  cellSize = 6

  constructor(params: Params) {
    this.params = params
    this.engine = new Engine(this.params.engine || {})
    this.controls = new OrbitControls({ engine: this.engine })
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
      new Mapping({
        engine: this.engine,
        name,
        position: { x, y: 0, z },
        mass: 0,
        orientation: 0,
        shapeAlgorithm: 'sbcode-trimesh',
      })

      const fallingItem = this.params.sphere ? 'sphere' : this.params.box ? 'box' : null
      if (fallingItem)
        new Mapping({
          engine: this.engine,
          name: Mappings.Box_A,
          position: { x, y: 15, z },
          shapeAlgorithm: fallingItem,
          mass: 1,
        })

      if (x === lastCellX) {
        x = firstCellX
        z += cellSize
      } else {
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

class ShowcaseStateMachine extends StateMachine {
  showcase: Showcase
  constructor(showcase: Showcase) {
    super()
    this.showcase = showcase
    this.init()
  }

  init() {
    this.addState('loading', LoadingState)
    this.addState('idle', IdleState)
  }
}

class ShowcaseStateMachineState extends State {
  machine: ShowcaseStateMachine
}

class LoadingState extends ShowcaseStateMachineState {
  name = 'loading'

  enter() {
    this.machine.showcase.engine.load().then(() => {
      this.machine.showcase.init()
      this.machine.setState('idle')
    })
  }

  exit() {
    const loadingEl = document.querySelector<HTMLElement>('#loading')
    if (loadingEl) loadingEl.style.display = 'none'
    this.machine.showcase.tick()
  }
}

class IdleState extends ShowcaseStateMachineState {
  name = 'idle'
}
