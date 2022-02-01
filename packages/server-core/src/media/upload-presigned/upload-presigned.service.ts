import { Application } from '../../../declarations'
import { UploadPresigned } from './upload-presigned.class'
import hooks from './upload-presigned.hooks'
import uploadDocs from './upload-presigned.docs'

declare module '../../../declarations' {
  interface ServiceTypes {
    'upload-presigned': UploadPresigned
  }
}

export default (app: Application): void => {
  const presigned = new UploadPresigned({}, app)
  presigned.docs = uploadDocs
  app.use('upload-presigned', presigned)

  const service = app.service('upload-presigned')

  service.hooks(hooks)
}
