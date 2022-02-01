/**
 * An object for swagger documentation configiration
 *
 * @author Kevin KIMENYI
 */
export default {
  definitions: {
    'location-type': {
      type: 'object',
      properties: {
        type: {
          type: 'string'
        }
      }
    },
    'location-type_list': {
      type: 'array',
      items: { $ref: '#/definitions/location-type' }
    }
  }
}
