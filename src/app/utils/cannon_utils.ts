import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { Geometry } from '../../../vendor/deprecated_geometry'

// biome-ignore lint/complexity/noStaticOnlyClass: Because why not.
export class CannonUtils {
  public static CreateBox(geometry: THREE.BufferGeometry): CANNON.Box {
    const size = new THREE.Vector3()
    geometry.computeBoundingBox()
    geometry.boundingBox?.getSize(size)
    return new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2))
  }

  public static CreateSphere(geometry: THREE.BufferGeometry): CANNON.Sphere {
    geometry.computeBoundingSphere()
    const radius = geometry.boundingSphere?.radius || 1
    return new CANNON.Sphere(radius)
  }

  public static BoxYOffset(geometry: THREE.BufferGeometry): number {
    const size = new THREE.Vector3()
    geometry.computeBoundingBox()
    geometry.boundingBox?.getSize(size)
    return size.y / 2
  }

  public static CreateBoxFromThreeBox(threeBox: THREE.Box3): CANNON.Box {
    const size = new THREE.Vector3()
    threeBox.getSize(size)
    return new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2))
  }

  public static CreateConvexPolyhedron(geometry: THREE.BufferGeometry): CANNON.ConvexPolyhedron {
    const cleanedGeometry = BufferGeometryUtils.mergeVertices(geometry)

    const geometryPosition = cleanedGeometry.attributes.position
    const positionVertices: CANNON.Vec3[] = []
    for (let i = 0; i < geometryPosition.array.length; i += 3) {
      positionVertices.push(
        new CANNON.Vec3(geometryPosition.array[i], geometryPosition.array[i + 1], geometryPosition.array[i + 2]),
      )
    }

    if (!cleanedGeometry.index) throw new Error('Mesh does not have an index')

    const indexes = cleanedGeometry.index.array
    const faces: number[][] = []
    for (let i = 0; i < indexes.length; i += 3) {
      faces.push([indexes[i], indexes[i + 1], indexes[i + 2]])
    }

    const geometryNormal = cleanedGeometry.attributes.position
    const verticesNormal: CANNON.Vec3[] = []
    for (let i = 0; i < geometryNormal.array.length; i += 3) {
      verticesNormal.push(
        new CANNON.Vec3(geometryNormal.array[i], geometryNormal.array[i + 1], geometryNormal.array[i + 2]),
      )
    }

    /**
     * Use this to return the shape without normals
     * (you will see "looks like it points into the shape? The vertices follow. Make sure they are ordered CCW around the normal, using the right hand rule." errors)
     */
    // (you will see "looks like it points into the shape? The vertices follow. Make sure they are ordered CCW around the normal, using the right hand rule." errors)
    // return new CANNON.ConvexPolyhedron({ vertices: positionVertices, faces })

    /**
     * Use this to force CANNON to compute the normals
     * (you will see "looks like it points into the shape? The vertices follow. Make sure they are ordered CCW around the normal, using the right hand rule." errors)
     */
    // const shape = new CANNON.ConvexPolyhedron({ vertices: positionVertices, faces })
    // shape.computeNormals()
    // return shape

    return new CANNON.ConvexPolyhedron({ vertices: positionVertices, faces, normals: verticesNormal })
  }

  public static CreateConvexPolyhedronFromDeprecatedGeometry(geometry: THREE.BufferGeometry): CANNON.ConvexPolyhedron {
    const geo = new Geometry().fromBufferGeometry(geometry)
    geo.mergeVertices()

    return new CANNON.ConvexPolyhedron({
      vertices: geo.vertices.map((v) => new CANNON.Vec3(v.x, v.y, v.z)),
      faces: geo.faces.map((f) => [f.a, f.b, f.c]),
      normals: geo.faces.map((f) => new CANNON.Vec3(f.normal.x, f.normal.y, f.normal.z)),
    })
  }
}
