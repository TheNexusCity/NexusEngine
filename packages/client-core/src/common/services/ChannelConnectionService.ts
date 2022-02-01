import { endVideoChat, leave } from '../../transports/SocketWebRTCClientFunctions'
import { EngineEvents } from '@xrengine/engine/src/ecs/classes/EngineEvents'
import { Network } from '@xrengine/engine/src/networking/classes/Network'
import { MediaStreams } from '@xrengine/engine/src/networking/systems/MediaStreamSystem'
import { accessAuthState } from '../../user/services/AuthService'
import { client } from '../../feathers'
import { store, useDispatch } from '../../store'
import { SocketWebRTCClientTransport } from '../../transports/SocketWebRTCClientTransport'
import { accessLocationState } from '../../social/services/LocationService'
import { MediaStreamService } from '../../media/services/MediaStreamService'

import { createState, useState } from '@hookstate/core'
import { InstanceServerProvisionResult } from '@xrengine/common/src/interfaces/InstanceServerProvisionResult'
import { ChannelType } from '@xrengine/common/src/interfaces/Channel'

//State
const state = createState({
  instance: {
    ipAddress: '',
    port: ''
  },
  locationId: '',
  sceneId: '',
  channelType: null! as ChannelType,
  channelId: '',
  videoEnabled: false,
  instanceProvisioned: false,
  connected: false,
  readyToConnect: false,
  updateNeeded: false,
  instanceServerConnecting: false,
  instanceProvisioning: false
})

store.receptors.push((action: ChannelConnectionActionType): any => {
  state.batch((s) => {
    switch (action.type) {
      case 'CHANNEL_SERVER_PROVISIONING':
        return s.merge({
          connected: false,
          instanceProvisioned: false,
          readyToConnect: false,
          instanceProvisioning: true
        })
      case 'CHANNEL_SERVER_PROVISIONED':
        MediaStreams.instance.channelType = action.channelType!
        MediaStreams.instance.channelId = action.channelId!
        return s.merge({
          instance: {
            ipAddress: action.ipAddress,
            port: action.port
          },
          channelType: action.channelType,
          channelId: action.channelId!,
          instanceProvisioning: false,
          instanceProvisioned: true,
          readyToConnect: true,
          updateNeeded: true,
          connected: false
        })
      case 'CHANNEL_SERVER_CONNECTING':
        return s.instanceServerConnecting.set(true)
      case 'CHANNEL_SERVER_CONNECTED':
        return s.merge({
          connected: true,
          updateNeeded: false,
          readyToConnect: false,
          instanceServerConnecting: false
        })
      case 'CHANNEL_SERVER_VIDEO_ENABLED':
        return s.merge({
          videoEnabled: action.enableVideo
        })
      case 'CHANNEL_SERVER_DISCONNECT':
        MediaStreams.instance.channelType = null!
        MediaStreams.instance.channelId = ''
        return s.merge({
          instance: {
            ipAddress: '',
            port: ''
          },
          locationId: '',
          sceneId: '',
          channelType: null!,
          channelId: '',
          instanceProvisioned: false,
          connected: false,
          readyToConnect: false,
          updateNeeded: false,
          instanceServerConnecting: false,
          instanceProvisioning: false
        })
    }
  }, action.type)
})

export const accessChannelConnectionState = () => state

export const useChannelConnectionState = () => useState(state) as any as typeof state

//Service
export const ChannelConnectionService = {
  provisionChannelServer: async (channelId?: string, isWorldConnection = false) => {
    const dispatch = useDispatch()
    dispatch(ChannelConnectionAction.channelServerProvisioning())
    const token = accessAuthState().authUser.accessToken.value
    const provisionResult = await client.service('instance-provision').find({
      query: {
        channelId: channelId,
        token: token
      }
    })
    if (provisionResult.ipAddress && provisionResult.port) {
      {
        dispatch(
          ChannelConnectionAction.channelServerProvisioned(
            provisionResult,
            channelId,
            isWorldConnection ? 'instance' : 'channel'
          )
        )
      }
    } else {
      EngineEvents.instance.dispatchEvent({
        type: SocketWebRTCClientTransport.EVENTS.PROVISION_CHANNEL_NO_GAMESERVERS_AVAILABLE
      })
    }
  },
  connectToChannelServer: async (channelId: string) => {
    const dispatch = useDispatch()
    dispatch(ChannelConnectionAction.channelServerConnecting())
    const authState = accessAuthState()
    const user = authState.user.value
    const { ipAddress, port } = accessChannelConnectionState().instance.value

    const locationState = accessLocationState()
    const currentLocation = locationState.currentLocation.location
    const sceneId = currentLocation?.sceneId?.value

    const transport = Network.instance.transportHandler.getMediaTransport() as SocketWebRTCClientTransport
    if (transport.socket) {
      await endVideoChat(transport, { endConsumers: true })
      await leave(transport, false)
    }

    dispatch(
      ChannelConnectionAction.enableVideo(
        currentLocation?.locationSettings?.videoEnabled?.value === true ||
          !(
            currentLocation?.locationSettings?.locationType?.value === 'showroom' &&
            user.locationAdmins?.find((locationAdmin) => locationAdmin.locationId === currentLocation?.id?.value) ==
              null
          )
      )
    )

    await transport.initialize({ sceneId, port, ipAddress, channelId })
    transport.left = false
    EngineEvents.instance.addEventListener(
      MediaStreams.EVENTS.TRIGGER_UPDATE_CONSUMERS,
      MediaStreamService.triggerUpdateConsumers
    )
  },
  resetChannelServer: () => {
    const dispatch = useDispatch()
    dispatch(ChannelConnectionAction.disconnect())
  }
}

if (globalThis.process.env['VITE_OFFLINE_MODE'] !== 'true') {
  client.service('instance-provision').on('created', (params) => {
    if (params.channelId != null) {
      const dispatch = useDispatch()
      dispatch(ChannelConnectionAction.channelServerProvisioned(params, params.channelId))
    }
  })
}

//Action
export const ChannelConnectionAction = {
  channelServerProvisioning: () => {
    return {
      type: 'CHANNEL_SERVER_PROVISIONING' as const
    }
  },
  channelServerProvisioned: (
    provisionResult: InstanceServerProvisionResult,
    channelId?: string,
    channelType?: ChannelType
  ) => {
    return {
      type: 'CHANNEL_SERVER_PROVISIONED' as const,
      id: provisionResult.id,
      ipAddress: provisionResult.ipAddress,
      port: provisionResult.port,
      channelType: channelType,
      channelId: channelId
    }
  },
  channelServerConnecting: () => {
    return {
      type: 'CHANNEL_SERVER_CONNECTING' as const
    }
  },
  channelServerConnected: () => {
    return {
      type: 'CHANNEL_SERVER_CONNECTED' as const
    }
  },
  enableVideo: (enableVideo: boolean) => {
    return {
      type: 'CHANNEL_SERVER_VIDEO_ENABLED' as const,
      enableVideo
    }
  },
  disconnect: () => {
    return {
      type: 'CHANNEL_SERVER_DISCONNECT' as const
    }
  }
}

export type ChannelConnectionActionType = ReturnType<
  typeof ChannelConnectionAction[keyof typeof ChannelConnectionAction]
>
