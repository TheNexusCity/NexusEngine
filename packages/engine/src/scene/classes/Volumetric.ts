import {
  LinearFilter,
  sRGBEncoding,
  PlaneBufferGeometry,
  MeshBasicMaterial,
  DoubleSide,
  Mesh,
  SphereBufferGeometry,
  RGBAFormat,
  MeshStandardMaterial,
  VideoTexture
} from 'three'
import Hls from 'hls.js/dist/hls.light'
import isHLS from '../functions/isHLS'
import AudioSource from './AudioSource'

export default class Volumetric extends AudioSource {
  _videoTexture: any
  _texture: any
  _mesh: Mesh
  _projection: string
  hls: any
  constructor(audioListener) {
    super(audioListener, 'volumetric')
    this._videoTexture = new VideoTexture(this.el)
    this._videoTexture.minFilter = LinearFilter
    this._videoTexture.encoding = sRGBEncoding
    this._texture = this._videoTexture
    const geometry = new PlaneBufferGeometry()
    const material = new MeshBasicMaterial()
    material.map = this._texture
    material.side = DoubleSide
    this._mesh = new Mesh(geometry, material)
    this._mesh.name = 'VideoMesh'
    this.add(this._mesh)
    this._projection = 'flat'
    this.hls = null
  }
  loadVideo(src: string, contentType: string) {
    return new Promise((resolve, reject) => {
      const _isHLS = isHLS(src, contentType)
      if (_isHLS) {
        if (!this.hls) {
          this.hls = new Hls()
        }
        this.hls.loadSource(src)
        this.hls.attachMedia(this.el)
        this.hls.on((Hls as any).Events.MANIFEST_PARSED, () => {
          this.hls.startLoad(-1)
        })
      } else {
        ;(this.el as any).src = src
      }
      const cleanup = () => {
        ;(this.el as any).removeEventListener('loadeddata', onLoadedMetadata)
        ;(this.el as any).removeEventListener('error', onError)
      }
      const onLoadedMetadata = () => {
        // if (this.el.autoplay) {
        // if(Engine.hasUserEngaged) {
        // this.el.play();
        // } else {
        //   EngineEvents.instance.once(EngineEvents.EVENTS.USER_ENGAGE, () => this.el.play());
        // }
        // }
        cleanup()
        cleanup()
        resolve(this._videoTexture)
      }
      const onError = (error) => {
        cleanup()
        reject(new Error(`Error loading volumetric "${(this.el as any).src}"`))
      }
      if (_isHLS) {
        this.hls.on((Hls as any).Events.ERROR, onError)
      }
      ;(this.el as any).addEventListener('loadeddata', onLoadedMetadata)
      ;(this.el as any).addEventListener('error', onError)
    })
  }
  get projection() {
    return this._projection
  }
  set projection(projection) {
    if (projection === this._projection) {
      return
    }
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
    this._projection = projection
    const nextMesh = new Mesh(geometry, material)
    nextMesh.name = 'VideoMesh'
    const meshIndex = this.children.indexOf(this._mesh)
    if (meshIndex === -1) {
      this.add(nextMesh)
    } else {
      this.children.splice(meshIndex, 1, nextMesh)
      nextMesh.parent = this
    }
    this._mesh = nextMesh
    this.onResize()
  }
  async load(src: string, contentType: string): Promise<this> {
    this._mesh.visible = false
    this._texture = await this.loadVideo(src, contentType)
    this.onResize()
    this.audioSource = this.audioListener.context.createMediaElementSource(this.el)
    this.audio.setNodeSource(this.audioSource)
    if (this._texture.format === RGBAFormat) {
      ;(this._mesh.material as MeshStandardMaterial).transparent = true
    }
    ;(this._mesh.material as MeshStandardMaterial).map = this._texture
    ;(this._mesh.material as MeshStandardMaterial).needsUpdate = true
    this._mesh.visible = true
    return this
  }
  onResize() {}
  clone(recursive) {
    return new (this.constructor as any)(this.audioListener).copy(this, recursive)
  }
  copy(source, recursive = true) {
    super.copy(source, false)
    if (recursive) {
      for (let i = 0; i < source.children.length; i++) {
        const child = source.children[i]
        if (child !== source.audio && child !== source._mesh) {
          this.add(child.clone())
        }
      }
    }
    this.projection = source.projection
    return this
  }
}
