import { prepare, getRssFeedsFromOPML, findNamedEntities, writeToFile, getDataFromRssFeed } from './lib/helpers'
import path from 'path'
import { Podcast } from './models'


const opmlFilePath = path.resolve(process.cwd(), './data/podcasts_opml.xml')

async function download() {
  const feeds = await getRssFeedsFromOPML(opmlFilePath)
  const _feeds = feeds.slice(0, 2)
  return Promise.all(_feeds.map((feed) => {
    return getDataFromRssFeed(feed.xmlurl)
  }))
}

async function ner(rssFeedData: Podcast[]) {
  return Promise.all(rssFeedData.map(async (data) => {
    const entities = await findNamedEntities(data.description)
    const episodesWithEntities = await Promise.all(data.items.map((episode) => {
      const itemEntities = findNamedEntities(episode.description)
      episode.entities = itemEntities
      return episode
    }))
    data.entities = entities
    data.items = episodesWithEntities
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

