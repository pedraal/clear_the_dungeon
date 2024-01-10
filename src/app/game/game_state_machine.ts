import { Game } from '.'
import { ThirdPersonControls } from '../controls/third_person_controls'
import { State, StateMachine } from '../utils/state_machine'
import { Coins } from './coins'

export class GameStateMachine extends StateMachine {
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

class GameStateMachineState extends State {
  machine: GameStateMachine
}

export class LoadingState extends GameStateMachineState {
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

export class IdleState extends GameStateMachineState {
  name = 'idle'

  enter() {
    if (this.startEl) {
      this.startEl.style.display = 'block'
      this.startEl.addEventListener('click', () => this.machine.setState('playing'))
    }

    if (this.machine.game.controls instanceof ThirdPersonControls) {
      this.machine.game.controls.disabledAxes = ['x', 'z', 'y']
      this.machine.game.controls.lookBackward = true
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

export class PlayingState extends GameStateMachineState {
  name = 'playing'
  duration = 60
  coins: Coins

  enter() {
    this.machine.game.score.reset()
    if (this.machine.game.controls instanceof ThirdPersonControls) {
      this.machine.game.controls.disabledAxes = []
      this.machine.game.controls.lookBackward = false
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

export class GameOverState extends GameStateMachineState {
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
