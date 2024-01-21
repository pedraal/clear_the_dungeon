import { Character, Characters } from './character'
import { MapControls } from './controls/map_controls'
import { ThirdPersonControls } from './controls/third_person_controls'
import { Engine, Params as EngineParams } from './engine'
import { GameMap } from './game/game_map'
import { State, StateMachine } from './utils/state_machine'

interface Params {
  engine?: EngineParams
  controls: 'tps' | 'map'
}

export class Game {
  params: Params
  engine: Engine
  stateMachine: GameStateMachine
  controls: ThirdPersonControls | MapControls
  map: GameMap
  character: Character

  constructor(params: Params) {
    this.params = params
    this.engine = new Engine(this.params.engine || {})
    this.stateMachine = new GameStateMachine(this)
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
    this.map = new GameMap(this.engine)
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

class GameStateMachine extends StateMachine {
  game: Game
  constructor(game: Game) {
    super()
    this.game = game
    this.init()
  }

  init() {
    this.addState('loading', LoadingState)
    this.addState('idle', IdleState)
    this.addState('playing', PlayingState)
    this.addState('game-over', GameOverState)
  }
}

class GameState extends State {
  machine: GameStateMachine
}

class LoadingState extends GameState {
  name = 'loading'

  enter() {
    this.machine.game.init()
    this.machine.game.engine.load().then(() => {
      this.machine.game.engine.init()
      this.machine.game.map.generate()
      this.machine.game.initCharacter()

      this.machine.setState('idle')
      this.machine.game.tick()
    })
  }

  exit() {
    const loadingEl = document.querySelector<HTMLElement>('#loading')
    if (loadingEl) loadingEl.style.display = 'none'
  }
}

class IdleState extends GameState {
  name = 'idle'

  enter() {
    if (this.startEl) {
      this.startEl.style.display = 'block'
      this.startEl.addEventListener('click', () => this.machine.setState('playing'))
    }

    if (this.machine.game.controls instanceof ThirdPersonControls) {
      this.machine.game.controls.disable()
    }
  }

  exit() {
    if (this.startEl) {
      this.startEl.removeEventListener('click', () => this.machine.setState('playing'))
      this.startEl.style.display = 'none'
    }
  }

  get startEl() {
    return document.querySelector<HTMLElement>('#start')
  }
}

class PlayingState extends GameState {
  name = 'playing'
  duration = 6000

  enter() {
    if (this.machine.game.controls instanceof ThirdPersonControls) {
      this.machine.game.controls.enable()
    }
    this.machine.game.character.body.setTranslation(
      { ...this.machine.game.map.spawn, y: this.machine.game.map.spawn.y + this.machine.game.character.yHalfExtend },
      true,
    )
  }

  update(deltaTime: number) {
    this.duration -= deltaTime

    if (this.duration <= 0) {
      this.machine.setState('game-over')
    }
  }

  exit() {}
}

class GameOverState extends GameState {
  name = 'game-over'
  duration = 5

  enter() {}

  update(deltaTime: number) {
    this.duration -= deltaTime
    if (this.duration <= 0) {
      this.machine.setState('idle')
    }
  }

  exit() {}
}
