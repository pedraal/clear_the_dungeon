import { GameEngine } from './game_engine'

new GameEngine({
  debugUi: import.meta.env.DEV,
  controls: 'third-person',
})
