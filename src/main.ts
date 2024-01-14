/// <reference types="vite/client" />
import { PhysicDebuggerModes } from './app/engine'
import { Game } from './app/game'

new Game({
  engine: {
    debugUi: import.meta.env.DEV,
    physicsDebugger: PhysicDebuggerModes.On,
  },
  controls: 'tps',
})
