/* Imports */
import fs from 'fs'
import { opmlToJSON } from 'opml-to-json'
import NerPromise, { Entity } from 'ner-promise'

import Parser from 'rss-parser'

const nerParser = new NerPromise({
  install_path: 'tmp/stanford-ner-2020-11-17'
})

async function getRssFeedsFromOPML(filePath: string): Promise<any[]> {
  const opmlContent = fs.readFileSync(filePath, 'utf8')
  const jsonData = await opmlToJSON(opmlContent)
  return jsonData.children[0].children as any[]
}

async function parseRssFeed(rssUrl: string) {
  const parser = new Parser()
  const feed = await parser.parseURL(rssUrl)
  return feed
}

async function findNamedEntities(text?: string): Promise<Entity[]> {
  if (text) {
    let entities = Promise.resolve([] as Entity[])
    try {
      console.log(text)
      entities = nerParser.process(text)
    } catch (error) {
      return entities
    }
    return Promise.resolve([])
  }

  else return Promise.resolve([])
}

async function getDataFromRssFeed(rssUrl: string) {
  return parseRssFeed(rssUrl)
}

function prepare() {
  const filePath = process.cwd() + '/tmp/dist/logs.md'
  const initLog = `## Data Collection and Generation\n\n`
  fs.writeFile(filePath, initLog, (err) => {
    if (err) console.log('error in logs: ', err.message)
    console.log("Beginning Logs")
  });
}

function logError(item: any, error: any){
  const filePath = process.cwd() + '/tmp/dist/logs.md'
  const logMessage = `\n\n${item?.title} failed to write to file: ${error.message}\n\n`
  fs.appendFile(filePath, logMessage, (err) => {
    if (err) console.log('error in logs: ', err.message)
    console.log("Logs updated")
  })
}

function writeToFile(podcast: any, total: number) {
  // console.log('saving: ', podcast?.title)
  const folder = process.cwd() + '/tmp/dist/podcasts'
  try {
    fs.writeFileSync(`${folder}/${podcast.title}.json`, JSON.stringify(podcast, null, 4), 'utf8')
    console.log(`done ${(total * 100).toFixed(2)}% - ${podcast.title}.json`)
  } catch (error: any) {
    logError(podcast, error)
  }

}

export { getRssFeedsFromOPML, findNamedEntities, getDataFromRssFeed, writeToFile, prepare, logError }
