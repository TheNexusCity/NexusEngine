import { isClient } from '../../common/functions/isClient'
import { Action } from '../functions/Action'
import {
  addComponent,
  defineQuery,
  EntityRemovedComponent,
  getComponent,
  hasComponent
} from '../functions/ComponentFunctions'
import { createEntity } from '../functions/EntityFunctions'
import { SystemFactoryType, SystemInstanceType, SystemModuleType } from '../functions/SystemFunctions'
import { Entity } from './Entity'
import { Engine } from './Engine'
import * as bitecs from 'bitecs'
import { AvatarComponent } from '../../avatar/components/AvatarComponent'
import { NetworkObjectComponent } from '../../networking/components/NetworkObjectComponent'
import { Physics } from '../../physics/classes/Physics'
import { HostUserId, UserId } from '@xrengine/common/src/interfaces/UserId'
import { NetworkId } from '@xrengine/common/src/interfaces/NetworkId'
import { NetworkClient } from '../../networking/interfaces/NetworkClient'
import { SystemUpdateType } from '../functions/SystemUpdateType'
import { WorldStateInterface } from '../../networking/schema/networkSchema'
import { PersistTagComponent } from '../../scene/components/PersistTagComponent'
import EntityTree from './EntityTree'
import { PortalComponent } from '../../scene/components/PortalComponent'
import { SceneLoaderType } from '../../common/constants/PrefabFunctionType'
import { ComponentJson } from '@xrengine/common/src/interfaces/SceneInterface'

type RemoveIndex<T> = {
  [K in keyof T as string extends K ? never : number extends K ? never : K]: T[K]
}

export const CreateWorld = Symbol('CreateWorld')
export class World {
  private constructor() {
    bitecs.createWorld(this)
    Engine.worlds.push(this)
    this.worldEntity = createEntity(this)
    this.localClientEntity = isClient ? (createEntity(this) as Entity) : (NaN as Entity)
    if (!Engine.currentWorld) Engine.currentWorld = this
    addComponent(this.worldEntity, PersistTagComponent, {}, this)
  }

  static [CreateWorld] = () => new World()

  sceneMetadata = undefined as string | undefined
  worldMetadata = {} as { [key: string]: string }

  delta = NaN
  elapsedTime = NaN
  fixedDelta = NaN
  fixedElapsedTime = 0
  fixedTick = 0

  _pipeline = [] as SystemModuleType<any>[]

  physics = new Physics()

  #entityQuery = bitecs.defineQuery([bitecs.Not(EntityRemovedComponent)])
  entityQuery = () => this.#entityQuery(this) as Entity[]

  #entityRemovedQuery = bitecs.defineQuery([EntityRemovedComponent])

  #portalQuery = bitecs.defineQuery([PortalComponent])
  portalQuery = () => this.#portalQuery(this) as Entity[]

  isInPortal = false

  /** Connected clients */
  clients = new Map() as Map<UserId, NetworkClient>

  /** Incoming actions */
  incomingActions = new Set<Required<Action>>()

  /** Cached actions */
  cachedActions = new Set<Required<Action>>()

  /** Outgoing actions */
  outgoingActions = new Set<Action>()

  /** All actions that have been dispatched */
  actionHistory = new Set<Action>()

  outgoingNetworkState: WorldStateInterface
  previousNetworkState: WorldStateInterface

  /**
   * Check if this user is hosting the world.
   */
  get isHosting() {
    return Engine.userId === this.hostId
  }

  /**
   * The UserId of the host
   */
  hostId = 'server' as HostUserId

  /**
   * The world entity
   */
  worldEntity: Entity

  /**
   * The local client entity
   */
  localClientEntity: Entity

  /**
   * Custom systems injected into this world
   */
  pipelines = {
    [SystemUpdateType.UPDATE]: [],
    [SystemUpdateType.FIXED_EARLY]: [],
    [SystemUpdateType.FIXED]: [],
    [SystemUpdateType.FIXED_LATE]: [],
    [SystemUpdateType.PRE_RENDER]: [],
    [SystemUpdateType.POST_RENDER]: []
  } as { [pipeline: string]: SystemInstanceType[] }

  /**
   * Entities mapped by name
   */
  namedEntities = new Map<string, Entity>()

  /**
   * Network object query
   */
  networkObjectQuery = defineQuery([NetworkObjectComponent])

  /** Tree of entity holding parent child relation between entities. */
  entityTree = new EntityTree()

  /** Registry map of scene loader components  */
  sceneLoadingRegistry = new Map<string, SceneLoaderType>()

  /** Registry map of prefabs  */
  scenePrefabRegistry = new Map<string, ComponentJson[]>()

  /**
   * Get the network objects owned by a given user
   * @param ownerId
   */
  getOwnedNetworkObjects(ownerId: UserId) {
    return this.networkObjectQuery(this).filter((eid) => getComponent(eid, NetworkObjectComponent).ownerId === ownerId)
  }

  /**
   * Get a network object by owner and NetworkId
   * @returns
   */
  getNetworkObject(ownerId: UserId, networkId: NetworkId) {
    return this.networkObjectQuery(this).find((eid) => {
      const networkObject = getComponent(eid, NetworkObjectComponent)
      return networkObject.networkId === networkId && networkObject.ownerId === ownerId
    })!
  }

  /**
   * Get the user avatar entity (the network object w/ an Avatar component)
   * @param userId
   * @returns
   */
  getUserAvatarEntity(userId: UserId) {
    return this.getOwnedNetworkObjects(userId).find((eid) => {
      return hasComponent(eid, AvatarComponent, this)
    })!
  }

  /** ID of last network created. */
  #availableNetworkId = 0 as NetworkId

  /** Get next network id. */
  createNetworkId(): NetworkId {
    return ++this.#availableNetworkId as NetworkId
  }

  /**
   * Action receptors
   */
  receptors = new Array<(action: Action) => void>()

  /**
   * Execute systems on this world
   *
   * @param delta
   * @param elapsedTime
   */
  execute(delta: number, elapsedTime: number) {
    this.delta = delta
    this.elapsedTime = elapsedTime
    for (const system of this.pipelines[SystemUpdateType.UPDATE]) system.execute()
    for (const system of this.pipelines[SystemUpdateType.PRE_RENDER]) system.execute()
    for (const system of this.pipelines[SystemUpdateType.POST_RENDER]) system.execute()
    for (const entity of this.#entityRemovedQuery(this)) bitecs.removeEntity(this, entity)
  }
}

export function createWorld() {
  console.log('Creating world')
  return World[CreateWorld]()
}
