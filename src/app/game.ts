import { OrbitControls } from './controls/orbit_controls'
import { ThirdPersonControls } from './controls/third_person_controls'
import { Engine, Params as EngineParams } from './engine'
import { Coins } from './game/coins'
import { GameMap } from './game/game_map'
import { Score } from './game/score'
import { Character, Characters } from './props/character'
import { State, StateMachine } from './utils/state_machine'

interface Params {
  engine?: EngineParams
  controls: 'tps' | 'orbit'
}

export class Game {
  params: Params
  engine: Engine
  stateMachine: GameStateMachine
  controls: ThirdPersonControls | OrbitControls
  map: GameMap
  character: Character
  score: Score

  constructor(params: Params) {
    this.params = params
    this.engine = new Engine(this.params.engine || {})
    this.stateMachine = new GameStateMachine(this)
    this.stateMachine.setState('loading')
  }

  init() {
    this.initControls()
    this.initMap()
    this.initScore()
  }

  private initControls() {
    if (this.params.controls === 'tps')
      this.controls = new ThirdPersonControls({
        engine: this.engine,
      })
    else if (this.params.controls === 'orbit') this.controls = new OrbitControls({ engine: this.engine })
  }

  private initMap() {
    this.map = new GameMap(this.engine)
  }

  private initScore() {
    this.score = new Score()
  }

  initCharacter() {
    this.character = new Character({
      engine: this.engine,
      name: Object.values(Characters)[Math.floor(Math.random() * Object.values(Characters).length)],
      position: {
        x: 0,
        y: 2,
        z: 0,
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
    this.machine.game.engine.loadModels().then(() => {
      this.machine.game.map.generateFloor()
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
  duration = 60
  coins: Coins

  enter() {
    this.machine.game.score.reset()
    if (this.machine.game.controls instanceof ThirdPersonControls) {
      this.machine.game.controls.enable()
    }
    this.machine.game.character.mesh.position.set(0, 0, 0)
    this.coins = new Coins(this.machine.game)
    if (this.playingUiEl) this.playingUiEl.style.display = 'block'
  }

  update(deltaTime: number) {
    this.duration -= deltaTime
    if (this.timerEl) this.timerEl.innerHTML = this.duration.toFixed(2)

    if (this.duration <= 0) {
      this.machine.setState('game-over')
    }
  }

  exit() {
    this.coins.remove()
    if (this.playingUiEl) this.playingUiEl.style.display = 'none'
  }

  get playingUiEl() {
    return document.querySelector<HTMLElement>('#playing-ui')
  }

  get timerEl() {
    return document.querySelector<HTMLElement>('#timer')
  }
}

class GameOverState extends GameState {
  name = 'game-over'
  duration = 5

  enter() {
    if (this.gameOverEl) this.gameOverEl.style.display = 'flex'
  }

  update(deltaTime: number) {
    this.duration -= deltaTime
    if (this.duration <= 0) {
      this.machine.setState('idle')
    }
  }

  exit() {
    if (this.gameOverEl) this.gameOverEl.style.display = 'none'
  }

  get gameOverEl() {
    return document.querySelector<HTMLElement>('#game-over')
  }
}
