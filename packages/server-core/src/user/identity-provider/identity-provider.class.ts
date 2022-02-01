import { Service, SequelizeServiceOptions } from 'feathers-sequelize'
import { Application } from '../../../declarations'
import { Sequelize } from 'sequelize'
import { v1 as uuidv1 } from 'uuid'
import { random } from 'lodash'
import getFreeInviteCode from '../../util/get-free-invite-code'
import { AuthenticationService } from '@feathersjs/authentication'
import config from '../../appconfig'
import { Params } from '@feathersjs/feathers'
import Paginated from '../../types/PageObject'
import blockchainTokenGenerator from '../../util/blockchainTokenGenerator'
import blockchainUserWalletGenerator from '../../util/blockchainUserWalletGenerator'
import { extractLoggedInUserFromParams } from '../auth-management/auth-management.utils'

interface Data {}

/**
 * A class for identity-provider service
 *
 * @author Vyacheslav Solovjov
 */

export class IdentityProvider extends Service {
  public app: Application
  public docs: any

  constructor(options: Partial<SequelizeServiceOptions>, app: Application) {
    super(options)
    this.app = app
  }

  /**
   * A method used to create accessToken
   *
   * @param data which contains token and type
   * @param params
   * @returns accessToken
   */
  async create(data: any, params: Params): Promise<any> {
    let { token, type, password } = data
    let user

    if (params.authentication) {
      const authResult = await (this.app.service('authentication') as any).strategies.jwt.authenticate(
        { accessToken: params.authentication.accessToken },
        {}
      )
      if (authResult[config.authentication.entity]?.userId) {
        user = await this.app.service('user').get(authResult[config.authentication.entity]?.userId)
      }
    }
    if (
      (!user || user.userRole !== 'admin') &&
      params.provider &&
      type !== 'password' &&
      type !== 'email' &&
      type !== 'sms'
    )
      type = 'guest' //Non-password/magiclink create requests must always be for guests
    let userId = data.userId
    let identityProvider: any

    switch (type) {
      case 'email':
        identityProvider = {
          token,
          type
        }
        break
      case 'sms':
        identityProvider = {
          token,
          type
        }
        break
      case 'password':
        identityProvider = {
          token,
          password,
          type
        }
        break
      case 'github':
        identityProvider = {
          token: token,
          type
        }
        break
      case 'facebook':
        identityProvider = {
          token: token,
          type
        }
        break
      case 'google':
        identityProvider = {
          token: token,
          type
        }
        break
      case 'twitter':
        identityProvider = {
          token: token,
          type
        }
        break
      case 'linkedin':
        identityProvider = {
          token: token,
          type
        }
        break
      case 'discord':
        identityProvider = {
          token: token,
          type
        }
        break
      case 'guest':
        identityProvider = {
          token: token,
          type: type
        }
        break
      case 'auth0':
        break
    }

    // if userId is not defined, then generate userId
    if (!userId) {
      userId = uuidv1()
    }

    const sequelizeClient: Sequelize = this.app.get('sequelizeClient')
    const userService = this.app.service('user')
    const User = sequelizeClient.model('user')

    // check if there is a user with userId
    let foundUser
    try {
      foundUser = await userService.get(userId)
    } catch (err) {}

    if (foundUser != null) {
      // if there is the user with userId, then we add the identity provider to the user
      return await super.create(
        {
          ...data,
          ...identityProvider,
          userId
        },
        params
      )
    }

    // create with user association
    params.sequelize = {
      include: [User]
    }

    const code = await getFreeInviteCode(this.app)
    // if there is no user with userId, then we create a user and a identity provider.
    const adminCount = await (this.app.service('user') as any).Model.count({
      where: {
        userRole: 'admin'
      }
    })
    const avatars = await this.app.service('avatar').find({ isInternal: true })
    let result
    try {
      result = await super.create(
        {
          ...data,
          ...identityProvider,
          user: {
            id: userId,
            userRole: type === 'guest' ? 'guest' : type === 'admin' || adminCount === 0 ? 'admin' : 'user',
            inviteCode: type === 'guest' ? null : code,
            avatarId: avatars[random(avatars.length - 1)].avatarId
          }
        },
        params
      )
    } catch (err) {
      await this.app.service('user').remove(userId)
      throw err
    }
    // DRC
    try {
      if (result.user.userRole !== 'guest') {
        try {
          let response: any = await blockchainTokenGenerator()

          const accessToken = response?.data?.accessToken

          let walleteResponse = await blockchainUserWalletGenerator(result.user.id, accessToken)
        } catch (err) {
          console.error(err, 'blockchain error')
        }
        let invenData: any = await this.app.service('inventory-item').find({ query: { isCoin: true } })

        let invenDataId = invenData.data[0].dataValues.inventoryItemId

        let resp = await this.app.service('user-inventory').create({
          userId: result.user.id,
          inventoryItemId: invenDataId,
          quantity: 10
        })
      }
    } catch (err) {
      console.error(err, 'error')
    }
    // DRC

    if (config.scopes.guest.length) {
      config.scopes.guest.forEach(async (el) => {
        await this.app.service('scope').create({
          type: el,
          userId: userId
        })
      })
    }

    if (type === 'guest') {
      if (config.scopes.guest.length) {
        config.scopes.guest.forEach(async (el) => {
          await this.app.service('scope').create({
            type: el,
            userId: userId
          })
        })
      }

      const authService = new AuthenticationService(this.app, 'authentication')
      // this.app.service('authentication')
      result.accessToken = await authService.createAccessToken({}, { subject: result.id.toString() })
    }
    return result
  }

  async find(params: Params): Promise<Data[] | Paginated<Data>> {
    const loggedInUser = extractLoggedInUserFromParams(params)
    if (params.provider) params.query!.userId = loggedInUser.id
    return super.find(params)
  }
}
