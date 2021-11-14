import path from 'path'
import slug from 'slug'

import { findNamedEntities, getDataFromXMLString, getFile, getFilesInFolder, getRssFeedsFromOPML, PodcastFeedData, prepare, writeToFile } from './lib/helpers'
import { Podcast } from './models'

const opmlFilePath = path.resolve(process.cwd(), './data/podcasts_opml.xml')

async function downloadFeeds(): Promise<(PodcastFeedData | void)[]> {
  const feeds = await getRssFeedsFromOPML(opmlFilePath)
  const podcasts =  Promise.all(
    feeds.map(async (feed: any, i: number) => {
    console.log(`Downloading Feeds: ${ (((i+1)/feeds.length)*100).toFixed(2)}%`)
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
    podcast?.items?.map(async (episode: any) => {
        const description = (episode['content'] ?? '')
        return { ...episode, entities: await findNamedEntities(description) }
      })
    )
  }
  podcast.entities = entities
  delete podcast.items
  podcast.episodes = episodesWithEntities ?? podcast.items
  return podcast
}

function write(podcasts: any[]) {
  podcasts.forEach((podcast, i) => {
    if(!podcast) return
    writeToFile(podcast, podcast.title, 'podcasts', ((i+1)/podcasts.length))
  })
}

const _pods: any[] = []
function saveFeedsToFolder(podData: any[]) {
  podData.filter((pod) => !!pod).forEach((pod: PodcastFeedData, i) => {
    _pods.push(pod.feed)
    writeToFile(pod.feed, slug(pod.rssUrl), 'feeds', ((i+1)/podData.length))
  })
  return Promise.resolve(true)
}

function generateNamedEntities(): Promise<boolean> {
  const pdcsts = Promise.all(_pods.map(async (podcast, i) => {

    const parsedRssFeed: any = await ner(podcast)
      .catch((error: any) => console.log('Error: '))

    if (parsedRssFeed) {
      writeToFile(parsedRssFeed, slug(parsedRssFeed.title), 'podcasts_ne', (i/_pods.length))
    }
    console.log(`Parsing Json Feeds: ${ (((i+1)/_pods.length)*100).toFixed(2)}%`)
    return parsedRssFeed
  }))
  return pdcsts.then((pdcsts) => console.log('\n👅-------------DONE Writing Podcasts JSON Files-------------🤩\n\n')).then(() => {
    return Promise.resolve(true)
  })
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
    console.log('\n💃-------------Done Generating Podcast Data-------------🥁\n\n')
    if (result) return generateNamedEntities()
    return Promise.resolve(false)
  }).then(() => {
    console.log('FIN')
  })


  // .then(podcasts => write(podcasts))
