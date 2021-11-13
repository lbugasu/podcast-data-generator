import { prepare, getRssFeedsFromOPML, findNamedEntities, writeToFile, getDataFromRssFeed, logError } from './lib/helpers'
import path from 'path'
import { Podcast } from './models'
import striptags from 'striptags'

const opmlFilePath = path.resolve(process.cwd(), './data/podcasts_opml.xml')

async function download() {
  const feeds = await getRssFeedsFromOPML(opmlFilePath)
  return Promise.all(
    feeds.map((feed, i) => {
      return getDataFromRssFeed(feed.xmlurl).catch((error: any) => console.log(`error parsing rss feed- ${i}: `, error.message))
    })
  )
}

async function ner(rssFeedData: (Podcast)[]) {
  console.log('performing NER')
  return Promise.all(
    rssFeedData.map(async data => {
      if (!data) return data
      const entities = await findNamedEntities(data?.description || '')
      let episodesWithEntities = [] as typeof data.items
      if (data.items) {
        episodesWithEntities = await Promise.all(
          data?.items?.map(async episode => {
            console.log(`NERing episode ${episode.title}`)
            const description = striptags(episode?.content || '')
            return { ...episode, entities: await findNamedEntities(description) }
          })
        )}
      //@ts-ignore
      return {
        ...data,
        entities,
        items: episodesWithEntities ?? data.items
      }
    })
  )
}

function write(podcasts: (Podcast | null)[]) {
  podcasts.forEach(podcast => {
    if(!podcast) return
    writeToFile(podcast)
  })
}

// Prepare folders for dist
prepare()

// Action
download().then(results => results.filter(podcast => !!podcast))
  .then((rssFeedData: Podcast[]) => ner(rssFeedData))
  .then(podcasts => write(podcasts))
