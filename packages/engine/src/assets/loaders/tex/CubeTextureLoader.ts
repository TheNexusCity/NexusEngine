import { CubeTexture, ImageBitmapLoader, ImageLoader, Loader } from 'three'
import { isWebWorker } from '../../../common/functions/getEnvironment'

class CubeTextureLoader extends Loader {
  constructor(manager?: any) {
    super(manager)
  }
  load(urls, onLoad, onProgress, onError) {
    const texture = new CubeTexture()
    const loader = new (isWebWorker ? ImageBitmapLoader : ImageLoader)(this.manager)
    loader.setCrossOrigin(this.crossOrigin)
    loader.setPath(this.path)
    let loaded = 0
    function loadTexture(i) {
      loader.load(
        urls[i],
        (image) => {
          texture.images[i] = image
          loaded++
          if (loaded === 6) {
            texture.needsUpdate = true
            if (onLoad) onLoad(texture)
          }
        },
        undefined,
        onError
      )
    }
    for (let i = 0; i < urls.length; ++i) {
      loadTexture(i)
    }
    return texture
  }
}

export { CubeTextureLoader }
