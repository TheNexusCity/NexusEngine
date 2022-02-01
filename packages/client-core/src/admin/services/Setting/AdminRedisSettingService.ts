import { client } from '../../../feathers'
import { AlertService } from '../../../common/services/AlertService'
import { useDispatch, store } from '../../../store'
import { createState, useState } from '@hookstate/core'
import { AdminRedisSetting } from '@xrengine/common/src/interfaces/AdminRedisSetting'

//State
const state = createState({
  redisSettings: [] as Array<AdminRedisSetting>,
  skip: 0,
  limit: 100,
  total: 0,
  updateNeeded: true
})

store.receptors.push((action: AdminRedisSettingActionType): any => {
  state.batch((s) => {
    switch (action.type) {
      case 'ADMIN_REDIS_SETTING_FETCHED':
        return s.merge({ redisSettings: action.adminRedisSettingResult.data, updateNeeded: false })
    }
  }, action.type)
})

export const accessAdminRedisSettingState = () => state

export const useAdminRedisSettingState = () => useState(state) as any as typeof state

//Service
export const AdminRedisSettingService = {
  fetchRedisSetting: async () => {
    const dispatch = useDispatch()
    {
      try {
        const redisSetting = await client.service('redis-setting').find()
        dispatch(AdminRedisSettingAction.redisSettingRetrieved(redisSetting))
      } catch (err) {
        AlertService.dispatchAlertError(err)
      }
    }
  }
}

//Action
import { AdminRedisSettingResult } from '@xrengine/common/src/interfaces/AdminRedisSettingResult'

export const AdminRedisSettingAction = {
  redisSettingRetrieved: (adminRedisSettingResult: AdminRedisSettingResult) => {
    return {
      type: 'ADMIN_REDIS_SETTING_FETCHED' as const,
      adminRedisSettingResult: adminRedisSettingResult
    }
  }
}

export type AdminRedisSettingActionType = ReturnType<
  typeof AdminRedisSettingAction[keyof typeof AdminRedisSettingAction]
>
