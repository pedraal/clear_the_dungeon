/// <reference types="vite/client" />
import { Game } from './app/game'

new Game({
  engine: {
    debugUi: import.meta.env.DEV,
  },
  controls: 'tps',
})
