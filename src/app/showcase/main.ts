/// <reference types="vite/client" />
import { Showcase } from '.'

new Showcase({
  engine: {
    debugUi: import.meta.env.DEV,
  },
  box: false,
  sphere: true,
})
