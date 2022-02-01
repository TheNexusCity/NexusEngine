import { createState, none, useState } from '@hookstate/core'
import { Channel } from '@xrengine/common/src/interfaces/Channel'
import { ChannelResult } from '@xrengine/common/src/interfaces/ChannelResult'
import { Group } from '@xrengine/common/src/interfaces/Group'
import { Instance } from '@xrengine/common/src/interfaces/Instance'
import { Message } from '@xrengine/common/src/interfaces/Message'
import { MessageResult } from '@xrengine/common/src/interfaces/MessageResult'
import { Party } from '@xrengine/common/src/interfaces/Party'
import { User } from '@xrengine/common/src/interfaces/User'
import { handleCommand, isCommand } from '@xrengine/engine/src/common/functions/commandHandler'
import { isBot } from '@xrengine/engine/src/common/functions/isBot'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { isPlayerLocal } from '@xrengine/engine/src/networking/utils/isPlayerLocal'
import { AlertService } from '../../common/services/AlertService'
import { accessInstanceConnectionState } from '../../common/services/InstanceConnectionService'
import { client } from '../../feathers'
import { store, useDispatch } from '../../store'
import { accessAuthState } from '../../user/services/AuthService'
import { getChatMessageSystem, hasSubscribedToChatSystem, removeMessageSystem } from './utils/chatSystem'

interface ChatMessageProps {
  targetObjectId: string
  targetObjectType: string
  text: string
}

//State

// TODO: find existing interfaces for these or move these to @xrengine/common/src/interfaces
const state = createState({
  channels: {
    channels: [] as Channel[],
    limit: 5,
    skip: 0,
    total: 0,
    updateNeeded: true
  },
  targetObjectType: '',
  targetObjectId: '',
  targetObject: {} as User | Group | Party | Instance,
  targetChannelId: '',
  updateMessageScroll: false,
  messageScrollInit: false,
  instanceChannelFetching: false,
  instanceChannelFetched: false
})

store.receptors.push((action: ChatActionType) => {
  state.batch((s) => {
    switch (action.type) {
      case 'LOADED_CHANNELS':
        return s.channels.merge({
          limit: action.limit,
          skip: action.skip,
          total: action.total,
          updateNeeded: false,
          channels: action.channels
        })
      case 'LOADED_CHANNEL': {
        let findIndex
        if (typeof action.channel.id === 'string')
          findIndex = s.channels.channels.findIndex((c) => c.id.value === action.channel.id)
        let idx = findIndex > -1 ? findIndex : s.channels.channels.length
        s.channels.channels[idx].set(action.channel)
        if (action.channelType === 'instance') {
          const endedInstanceChannelIndex = s.channels.channels.findIndex(
            (channel) => channel.channelType.value === 'instance' && channel.id.value !== action.channel.id
          )
          if (endedInstanceChannelIndex > -1) s.channels.channels[endedInstanceChannelIndex].set(none)
          s.merge({
            instanceChannelFetched: true,
            instanceChannelFetching: false
          })
        }
        return
      }

      case 'CREATED_MESSAGE': {
        const channelId = action.message.channelId
        const selfUser = action.selfUser
        const channel = s.channels.channels.find((c) => c.id.value === channelId)

        if (!channel) {
          s.channels.updateNeeded.set(true)
        } else {
          if (!channel.messages.length) channel.messages.set([action.message])
          else channel.messages[channel.messages.length].set(action.message)
        }

        s.updateMessageScroll.set(true)

        if (s.targetChannelId.value.length === 0 && channel) {
          const channelType = channel.channelType.value
          const targetObject =
            channelType === 'user'
              ? channel.userId1.value === selfUser.id
                ? channel.user1
                : channel.user2
              : channelType === 'group'
              ? channel.group
              : channelType === 'instance'
              ? channel.instance
              : channel.party
          s.merge({
            targetChannelId: channelId,
            targetObjectType: channelType,
            targetObject: targetObject.value,
            targetObjectId: targetObject.id.value
          })
        }
        return
      }

      case 'LOADED_MESSAGES': {
        const channelId = action.channelId
        const channel = s.channels.channels.find((c) => c.id.value === channelId)
        if (channel) {
          for (const m of action.messages) {
            const message = channel.messages.find((m2) => m2.id.value === m.id)
            if (message) message.set(m)
            else channel.messages[channel.messages.length].set(m)
          }
        }

        return
      }

      case 'REMOVED_MESSAGE': {
        const channelId = action.message.channelId
        const channel = s.channels.channels.find((c) => c.id.value === channelId)
        if (channel) {
          const messageIdx = channel.messages.findIndex((m) => m.id.value === action.message.id)
          if (messageIdx > -1) channel.messages.merge({ [messageIdx]: none })
        } else {
          s.channels.updateNeeded.set(true)
        }

        return
      }

      case 'PATCHED_MESSAGE': {
        const channelId = action.message.channelId
        const channel = s.channels.channels.find((c) => c.id.value === channelId)
        if (channel) {
          const messageIdx = channel.messages.findIndex((m) => m.id.value === action.message.id)
          if (messageIdx > -1) channel.messages[messageIdx].set(action.message)
        } else {
          s.channels.updateNeeded.set(true)
        }

        return
      }

      case 'CREATED_CHANNEL': {
        const channelId = action.channel.id
        const channel = s.channels.channels.find((c) => c.id.value === channelId)

        if (channel) {
          channel.merge(action.channel)
        } else {
          s.channels.channels[s.channels.channels.length].set(action.channel)
        }

        return
      }

      case 'PATCHED_CHANNEL': {
        const channelId = action.channel.id
        const channel = s.channels.channels.find((c) => c.id.value === channelId)

        if (channel) {
          channel.merge(action.channel)
        } else {
          s.channels.channels[s.channels.channels.length].set(action.channel)
        }

        return
      }

      case 'REMOVED_CHANNEL': {
        const channelId = action.channel.id
        const channelIdx = s.channels.channels.findIndex((c) => c.id.value === channelId)
        if (channelIdx > -1) {
          s.channels.channels[channelIdx].set(none)
        }
        return
      }

      case 'CHAT_TARGET_SET':
        const { targetObjectType, targetObject, targetChannelId } = action
        return s.merge({
          targetObjectType: targetObjectType,
          targetObjectId: targetObject.id,
          targetObject: targetObject,
          targetChannelId: targetChannelId,
          updateMessageScroll: true,
          messageScrollInit: true
        })

      case 'SET_MESSAGE_SCROLL_INIT':
        const { value } = action
        return s.merge({ messageScrollInit: value })

      case 'FETCHING_INSTANCE_CHANNEL':
        return s.merge({ instanceChannelFetching: true })

      case 'SET_UPDATE_MESSAGE_SCROLL': {
        return s.merge({ updateMessageScroll: action.value })
      }
    }
  }, action.type)
})

export const accessChatState = () => state

export const useChatState = () => useState(state) as any as typeof state

globalThis.chatState = state

//Service
export const ChatService = {
  getChannels: async (skip?: number, limit?: number) => {
    const dispatch = useDispatch()
    try {
      const chatState = accessChatState().value

      const channelResult = await client.service('channel').find({
        query: {
          $limit: limit != null ? limit : chatState.channels.limit,
          $skip: skip != null ? skip : chatState.channels.skip
        }
      })
      dispatch(ChatAction.loadedChannels(channelResult))
    } catch (err) {
      AlertService.dispatchAlertError(err)
    }
  },
  getInstanceChannel: async () => {
    const dispatch = useDispatch()
    try {
      const channelResult = await client.service('channel').find({
        query: {
          channelType: 'instance',
          instanceId: accessInstanceConnectionState().instance.id.value
        }
      })
      if (channelResult.total === 0) return setTimeout(() => ChatService.getInstanceChannel(), 2000)
      dispatch(ChatAction.loadedChannel(channelResult.data[0], 'instance'))
    } catch (err) {
      AlertService.dispatchAlertError(err)
    }
  },
  createMessage: async (values: ChatMessageProps) => {
    try {
      const chatState = accessChatState().value
      const data = {
        targetObjectId: chatState.targetObjectId || values.targetObjectId || '',
        targetObjectType: chatState.targetObjectType || values.targetObjectType || 'party',
        text: values.text
      }
      if (data.targetObjectId === null || data.targetObjectType === null) {
        console.log('invalid data, something is null: ')
        console.log(data)
        return
      }
      await client.service('message').create(data)
    } catch (err) {
      AlertService.dispatchAlertError(err)
    }
  },
  sendChatMessage: (values: ChatMessageProps) => {
    try {
      client.service('message').create({
        targetObjectId: values.targetObjectId,
        targetObjectType: values.targetObjectType,
        text: values.text
      })
    } catch (err) {
      console.log(err)
    }
  },
  sendMessage: (text: string) => {
    const user = accessAuthState().user.value
    if (user.instanceId && text) {
      ChatService.sendChatMessage({
        targetObjectId: user.instanceId,
        targetObjectType: 'instance',
        text: text
      })
    }
  },
  getChannelMessages: async (channelId: string, skip?: number, limit?: number) => {
    const dispatch = useDispatch()
    if (channelId && channelId.length > 0) {
      try {
        const chatState = accessChatState().value
        const messageResult = await client.service('message').find({
          query: {
            channelId: channelId,
            $sort: {
              createdAt: -1
            },
            $limit: limit != null ? limit : chatState.channels.channels[channelId].limit,
            $skip: skip != null ? skip : chatState.channels.channels[channelId].skip
          }
        })
        dispatch(ChatAction.loadedMessages(channelId, messageResult))
      } catch (err) {
        AlertService.dispatchAlertError(err)
      }
    }
  },
  removeMessage: async (messageId: string) => {
    try {
      await client.service('message').remove(messageId)
    } catch (err) {
      AlertService.dispatchAlertError(err)
    }
  },
  patchMessage: async (messageId: string, text: string) => {
    try {
      await client.service('message').patch(messageId, {
        text: text
      })
    } catch (err) {
      AlertService.dispatchAlertError(err)
    }
  },
  updateChatTarget: async (targetObjectType: string, targetObject: any) => {
    const dispatch = useDispatch()
    if (!targetObject) {
      dispatch(ChatAction.setChatTarget(targetObjectType, targetObject, ''))
    } else {
      const targetChannelResult = await client.service('channel').find({
        query: {
          findTargetId: true,
          targetObjectType: targetObjectType,
          targetObjectId: targetObject.id
        }
      })
      dispatch(
        ChatAction.setChatTarget(
          targetObjectType,
          targetObject,
          targetChannelResult.total > 0 ? targetChannelResult.data[0].id : ''
        )
      )
    }
  },
  clearChatTargetIfCurrent: async (targetObjectType: string, targetObject: any) => {
    const dispatch = useDispatch()
    const chatState = accessChatState().value
    const chatStateTargetObjectType = chatState.targetObjectType
    const chatStateTargetObjectId = chatState.targetObjectId
    if (
      targetObjectType === chatStateTargetObjectType &&
      (targetObject.id === chatStateTargetObjectId ||
        targetObject.relatedUserId === chatStateTargetObjectId ||
        targetObject.userId === chatStateTargetObjectId)
    ) {
      dispatch(ChatAction.setChatTarget('', {}, ''))
    }
  },
  updateMessageScrollInit: async (value: boolean) => {
    const dispatch = useDispatch()
    dispatch(ChatAction.setMessageScrollInit(value))
  }
}

if (globalThis.process.env['VITE_OFFLINE_MODE'] !== 'true') {
  client.service('message').on('created', (params) => {
    const selfUser = accessAuthState().user.value
    const { message } = params
    if (message != undefined && message.text != undefined) {
      if (isPlayerLocal(message.senderId)) {
        if (handleCommand(message.text, Engine.currentWorld.localClientEntity, message.senderId)) return
        else {
          const system = getChatMessageSystem(message.text)
          if (system !== 'none') {
            message.text = removeMessageSystem(message.text)
            if (!isBot(window) && !Engine.isBot && !hasSubscribedToChatSystem(selfUser.id, system)) return
          }
        }
      } else {
        const system = getChatMessageSystem(message.text)
        if (system !== 'none') {
          message.text = removeMessageSystem(message.text)
          if (!isBot(window) && !Engine.isBot && !Engine.isBot && !hasSubscribedToChatSystem(selfUser.id, system))
            return
        } else if (isCommand(message.text) && !Engine.isBot && !isBot(window)) return
      }
    }

    const msg = ChatAction.createdMessage(params.message, selfUser)
    if (msg != undefined) store.dispatch(msg)
  })

  client.service('message').on('patched', (params) => {
    store.dispatch(ChatAction.patchedMessage(params.message))
  })

  client.service('message').on('removed', (params) => {
    store.dispatch(ChatAction.removedMessage(params.message))
  })

  client.service('channel').on('created', (params) => {
    store.dispatch(ChatAction.createdChannel(params.channel))
  })

  client.service('channel').on('patched', (params) => {
    store.dispatch(ChatAction.patchedChannel(params.channel))
  })

  client.service('channel').on('removed', (params) => {
    store.dispatch(ChatAction.removedChannel(params.channel))
  })
}

//Action

export const ChatAction = {
  loadedChannel: (channelResult: Channel, channelFetchedType: string) => {
    return {
      type: 'LOADED_CHANNEL' as const,
      channel: channelResult,
      channelType: channelFetchedType
    }
  },
  loadedChannels: (channelResult: ChannelResult) => {
    return {
      type: 'LOADED_CHANNELS' as const,
      channels: channelResult.data,
      limit: channelResult.limit,
      skip: channelResult.skip,
      total: channelResult.total
    }
  },
  createdMessage: (message: Message, selfUser: User) => {
    return {
      type: 'CREATED_MESSAGE' as const,
      message: message,
      selfUser: selfUser
    }
  },
  patchedMessage: (message: Message) => {
    return {
      type: 'PATCHED_MESSAGE' as const,
      message: message
    }
  },
  removedMessage: (message: Message) => {
    return {
      type: 'REMOVED_MESSAGE' as const,
      message: message
    }
  },
  loadedMessages: (channelId: string, messageResult: MessageResult) => {
    return {
      type: 'LOADED_MESSAGES' as const,
      messages: messageResult.data,
      limit: messageResult.limit,
      skip: messageResult.skip,
      total: messageResult.total,
      channelId: channelId
    }
  },
  setChatTarget: (targetObjectType: string, targetObject: any, targetChannelId: string) => {
    return {
      type: 'CHAT_TARGET_SET' as const,
      targetObjectType: targetObjectType,
      targetObject: targetObject,
      targetChannelId: targetChannelId
    }
  },
  setMessageScrollInit: (value: boolean) => {
    return {
      type: 'SET_MESSAGE_SCROLL_INIT' as const,
      value: value
    }
  },
  createdChannel: (channel: Channel) => {
    return {
      type: 'CREATED_CHANNEL' as const,
      channel: channel
    }
  },
  patchedChannel: (channel: Channel) => {
    return {
      type: 'PATCHED_CHANNEL' as const,
      channel: channel
    }
  },
  removedChannel: (channel: Channel) => {
    return {
      type: 'REMOVED_CHANNEL' as const,
      channel: channel
    }
  },
  fetchingInstanceChannel: () => {
    return {
      type: 'FETCHING_INSTANCE_CHANNEL' as const
    }
  },
  setUpdateMessageScroll: (value: boolean) => {
    return {
      type: 'SET_UPDATE_MESSAGE_SCROLL' as const,
      value: value
    }
  }
}

export type ChatActionType = ReturnType<typeof ChatAction[keyof typeof ChatAction]>
