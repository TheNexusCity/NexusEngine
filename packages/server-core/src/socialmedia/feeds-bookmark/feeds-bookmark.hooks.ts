/**
 * @author Gleb Ordinsky <glebordinsky@gmail.com>
 */
import * as notifications from '@xrengine/server-core/src/hooks/notifications'

export default {
  before: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [notifications.addFeedBookmark],
    update: [],
    patch: [],
    remove: [notifications.removeFeedBookmark]
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
} as any
