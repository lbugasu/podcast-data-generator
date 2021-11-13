import path from 'path'
import slug from 'slug'

import { findNamedEntities, getDataFromXMLString, getFile, getFilesInFolder, getRssFeedsFromOPML, PodcastFeedData, prepare, writeToFile } from './lib/helpers'
import { Podcast } from './models'

const opmlFilePath = path.resolve(process.cwd(), './data/podcasts_opml.xml')

async function downloadFeeds(): Promise<(PodcastFeedData | void)[]> {
  const feeds = await getRssFeedsFromOPML(opmlFilePath)
  const podcasts =  Promise.all(
    feeds.map(async (feed: any, i: number) => {
    console.log(`Downloading Feeds: ${ ((i/feeds.length)*100).toFixed(2)}%`)
      return getDataFromXMLString(feed.xmlurl)
        .catch((error: any) => {
          console.log(`error parsing rss feed- ${i}: `, error.message)
        })
    })
  )
  return (await podcasts).filter((podcast: any) => podcast)
}

async function ner(podcast: any): Promise<any>{
  const entities = await findNamedEntities(podcast['description'])
  let episodesWithEntities: any = []
  if (podcast.items) {
    episodesWithEntities = await Promise.all(
    podcast?.items?.slice(0, 2).map(async (episode: any) => {
        const description = (episode['content'] ?? '')
        return { ...episode, entities: await findNamedEntities(description) }
      })
    )
  }
  podcast.entities = entities
  podcast.episodes = episodesWithEntities ?? podcast.items
  return podcast
}

function write(podcasts: any[]) {
  podcasts.forEach((podcast, i) => {
    if(!podcast) return
    writeToFile(podcast, podcast.title, 'podcasts', (i/podcasts.length))
  })
}

function saveFeedsToFolder(podData: any[]) {
  podData.filter((pod)=>!!pod).forEach((pod: PodcastFeedData, i) => {
    writeToFile(pod.feed, slug(pod.rssUrl), 'feeds', (i/podData.length))
  })
  return Promise.resolve(true)
}

function parsePodcastData() {
  const pdcstRssFeedPaths = getFilesInFolder('feeds')
  const pdcsts = Promise.all(pdcstRssFeedPaths.slice(0, 2).map(async (xmlFeedPath, i) => {

    const jsonFile = JSON.parse(getFile(`feeds\/${xmlFeedPath}`))
    const parsedRssFeed: Podcast | void = await ner(jsonFile)
      .catch((error: any) => {
      console.log('Error: ')
    })
    if (parsedRssFeed) {
      writeToFile(parsedRssFeed, slug(parsedRssFeed.title || xmlFeedPath), 'podcasts', (i/pdcstRssFeedPaths.length))
    }
    console.log(`Parsing Json Feeds: ${ ((i/pdcstRssFeedPaths.length)*100).toFixed(2)}%`)
    return parsedRssFeed
  }))
  pdcsts.then((pdcsts) => console.log('DONE Writing Podcasts JSON Files'))
}

// Prepare folders for dist
prepare()

// Action
downloadFeeds()
  .then((feeds: any[]) => {
    try {  return saveFeedsToFolder(feeds)}
    catch (error: any) {
      console.log('error saving feeds to folder', error.message)
      return Promise.resolve(false)
    }
  })
  .then((result: boolean) => {
    if( result ) {
      console.log('done')
      parsePodcastData()
    }
    else {
      console.log('error')
    }
  })
    
  // .then(podcasts => write(podcasts))
