import { Service, SequelizeServiceOptions } from 'feathers-sequelize'
import { Application } from '../../../declarations'
import { Params } from '@feathersjs/feathers'
import Sequelize, { Op } from 'sequelize'

/**
 * A class for Intance service
 *
 * @author Vyacheslav Solovjov
 */
export class Instance extends Service {
  app: Application
  docs: any
  constructor(options: Partial<SequelizeServiceOptions>, app: Application) {
    super(options)
    this.app = app
  }
  /**
   * A method which searches for instances
   *
   * @param params of query with an acton or user role
   * @returns user object
   */
  async find(params: Params): Promise<any> {
    const action = params.query?.action
    const search = params.query?.search
    const skip = params.query?.$skip ? params.query.$skip : 0
    const limit = params.query?.$limit ? params.query.$limit : 10

    if (action === 'admin') {
      //TODO: uncomment here
      // const loggedInUser = extractLoggedInUserFromParams(params)
      // const user = await super.get(loggedInUser.userId);
      // console.log(user);
      // if (user.userRole !== 'admin') throw new Forbidden ('Must be system admin to execute this action');
      let ip = {}
      let name = {}
      if (!isNaN(search)) {
        ip = search ? { ipAddress: { [Op.like]: `%${search}%` } } : {}
      } else {
        name = search ? { name: { [Op.like]: `%${search}%` } } : {}
      }

      const foundLocation = await (this.app.service('instance') as any).Model.findAndCountAll({
        offset: skip,
        limit: limit,
        include: {
          model: (this.app.service('location') as any).Model,
          required: true,
          where: { ...name }
        },
        nest: false,
        where: { ended: false, ...ip }
      })

      return {
        skip: skip,
        limit: limit,
        total: foundLocation.count,
        data: foundLocation.rows
      }
    } else {
      return super.find(params)
    }
  }
}
