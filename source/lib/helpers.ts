/* Imports */
import fs from 'fs'
import { opmlToJSON } from 'opml-to-json'
import Parser, { Item, Output } from 'rss-parser'
import NerPromise, { Entity } from 'ner-promise'

async function getRssFeedsFromOPML(filePath: string): Promise<Item[]> {
  const opmlContent = fs.readFileSync(filePath, 'utf8')
  const jsonData = await opmlToJSON(opmlContent)
  return jsonData.children[0].children as Item[]
}

export function parseRssFeed(rssUrl: string) {
  const parser = new Parser()
  return parser.parseURL(rssUrl)
}

async function findNamedEntities(text?: string): Promise<Entity[]> {
  const nerParser = new NerPromise({
    install_path: 'tmp/stanford-ner-2020-11-17'
  })
  if (text) return nerParser.process(text)
  else return []
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

function writeToFile(podcast: { [key: string]: any }) {
  const folder = process.cwd() + '/tmp/dist/podcasts'
  try {
    fs.writeFileSync(`${folder}/${podcast.title}.json`, JSON.stringify(podcast, null, 4), 'utf8')
  } catch (error: any) {
    logError(podcast, error)
  }

}

export { getRssFeedsFromOPML, findNamedEntities, getDataFromRssFeed, writeToFile, prepare, logError }
