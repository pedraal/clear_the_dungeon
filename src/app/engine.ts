import RAPIER from '@dimforge/rapier3d/rapier'
import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module'
import { Character } from './character'
import { Mapping, Mappings } from './mapping'
import { Updatable } from './types'
import { RapierDebugRenderer } from './utils/rapier_debug_renderer'

export enum PhysicDebuggerModes {
  Off = 0,
  On = 1,
  Strict = 2,
}

export interface Params {
  physicsDebugger?: PhysicDebuggerModes
  helpers?: boolean
  debugUi?: boolean
}

export class Engine {
  canvas: HTMLCanvasElement
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  params: Params
  clock: THREE.Clock
  world: RAPIER.World
  physicsDebugger?: RapierDebugRenderer
  stats: Stats
  previousElapsedTime: number
  updatables: Updatable[]
  camera: THREE.PerspectiveCamera
  rapier: typeof RAPIER

  constructor(params: Params) {
    this.params = params

    const canvas = document.querySelector('canvas')
    if (!canvas) throw new Error('No canvas found')
    this.canvas = canvas

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true })
    this.renderer.setSize(this.viewport.width, this.viewport.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(90, this.viewport.width / this.viewport.height, 0.1, 100)
    this.updatables = []

    this.clock = new THREE.Clock()
    this.previousElapsedTime = 0

    if (this.params.debugUi) {
      this.stats = new Stats()
      document.body.appendChild(this.stats.dom)
    }
    const ambiantLight = new THREE.AmbientLight(0xffffff, 1.5)
    this.scene.add(ambiantLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 3)
    // directionalLight.position.set(-10, 10, -10)
    const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 5)
    this.scene.add(directionalLight)
    if (this.params.helpers) this.scene.add(directionalLightHelper)

    if (this.params.helpers) this.scene.add(new THREE.GridHelper(100, 100))
    if (this.params.helpers) this.scene.add(new THREE.AxesHelper(10))

    window.addEventListener('resize', this.onResize.bind(this))
  }

  load(mappings?: Set<Mappings>) {
    return Promise.all([Character.load(), Mapping.loadMappings(mappings), this.loadRapier()])
  }

  async loadRapier() {
    this.rapier = await import('@dimforge/rapier3d')
  }

  init() {
    this.initPhysics()
  }

  initPhysics() {
    this.world = new this.rapier.World({ x: 0, y: -9.81, z: 0 })
    if (this.params.physicsDebugger !== PhysicDebuggerModes.Off) this.physicsDebugger = new RapierDebugRenderer(this)
  }

  private onResize() {
    this.camera.aspect = this.viewport.width / this.viewport.height
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(this.viewport.width, this.viewport.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  tick(update: (deltaTime: number, elapsedTime: number) => void) {
    const elapsedTime = this.clock.getElapsedTime()
    const deltaTime = elapsedTime - this.previousElapsedTime
    this.previousElapsedTime = elapsedTime

    this.updatePhysics(elapsedTime)
    this.updateRenderer(deltaTime, elapsedTime)
    this.updateDebugUi()

    update(deltaTime, elapsedTime)

    window.requestAnimationFrame(() => this.tick(update))
  }

  private updatePhysics(elapsedTime: number) {
    this.world.step()
    if (Math.floor(elapsedTime) % 1 === 0) this.physicsDebugger?.update()
  }

  private updateRenderer(deltaTime: number, elapsedTime: number) {
    for (const object of this.updatables) object.update(deltaTime, elapsedTime)
    this.renderer.render(this.scene, this.camera)
  }

  private updateDebugUi() {
    if (!this.params.debugUi) return
    this.stats.update()
  }

  get viewport() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    }
  }
}
