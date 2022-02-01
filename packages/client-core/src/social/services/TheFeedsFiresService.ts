import { AlertService } from '../../common/services/AlertService'
import { client } from '../../feathers'
import { useDispatch } from '../../store'
import { TheFeedsAction } from './TheFeedsService'
import { CreatorShort } from '@xrengine/common/src/interfaces/Creator'
import { TheFeedsFires } from '@xrengine/server-core/src/socialmedia/feeds-fires/feeds-fires.class'
import { createState, DevTools, useState, none, Downgraded } from '@hookstate/core'
import { store } from '../../store'

//State
const state = createState({
  thefeedsFires: {
    thefeedsFires: [],
    fetching: false
  }
})

store.receptors.push((action: TheFeedsFiresActionType): any => {
  state.batch((s) => {
    switch (action.type) {
      case 'THEFEEDS_FIRES_FETCH':
        return s.thefeedsFires.fetching.set(true)
      case 'THEFEEDS_FIRES_RETRIEVED':
        return s.thefeedsFires.thefeedsFires.set(action.thefeedsFires)
      case 'ADD_THEFEEDS_FIRES':
        return s.thefeedsFires.thefeedsFires.set([...s.thefeedsFires.thefeedsFires, action.thefeedsFire])
      case 'REMOVE_THEFEEDS_FIRES':
        return s.thefeedsFires.thefeedsFires.set(
          s.thefeedsFires.thefeedsFires.value.filter((i) => i.id !== action.thefeedsFireId)
        )
    }
  }, action.type)
})

export const accessTheFeedsFiresState = () => state
export const useTheFeedsFiresState = () => useState(state)

//Service
export const TheFeedsFiresService = {
  getTheFeedsFires: async (thefeedsId: string, setThefeedsFires: any) => {
    const dispatch = useDispatch()
    {
      try {
        //       dispatch(fetchingTheFeedsFires());
        const thefeedsResults = await client.service('thefeeds-fires').find({ query: { thefeedsId: thefeedsId } })
        //       console.log(thefeedsResults)

        //       dispatch(thefeedsFiresRetrieved(thefeedsResults.data, thefeedsId));
        setThefeedsFires(thefeedsResults)
      } catch (err) {
        AlertService.dispatchAlertError(err)
      }
    }
  },
  addFireToTheFeeds: async (thefeedsId: string) => {
    const dispatch = useDispatch()
    {
      try {
        const feedsFire = await client.service('thefeeds-fires').create({ thefeedsId })
        const feedsFireStore = {
          id: feedsFire.creatorId
        }
        //@ts-ignore
        dispatch(addTheFeedsFire(feedsFireStore))
      } catch (err) {
        AlertService.dispatchAlertError(err)
      }
    }
  },
  removeFireToTheFeeds: async (thefeedsId: string) => {
    const dispatch = useDispatch()
    {
      try {
        await client.service('thefeeds-fires').remove(thefeedsId)
        dispatch(TheFeedsAction.removeTheFeedsFire(thefeedsId))
      } catch (err) {
        AlertService.dispatchAlertError(err)
      }
    }
  }
}

//Action
export const TheFeedsFiresAction = {
  addThefeedsFires: (thefeedsFire: CreatorShort) => {
    return {
      type: 'ADD_THEFEEDS_FIRES' as const,
      thefeedsFire
    }
  },
  removeThefeedsFires: (thefeedsFireId: String) => {
    return {
      type: 'REMOVE_THEFEEDS_FIRES' as const,
      thefeedsFireId
    }
  },
  thefeedsFiresRetrieved: (thefeedsFires: CreatorShort[]) => {
    return {
      type: 'THEFEEDS_FIRES_RETRIEVED' as const,
      thefeedsFires: thefeedsFires
    }
  },
  fetchingTheFeedsFires: () => {
    return {
      type: 'THEFEEDS_FIRES_FETCH' as const
    }
  }
}

export type TheFeedsFiresActionType = ReturnType<typeof TheFeedsFiresAction[keyof typeof TheFeedsFiresAction]>
