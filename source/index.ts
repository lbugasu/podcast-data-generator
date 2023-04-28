import path from 'path'
import slug from 'slug'
import fs from 'fs'

import { getDataFromXMLString, getRssFeedsFromOPML, PodcastFeedData, prepare, writeToFile } from './lib/helpers'

const opmlFilePath = path.resolve(process.cwd(), './data/podcasts_opml.xml')

async function downloadFeeds(): Promise<(PodcastFeedData | void)[]> {
  const feeds = await await getRssFeedsFromOPML(opmlFilePath)
  const rssUrls = feeds.map(({ xmlurl }) => xmlurl).join('\n')
  fs.writeFileSync(process.cwd() + '/dist/rssUrls.txt', rssUrls, 'utf8')

  const podcasts = Promise.all(
    feeds.map(async (feed: any, i: number) => {
      return getDataFromXMLString(feed.xmlurl)
        .catch((error: any) => {
          console.log(`error parsing rss feed- ${i}: `, error.message)
        })
        .then(res => {
          console.log(`Downloaded Feed: ${feed.xmlurl}. ::: Progress ~ ${(((i + 1) / feeds.length) * 100).toFixed(2)}%`)
          return res
        })
    })
  )
  // Remove undefined values
  return (await podcasts).filter((podcast: any) => podcast)
}

const _pods = []
function saveFeedsToFolder(podData: any[]) {
  podData
    .filter(pod => !!pod)
    .forEach((pod: PodcastFeedData, i) => {
      _pods.push(pod.feed)
      writeToFile(pod.feed, slug(pod.feed.title), 'podcasts', (i + 1) / podData.length)
    })
  return Promise.resolve(true)
}

// Prepare folders for dist
prepare()

// Action
downloadFeeds()
  .then((feeds: any[]) => {
    try {
      return saveFeedsToFolder(feeds)
    } catch (error: any) {
      console.log('error saving feeds to folder', error.message)
      return Promise.resolve(false)
    }
  })
  .then(() => {
    console.log('\n💃-------------Done Generating Podcast Data-------------🥁\n\n')
  })
