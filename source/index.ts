import path from 'path'
import slug from 'slug'
import striptags from 'striptags'

import { findNamedEntities, getDataFromXMLString, getFile, getFilesInFolder, getRssFeedsFromOPML, parseRssXMLString, PodcastFeedData, prepare, writeToFile } from './lib/helpers'
import { Podcast } from './models'

const opmlFilePath = path.resolve(process.cwd(), './data/podcasts_opml.xml')

async function downloadFeeds(): Promise<(PodcastFeedData | void)[]> {
  const feeds = await getRssFeedsFromOPML(opmlFilePath)
  const podcasts =  Promise.all(
    feeds.map(async (feed: any, i: number) => {
      return getDataFromXMLString(feed.xmlurl)
        .catch((error: any) => {
          console.log('error on url: ', feed.xmlurl)
          console.log(`error parsing rss feed- ${i}: `, error.message)
        })
    })
  )
  const _podcsts = (await podcasts).filter((podcast: any) => podcast)
  console.log(_podcsts.length)
  return _podcsts
}

async function ner(rssFeedData: any[]) {
  console.log('performing NER')
  return Promise.all(
    rssFeedData.map(async (podcast : any) => {
      if (!podcast) return podcast
      const entities = await findNamedEntities(podcast.meta)
      let episodesWithEntities: any = []
      if (podcast.episodes) {
        episodesWithEntities = await Promise.all(
        podcast?.episodes?.map(async (episode: any) => {
            console.log(`NERing episode ${episode.title}`)
            const description = striptags(episode?.description || '')
            return { ...episode, entities: await findNamedEntities(description) }
          })
        )}
      //@ts-ignore
      return {
        ...podcast,
        entities: entities,
        episodes:  episodesWithEntities
      }
    })
  )
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
  const pdcsts = Promise.all(pdcstRssFeedPaths.map(async (xmlFeedPath, i) => {
    console.log(`parsing XML Feeds: ${ ((i/pdcstRssFeedPaths.length)*100).toFixed(2)}%`)
    const xmlFeed = getFile(`feeds\/${xmlFeedPath}`)
    const parsedRssFeed = await parseRssXMLString(xmlFeed)
      .catch((error: any) => {
      console.log('Error: ', error.message)
    })
    if (parsedRssFeed) {
      console.log(`parsed ${i} of ${pdcstRssFeedPaths.length}`)
      writeToFile(parsedRssFeed, slug(parsedRssFeed.title || xmlFeedPath), 'podcasts', (i/pdcstRssFeedPaths.length))
    }
    
    return parsedRssFeed
  }))
  pdcsts.then((pdcsts) => console.log('DONE Writing Podcasts JSON Files'))
}

// Prepare folders for dist
prepare()


// Action
downloadFeeds()
  // .then((feeds: any[]) => {
  //   try {  return saveFeedsToFolder(feeds)}
  //   catch (error: any) {
  //     console.log('error saving feeds to folder', error.message)
  //     return Promise.resolve(false)
  //   }
  // })
  // .then((result: boolean) => {
  //   if( result ) {
  //     console.log('done')
  //     parsePodcastData()
  //   }
  //   else {
  //     console.log('error')
  //   }
  // })
// parsePodcastData()
    
  // .then((rssFeedData: any[]) => ner(rssFeedData))
  // .then(podcasts => write(podcasts))
