import { getRssFeedsFromOPML, findNamedEntities, parseRssFeed, getDataFromRssFeed} from './lib/helpers'
import path from 'path'


const opmlFilePath = path.resolve(process.cwd(), './data/podcasts_opml.xml')

async function run() {
  const feeds = await getRssFeedsFromOPML(opmlFilePath)

  const _feeds = feeds.slice(0, 2)
  const rssFeedData = await Promise.all(_feeds.map((feed) => {
    return getDataFromRssFeed(feed.xmlurl)
  }))

  rssFeedData.forEach(async (data) => {
    const entities = await findNamedEntities(data.description)
    console.log(entities)
  })

}

run()
