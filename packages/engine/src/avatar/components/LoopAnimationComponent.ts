import { AnimationAction } from 'three'
import { createMappedComponent } from '../../ecs/functions/ComponentFunctions'

export type LoopAnimationComponentType = {
  activeClipIndex: number
  hasAvatarAnimations: boolean
  action?: AnimationAction
}

export const LoopAnimationComponent = createMappedComponent<LoopAnimationComponentType>('LoopAnimationComponent')
