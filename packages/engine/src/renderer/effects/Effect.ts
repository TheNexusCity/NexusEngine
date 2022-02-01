import { EventDispatcher, WebGLRenderer, WebGLRenderTarget } from 'three'
import disposeScene from '../functions/disposeScene'
import { BlendFunction, BlendMode } from 'postprocessing'

/**
 * An abstract effect.
 *
 * Effects can be combined using the {@link EffectPass}.
 *
 * @implements {Initializable}
 * @implements {Resizable}
 * @implements {Disposable}
 */

export class Effect extends EventDispatcher {
  name: any
  attributes: number
  fragmentShader: any
  vertexShader: any
  defines: Map<any, any>
  uniforms: Map<any, any>
  extensions: any
  blendMode: BlendMode
  /**
   * Constructs a new effect.
   *
   * @param {String} name - The name of this effect. Doesn't have to be unique.
   * @param {String} fragmentShader - The fragment shader. This shader is required.
   * @param {Object} [options] - Additional options.
   * @param {EffectAttribute} [options.attributes=EffectAttribute.NONE] - The effect attributes that determine the execution priority and resource requirements.
   * @param {BlendFunction} [options.blendFunction=BlendFunction.SCREEN] - The blend function of this effect.
   * @param {Map<String, String>} [options.defines] - Custom preprocessor macro definitions. Keys are names and values are code.
   * @param {Map<String, Uniform>} [options.uniforms] - Custom shader uniforms. Keys are names and values are uniforms.
   * @param {Set<WebGLExtension>} [options.extensions] - WebGL extensions.
   * @param {String} [options.vertexShader=null] - The vertex shader. Most effects don't need one.
   */

  constructor(
    name,
    fragmentShader,
    {
      attributes = EffectAttribute.NONE,
      blendFunction = BlendFunction.SCREEN,
      defines = new Map(),
      uniforms = new Map(),
      extensions = null,
      vertexShader = null
    } = {}
  ) {
    super()

    /**
     * The name of this effect.
     *
     * @type {String}
     */

    this.name = name

    /**
     * The effect attributes.
     *
     * @type {EffectAttribute}
     * @private
     */

    this.attributes = attributes

    /**
     * The fragment shader.
     *
     * @type {String}
     * @private
     */

    this.fragmentShader = fragmentShader

    /**
     * The vertex shader.
     *
     * @type {String}
     * @private
     */

    this.vertexShader = vertexShader

    /**
     * Preprocessor macro definitions.
     *
     * Call {@link Effect.setChanged} after changing macro definitions.
     *
     * @type {Map<String, String>}
     */

    this.defines = defines

    /**
     * Shader uniforms.
     *
     * You may freely modify the values of these uniforms at runtime. However,
     * uniforms should not be removed or added after the effect was created.
     *
     * Call {@link Effect.setChanged} after adding or removing uniforms.
     *
     * @type {Map<String, Uniform>}
     */

    this.uniforms = uniforms

    /**
     * WebGL extensions that are required by this effect.
     *
     * Call {@link Effect.setChanged} after adding or removing extensions.
     *
     * @type {Set<WebGLExtension>}
     */

    this.extensions = extensions

    /**
     * The blend mode of this effect.
     *
     * The result of this effect will be blended with the result of the previous
     * effect using this blend mode.
     *
     * @type {BlendMode}
     */

    this.blendMode = new BlendMode(blendFunction)
    ;(this.blendMode as any).addEventListener('change', (event) => this.setChanged())
  }

  /**
   * Informs the associated {@link EffectPass} that this effect has changed in
   * a way that requires a shader recompilation.
   *
   * Call this method after changing macro definitions or extensions and after
   * adding or removing uniforms.
   *
   * @protected
   */

  setChanged() {
    ;(this as any).dispatchEvent({ type: 'change' })
  }

  /**
   * Returns the effect attributes.
   *
   * @return {EffectAttribute} The attributes.
   */

  getAttributes() {
    return this.attributes
  }

  /**
   * Sets the effect attributes.
   *
   * Effects that have the same attributes will be executed in the order in
   * which they were registered. Some attributes imply a higher priority.
   *
   * @protected
   * @param {EffectAttribute} attributes - The attributes.
   */

  setAttributes(attributes) {
    this.attributes = attributes
    this.setChanged()
  }

  /**
   * Returns the fragment shader.
   *
   * @return {String} The fragment shader.
   */

  getFragmentShader() {
    return this.fragmentShader
  }

  /**
   * Sets the fragment shader.
   *
   * @protected
   * @param {String} fragmentShader - The fragment shader.
   */

  setFragmentShader(fragmentShader) {
    this.fragmentShader = fragmentShader
    this.setChanged()
  }

  /**
   * Returns the vertex shader.
   *
   * @return {String} The vertex shader.
   */

  getVertexShader() {
    return this.vertexShader
  }

  /**
   * Sets the vertex shader.
   *
   * @protected
   * @param {String} vertexShader - The vertex shader.
   */

  setVertexShader(vertexShader) {
    this.vertexShader = vertexShader
    this.setChanged()
  }

  /**
   * Sets the depth texture.
   *
   * You may override this method if your effect requires direct access to the
   * depth texture that is bound to the associated {@link EffectPass}.
   *
   * @param {Texture} depthTexture - A depth texture.
   * @param {Number} [depthPacking=0] - The depth packing.
   */

  setDepthTexture(depthTexture, depthPacking = 0) {}

  /**
   * Updates the effect by performing supporting operations.
   *
   * This method is called by the {@link EffectPass} right before the main
   * fullscreen render operation, even if the blend function is set to `SKIP`.
   *
   * You may override this method if you need to render additional off-screen
   * textures or update custom uniforms.
   *
   * @param {WebGLRenderer} renderer - The renderer.
   * @param {WebGLRenderTarget} inputBuffer - A frame buffer that contains the result of the previous pass.
   * @param {Number} [deltaTime] - The time between the last frame and the current one in seconds.
   */

  update(renderer: WebGLRenderer, inputBuffer: WebGLRenderTarget, deltaTime: number): void {}

  /**
   * Updates the size of this effect.
   *
   * You may override this method in case you want to be informed about the main
   * render size.
   *
   * The {@link EffectPass} calls this method before this effect is initialized
   * and every time its own size is updated.
   *
   * @param {Number} width - The width.
   * @param {Number} height - The height.
   * @example this.myRenderTarget.setSize(width, height);
   */

  setSize(width, height) {}

  /**
   * Performs initialization tasks.
   *
   * By overriding this method you gain access to the renderer. You'll also be
   * able to configure your custom render targets to use the appropriate format
   * (RGB or RGBA).
   *
   * The provided renderer can be used to warm up special off-screen render
   * targets by performing a preliminary render operation.
   *
   * The {@link EffectPass} calls this method during its own initialization
   * which happens after the size has been set.
   *
   * @param {WebGLRenderer} renderer - The renderer.
   * @param {Boolean} alpha - Whether the renderer uses the alpha channel or not.
   * @param {Number} frameBufferType - The type of the main frame buffers.
   * @example if(!alpha && frameBufferType === UnsignedByteType) { this.myRenderTarget.texture.format = RGBFormat; }
   */

  initialize(renderer, alpha, frameBufferType) {}

  /**
   * Performs a shallow search for properties that define a dispose method and
   * deletes them. The effect will be inoperative after this method was called!
   *
   * The {@link EffectPass} calls this method when it is being destroyed. Do not
   * call this method directly.
   */

  dispose() {
    for (const key of Object.keys(this)) {
      if (this[key] !== null && typeof this[key].dispose === 'function') {
        if (key === 'scene') {
          disposeScene(this[key])
          this[key] = null
          continue
        }

        /** @ignore */
        this[key].dispose()
      }
    }
  }
}

/**
 * An enumeration of effect attributes.
 *
 * Attributes can be concatenated using the bitwise OR operator.
 *
 * @type {Object}
 * @property {Number} NONE - No attributes. Most effects don't need to specify any attributes.
 * @property {Number} DEPTH - Describes effects that require a depth texture.
 * @property {Number} CONVOLUTION - Describes effects that fetch additional samples from the input buffer. There cannot be more than one effect with this attribute per {@link EffectPass}.
 * @example const attributes = EffectAttribute.CONVOLUTION | EffectAttribute.DEPTH;
 */

export const EffectAttribute = {
  NONE: 0,
  DEPTH: 1,
  CONVOLUTION: 2
}

/**
 * An enumeration of WebGL extensions.
 *
 * @type {Object}
 * @property {String} DERIVATIVES - Enables derivatives by adding the functions dFdx, dFdy and fwidth.
 * @property {String} FRAG_DEPTH - Enables gl_FragDepthEXT to set a depth value of a fragment from within the fragment shader.
 * @property {String} DRAW_BUFFERS - Enables multiple render targets (MRT) support.
 * @property {String} SHADER_TEXTURE_LOD - Enables explicit control of texture LOD.
 */

export const WebGLExtension = {
  DERIVATIVES: 'derivatives',
  FRAG_DEPTH: 'fragDepth',
  DRAW_BUFFERS: 'drawBuffers',
  SHADER_TEXTURE_LOD: 'shaderTextureLOD'
}
