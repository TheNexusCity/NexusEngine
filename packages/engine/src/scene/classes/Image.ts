import {
  Object3D,
  MeshBasicMaterial,
  SphereBufferGeometry,
  DoubleSide,
  Mesh,
  sRGBEncoding,
  LinearFilter,
  PlaneBufferGeometry,
  MeshStandardMaterial
} from 'three'
import loadTexture from '../../assets/functions/loadTexture'
export const ImageProjection = {
  Flat: 'flat',
  Equirectangular360: '360-equirectangular'
}
export const ImageAlphaMode = {
  Opaque: 'opaque',
  Blend: 'blend',
  Mask: 'mask'
}
export default class Image extends Object3D {
  _src: any
  _projection: string
  _alphaMode: string
  _alphaCutoff: number
  _mesh: Mesh
  _texture: any
  constructor() {
    super()
    this._src = null
    this._projection = 'flat'
    this._alphaMode = ImageAlphaMode.Opaque
    this._alphaCutoff = 0.5
    const geometry = new PlaneBufferGeometry()
    const material = new MeshBasicMaterial()
    material.side = DoubleSide
    material.transparent = this.alphaMode === ImageAlphaMode.Blend
    material.alphaTest = this.alphaMode === ImageAlphaMode.Mask ? this._alphaCutoff : 0
    this._mesh = new Mesh(geometry, material)
    this._mesh.name = 'ImageMesh'
    ;(this as any).add(this._mesh)
    this._texture = null
  }
  get src() {
    return this._src
  }
  set src(src) {
    this.load(src).catch(console.error)
  }
  loadTexture(src) {
    return loadTexture(src)
  }
  get alphaMode() {
    return this._alphaMode
  }
  set alphaMode(v) {
    this._alphaMode = v
    ;(this._mesh.material as MeshStandardMaterial).transparent = v === ImageAlphaMode.Blend
    ;(this._mesh.material as MeshStandardMaterial).alphaTest = v === ImageAlphaMode.Mask ? this.alphaCutoff : 0
    ;(this._mesh.material as MeshStandardMaterial).needsUpdate = true
  }
  get alphaCutoff() {
    return this._alphaCutoff
  }
  set alphaCutoff(v) {
    this._alphaCutoff = v
    ;(this._mesh.material as MeshStandardMaterial).alphaTest = v
    ;(this._mesh.material as MeshStandardMaterial).needsUpdate = true
  }
  get projection() {
    return this._projection
  }
  set projection(projection) {
    const material = new MeshBasicMaterial()
    let geometry
    if (projection === '360-equirectangular') {
      geometry = new SphereBufferGeometry(1, 64, 32)
      // invert the geometry on the x-axis so that all of the faces point inward
      geometry.scale(-1, 1, 1)
    } else {
      geometry = new PlaneBufferGeometry()
      material.side = DoubleSide
    }
    material.map = this._texture
    material.transparent = this.alphaMode === ImageAlphaMode.Blend
    material.alphaTest = this.alphaMode === ImageAlphaMode.Mask ? this._alphaCutoff : 0
    this._projection = projection
    const nextMesh = new Mesh(geometry, material)
    nextMesh.name = 'ImageMesh'
    nextMesh.visible = this._mesh.visible
    const meshIndex = (this as any).children.indexOf(this._mesh)
    if (meshIndex === -1) {
      ;(this as any).add(nextMesh)
    } else {
      ;(this as any).children.splice(meshIndex, 1, nextMesh)
      nextMesh.parent = this
    }
    this._mesh = nextMesh
    this.onResize()
  }
  async load(src) {
    this._src = src
    this._mesh.visible = false
    const material = this._mesh.material as MeshStandardMaterial
    if (material.map) {
      material.map.dispose()
    }
    const texture = (await this.loadTexture(src)) as any
    if (!texture) return this
    // TODO: resize to maintain aspect ratio but still allow scaling.
    texture.encoding = sRGBEncoding
    texture.minFilter = LinearFilter
    this._texture = texture
    this.onResize()
    material.transparent = this.alphaMode === ImageAlphaMode.Blend
    material.alphaTest = this.alphaMode === ImageAlphaMode.Mask ? this._alphaCutoff : 0
    ;(this._mesh.material as MeshStandardMaterial).map = this._texture
    ;(this._mesh.material as MeshStandardMaterial).needsUpdate = true
    this._mesh.visible = true
    return this
  }
  onResize() {
    if (this._texture && this.projection === ImageProjection.Flat) {
      const ratio = (this._texture.image.height || 1.0) / (this._texture.image.width || 1.0)
      const width = Math.min(1.0, 1.0 / ratio)
      const height = Math.min(1.0, ratio)
      this._mesh.scale.set(width, height, 1)
    }
  }
  copy(source, recursive = true) {
    if (recursive) {
      ;(this as any).remove(this._mesh)
    }
    super.copy(source, recursive)
    if (recursive) {
      const _meshIndex = source.children.indexOf(source._mesh)
      if (_meshIndex !== -1) {
        ;(this._mesh as any) = (this as any).children[_meshIndex]
      }
    }
    this.projection = source.projection
    this.src = source.src
    return this
  }
}
