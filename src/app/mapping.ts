import RAPIER from '@dimforge/rapier3d/rapier'
import * as THREE from 'three'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Engine, PhysicDebuggerModes } from './engine'
import { GenericModel } from './utils/generic_model'
import { GLTFUtils } from './utils/gltf_utils'

interface Params {
  engine: Engine
  name: Mappings
  position: { x: number; y: number; z: number }
  orientation?: number
  manualUpdate?: boolean
  bodyType?: 'dynamic' | 'fixed' | 'kinematic'
  shape?: 'box' | 'sphere' | 'trimesh' | 'convex'
}

export class Mapping extends GenericModel {
  params: Params
  engine: Engine
  mesh: THREE.Mesh
  body: RAPIER.RigidBody
  collider: RAPIER.Collider
  shape: Params['shape']
  boundingBox: THREE.Box3
  boundingSphere: THREE.Sphere

  constructor(params: Params) {
    super(params)
    this.params = params
    this.engine = this.params.engine

    this.model = GLTFUtils.cloneGltf(Mapping.gltfs[this.params.name]) as GLTF

    this.mesh = this.model.scene.children[0].clone(true) as THREE.Mesh
    this.mesh.receiveShadow = true
    this.mesh.rotation.y = Math.PI * (this.params.orientation || 0)
    this.mesh.geometry = this.mesh.geometry.clone()
    this.mesh.geometry.computeBoundingBox()
    this.mesh.geometry.computeBoundingSphere()
    this.boundingBox = this.mesh.geometry.boundingBox as THREE.Box3
    this.boundingSphere = this.mesh.geometry.boundingSphere as THREE.Sphere

    this.shape = this.params.shape || 'box'
    if (['box', 'sphere'].includes(this.shape)) {
      this.mesh.geometry.center()
    } else {
      this.mesh.geometry.translate(0, -this.boundingBox.min.y, 0)
    }

    let bodyDesc: RAPIER.RigidBodyDesc
    switch (this.params.bodyType) {
      case 'dynamic':
        bodyDesc = this.engine.rapier.RigidBodyDesc.dynamic()
        break
      case 'fixed':
        bodyDesc = this.engine.rapier.RigidBodyDesc.fixed()
        break
      case 'kinematic':
        bodyDesc = this.engine.rapier.RigidBodyDesc.kinematicVelocityBased()
        break
      default:
        bodyDesc = this.engine.rapier.RigidBodyDesc.fixed()
        break
    }

    bodyDesc
      .setTranslation(this.params.position.x, this.params.position.y, this.params.position.z)
      .setRotation(this.mesh.quaternion)

    this.body = this.engine.world.createRigidBody(bodyDesc)
    const colliderDesc = new this.engine.rapier.ColliderDesc(this.colliderShape)

    if (this.shape === 'trimesh') {
      const center = this.boundingBox.getCenter(new THREE.Vector3())
      colliderDesc.setMassProperties(
        1,
        { x: center.x, y: center.y, z: center.z },
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0, w: 1 },
      )
    }

    if (!colliderDesc) throw new Error(`No colliderDesc for ${this.params.name}`)
    this.collider = this.engine.world.createCollider(colliderDesc, this.body)

    if (this.engine.params.physicsDebugger !== PhysicDebuggerModes.Strict) this.engine.scene.add(this.mesh)
    if (!this.params.manualUpdate) this.engine.updatables.push(this)
  }

  get colliderShape() {
    if (this.params.shape === 'box')
      return new this.engine.rapier.Cuboid(
        ...(this.boundingBox.getSize(new THREE.Vector3()).divideScalar(2).toArray() as [number, number, number]),
      )
    else if (this.params.shape === 'sphere') return new this.engine.rapier.Ball(this.boundingSphere.radius)
    else if (this.params.shape === 'trimesh')
      return new this.engine.rapier.TriMesh(
        new Float32Array(this.mesh.geometry.attributes.position.array),
        new Uint32Array(this.mesh.geometry.index?.array || []),
      )
    else if (this.params.shape === 'convex')
      return new this.engine.rapier.ConvexPolyhedron(new Float32Array(this.mesh.geometry.attributes.position.array))
    else
      return new this.engine.rapier.Cuboid(
        ...(this.boundingBox.getSize(new THREE.Vector3()).divideScalar(2).toArray() as [number, number, number]),
      )
  }

  update() {
    this.mesh.position.copy(this.body.translation() as unknown as THREE.Vector3)
    this.mesh.quaternion.copy(this.body.rotation() as unknown as THREE.Quaternion)
  }

  remove() {
    this.engine.updatables = this.engine.updatables.filter((u) => u !== this)
    this.engine.world.removeRigidBody(this.body)
    this.engine.scene.remove(this.mesh)
  }

  static async load() {
    return GenericModel.load('mappings', 'gltf', Object.values(Mappings))
  }
}

// Assets source : https://kaylousberg.com/game-assets
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
