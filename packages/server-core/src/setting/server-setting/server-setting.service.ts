import hooks from './server-setting.hooks'
import { Application } from '../../../declarations'
import { ServerSetting } from './server-setting.class'
import createModel from './server-setting.model'
import { refreshAppConfig } from '../../updateAppConfig'

declare module '../../../declarations' {
  interface ServiceTypes {
    server: ServerSetting
  }
}

export default (app: Application): void => {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
    multi: true
  }

  const event = new ServerSetting(options, app)
  app.use('server-setting', event)

  const service = app.service('server-setting')
  service.hooks(hooks)

  service.on('patched', () => {
    //TODO: refresh app config after server setting is patched
    refreshAppConfig()
  })
}
