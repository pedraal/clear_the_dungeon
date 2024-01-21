/// <reference types="vite/client" />
import { PhysicDebuggerModes } from './app/engine'
import { Game } from './app/game'

const devConfig: {
  physicsDebugger: PhysicDebuggerModes
  controls: 'map' | 'tps'
} = {
  physicsDebugger: PhysicDebuggerModes.On,
  controls: 'map',
}

new Game({
  engine: {
    debugUi: import.meta.env.DEV,
    physicsDebugger: import.meta.env.DEV ? devConfig.physicsDebugger : PhysicDebuggerModes.Off,
  },
  controls: import.meta.env.DEV ? devConfig.controls : 'tps',
})
