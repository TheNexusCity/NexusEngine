import { AnimationMixer, Object3D } from 'three'
import { LoadGLTF } from '../../assets/functions/LoadGLTF'
import { AnimationManager } from '../../avatar/AnimationManager'
import cloneObject3D from '../../scene/functions/cloneObject3D'

export default class Model extends Object3D {
  model: any
  _src: any
  _castShadow: boolean
  _receiveShadow: boolean
  activeClipIndex: number
  animationMixer: any
  activeClipAction: any
  hasAvatarAnimations = false
  constructor() {
    super()
    ;(this as any).type = 'Model'
    this.model = null
    this._src = null
    this._castShadow = false
    this._receiveShadow = false
    // Use index instead of references to AnimationClips to simplify animation cloning / track name remapping
    this.activeClipIndex = -1
    this.animationMixer = null
    this.activeClipAction = null
  }
  get src() {
    return this._src
  }
  set src(value) {
    this.load(value).catch(console.error)
  }
  async loadGLTF(src) {
    console.log('gltf is')
    // const gltf = await new GLTFLoader(src).loadGLTF();
    const gltf = await LoadGLTF(src)
    console.log(gltf)

    const model = gltf.scene
    model.animations = this.hasAvatarAnimations ? AnimationManager.instance._animations : model.animations || []
    return model
  }
  async load(src, ...args) {
    this._src = src
    if (this.model) {
      ;(this as any).remove(this.model)
      this.model = null
    }
    const model = await this.loadGLTF(src)
    this.model = model
    ;(this as any).add(model)
    if (model.animations && model.animations.length > 0) {
      this.animationMixer = new AnimationMixer(this.model)
    }
    this.castShadow = this._castShadow
    this.receiveShadow = this._receiveShadow
    return this
  }
  getClipOptions() {
    const clipOptions =
      this.model && this.model.animations
        ? this.model.animations.map((clip, index) => ({
            label: clip.name,
            value: index
          }))
        : []
    clipOptions.unshift({ label: 'None', value: -1 })
    return clipOptions
  }
  get activeClip() {
    return (this.model && this.model.animations && this.model.animations[this.activeClipIndex]) || null
  }
  updateAnimationState() {
    const clip = this.activeClip
    const playingClip = this.activeClipAction && this.activeClipAction.getClip()
    if (clip !== playingClip) {
      if (this.activeClipAction) {
        this.activeClipAction.stop()
      }
      if (this.animationMixer && clip) {
        this.activeClipAction = this.animationMixer.clipAction(clip)
        this.activeClipAction.play()
      } else {
        this.activeClipAction = null
      }
    }
  }
  playAnimation() {
    this.updateAnimationState()
  }
  stopAnimation() {
    if (this.activeClipAction) {
      this.activeClipAction.stop()
      this.activeClipAction = null
    }
  }
  update(dt) {
    if (this.animationMixer) {
      this.updateAnimationState()
      this.animationMixer.update(dt)
    }
  }
  /** @ts-ignore */
  get castShadow() {
    return this._castShadow
  }
  set castShadow(value) {
    this._castShadow = value
    if (this.model) {
      this.model.traverse((child) => {
        child.castShadow = value
        if (child.material) {
          const material = child.material
          if (Array.isArray(material)) {
            for (let i = 0; i < material.length; i++) {
              material[i].needsUpdate = true
            }
          } else {
            material.needsUpdate = true
          }
        }
      })
    }
  }
  /** @ts-ignore */
  get receiveShadow() {
    return this._receiveShadow
  }
  set receiveShadow(value) {
    this._receiveShadow = value
    if (this.model) {
      this.model.traverse((child) => {
        child.receiveShadow = value
        if (child.material) {
          const material = child.material
          if (Array.isArray(material)) {
            for (let i = 0; i < material.length; i++) {
              material[i].needsUpdate = true
            }
          } else {
            material.needsUpdate = true
          }
        }
      })
    }
  }
  setShadowsEnabled(enabled) {
    if (this.model) {
      this.model.traverse((child) => {
        child.castShadow = enabled ? this._castShadow : false
        child.receiveShadow = enabled ? this._receiveShadow : false
        if (child.material) {
          const material = child.material
          if (Array.isArray(material)) {
            for (let i = 0; i < material.length; i++) {
              material[i].needsUpdate = true
            }
          } else {
            material.needsUpdate = true
          }
        }
      })
    }
  }
  // TODO: Add play/pause methods for previewing animations.
  copy(source, recursive = true) {
    super.copy(source, false)
    for (const child of source.children) {
      let clonedChild
      if (child === source.model) {
        clonedChild = cloneObject3D(child)
        this.model = clonedChild
        if (this.model.animations.length > 0) {
          this.animationMixer = new AnimationMixer(this.model)
        }
      } else if (recursive === true && child !== source.loadingCube) {
        clonedChild = child.clone()
      }
      if (clonedChild) {
        ;(this as any).add(clonedChild)
      }
    }
    this._src = source._src
    this.activeClipIndex = source.activeClipIndex
    return this
  }
}
