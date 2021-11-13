import { prepare, getRssFeedsFromOPML, findNamedEntities, writeToFile, getDataFromRssFeed, logError } from './lib/helpers'
import path from 'path'
import { Podcast } from './models'
import striptags from 'striptags'

const opmlFilePath = path.resolve(process.cwd(), './data/podcasts_opml.xml')

async function download() {
  const feeds = await getRssFeedsFromOPML(opmlFilePath)
  return Promise.all(
    feeds.map(async (feed: any, i: number) => {
      return getDataFromRssFeed(feed.xmlurl)
        .catch((error: any) => {
          console.log('error on url: ', feed.xmlurl)
          console.log(`error parsing rss feed- ${i}: `, error.message)
        })
    })
  )
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
    writeToFile(podcast, (i/podcasts.length))
  })
}

// Prepare folders for dist
prepare()

// Action
download()
  .then((rssFeedData: any[]) => ner(rssFeedData))
  .then(podcasts => write(podcasts))
