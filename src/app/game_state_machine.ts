import { Coins } from "./coins";
import { ThirdPersonControls } from "./controls/third_person_controls";
import { GameEngine } from "./game_engine";
import { State, StateMachine } from "./utils/state_machine";

export class GameStateMachine extends StateMachine {
  engine: GameEngine;
  constructor(engine: GameEngine) {
    super()
    this.engine = engine
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
  machine: GameStateMachine;
}

export class LoadingState extends GameStateMachineState {
  name = 'loading'

  enter() {
    this.machine.engine.init()
    this.machine.engine.loadModels().then(() => {
      this.machine.engine.map.generateFloor()
      this.machine.engine.initCharacter()

      this.machine.setState('idle')
      this.machine.engine.tick()
    })
  }

  exit() {
    document.querySelector<HTMLElement>('#loading')!.style.display = 'none'
  }
}

export class IdleState extends GameStateMachineState {
  name = 'idle'

  enter() {
    document.querySelector<HTMLElement>('#start')!.style.display = 'block'
    document.querySelector<HTMLElement>('#start')!.addEventListener('click', () => this.machine.setState('playing'))

    if (this.machine.engine.controls instanceof ThirdPersonControls) {
      this.machine.engine.controls.disabledAxes = ['x', 'z', 'y']
      this.machine.engine.controls.lookBackward = true
    }
  }

  exit() {
    document.querySelector<HTMLElement>('#start')!.style.display = 'none'
  }
}

export class PlayingState extends GameStateMachineState {
  name = 'playing'
  duration = 60
  coins: Coins

  enter() {
    this.machine.engine.score.reset()
    if (this.machine.engine.controls instanceof ThirdPersonControls) {
      this.machine.engine.controls.disabledAxes = []
      this.machine.engine.controls.lookBackward = false
    }
    this.machine.engine.character.mesh.position.set(0, 0, 0)
    this.coins = new Coins(this.machine.engine)
    document.querySelector<HTMLElement>('#playing-ui')!.style.display = 'block'
  }

  update(deltaTime: number, elapsedTime: number) {
    this.duration -= deltaTime
    document.querySelector<HTMLElement>('#timer')!.innerHTML = this.duration.toFixed(2)

    if (this.duration <= 0) {
      this.machine.setState('game-over')
    }
  }

  exit() {
    this.coins.remove()
    document.querySelector<HTMLElement>('#playing-ui')!.style.display = 'none'
  }
}

export class GameOverState extends GameStateMachineState {
  name = 'game-over'
  duration = 5

  enter() {
    document.querySelector<HTMLElement>('#game-over')!.style.display = 'flex'
  }

  update(deltaTime: number, elapsedTime: number) {
    this.duration -= deltaTime
    if (this.duration <= 0) {
      this.machine.setState('idle')
    }
  }

  exit() {
    document.querySelector<HTMLElement>('#game-over')!.style.display = 'none'
  }
}
