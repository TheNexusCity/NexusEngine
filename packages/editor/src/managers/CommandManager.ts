import EventEmitter from 'events'
import { getContentType } from '@xrengine/common/src/utils/getContentType'
import History from '../classes/History'
import EditorCommands, { EditorCommandsType } from '../constants/EditorCommands'
import EditorEvents from '../constants/EditorEvents'
import AddObjectCommand, { AddObjectCommandParams } from '../commands/AddObjectCommand'
import AddToSelectionCommand from '../commands/AddToSelectionCommand'
import Command from '../commands/Command'
import DuplicateObjectCommand, { DuplicateObjectCommandParams } from '../commands/DuplicateObjectCommand'
import RemoveFromSelectionCommand from '../commands/RemoveFromSelectionCommand'
import RemoveObjectsCommand, { RemoveObjectCommandParams } from '../commands/RemoveObjectsCommand'
import ReparentCommand, { ReparentCommandParams } from '../commands/ReparentCommand'
import ReplaceSelectionCommand from '../commands/ReplaceSelectionCommand'
import ToggleSelectionCommand from '../commands/ToggleSelectionCommand'
import GroupCommand, { GroupCommandParams } from '../commands/GroupCommand'
import PositionCommand, { PositionCommandParams } from '../commands/PositionCommand'
import RotationCommand, { RotationCommandParams } from '../commands/RotationCommand'
import RotateAroundCommand, { RotateAroundCommandParams } from '../commands/RotateAroundCommand'
import ScaleCommand, { ScaleCommandParams } from '../commands/ScaleCommand'
import ModifyPropertyCommand, { ModifyPropertyCommandParams } from '../commands/ModifyPropertyCommand'
import isInputSelected from '../functions/isInputSelected'
import { SceneManager } from './SceneManager'
import { getComponent, hasComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { EntityTreeNode } from '@xrengine/engine/src/ecs/classes/EntityTree'
import TagComponentCommand, { TagComponentCommandParams } from '../commands/TagComponentCommand'
import { useWorld } from '@xrengine/engine/src/ecs/functions/SystemHooks'
import { DisableTransformTagComponent } from '@xrengine/engine/src/transform/components/DisableTransformTagComponent'
import { createEntity } from '@xrengine/engine/src/ecs/functions/EntityFunctions'
import { ScenePrefabs, ScenePrefabTypes } from '@xrengine/engine/src/scene/functions/registerPrefabs'
import { VideoComponent } from '@xrengine/engine/src/scene/components/VideoComponent'
import { ImageComponent } from '@xrengine/engine/src/scene/components/ImageComponent'
import { AudioComponent } from '@xrengine/engine/src/audio/components/AudioComponent'
import { ModelComponent } from '@xrengine/engine/src/scene/components/ModelComponent'
import { LinkComponent } from '@xrengine/engine/src/scene/components/LinkComponent'
import { TransformComponent } from '@xrengine/engine/src/transform/components/TransformComponent'

export type CommandParamsType =
  | AddObjectCommandParams
  | RemoveObjectCommandParams
  | DuplicateObjectCommandParams
  | ModifyPropertyCommandParams
  | ReparentCommandParams
  | GroupCommandParams
  | PositionCommandParams
  | RotationCommandParams
  | ScaleCommandParams
  | RotateAroundCommandParams
  | TagComponentCommandParams

export class CommandManager extends EventEmitter {
  static instance: CommandManager = new CommandManager()

  commands: {
    [key: string]: typeof Command
  }

  selected: EntityTreeNode[] = []
  selectedTransformRoots: EntityTreeNode[] = []
  history: History

  constructor() {
    super()

    this.history = new History()

    this.commands = {
      [EditorCommands.ADD_OBJECTS]: AddObjectCommand,
      [EditorCommands.DUPLICATE_OBJECTS]: DuplicateObjectCommand,
      [EditorCommands.REMOVE_OBJECTS]: RemoveObjectsCommand,
      [EditorCommands.ADD_TO_SELECTION]: AddToSelectionCommand,
      [EditorCommands.REMOVE_FROM_SELECTION]: RemoveFromSelectionCommand,
      [EditorCommands.TOGGLE_SELECTION]: ToggleSelectionCommand,
      [EditorCommands.REPLACE_SELECTION]: ReplaceSelectionCommand,
      [EditorCommands.REPARENT]: ReparentCommand,
      [EditorCommands.GROUP]: GroupCommand,
      [EditorCommands.POSITION]: PositionCommand,
      [EditorCommands.ROTATION]: RotationCommand,
      [EditorCommands.ROTATE_AROUND]: RotateAroundCommand,
      [EditorCommands.SCALE]: ScaleCommand,
      [EditorCommands.MODIFY_PROPERTY]: ModifyPropertyCommand,
      [EditorCommands.TAG_COMPONENT]: TagComponentCommand
    }

    window.addEventListener('copy', this.onCopy)
    window.addEventListener('paste', this.onPaste)
  }

  executeCommand = (
    command: EditorCommandsType,
    object: EntityTreeNode | EntityTreeNode[],
    params: CommandParamsType = {}
  ) => {
    if (!params) params = {}
    new this.commands[command](!Array.isArray(object) ? [object] : object, params).execute()
  }

  executeCommandWithHistory = (
    command: EditorCommandsType,
    object: EntityTreeNode | EntityTreeNode[],
    params: CommandParamsType = {}
  ) => {
    params.keepHistory = true
    this.history.execute(new this.commands[command](!Array.isArray(object) ? [object] : object, params))
  }

  executeCommandOnSelection = (command: EditorCommandsType, params: CommandParamsType = {}) => {
    new this.commands[command](this.selected, params).execute()
  }

  executeCommandWithHistoryOnSelection = (command: EditorCommandsType, params: CommandParamsType = {}) => {
    params.keepHistory = true
    this.history.execute(new this.commands[command](this.selected, params))
  }

  setProperty(affectedEntityNodes: EntityTreeNode[], params: ModifyPropertyCommandParams, withHistory = true) {
    if (withHistory) {
      this.executeCommandWithHistory(EditorCommands.MODIFY_PROPERTY, affectedEntityNodes, params)
    } else {
      this.executeCommand(EditorCommands.MODIFY_PROPERTY, affectedEntityNodes, params)
    }
  }

  setPropertyOnSelectionEntities(params: ModifyPropertyCommandParams, withHistory = true) {
    this.setProperty(this.selected, params, withHistory)
  }

  setPropertyOnEntityNode(node: EntityTreeNode, params: ModifyPropertyCommandParams, withHistory = true) {
    this.setProperty([node], params, withHistory)
  }

  emitEvent = (event: EditorEvents, ...args: any[]): void => {
    this.emit(event.toString(), ...args)
  }

  /**
   * Function getRootObjects used to find root objects.
   *
   * @author Robert Long
   * @param  {any}  objects
   * @param  {Array}   [target=[]]
   * @param  {Boolean} [filterUnremovable=true]
   * @param  {Boolean} [filterUntransformable=false]
   * @return {any}
   */
  getRootObjects(objects, target: EntityTreeNode[] = [], filterUnremovable = true, filterUntransformable = false) {
    target.length = 0

    // Recursively find the nodes in the tree with the lowest depth
    const traverse = (curObject: EntityTreeNode) => {
      if (
        objects.indexOf(curObject) !== -1 &&
        !(filterUnremovable && !curObject.parentNode) &&
        !(filterUntransformable && hasComponent(curObject.entity, DisableTransformTagComponent))
      ) {
        target.push(curObject)
        return
      }

      if (curObject.children) {
        for (let i = 0; i < curObject.children.length; i++) {
          traverse(curObject.children[i])
        }
      }
    }

    const world = useWorld()
    traverse(world.entityTree.rootNode)

    return target
  }

  /**
   * Function getTransformRoots provides root objects
   *
   * @author Robert Long
   * @param objects
   * @param target
   * @returns
   */
  getTransformRoots(objects, target: EntityTreeNode[] = []) {
    return this.getRootObjects(objects, target, true, true)
  }

  /**
   * Function to update transform roots.
   *
   * @author Robert Long
   */
  updateTransformRoots() {
    this.getTransformRoots(this.selected, this.selectedTransformRoots)
  }

  /**
   * Function revert used to revert back the recent changes on the basis of checkpoint.
   *
   * @author Robert Long
   * @param  {type} checkpointId
   */
  revert(checkpointId) {
    this.history.revert(checkpointId)
  }

  /**
   * Function undo used to undo changes using history of this component.
   *
   * @author Robert Long
   */
  undo() {
    this.history.undo()
  }

  /**
   * Function redo used to redo changes on the basis of history of component.
   *
   * @author Robert Long
   */
  redo() {
    this.history.redo()
  }

  onCopy = (event) => {
    if (isInputSelected()) return
    event.preventDefault()

    // TODO: Prevent copying objects with a disabled transform
    if (this.selected.length > 0) {
      event.clipboardData.setData(
        'application/vnd.editor.nodes',
        JSON.stringify({ entities: this.selected.map((node) => node.entity) })
      )
    }
  }

  onPaste = (event) => {
    if (isInputSelected()) return
    event.preventDefault()

    let data

    if ((data = event.clipboardData.getData('application/vnd.editor.nodes')) !== '') {
      const { entities } = JSON.parse(data)

      if (!Array.isArray(entities)) return
      const nodes = entities
        .map((entity) => useWorld().entityTree.findNodeFromEid(entity))
        .filter((entity) => entity) as EntityTreeNode[]

      if (nodes) {
        CommandManager.instance.executeCommandWithHistory(EditorCommands.DUPLICATE_OBJECTS, nodes)
      }
    } else if ((data = event.clipboardData.getData('text')) !== '') {
      try {
        const url = new URL(data)
        this.addMedia({ url: url.href }).catch((error) => this.emitEvent(EditorEvents.ERROR, error))
      } catch (e) {
        console.warn('Clipboard contents did not contain a valid url')
      }
    }
  }

  async addMedia({ url }, parent?: EntityTreeNode, before?: EntityTreeNode, updatePosition = true) {
    let contentType = (await getContentType(url)) || ''
    const { hostname } = new URL(url)

    let node = new EntityTreeNode(createEntity())
    let prefabType = '' as ScenePrefabTypes
    let updateFunc = null! as Function

    if (contentType.startsWith('model/gltf')) {
      prefabType = ScenePrefabs.model
      updateFunc = () =>
        this.setPropertyOnEntityNode(
          node,
          {
            component: ModelComponent,
            properties: { src: url, initialScale: 'fit' }
          },
          false
        )
    } else if (contentType.startsWith('video/') || hostname === 'www.twitch.tv') {
      prefabType = ScenePrefabs.video
      updateFunc = () =>
        this.setPropertyOnEntityNode(
          node,
          {
            component: VideoComponent,
            properties: { videoSource: url }
          },
          false
        )
    } else if (contentType.startsWith('image/')) {
      prefabType = ScenePrefabs.image
      updateFunc = () =>
        this.setPropertyOnEntityNode(
          node,
          {
            component: ImageComponent,
            properties: { imageSource: url }
          },
          false
        )
    } else if (contentType.startsWith('audio/')) {
      prefabType = ScenePrefabs.audio
      updateFunc = () =>
        this.setPropertyOnEntityNode(
          node,
          {
            component: AudioComponent,
            properties: { audioSource: url }
          },
          false
        )
    } else if (url.contains('.uvol')) {
      prefabType = ScenePrefabs.volumetric
      updateFunc = () =>
        this.setPropertyOnEntityNode(
          node,
          {
            component: AudioComponent,
            properties: { paths: [url] }
          },
          false
        )
    } else {
      prefabType = ScenePrefabs.link
      updateFunc = () =>
        this.setPropertyOnEntityNode(
          node,
          {
            component: LinkComponent,
            properties: { href: url }
          },
          false
        )
    }

    if (prefabType) {
      this.executeCommandWithHistory(EditorCommands.ADD_OBJECTS, node, {
        prefabTypes: prefabType,
        parents: parent,
        befores: before
      })

      updateFunc()

      if (updatePosition) {
        const transformComponent = getComponent(node.entity, TransformComponent)
        if (transformComponent) SceneManager.instance.getSpawnPosition(transformComponent.position)
      }
    }

    CommandManager.instance.emitEvent(EditorEvents.FILE_UPLOADED)
    return node
  }
}
