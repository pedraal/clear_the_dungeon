import * as CANNON from 'cannon-es'
import GUI from 'lil-gui'
import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module'
import CannonDebugRenderer from '../../vendor/cannon_debug_renderer'
import { Character } from './props/character'
import { Mapping } from './props/mapping'
import { Updatable } from './types'

export interface Params {
  physicsDebugger?: boolean
  gridHelper?: boolean
  axesHelper?: boolean
  debugUi?: boolean
}

export class Engine {
  canvas: HTMLCanvasElement
  viewport: { width: number; height: number }
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  params: Params
  clock: THREE.Clock
  world: CANNON.World
  defaultMaterial: CANNON.Material
  physicsDebugger?: CannonDebugRenderer
  gui: GUI
  stats: Stats
  previousElapsedTime: number
  updatables: Updatable[]
  camera: THREE.PerspectiveCamera

  constructor(params: Params) {
    this.params = params

    const canvas = document.querySelector('canvas')
    if (!canvas) throw new Error('No canvas found')
    this.canvas = canvas

    this.computeViewport()
    this.initRenderer()
    this.initClock()
    this.initPhysics()
    this.initDebugUi()
    this.initGlobalLights()
    this.initGlobalHelpers()

    window.addEventListener('resize', this.onResize.bind(this))
  }

  loadModels() {
    return Promise.all([Character.load(), Mapping.load()])
  }

  private computeViewport() {
    this.viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    }
  }

  private initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true })
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(90, this.viewport.width / this.viewport.height, 0.1, 100)
    this.updatables = []

    this.renderer.setSize(this.viewport.width, this.viewport.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  private initClock() {
    this.clock = new THREE.Clock()
    this.previousElapsedTime = 0
  }

  private initPhysics() {
    this.world = new CANNON.World()
    this.world.gravity.set(0, -9.82, 0)
    const broadphase = new CANNON.SAPBroadphase(this.world)
    this.world.broadphase = broadphase
    this.world.allowSleep = true

    this.defaultMaterial = new CANNON.Material('default')
    const defaultContactMaterial = new CANNON.ContactMaterial(this.defaultMaterial, this.defaultMaterial, {
      friction: 0.1,
      restitution: 0,
    })
    this.world.addContactMaterial(defaultContactMaterial)

    if (this.params.physicsDebugger) this.physicsDebugger = new CannonDebugRenderer(this.scene, this.world)
  }

  private initGlobalLights() {
    const ambiantLight = new THREE.AmbientLight(0xffffff, 1.5)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 3)
    this.scene.add(ambiantLight, directionalLight)
  }

  private initGlobalHelpers() {
    if (this.params.gridHelper) {
      const gridHelper = new THREE.GridHelper(100, 100)
      this.scene.add(gridHelper)
    }

    if (this.params.axesHelper) {
      const axesHelper = new THREE.AxesHelper(10)
      this.scene.add(axesHelper)
    }
  }

  private initDebugUi() {
    if (!this.params.debugUi) return
    this.gui = new GUI()
    this.stats = new Stats()
    document.body.appendChild(this.stats.dom)
  }

  private onResize() {
    this.computeViewport()
    this.camera.aspect = this.viewport.width / this.viewport.height
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(this.viewport.width, this.viewport.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  tick(update: (deltaTime: number, elapsedTime: number) => void) {
    const elapsedTime = this.clock.getElapsedTime()
    const deltaTime = elapsedTime - this.previousElapsedTime
    this.previousElapsedTime = elapsedTime

    this.updatePhysics(deltaTime)
    this.updateRenderer(deltaTime, elapsedTime)
    this.updateDebugUi()

    update(deltaTime, elapsedTime)

    window.requestAnimationFrame(() => this.tick(update))
  }

  private updatePhysics(deltaTime: number) {
    this.world.step(1 / 60, deltaTime, 1000)
    this.physicsDebugger?.update()
  }

  private updateRenderer(deltaTime: number, elapsedTime: number) {
    for (const object of this.updatables) object.update(deltaTime, elapsedTime)
    this.renderer.render(this.scene, this.camera)
  }

  private updateDebugUi() {
    if (!this.params.debugUi) return
    this.stats.update()
  }
}
