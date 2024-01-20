import RAPIER from '@dimforge/rapier3d/rapier'
import { MapControls } from './controls/map_controls'
import { Engine, Params as EngineParams } from './engine'
import { Mapping, Mappings } from './mapping'
import { State, StateMachine } from './utils/state_machine'

interface Params {
  engine?: EngineParams
  fallingItems?: boolean
}

let boxBody1: RAPIER.RigidBody
let boxBody2: RAPIER.RigidBody
let boxBody3: RAPIER.RigidBody
let box: Mapping
export class Showcase {
  params: Params
  engine: Engine
  stateMachine: ShowcaseStateMachine
  controls: MapControls

  rowLength = 8
  cellSize = 6

  constructor(params: Params) {
    this.params = params
    this.engine = new Engine(this.params.engine || {})
    this.controls = new MapControls({ engine: this.engine })
    this.stateMachine = new ShowcaseStateMachine(this)
    this.stateMachine.setState('loading')
  }

  init() {
    this.initModelsShowcase()
  }

  initModelsShowcase() {
    const rowLength = 9
    const cellSize = 6

    const firstCellX = -(rowLength / 2) * cellSize
    const firstCellZ = -(rowLength / 2) * cellSize
    let currentRowItem = 0

    let x = firstCellX
    let z = firstCellZ

    for (const name of [...Object.values(Mappings)]) {
      new Mapping({
        engine: this.engine,
        name,
        position: { x, y: 0, z },
        orientation: 0,
        shape: 'trimesh',
      })

      if (this.params.fallingItems)
        new Mapping({
          engine: this.engine,
          name: currentRowItem % 2 === 0 ? Mappings.Box_A : Mappings.Coin_A,
          position: { x, y: 10, z },
          bodyType: 'dynamic',
          shape: 'box',
        })

      if (currentRowItem === rowLength) {
        x = firstCellX
        z += cellSize
        currentRowItem = 0
      } else {
        x += cellSize
        currentRowItem++
      }
    }
  }

  initExperimental() {
    const floorBody = this.engine.world.createRigidBody(
      this.engine.rapier.RigidBodyDesc.fixed().setTranslation(0, 0, 0).setRotation({ w: 1.0, x: 0.0, y: 0.0, z: 0.0 }),
    )
    this.engine.world.createCollider(this.engine.rapier.ColliderDesc.cuboid(5, 0.1, 5), floorBody)

    boxBody1 = this.engine.world.createRigidBody(
      this.engine.rapier.RigidBodyDesc.kinematicPositionBased().setTranslation(-3, 1.1, -3),
    )
    this.engine.world.createCollider(this.engine.rapier.ColliderDesc.cuboid(1, 1, 1), boxBody1)

    boxBody2 = this.engine.world.createRigidBody(
      this.engine.rapier.RigidBodyDesc.kinematicVelocityBased().setTranslation(3, 1.1, 3).setAngularDamping(50),
    )
    this.engine.world.createCollider(this.engine.rapier.ColliderDesc.cuboid(1, 1, 1), boxBody2)

    boxBody3 = this.engine.world.createRigidBody(
      this.engine.rapier.RigidBodyDesc.dynamic().setTranslation(0, 0, 0).setLinearDamping(0),
    )
    this.engine.world.createCollider(this.engine.rapier.ColliderDesc.cuboid(1, 1, 1).setRestitution(0.7), boxBody3)
    boxBody3.addTorque({ x: 40.0, y: 0.0, z: 0.0 }, true)

    const box = new Mapping({
      engine: this.engine,
      name: Mappings.Box_A,
      position: { x: 0, y: 10, z: 0 },
      bodyType: 'dynamic',
      shape: 'trimesh',
    })
  }

  tick() {
    this.engine.tick((dt, et) => {
      // boxBody1.setAngvel({ x: 0, y: 0, z: 1 }, true)
      // boxBody2.setAngvel({ x: 0, y: 0, z: 2 }, true)
    })
  }
}

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
      this.machine.showcase.engine.init()
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
