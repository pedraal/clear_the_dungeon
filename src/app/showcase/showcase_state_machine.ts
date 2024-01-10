import { Showcase } from '.'
import { State, StateMachine } from '../utils/state_machine'

export class ShowcaseStateMachine extends StateMachine {
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

export class LoadingState extends ShowcaseStateMachineState {
  name = 'loading'

  enter() {
    this.machine.showcase.engine.loadModels().then(() => {
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

export class IdleState extends ShowcaseStateMachineState {
  name = 'idle'
}
