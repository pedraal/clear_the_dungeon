import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { GameEngine } from '../game_engine'

export class Floor {
  static Geometry = new THREE.PlaneGeometry(50, 50)
  static Material = new THREE.MeshBasicMaterial({ color: 0x444444 })
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial, THREE.Object3DEventMap>
  body: CANNON.Body

  constructor(position: { x: number, y: number, z: number }) {
    this.mesh = new THREE.Mesh(
      Floor.Geometry,
      Floor.Material,
    )
    this.mesh.name = 'Floor'
    this.mesh.rotation.x = -Math.PI / 2
    this.mesh.castShadow = true
    this.mesh.position.copy(position as unknown as THREE.Vector3)

    this.body = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: GameEngine.instance.defaultMaterial,
    })
    this.body.position.copy(this.mesh.position as unknown as CANNON.Vec3)
    this.body.quaternion.copy(this.mesh.quaternion as unknown as CANNON.Quaternion)

    if (!GameEngine.instance.physicsDebugger) GameEngine.instance.scene.add(this.mesh)
    GameEngine.instance.world.addBody(this.body)
  }
}
