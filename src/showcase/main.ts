/// <reference types="vite/client" />
import { Showcase } from '../app/showcase'

new Showcase({
  engine: {
    debugUi: true,
  },
  box: false,
  sphere: true,
})
