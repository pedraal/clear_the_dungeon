/// <reference types="vite/client" />
import { Game } from '.'

new Game({
  engine: {
    debugUi: import.meta.env.DEV,
  },
  controls: 'third-person',
})
