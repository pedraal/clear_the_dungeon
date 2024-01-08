import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { GameEngine } from '../game_engine'

export class Box {
  static Geometry = new THREE.BoxGeometry(1, 1, 1)
  static Material = new THREE.MeshBasicMaterial({ color: 0x0000FF })
  mesh: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial, THREE.Object3DEventMap>
  body: CANNON.Body

  constructor(side: number, position: { x: number, y: number, z: number }) {
    this.mesh = new THREE.Mesh(
      Box.Geometry,
      Box.Material,
    )
    this.mesh.name = 'Box'
    this.mesh.scale.set(side, side, side)
    this.mesh.castShadow = true
    this.mesh.position.copy(position as unknown as THREE.Vector3)

    this.body = new CANNON.Body({
      mass: 1,
      shape: new CANNON.Sphere(side * 0.5), // This fixes the weird box to convex polyhedron colling issue
      material: GameEngine.instance.defaultMaterial,
    })
    this.body.position.copy(position as unknown as CANNON.Vec3)

    if (!GameEngine.instance.physicsDebugger) GameEngine.instance.scene.add(this.mesh)
    GameEngine.instance.world.addBody(this.body)
    GameEngine.instance.updatables.push(this)
  }

  update() {
    this.mesh.position.copy(this.body.position as unknown as THREE.Vector3)
    this.mesh.quaternion.copy(this.body.quaternion as unknown as THREE.Quaternion)
  }
}
