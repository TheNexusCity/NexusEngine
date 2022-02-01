// Initializes the `feed` service on path `/feed`
import { Application } from '../../../declarations'
import { Notifications } from './notifications.class'
import createModel from './notifications.model'
import hooks from './notifications.hooks'

// Add this service to the service type index
// declare module '../../../declarations' {
//   interface ServiceTypes {
//     'Notifications': FeedFires;
//   }
// }

export default function (app: Application): void {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  }

  // Initialize our service with any options it requires
  app.use('notifications', new Notifications(options, app))

  // Get our initialized service so that we can register hooks
  const service = app.service('notifications')

  service.hooks(hooks)
}
