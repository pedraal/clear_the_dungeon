import * as CANNON from 'cannon-es'
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import CannonUtils from '../../../vendor/cannon_utils'
import { Engine, PhysicDebuggerModes } from '../engine'
import { GLTFUtils } from '../utils/gltf_utils'
import { MyCannonUtils } from '../utils/my_cannon_utils'

// Assets source : https://kaylousberg.com/game-assets/prototype-bits
export enum Mappings {
  Primitive_Beam = 'Primitive_Beam',
  Primitive_Cube_Small = 'Primitive_Cube_Small',
  Primitive_Cube = 'Primitive_Cube',
  Primitive_Doorway = 'Primitive_Doorway',
  Primitive_Floor_Hole = 'Primitive_Floor_Hole',
  Primitive_Floor = 'Primitive_Floor',
  Primitive_Pillar = 'Primitive_Pillar',
  Primitive_Slope_Half_InnerCorner = 'Primitive_Slope_Half_InnerCorner',
  Primitive_Slope_Half_OuterCorner = 'Primitive_Slope_Half_OuterCorner',
  Primitive_Slope_Half = 'Primitive_Slope_Half',
  Primitive_Slope_InnerCorner = 'Primitive_Slope_InnerCorner',
  Primitive_Slope_OuterCorner = 'Primitive_Slope_OuterCorner',
  Primitive_Slope = 'Primitive_Slope',
  Primitive_Stairs_Half = 'Primitive_Stairs_Half',
  Primitive_Stairs = 'Primitive_Stairs',
  Primitive_Wall_Half = 'Primitive_Wall_Half',
  Primitive_Wall_OpenCorner = 'Primitive_Wall_OpenCorner',
  Primitive_Wall_Short = 'Primitive_Wall_Short',
  Primitive_Wall_Slope = 'Primitive_Wall_Slope',
  Primitive_Wall = 'Primitive_Wall',
  Primitive_Window = 'Primitive_Window',
  Cube_Prototype_Large_A = 'Cube_Prototype_Large_A',
  Cube_Prototype_Large_B = 'Cube_Prototype_Large_B',
  Cube_Prototype_Small = 'Cube_Prototype_Small',
  Pillar_A = 'Pillar_A',
  Pillar_B = 'Pillar_B',
  Wall_Decorated = 'Wall_Decorated',
  Wall_Doorway = 'Wall_Doorway',
  Wall_Half = 'Wall_Half',
  Wall_Target = 'Wall_Target',
  Wall_Window_Closed = 'Wall_Window_Closed',
  Wall_Window_Open = 'Wall_Window_Open',
  Wall = 'Wall',
  Door_A_Decorated = 'Door_A_Decorated',
  Door_A = 'Door_A',
  Door_B = 'Door_B',
  Floor_Dirt = 'Floor_Dirt',
  Floor_Prototype = 'Floor_Prototype',
  Floor = 'Floor',
  Pallet_Large = 'Pallet_Large',
  Pallet_Small_Decorated_A = 'Pallet_Small_Decorated_A',
  Pallet_Small_Decorated_B = 'Pallet_Small_Decorated_B',
  Pallet_Small = 'Pallet_Small',
  table_medium_Decorated = 'table_medium_Decorated',
  table_medium_long = 'table_medium_long',
  table_medium = 'table_medium',
  target_pieces_A = 'target_pieces_A',
  target_pieces_B = 'target_pieces_B',
  target_pieces_C = 'target_pieces_C',
  target_pieces_D = 'target_pieces_D',
  target_pieces_E = 'target_pieces_E',
  target_pieces_F = 'target_pieces_F',
  target_small = 'target_small',
  target_stand_A_Decorated = 'target_stand_A_Decorated',
  target_stand_A = 'target_stand_A',
  target_stand_B = 'target_stand_B',
  target_wall_large_A = 'target_wall_large_A',
  target_wall_large_B = 'target_wall_large_B',
  target_wall_small = 'target_wall_small',
  target = 'target',
  Dummy_Base = 'Dummy_Base',
  Box_A = 'Box_A',
  Box_B = 'Box_B',
  Box_C = 'Box_C',
  Coin_A = 'Coin_A',
  Coin_B = 'Coin_B',
  Coin_C = 'Coin_C',
}

interface Params {
  engine: Engine
  name: Mappings
  position: { x: number; y: number; z: number }
  orientation?: number
  mass?: number
  shapeAlgorithm?: 'convex' | 'convex-deprecated' | 'sbcode-convex' | 'sbcode-trimesh' | 'box'
}

export class Mapping {
  static gltfs: Record<string, GLTF> = {}
  static loader = new GLTFLoader()
  static async load() {
    const loadPromise = (name: string): Promise<void> =>
      new Promise((resolve) => {
        Mapping.loader.load(
          `/gltf/mappings/${name}.gltf`,
          (model) => {
            Mapping.gltfs[name] = model
            resolve()
          },
          (xhr) => {
            // console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
          },
          (error) => {
            console.error('GLTFLoader : ', error)
          },
        )
      })

    await Promise.all(Object.keys(Mappings).map((name) => loadPromise(name)))
  }

  mesh: THREE.Mesh
  body: CANNON.Body
  model: GLTF
  shapeAlgorithm: Params['shapeAlgorithm']
  params: Params
  engine: Engine

  constructor(params: Params) {
    this.params = params
    this.engine = this.params.engine
    this.model = GLTFUtils.cloneGltf(Mapping.gltfs[params.name]) as GLTF
    this.mesh = this.model.scene.children[0] as THREE.Mesh
    this.mesh.receiveShadow = true
    this.mesh.position.copy(params.position as THREE.Vector3)
    this.mesh.rotation.y = Math.PI * (params.orientation || 0)
    this.shapeAlgorithm = params.shapeAlgorithm || 'convex-deprecated'

    this.body = new CANNON.Body({
      mass: params.mass || 0,
      shape: this.cannonShape,
      material: this.engine.defaultMaterial,
    })
    const bodyPosition = new CANNON.Vec3()
    bodyPosition.copy(this.mesh.position as unknown as CANNON.Vec3)
    if (this.shapeAlgorithm === 'box') bodyPosition.y += MyCannonUtils.BoxYOffset(this.mesh.geometry)
    this.body.position.copy(bodyPosition)
    this.body.quaternion.copy(this.mesh.quaternion as unknown as CANNON.Quaternion)

    if (this.engine.params.physicsDebugger !== PhysicDebuggerModes.Strict) this.engine.scene.add(this.mesh)
    this.engine.world.addBody(this.body)
  }

  update() {
    this.mesh.position.copy(this.body.position as unknown as THREE.Vector3)
    this.mesh.quaternion.copy(this.body.quaternion as unknown as THREE.Quaternion)
  }

  get cannonShape() {
    if (this.shapeAlgorithm === 'convex') return MyCannonUtils.CreateConvexPolyhedron(this.mesh.geometry)
    else if (this.shapeAlgorithm === 'convex-deprecated')
      return MyCannonUtils.CreateConvexPolyhedronFromDeprecatedGeometry(this.mesh.geometry)
    else if (this.shapeAlgorithm === 'sbcode-convex') return CannonUtils.CreateConvexPolyhedron(this.mesh.geometry)
    else if (this.shapeAlgorithm === 'sbcode-trimesh') return CannonUtils.CreateTrimesh(this.mesh.geometry)
    else if (this.shapeAlgorithm === 'box') return MyCannonUtils.CreateBox(this.mesh.geometry)
    else return MyCannonUtils.CreateBox(this.mesh.geometry)
  }

  remove() {
    this.engine.updatables = this.engine.updatables.filter((u) => u !== this)
    this.engine.world.removeBody(this.body)
    this.engine.scene.remove(this.mesh)
  }
}
