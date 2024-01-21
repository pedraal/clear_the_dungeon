/// <reference types="vite/client" />
import { PhysicDebuggerModes } from '../app/engine'
import { Sandbox } from '../app/sandbox'

new Sandbox({
  engine: {
    debugUi: true,
    physicsDebugger: PhysicDebuggerModes.On,
  },
  controls: 'tps',
})
