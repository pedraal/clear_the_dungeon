import { Coins } from "./coins";
import { ThirdPersonControls } from "./controls/third_person_controls";
import { GameEngine } from "./game_engine";
import { GameMap } from "./game_map";
import { Character } from "./props/character";
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

let character: Character

export class LoadingState extends GameStateMachineState {
  name = 'loading'

  enter() {
    this.machine.engine.init()
    this.machine.engine.loadModels().then(() => {
      const map = new GameMap()
      map.generateFloor()

      const controls = (this.machine.engine.controls instanceof ThirdPersonControls) ? this.machine.engine.controls : undefined

      character = new Character({
        name: Character.models[0],
        position: {
          x: 0,
          y: 2,
          z: 0
        },
        orientation: 0,
        controls
      })

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
  coins: Coins;

  enter() {
    if (this.machine.engine.controls instanceof ThirdPersonControls) {
      this.machine.engine.controls.disabledAxes = []
      this.machine.engine.controls.lookBackward = false
    }
    this.coins = new Coins(character.mesh)
    document.querySelector<HTMLElement>('#playing-ui')!.style.display = 'block'
  }

  update(deltaTime: number, elapsedTime: number) {
    this.duration -= deltaTime
    document.querySelector<HTMLElement>('#timer')!.innerHTML = this.duration.toFixed(2)
    character.update(deltaTime, elapsedTime)

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
