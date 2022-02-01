import os from 'os'
import { MediaStreams } from '@xrengine/engine/src/networking/systems/MediaStreamSystem'
import { Network } from '@xrengine/engine/src/networking//classes/Network'
import { MessageTypes } from '@xrengine/engine/src/networking/enums/MessageTypes'
import { getNearbyUsers } from '@xrengine/engine/src/networking/functions/getNearbyUsers'
import { WebRtcTransportParams } from '@xrengine/server-core/src/types/WebRtcTransportParams'
import { createWorker } from 'mediasoup'
import {
  DataProducer,
  DataConsumer,
  DataConsumerOptions,
  DataProducerOptions,
  Producer,
  Router,
  RtpCodecCapability,
  Transport,
  WebRtcTransport
} from 'mediasoup/node/lib/types'
import SocketIO from 'socket.io'
import { localConfig, sctpParameters } from '@xrengine/server-core/src/config'
import { getUserIdFromSocketId } from './NetworkFunctions'
import config from '@xrengine/server-core/src/appconfig'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { SocketWebRTCServerTransport } from './SocketWebRTCServerTransport'

const toArrayBuffer = (buf): any => {
  var ab = new ArrayBuffer(buf.length)
  var view = new Uint8Array(ab)
  for (var i = 0; i < buf.length; ++i) {
    view[i] = buf[i]
  }
  return ab
}

export async function startWebRTC(networkTransport: SocketWebRTCServerTransport): Promise<void> {
  console.info('Starting WebRTC Server')
  // Initialize roomstate
  const cores = os.cpus()
  networkTransport.routers = { instance: [] }
  for (let i = 0; i < cores.length; i++) {
    const newWorker = await createWorker({
      logLevel: 'debug',
      rtcMinPort: localConfig.mediasoup.worker.rtcMinPort,
      rtcMaxPort: localConfig.mediasoup.worker.rtcMaxPort,
      // dtlsCertificateFile: serverConfig.server.certPath,
      // dtlsPrivateKeyFile: serverConfig.server.keyPath,
      logTags: ['sctp']
    })

    newWorker.on('died', (err) => {
      console.error('mediasoup worker died (this should never happen)')
      console.error('Reported error', err)
      process.exit(1)
    })

    console.info('Created Mediasoup worker')

    const mediaCodecs = localConfig.mediasoup.router.mediaCodecs as RtpCodecCapability[]
    const newRouter = await newWorker.createRouter({ mediaCodecs })
    networkTransport.routers.instance.push(newRouter)
    console.info('Worker created router')
    networkTransport.workers.push(newWorker)
  }
}

export const sendNewProducer =
  (networkTransport: SocketWebRTCServerTransport, socket: SocketIO.Socket, channelType: string, channelId?: string) =>
  async (producer: Producer): Promise<void> => {
    const userId = getUserIdFromSocketId(socket.id)!
    const world = Engine.currentWorld
    const selfClient = world.clients.get(userId)!
    if (selfClient?.socketId != null) {
      for (const [, client] of world.clients) {
        console.info(`Sending media for ${userId}`)
        client?.media &&
          Object.entries(client.media!).map(([subName, subValue]) => {
            if (
              channelType === 'instance'
                ? 'instance' === (subValue as any).channelType
                : (subValue as any).channelType === channelType && (subValue as any).channelId === channelId
            )
              selfClient.socket!.emit(
                MessageTypes.WebRTCCreateProducer.toString(),
                client.userId,
                subName,
                producer.id,
                channelType,
                channelId
              )
          })
      }
    }
  }
// Create consumer for each client!
export const sendCurrentProducers = async (
  socket: SocketIO.Socket,
  userIds: string[],
  channelType: string,
  channelId?: string
): Promise<void> => {
  const world = Engine.currentWorld
  const selfUserId = getUserIdFromSocketId(socket.id)!
  const selfClient = world.clients.get(selfUserId)!
  if (selfClient?.socketId != null) {
    for (const [userId, client] of world.clients) {
      if (
        userId === selfUserId ||
        (userIds.length > 0 && userIds.includes(userId) === false) ||
        client.media == null ||
        client.socketId == null
      )
        return
      Object.entries(client.media).map(([subName, subValue]) => {
        if ((subValue as any).channelType === channelType && (subValue as any).channelId === channelId)
          selfClient.socket!.emit(
            MessageTypes.WebRTCCreateProducer.toString(),
            client.userId,
            subName,
            (subValue as any).producerId,
            channelType,
            channelId
          )
      })
    }
  }
}

export const handleConsumeDataEvent =
  (networkTransport: SocketWebRTCServerTransport, socket: SocketIO.Socket) =>
  async (dataProducer: DataProducer): Promise<any> => {
    const userId = getUserIdFromSocketId(socket.id)!
    console.info('Data Consumer being created on server by client: ' + userId)
    const world = Engine.currentWorld
    if (!world.clients.has(userId)) return Promise.resolve(false)

    const newTransport: Transport = world.clients.get(userId)!.instanceRecvTransport
    const outgoingDataProducer = networkTransport.outgoingDataProducer

    if (newTransport != null) {
      try {
        const dataConsumer = await newTransport.consumeData({
          dataProducerId: outgoingDataProducer.id,
          appData: { peerId: userId, transportId: newTransport.id }
        })

        dataConsumer.on('producerclose', () => {
          dataConsumer.close()
          if (world.clients.has(userId)) world.clients.get(userId)!.dataConsumers!.delete(dataProducer.id)
        })

        console.info('Setting data consumer to room state')
        if (!world.clients.has(userId))
          return socket.emit(MessageTypes.WebRTCConsumeData.toString(), { error: 'client no longer exists' })
        world.clients.get(userId)!.dataConsumers!.set(dataProducer.id, dataConsumer)
        if (!world.clients.has(userId))
          return socket.emit(MessageTypes.WebRTCConsumeData.toString(), { error: 'client no longer exists' })
        const dataProducerOut = world.clients.get(userId)!.dataProducers!.get('instance')
        // Data consumers are all consuming the single producer that outputs from the server's message queue
        socket.emit(MessageTypes.WebRTCConsumeData.toString(), {
          dataProducerId: dataProducerOut.id,
          sctpStreamParameters: dataConsumer.sctpStreamParameters,
          label: dataConsumer.label,
          id: dataConsumer.id,
          appData: dataConsumer.appData,
          protocol: 'raw'
        } as DataConsumerOptions)
      } catch (err) {
        console.log('Consume data error', err)
        console.log('Transport that could not be consumed', newTransport)
        socket.emit(MessageTypes.WebRTCConsumeData.toString(), { error: 'transport did not exist' })
      }
    } else socket.emit(MessageTypes.WebRTCConsumeData.toString(), { error: 'transport did not exist' })
  }

export async function closeTransport(transport): Promise<void> {
  console.info('closing transport ' + transport.id, transport.appData)
  // our producer and consumer event handlers will take care of
  // calling closeProducer() and closeConsumer() on all the producers
  // and consumers associated with this transport
  if (transport && typeof transport.close === 'function') {
    await transport.close()
    delete Network.instance.transports[transport.id]
  }
}
export async function closeProducer(producer): Promise<void> {
  console.info('closing producer ' + producer.id, producer.appData)
  await producer.close()

  if (MediaStreams.instance)
    MediaStreams.instance.producers = MediaStreams.instance?.producers.filter((p) => p.id !== producer.id)

  const world = Engine.currentWorld
  if (world.clients.has(producer.appData.peerId))
    delete world.clients.get(producer.appData.peerId)!.media![producer.appData.mediaTag]
}

export async function closeProducerAndAllPipeProducers(producer): Promise<void> {
  console.log('closing producer and all pipe producer ' + producer?.id, producer?.appData)
  if (producer != null) {
    // remove this producer from our roomState.producers list
    if (MediaStreams.instance)
      MediaStreams.instance.producers = MediaStreams.instance?.producers.filter((p) => p.id !== producer.id)

    // finally, close the original producer
    await producer.close()

    // remove this producer from our roomState.producers list
    if (MediaStreams.instance)
      MediaStreams.instance.producers = MediaStreams.instance?.producers.filter((p) => p.id !== producer.id)
    if (MediaStreams.instance)
      MediaStreams.instance.consumers = MediaStreams.instance?.consumers.filter(
        (c) => !(c.appData.mediaTag === producer.appData.mediaTag && c.producerId === producer.id)
      )

    // remove this track's info from our roomState...mediaTag bookkeeping
    delete Engine.currentWorld.clients.get(producer.appData.peerId)?.media![producer.appData.mediaTag]
  }
}

export async function closeConsumer(consumer): Promise<void> {
  await consumer.close()

  if (MediaStreams.instance)
    MediaStreams.instance.consumers = MediaStreams.instance?.consumers.filter((c) => c.id !== consumer.id)

  const world = Engine.currentWorld
  for (const [, client] of world.clients) {
    client.socket!.emit(MessageTypes.WebRTCCloseConsumer.toString(), consumer.id)
  }

  delete world.clients.get(consumer.appData.peerId)?.consumerLayers![consumer.id]
}

export async function createWebRtcTransport(
  networkTransport: SocketWebRTCServerTransport,
  { peerId, direction, sctpCapabilities, channelType, channelId }: WebRtcTransportParams
): Promise<WebRtcTransport> {
  const { listenIps, initialAvailableOutgoingBitrate } = localConfig.mediasoup.webRtcTransport
  const mediaCodecs = localConfig.mediasoup.router.mediaCodecs as RtpCodecCapability[]
  if (channelType !== 'instance') {
    if (networkTransport.routers[`${channelType}:${channelId}`] == null) {
      networkTransport.routers[`${channelType}:${channelId}`] = [] as any
      await Promise.all(
        networkTransport.workers.map(async (worker) => {
          const newRouter = await worker.createRouter({ mediaCodecs })
          networkTransport.routers[`${channelType}:${channelId}`].push(newRouter)
          return Promise.resolve()
        })
      )
    }
    console.info('Worker created router for channel ' + `${channelType}:${channelId}`)
  }

  const routerList =
    channelType === 'instance' && channelId == null
      ? networkTransport.routers.instance
      : networkTransport.routers[`${channelType}:${channelId}`]

  const dumps: any = await Promise.all(routerList.map(async (item) => await item.dump()))
  const sortedDumps = dumps.sort((a, b) => a.transportIds.length - b.transportIds.length)
  const selectedrouter = routerList.find((item) => item.id === sortedDumps[0].id)!

  const newTransport = await selectedrouter?.createWebRtcTransport({
    listenIps: listenIps,
    enableUdp: true,
    enableTcp: false,
    preferUdp: true,
    enableSctp: true,
    numSctpStreams: sctpCapabilities.numStreams,
    initialAvailableOutgoingBitrate: initialAvailableOutgoingBitrate,
    appData: { peerId, channelType, channelId, clientDirection: direction }
  })

  // console.info('New transport to return:')
  // console.info(newTransport)
  return newTransport
}

export async function createInternalDataConsumer(
  networkTransport: SocketWebRTCServerTransport,
  dataProducer: DataProducer,
  userId: string
): Promise<DataConsumer | null> {
  try {
    const consumer = await networkTransport.outgoingDataTransport.consumeData({
      dataProducerId: dataProducer.id,
      appData: { peerId: userId, transportId: networkTransport.outgoingDataTransport.id },
      maxPacketLifeTime: dataProducer.sctpStreamParameters!.maxPacketLifeTime,
      maxRetransmits: dataProducer.sctpStreamParameters!.maxRetransmits,
      ordered: false
    })
    consumer.on('message', (message) => {
      Network.instance.incomingMessageQueueUnreliable.add(toArrayBuffer(message))
      Network.instance.incomingMessageQueueUnreliableIDs.add(userId)
    })
    return consumer
  } catch (err) {
    console.log('Error creating internal data consumer', err)
    console.log('dataProducer that caused error', dataProducer)
  }
  return null
}

export async function handleWebRtcTransportCreate(
  networkTransport: SocketWebRTCServerTransport,
  socket,
  data: WebRtcTransportParams,
  callback
): Promise<any> {
  const userId = getUserIdFromSocketId(socket.id)!
  const { direction, peerId, sctpCapabilities, channelType, channelId } = Object.assign(data, { peerId: userId })

  const existingTransports = Network.instance.transports.filter(
    (t) =>
      t.appData.peerId === peerId &&
      t.appData.direction === direction &&
      (channelType === 'instance'
        ? t.appData.channelType === 'instance'
        : t.appData.channelType === channelType && t.appData.channelId === channelId)
  )
  await Promise.all(existingTransports.map((t) => closeTransport(t)))
  const newTransport: WebRtcTransport = await createWebRtcTransport(networkTransport, {
    peerId,
    direction,
    sctpCapabilities,
    channelType,
    channelId
  })

  await newTransport.setMaxIncomingBitrate(localConfig.mediasoup.webRtcTransport.maxIncomingBitrate)

  Network.instance.transports[newTransport.id] = newTransport

  // Distinguish between send and create transport of each client w.r.t producer and consumer (data or mediastream)
  const world = Engine.currentWorld
  if (direction === 'recv') {
    if (channelType === 'instance' && world.clients.has(userId))
      world.clients.get(userId)!.instanceRecvTransport = newTransport
    else if (channelType !== 'instance' && channelId != null)
      world.clients.get(userId)!.channelRecvTransport = newTransport
  } else if (direction === 'send') {
    if (channelType === 'instance' && world.clients.has(userId))
      world.clients.get(userId)!.instanceSendTransport = newTransport
    else if (channelType !== 'instance' && channelId != null && world.clients.has(userId))
      world.clients.get(userId)!.channelSendTransport = newTransport
  }

  const { id, iceParameters, iceCandidates, dtlsParameters } = newTransport

  if (config.kubernetes.enabled) {
    const serverResult = await networkTransport.app.k8AgonesClient.get('gameservers')
    const thisGs = serverResult.items.find(
      (server) => server.metadata.name === networkTransport.app.gameServer.objectMeta.name
    )

    for (let [index, candidate] of iceCandidates.entries()) {
      iceCandidates[index].port = thisGs.spec?.ports?.find(
        (portMapping) => portMapping.containerPort === candidate.port
      ).hostPort
    }
  }
  const clientTransportOptions = {
    id,
    sctpParameters: {
      ...sctpParameters,
      OS: sctpCapabilities.numStreams.OS,
      MIS: sctpCapabilities.numStreams.MIS
    },
    iceParameters,
    iceCandidates,
    dtlsParameters
  }

  newTransport.observer.on('dtlsstatechange', (dtlsState) => {
    if (dtlsState === 'closed') closeTransport(newTransport)
  })
  // Create data consumers for other clients if the current client transport receives data producer on it
  newTransport.observer.on('newdataproducer', handleConsumeDataEvent(networkTransport, socket))
  newTransport.observer.on('newproducer', sendNewProducer(networkTransport, socket, channelType, channelId))
  // console.log('Callback from transportCreate with options:');
  // console.log(clientTransportOptions);
  callback({ transportOptions: clientTransportOptions })
}

export async function handleWebRtcProduceData(
  networkTransport: SocketWebRTCServerTransport,
  socket,
  data,
  callback
): Promise<any> {
  const userId = getUserIdFromSocketId(socket.id)
  if (!userId) {
    console.log('userId could not be found for socketId' + socket.id)
    return
  }
  if (!data.label) throw { error: 'data producer label i.e. channel name is not provided!' }

  const world = Engine.currentWorld
  if (!world.clients.has(userId)) return callback({ error: 'client no longer exists' })
  const { transportId, sctpStreamParameters, label, protocol, appData } = data
  console.info(`Data channel label: ${label} -- user id: ` + userId)
  console.info('Data producer params', data)
  const transport: any = Network.instance.transports[transportId]
  const options: DataProducerOptions = {
    label,
    protocol,
    sctpStreamParameters,
    appData: { ...(appData || {}), peerID: userId, transportId }
  }
  if (transport != null) {
    try {
      const dataProducer = await transport.produceData(options)
      networkTransport.dataProducers.push(dataProducer)
      console.info(`user ${userId} producing data`)
      if (world.clients.has(userId)) {
        world.clients.get(userId)!.dataProducers!.set(label, dataProducer)

        const currentRouter = networkTransport.routers.instance.find(
          (router) => router.id === (transport as any).internal.routerId
        )!

        await Promise.all(
          networkTransport.routers.instance.map(async (router) => {
            if (router.id !== (transport as any).internal.routerId)
              return currentRouter.pipeToRouter({
                dataProducerId: dataProducer.id,
                router: router
              })
            else return Promise.resolve()
          })
        )

        // if our associated transport closes, close ourself, too
        dataProducer.on('transportclose', () => {
          networkTransport.dataProducers.splice(networkTransport.dataProducers.indexOf(dataProducer), 1)
          console.info("data producer's transport closed: " + dataProducer.id)
          dataProducer.close()
          world.clients.get(userId)!.dataProducers!.delete(label)
        })
        const internalConsumer = await createInternalDataConsumer(networkTransport, dataProducer, userId)
        if (internalConsumer) {
          if (!world.clients.has(userId)) return callback({ error: 'Client no longer exists' })
          world.clients.get(userId)!.dataConsumers!.set(label, internalConsumer)
          // transport.handleConsumeDataEvent(socket);
          console.info('transport.handleConsumeDataEvent(socket);')
          // Possibly do stuff with appData here
          console.info('Sending dataproducer id to client:' + dataProducer.id)
          return callback({ id: dataProducer.id })
        } else return callback({ error: 'invalid data producer' })
      } else {
        return callback({ error: 'client no longer exists' })
      }
    } catch (e) {
      console.error('handleWebRtcProduceData', e)
    }
  } else return callback({ error: 'invalid transport' })
}

export async function handleWebRtcTransportClose(socket, data, callback): Promise<any> {
  const { transportId } = data
  const transport = Network.instance.transports[transportId]
  if (transport != null) await closeTransport(transport).catch((err) => console.error(err))
  callback({ closed: true })
}

export async function handleWebRtcTransportConnect(socket, data, callback): Promise<any> {
  const { transportId, dtlsParameters } = data,
    transport = Network.instance.transports[transportId]
  if (transport != null) {
    await transport.connect({ dtlsParameters }).catch((err) => {
      console.error('handleWebRtcTransportConnect', err, data)
      callback({ connected: false })
      return
    })
    callback({ connected: true })
  } else callback({ error: 'invalid transport' })
}

export async function handleWebRtcCloseProducer(socket, data, callback): Promise<any> {
  const { producerId } = data,
    producer = MediaStreams.instance?.producers.find((p) => p.id === producerId)
  await closeProducerAndAllPipeProducers(producer).catch((err) => console.error(err))
  callback({ closed: true })
}

export async function handleWebRtcSendTrack(networkTransport, socket, data, callback): Promise<any> {
  const userId = getUserIdFromSocketId(socket.id)
  const { transportId, kind, rtpParameters, paused = false, appData } = data,
    transport: any = Network.instance.transports[transportId] as Transport

  if (transport == null) return callback({ error: 'Invalid transport ID' })

  try {
    const producer = await transport.produce({
      kind,
      rtpParameters,
      paused,
      appData: { ...appData, peerId: userId, transportId }
    })

    const routers = networkTransport.routers[`${appData.channelType}:${appData.channelId}`]
    const currentRouter = routers.find((router) => router.id === (transport as any).internal.routerId)!

    await Promise.all(
      routers.map(async (router: Router) => {
        if ((router as any).id !== (transport as any).internal.routerId)
          return currentRouter.pipeToRouter({
            producerId: producer.id,
            router: router
          })
        else return Promise.resolve()
      })
    )

    producer.on('transportclose', () => closeProducerAndAllPipeProducers(producer))

    if (!MediaStreams.instance?.producers) console.warn('Media stream producers is undefined')
    MediaStreams.instance?.producers?.push(producer)

    const world = Engine.currentWorld
    if (userId != null && world.clients.has(userId)) {
      world.clients.get(userId)!.media![appData.mediaTag] = {
        paused,
        producerId: producer.id,
        globalMute: false,
        encodings: rtpParameters.encodings,
        channelType: appData.channelType,
        channelId: appData.channelId
      }
    }

    for (const [clientUserId, client] of world.clients) {
      if (clientUserId !== userId)
        client.socket!.emit(
          MessageTypes.WebRTCCreateProducer.toString(),
          userId,
          appData.mediaTag,
          producer.id,
          appData.channelType,
          appData.channelId
        )
    }
    callback({ id: producer.id })
  } catch (err) {
    console.log('Error with sendTrack:', err)
    callback({ error: 'error with sendTrack: ' + err })
  }
}

export async function handleWebRtcReceiveTrack(
  networkTransport: SocketWebRTCServerTransport,
  socket,
  data,
  callback
): Promise<any> {
  const world = Engine.currentWorld
  const userId = getUserIdFromSocketId(socket.id)!
  const { mediaPeerId, mediaTag, rtpCapabilities, channelType, channelId } = data
  const producer = MediaStreams.instance.producers.find(
    (p) =>
      p.appData.mediaTag === mediaTag &&
      p.appData.peerId === mediaPeerId &&
      (channelType === 'instance'
        ? p.appData.channelType === channelType
        : p.appData.channelType === channelType && p.appData.channelId === channelId)
  )
  const router = networkTransport.routers[`${channelType}:${channelId}`][0]
  if (producer == null || !router.canConsume({ producerId: producer.id, rtpCapabilities })) {
    const msg = `client cannot consume ${mediaPeerId}:${mediaTag}`
    console.error(`recv-track: ${userId} ${msg}`)
    return callback({ error: msg })
  }

  const transport = Object.values(Network.instance.transports).find(
    (t) =>
      (t as any).appData.peerId === userId &&
      (t as any).appData.clientDirection === 'recv' &&
      (channelType === 'instance'
        ? (t as any).appData.channelType === channelType
        : (t as any).appData.channelType === channelType && (t as any).appData.channelId === channelId) &&
      (t as any).closed === false
  )

  if (transport != null) {
    try {
      const consumer = await (transport as any).consume({
        producerId: producer.id,
        rtpCapabilities,
        paused: true, // see note above about always starting paused
        appData: { peerId: userId, mediaPeerId, mediaTag, channelType: channelType, channelId: channelId }
      })

      // we need both 'transportclose' and 'producerclose' event handlers,
      // to make sure we close and clean up consumers in all circumstances
      consumer.on('transportclose', () => {
        console.info(`consumer's transport closed`)
        console.info(consumer.id)
        closeConsumer(consumer)
      })
      consumer.on('producerclose', () => {
        console.info(`consumer's producer closed`)
        console.info(consumer.id)
        closeConsumer(consumer)
      })
      consumer.on('producerpause', () => {
        if (consumer && typeof consumer.pause === 'function')
          Network.instance.mediasoupOperationQueue.add({
            object: consumer,
            action: 'pause'
          })
        socket.emit(MessageTypes.WebRTCPauseConsumer.toString(), consumer.id)
      })
      consumer.on('producerresume', () => {
        if (consumer && typeof consumer.resume === 'function')
          Network.instance.mediasoupOperationQueue.add({
            object: consumer,
            action: 'resume'
          })
        socket.emit(MessageTypes.WebRTCResumeConsumer.toString(), consumer.id)
      })

      // stick this consumer in our list of consumers to keep track of
      MediaStreams.instance?.consumers.push(consumer)

      if (world.clients.has(userId))
        world.clients.get(userId)!.consumerLayers![consumer.id] = {
          currentLayer: null,
          clientSelectedLayer: null
        }

      // update above data structure when layer changes.
      consumer.on('layerschange', (layers) => {
        if (world.clients.has(userId) && world.clients.get(userId)!.consumerLayers![consumer.id])
          world.clients.get(userId)!.consumerLayers![consumer.id].currentLayer = layers && layers.spatialLayer
      })

      callback({
        producerId: producer.id,
        id: consumer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        type: consumer.type,
        producerPaused: consumer.producerPaused
      })
    } catch (err) {
      console.log('Consume error', err)
      console.log('Transport that could not be consumed', transport)
      callback({ error: 'Transport to consume no longer exists' })
    }
  } else {
    callback({
      id: null
    })
  }
}

export async function handleWebRtcPauseConsumer(socket, data, callback): Promise<any> {
  const { consumerId } = data,
    consumer = MediaStreams.instance?.consumers.find((c) => c.id === consumerId)
  if (consumer != null) {
    Network.instance.mediasoupOperationQueue.add({
      object: consumer,
      action: 'pause'
    })
  }
  callback({ paused: true })
}

export async function handleWebRtcResumeConsumer(socket, data, callback): Promise<any> {
  const { consumerId } = data,
    consumer = MediaStreams.instance?.consumers.find((c) => c.id === consumerId)
  if (consumer != null) {
    Network.instance.mediasoupOperationQueue.add({
      object: consumer,
      action: 'resume'
    })
  }
  callback({ resumed: true })
}

export async function handleWebRtcCloseConsumer(socket, data, callback): Promise<any> {
  const { consumerId } = data,
    consumer = MediaStreams.instance?.consumers.find((c) => c.id === consumerId)
  if (consumer != null) await closeConsumer(consumer)
  callback({ closed: true })
}

export async function handleWebRtcConsumerSetLayers(socket, data, callback): Promise<any> {
  const { consumerId, spatialLayer } = data,
    consumer = MediaStreams.instance?.consumers.find((c) => c.id === consumerId)
  console.info('consumer-set-layers: ', spatialLayer, consumer.appData)
  await consumer.setPreferredLayers({ spatialLayer })
  callback({ layersSet: true })
}

export async function handleWebRtcResumeProducer(socket, data, callback): Promise<any> {
  const userId = getUserIdFromSocketId(socket.id)
  const { producerId } = data,
    producer = MediaStreams.instance?.producers.find((p) => p.id === producerId)
  console.info('resume-producer', producer?.appData)
  if (producer != null) {
    Network.instance.mediasoupOperationQueue.add({
      object: producer,
      action: 'resume'
    })
    // await producer.resume();
    const world = Engine.currentWorld
    if (userId != null && world.clients.has(userId)) {
      world.clients.get(userId)!.media![producer.appData.mediaTag].paused = false
      world.clients.get(userId)!.media![producer.appData.mediaTag].globalMute = false
      const hostClient = Array.from(world.clients.entries()).find(([, client]) => {
        return client.media![producer.appData.mediaTag]?.producerId === producerId
      })!
      hostClient[1].socket!.emit(MessageTypes.WebRTCResumeProducer.toString(), producer.id)
    }
  }
  callback({ resumed: true })
}

export async function handleWebRtcPauseProducer(socket, data, callback): Promise<any> {
  const userId = getUserIdFromSocketId(socket.id)
  const world = Engine.currentWorld
  const { producerId, globalMute } = data,
    producer = MediaStreams.instance?.producers.find((p) => p.id === producerId)
  if (producer != null) {
    Network.instance.mediasoupOperationQueue.add({
      object: producer,
      action: 'pause'
    })
    if (
      userId != null &&
      world.clients.has(userId) &&
      world.clients.get(userId)!.media![producer.appData.mediaTag] != null
    ) {
      world.clients.get(userId)!.media![producer.appData.mediaTag].paused = true
      world.clients.get(userId)!.media![producer.appData.mediaTag].globalMute = globalMute || false
      if (globalMute === true) {
        const hostClient = Array.from(world.clients.entries()).find(([, client]) => {
          return client.media![producer.appData.mediaTag]?.producerId === producerId
        })!
        hostClient[1].socket!.emit(MessageTypes.WebRTCPauseProducer.toString(), producer.id, true)
      }
    }
  }
  callback({ paused: true })
}

export async function handleWebRtcRequestNearbyUsers(
  networkTransport: SocketWebRTCServerTransport,
  socket,
  data,
  callback
): Promise<any> {
  const userId = getUserIdFromSocketId(socket.id)!
  const world = Engine.currentWorld
  const selfClient = world.clients.get(userId)!
  if (selfClient?.socketId != null) {
    const nearbyUsers = getNearbyUsers(userId)
    const nearbyUserIds = nearbyUsers == null ? [] : nearbyUsers.map((user) => user.id)
    callback({ userIds: nearbyUserIds })
  } else {
    callback({ userIds: [] })
  }
}

export async function handleWebRtcRequestCurrentProducers(socket, data, callback): Promise<any> {
  const { userIds, channelType, channelId } = data

  await sendCurrentProducers(socket, userIds || [], channelType, channelId)
  callback({ requested: true })
}

export async function handleWebRtcInitializeRouter(
  networkTransport: SocketWebRTCServerTransport,
  socket,
  data,
  callback
): Promise<any> {
  const { channelType, channelId } = data
  if (!(channelType === 'instance' && channelId == null)) {
    const mediaCodecs = localConfig.mediasoup.router.mediaCodecs as RtpCodecCapability[]
    if (networkTransport.routers[`${channelType}:${channelId}`] == null) {
      console.log('Making new routers for channel', channelId)
      networkTransport.routers[`${channelType}:${channelId}`] = []
      await Promise.all(
        networkTransport.workers.map(async (worker) => {
          const newRouter = await worker.createRouter({ mediaCodecs })
          networkTransport.routers[`${channelType}:${channelId}`].push(newRouter)
          return Promise.resolve()
        })
      )
    }
  }
  callback({ initialized: true })
}
