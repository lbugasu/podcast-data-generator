import { prepare, getRssFeedsFromOPML, findNamedEntities, writeToFile, getDataFromRssFeed, logError } from './lib/helpers'
import path from 'path'
import { Podcast } from './models'
import striptags from 'striptags';

const opmlFilePath = path.resolve(process.cwd(), './data/podcasts_opml.xml')

async function download() {
  const feeds = await getRssFeedsFromOPML(opmlFilePath)
  return Promise.all(feeds.map((feed) => {
    return getDataFromRssFeed(feed.xmlurl)
  }))
}

async function ner(rssFeedData: Podcast[]) {
  return Promise.all(rssFeedData.map(async (data) => {
    const entities = await findNamedEntities(data.description)
    let episodesWithEntities = await Promise.all(data.items.map( async (episode) => {
      const description = striptags(episode?.content || '')
      const itemEntities = await findNamedEntities(description).catch((error: any) => {
        console.log('something mysterious happened: ', error.message)
        logError(episode, error)
      })
      episode.entities = itemEntities
      return episode
    })).catch((error: any) => {
      console.log('error processing podcast: ', error.message)
      episodesWithEntities = data.items
      logError(data, error)
    })
    data.entities = entities
    data.items = episodesWithEntities ?? data.items
    return data
  }))
}

function write(podcasts: Podcast[]) {
  podcasts.forEach((podcast) => {
    writeToFile(podcast)
  })
}

// Prepare folders for dist
prepare()

// Action
download()
  .then((rssFeedData: Podcast[]) => ner(rssFeedData))
  .then((podcasts) => write(podcasts))

