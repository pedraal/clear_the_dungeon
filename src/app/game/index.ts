import { Engine, Params as EngineParams } from '../engine'
import { Character } from '../props/character'
import { GameStateMachine } from './game_state_machine'
import { ThirdPersonControls } from '../controls/third_person_controls'
import { OverlordControls } from '../controls/overlord_controls'
import { GameMap } from './game_map'
import { Score } from './score'

interface Params {
  engine?: EngineParams
  controls: 'third-person' | 'overlord'
}

export class Game {
  params: Params
  engine: Engine
  stateMachine: GameStateMachine
  controls: ThirdPersonControls | OverlordControls
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
    if (this.params.controls === 'third-person')
      this.controls = new ThirdPersonControls({
        engine: this.engine,
        disabledAxes: [
          'z',
          'x'
        ]
      })
    else if (this.params.controls === 'overlord')
      this.controls = new OverlordControls(this.engine)
  }

  private initMap() {
    this.map = new GameMap(this.engine)
  }

  private initScore() {
    this.score = new Score()
  }

  initCharacter() {
    const controls = (this.controls instanceof ThirdPersonControls) ? this.controls : undefined

    this.character = new Character({
      engine: this.engine,
      name: Character.models[0],
      position: {
        x: 0,
        y: 2,
        z: 0
      },
      orientation: 0,
      controls
    })
  }

  tick() {
    this.engine.tick((dt, et) => {
      this.stateMachine.currentState?.update(dt, et)
    })
  }
}
