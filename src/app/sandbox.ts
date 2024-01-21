import { Character, Characters } from './character'
import { MapControls } from './controls/map_controls'
import { ThirdPersonControls } from './controls/third_person_controls'
import { Engine, Params as EngineParams } from './engine'
import { SandboxMap } from './sandbox/sandbox_map'
import { State, StateMachine } from './utils/state_machine'

interface Params {
  engine?: EngineParams
  controls: 'tps' | 'map'
}

export class Sandbox {
  params: Params
  engine: Engine
  stateMachine: SandboxStateMachine
  controls: ThirdPersonControls | MapControls
  map: SandboxMap
  character: Character

  rowLength = 8
  cellSize = 6

  constructor(params: Params) {
    this.params = params
    this.engine = new Engine(this.params.engine || {})
    this.stateMachine = new SandboxStateMachine(this)
    this.stateMachine.setState('loading')
  }

  init() {
    this.initControls()
    this.initMap()
  }

  private initControls() {
    if (this.params.controls === 'tps')
      this.controls = new ThirdPersonControls({
        engine: this.engine,
      })
    else if (this.params.controls === 'map') this.controls = new MapControls({ engine: this.engine })
  }

  private initMap() {
    this.map = new SandboxMap(this.engine)
  }

  initCharacter() {
    this.character = new Character({
      engine: this.engine,
      name: Object.values(Characters)[Math.floor(Math.random() * Object.values(Characters).length)],
      position: {
        x: this.map.spawn.x,
        y: this.map.spawn.y,
        z: this.map.spawn.z,
      },
      orientation: 0,
      controls: this.controls,
    })
  }

  tick() {
    this.engine.tick((dt, et) => {
      this.stateMachine.currentState?.update(dt, et)
    })
  }
}

class SandboxStateMachine extends StateMachine {
  sandbox: Sandbox
  constructor(sandbox: Sandbox) {
    super()
    this.sandbox = sandbox
    this.init()
  }

  init() {
    this.addState('loading', LoadingState)
    this.addState('idle', IdleState)
  }
}

class SandboxStateStateMachine extends State {
  machine: SandboxStateMachine
}

class LoadingState extends SandboxStateStateMachine {
  name = 'loading'

  enter() {
    this.machine.sandbox.init()
    this.machine.sandbox.engine.load().then(() => {
      this.machine.sandbox.engine.init()
      this.machine.sandbox.map.generate()
      this.machine.sandbox.initCharacter()

      this.machine.setState('idle')
      this.machine.sandbox.tick()
    })
  }

  exit() {
    const loadingEl = document.querySelector<HTMLElement>('#loading')
    if (loadingEl) loadingEl.style.display = 'none'
    this.machine.sandbox.tick()
  }
}

class IdleState extends SandboxStateStateMachine {
  name = 'idle'

  enter() {
    if (this.machine.sandbox.controls instanceof ThirdPersonControls) {
      this.machine.sandbox.controls.enable()
    }
    this.machine.sandbox.character.body.setTranslation(
      {
        ...this.machine.sandbox.map.spawn,
        y: this.machine.sandbox.map.spawn.y + this.machine.sandbox.character.yHalfExtend,
      },
      true,
    )
  }
}
