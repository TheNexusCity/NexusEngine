import authenticate from '../../hooks/authenticate'
import restrictUserRole from '../../hooks/restrict-user-role'
import { iff, isProvider, disallow } from 'feathers-hooks-common'

export default {
  before: {
    all: [authenticate(), iff(isProvider('external'), restrictUserRole('admin') as any)],
    find: [],
    get: [],
    create: [],
    update: [disallow()],
    patch: [disallow()],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
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
