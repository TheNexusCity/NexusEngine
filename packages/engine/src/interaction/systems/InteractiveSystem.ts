import {
  addComponent,
  defineQuery,
  getComponent,
  hasComponent,
  removeComponent
} from '../../ecs/functions/ComponentFunctions'
import { Object3DComponent } from '../../scene/components/Object3DComponent'
import { BoundingBoxComponent } from '../components/BoundingBoxComponent'
import { InteractableComponent } from '../components/InteractableComponent'
import { InteractiveFocusedComponent } from '../components/InteractiveFocusedComponent'
import { InteractorComponent } from '../components/InteractorComponent'
import { SubFocusedComponent } from '../components/SubFocusedComponent'
import { HighlightComponent } from '../../renderer/components/HighlightComponent'
import { XRUIComponent } from '@xrengine/engine/src/xrui/components/XRUIComponent'
import { interactBoxRaycast } from '../functions/interactBoxRaycast'
import { InteractedComponent } from '../components/InteractedComponent'
import { createBoxComponent } from '../functions/createBoxComponent'
import { World } from '../../ecs/classes/World'
import {
  createInteractUI,
  showInteractUI,
  hideInteractUI,
  getInteractUI,
  updateInteractUI,
  setUserDataInteractUI,
  InteractiveUI
} from '../functions/interactUI'
import { EquippedComponent } from '../components/EquippedComponent'
import { Not } from 'bitecs'
import { dispatchLocal } from '../../networking/functions/dispatchFrom'
import { EngineActions } from '../../ecs/classes/EngineService'
import { AudioComponent } from '../../audio/components/AudioComponent'
import { toggleAudio } from '../../scene/functions/loaders/AudioFunctions'
import { VideoComponent } from '../../scene/components/VideoComponent'
import { VolumetricComponent } from '../../scene/components/VolumetricComponent'
import { toggleVideo } from '../../scene/functions/loaders/VideoFunctions'
import { toggleVolumetric } from '../../scene/functions/loaders/VolumetricFunctions'

export default async function InteractiveSystem(world: World) {
  const interactorsQuery = defineQuery([InteractorComponent])
  // Included Object3DComponent in query because Object3DComponent might be added with delay for network spawned objects
  const interactiveQuery = defineQuery([InteractableComponent, Object3DComponent, Not(EquippedComponent)])
  const boundingBoxQuery = defineQuery([BoundingBoxComponent])
  const focusQuery = defineQuery([InteractableComponent, InteractiveFocusedComponent])
  const subfocusQuery = defineQuery([InteractableComponent, SubFocusedComponent])
  const interactedQuery = defineQuery([InteractedComponent])
  const xrComponentQuery = defineQuery([XRUIComponent, Object3DComponent])

  return () => {
    for (const entity of interactiveQuery.enter(world)) {
      const interactionData = getComponent(entity, InteractableComponent)
      if (!hasComponent(entity, BoundingBoxComponent)) {
        createBoxComponent(entity)
      }
      if (interactionData.interactionType !== 'equippable' && !getInteractUI(entity)) {
        createInteractUI(entity)
      }
    }

    for (const entity of interactiveQuery.exit(world)) {
      // this getComponent check is required for handling cases when multiple setEquippedObject cached network action are received
      // and this exit query could get called with EquippedComponent not being present on the entity
      if (getComponent(entity, EquippedComponent)) {
        removeComponent(entity, BoundingBoxComponent)
      }
      removeComponent(entity, InteractiveFocusedComponent)
      removeComponent(entity, SubFocusedComponent)
    }

    const interactives = interactiveQuery(world)

    for (const entity of interactorsQuery(world)) {
      if (interactives.length) {
        interactBoxRaycast(entity, boundingBoxQuery(world))
        const interacts = getComponent(entity, InteractorComponent)
        if (interacts.focusedInteractive) {
          if (!hasComponent(interacts.focusedInteractive, InteractiveFocusedComponent)) {
            addComponent(interacts.focusedInteractive, InteractiveFocusedComponent, { interacts: entity })
          }
        }

        // unmark all unfocused
        for (const entityInter of interactives) {
          if (entityInter !== interacts.focusedInteractive && hasComponent(entityInter, InteractiveFocusedComponent)) {
            removeComponent(entityInter, InteractiveFocusedComponent)
          }
          if (interacts.subFocusedArray.some((v) => v[0].entity === entityInter)) {
            if (!hasComponent(entityInter, SubFocusedComponent)) {
              addComponent(entityInter, SubFocusedComponent, { subInteracts: entityInter })
            }
          } else {
            removeComponent(entityInter, SubFocusedComponent)
          }
        }
      }
    }

    // removal is the first because the hint must first be deleted, and then a new one appears
    for (const entity of focusQuery.exit()) {
      hideInteractUI(entity)
    }

    for (const entity of focusQuery.enter()) {
      showInteractUI(entity)
    }

    for (const entity of subfocusQuery.enter()) {
      addComponent(entity, HighlightComponent, { color: 0xff0000, hiddenColor: 0x0000ff, edgeStrength: 1 })
    }
    for (const entity of subfocusQuery.exit()) {
      removeComponent(entity, HighlightComponent)
    }

    for (const entity of xrComponentQuery.enter()) {
      if (InteractiveUI.has(entity)) setUserDataInteractUI(entity)
    }

    for (const xrEntity of InteractiveUI.keys()) {
      updateInteractUI(xrEntity)
    }

    for (const entity of interactedQuery.enter()) {
      const interactiveComponent = getComponent(entity, InteractableComponent)
      if (hasComponent(entity, AudioComponent)) {
        toggleAudio(entity)
      } else if (hasComponent(entity, VideoComponent)) {
        toggleVideo(entity)
      } else if (hasComponent(entity, VolumetricComponent)) {
        toggleVolumetric(entity)
      } else {
        dispatchLocal(EngineActions.objectActivation(interactiveComponent))
      }
      removeComponent(entity, InteractedComponent)
    }
  }
}
