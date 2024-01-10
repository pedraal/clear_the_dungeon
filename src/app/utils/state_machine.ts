type StateClass = typeof State

export class StateMachine {
  states: Record<string, StateClass>
  currentState: State | undefined

  constructor() {
    this.states = {}
    this.currentState = undefined
  }

  init() {}

  addState(name: string, state: StateClass) {
    this.states[name] = state
  }

  setState(name: string) {
    const prevState = this.currentState
    if (prevState) {
      if (prevState.name !== name) {
        prevState.exit()
      } else return
    }

    const stateClass = this.states[name]
    this.currentState = new stateClass(this)
    this.currentState.enter(prevState)
  }
}

export class State {
  machine: StateMachine
  name: string

  constructor(machine: StateMachine) {
    this.machine = machine

    if (this.name === '') {
      throw new Error('State name cannot be empty')
    }
  }

  enter(prevState?: State) {}
  update(deltaTime: number, elapsedTime: number) {}
  exit() {}
}
