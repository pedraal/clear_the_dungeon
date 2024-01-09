import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import GUI from 'lil-gui'
import Stats from 'three/examples/jsm/libs/stats.module'
import CannonDebugRenderer from './utils/cannon_debug_renderer'
import { Mapping } from './props/mapping'
import { Character } from './props/character'
import { Updatable } from './types'
import { GameStateMachine } from './game_state_machine'
import { ThirdPersonControls } from './controls/third_person_controls'
import { OverlordControls } from './controls/overlord_controls'
import { GameMap } from './game_map'
import { Score } from './score'

interface Params {
  physicsDebugger?: boolean
  gridHelper?: boolean
  axesHelper?: boolean
  debugUi?: boolean
  controls: 'third-person' | 'overlord'
}

export class GameEngine {
  static instance: GameEngine

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
  stateMachine: GameStateMachine
  controls: ThirdPersonControls | OverlordControls
  map: GameMap
  character: Character
  score: Score

  constructor(params: Params) {
    this.params = params
    const canvas = document.querySelector('canvas')
    if (!canvas)
      throw new Error('No canvas found')
    this.canvas = canvas

    this.stateMachine = new GameStateMachine(this)
    this.stateMachine.setState('loading')

    window.addEventListener('resize', this.onResize.bind(this))
    GameEngine.instance = this
  }

  init() {
    this.computeViewport()
    this.initRenderer()
    this.initClock()
    this.initPhysics()
    this.initDebugUi()
    this.initGlobalLights()
    this.initGlobalHelpers()
    this.initControls()
    this.initMap()
    this.initScore()
  }

  loadModels() {
    return Promise.all([
      Character.load(),
      Mapping.load(),
    ])
  }

  private computeViewport() {
    this.viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    }
  }

  private initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas })
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
    const defaultContactMaterial = new CANNON.ContactMaterial(
      this.defaultMaterial,
      this.defaultMaterial,
      { friction: 0.1, restitution: 0 },
    )
    this.world.addContactMaterial(defaultContactMaterial)

    if (this.params.physicsDebugger)
      this.physicsDebugger = new CannonDebugRenderer(this.scene, this.world)
  }

  private initGlobalLights() {
    const ambiantLight = new THREE.AmbientLight(0xFFFFFF, 1.5)
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 3)
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

  private initControls() {
    if (this.params.controls === 'third-person')
      this.controls = new ThirdPersonControls({
        engine: this,
        disabledAxes: [
          'z',
          'x'
        ]
      })
    else if (this.params.controls === 'overlord')
      this.controls = new OverlordControls(this)
  }

  private initMap() {
    this.map = new GameMap()
  }

  private initScore() {
    this.score = new Score()
  }

  initCharacter() {
    const controls = (this.controls instanceof ThirdPersonControls) ? this.controls : undefined

    this.character = new Character({
      name: Character.models[0],
      position: {
        x: 0,
        y: 2,
        z: 0
      },
      orientation: 0,
      controls
    })
  }

  private onResize() {
    this.computeViewport()
    this.camera.aspect = this.viewport.width / this.viewport.height
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(this.viewport.width, this.viewport.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  tick() {
    const elapsedTime = this.clock.getElapsedTime()
    const deltaTime = elapsedTime - this.previousElapsedTime
    this.previousElapsedTime = elapsedTime

    this.updatePhysics(deltaTime)
    this.updateRenderer(deltaTime, elapsedTime)
    this.updateDebugUi()
    this.stateMachine.currentState?.update(deltaTime, elapsedTime)

    window.requestAnimationFrame(() => this.tick())
  }

  private updatePhysics(deltaTime: number) {
    this.world.step(1 / 60, deltaTime, 1000)
    this.physicsDebugger?.update()
  }

  private updateRenderer(deltaTime: number, elapsedTime: number) {
    this.updatables.forEach((object) => {
      object.update(deltaTime, elapsedTime)
    })
    this.renderer.render(this.scene, this.camera)
  }

  private updateDebugUi() {
    if (!this.params.debugUi) return
    this.stats.update()
  }
}
