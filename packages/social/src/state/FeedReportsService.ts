/**
 * @author Tanya Vykliuk <tanya.vykliuk@gmail.com>
 */
import { AlertService } from '@xrengine/client-core/src/common/services/AlertService'
import { client } from '@xrengine/client-core/src/feathers'
import { useDispatch } from '@xrengine/client-core/src/store'
// import { fetchingFeedFires, feedFiresRetrieved } from './actions'
// import { addFeedReport } from '../feed/actions'

// export function getFeedReportsasync (feedId: string) {
//
// const dispatch = useDispatch(); {
//     try {
//       dispatch(fetchingFeedFires())
//       const feedsResults = await client.service('feed-report').find({ query: { feedId: feedId } })
//       dispatch(feedFiresRetrieved(feedsResults.data))
//     } catch (err) {
//       console.log(err)
//       dispatchAlertError(dispatch, err.message)
//     }
//   }
// }

export const FeedReportsService = {
  addReportToFeed: async (feedId: string) => {
    const dispatch = useDispatch()
    {
      try {
        await client.service('feed-report').create({ feedId })
        // dispatch(addFeedReport(feedId))
      } catch (err) {
        AlertService.dispatchAlertError(err)
      }
    }
  }
}

// export function removeReportToFeedasync (feedId: string) {
// const dispatch = useDispatch(); {
//     try {
//       await client.service('feed-report').remove(feedId)
//       dispatch(removeFeedReport(feedId))
//     } catch (err) {
//       console.log(err)
//       dispatchAlertError(dispatch, err.message)
//     }
//   }
// }
