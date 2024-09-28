/* Imports */
import fs from 'fs'
import { opmlToJSON } from 'opml-to-json'
import Parser from 'rss-parser'
import { EntityRecognizer } from 'core-nlp-ner'
const fetch = require('node-fetch')
import { Object as JSONObject } from 'json-typescript'
import { parseString } from 'xml2js'

const parser = new Parser()
const nerParser = new EntityRecognizer({
  installPath: 'tmp/stanford-ner-2020-11-17'
})

async function getRssFeedsFromOPML(filePath: string): Promise<any[]> {
  const opmlContent = fs.readFileSync(filePath, 'utf8')
  const jsonData = await opmlToJSON(opmlContent)
  return jsonData.children[0].children as any[]
}

async function parseRssFeed(rssUrl: string) {
  return parser.parseURL(rssUrl)
}

async function parseRssXMLString(xmlString: string) {
  return parser.parseString(xmlString)
}

async function findNamedEntities(text?: string): Promise<any> {
  if (text) {
    let entities = {}
    try {
      entities = (await nerParser.processAsync(text)) as any
    } catch (error) {
      return entities
    }
    return entities
  } else return {}
}

export type PodcastFeedData = { feed: { [index: string]: any } }
/**
 * Returns the XML Data of the podcast feed
 */
async function getXMLTextData(url: string) {
  return fetch(url).then((res: any) => res.text())
}

async function parseXMLText(xmlString: string): Promise<JSONObject> {
  return new Promise((resolve, reject) => {
    parseString(xmlString, (err, result) => {
      if (err) reject(err)
      resolve(result)
    })
  })
}

async function getDataFromXMLString(rssUrl: string): Promise<PodcastFeedData> {
  const feed = await parseRssFeed(rssUrl)
  if(!feed.feedUrl){
    console.warn(`Found a feed without a feed Url: ${rssUrl}`)
    feed.feedUrl = rssUrl
  }
  return { feed }
}

async function getDataFromXMLString2(rssUrl: string): Promise<PodcastFeedData> {
  const xmlString = await getXMLTextData(rssUrl)
  const feed = await parseXMLText(xmlString)
  return { feed: feed }
}

function prepare() {
  const filePath = process.cwd() + '/tmp/dist/logs.md'
  const initLog = `## Data Collection and Generation\n\n`
  fs.writeFile(filePath, initLog, err => {
    if (err) console.log('error in logs: ', err.message)
    console.log('Beginning Logs')
  })
}

function logError(item: any, error: any) {
  const filePath = process.cwd() + '/tmp/dist/logs.md'
  const logMessage = `\n\n${item?.title} failed to write to file: ${error.message}\n\n`
  fs.appendFile(filePath, logMessage, err => {
    if (err) console.log('error in logs: ', err.message)
    console.log('Logs updated')
  })
}

function writeToFile(podcast: any, fileName?: string, folderName?: string, total?: number) {
  const folder = process.cwd() + `\/tmp\/dist/${folderName}`
  try {
    fs.writeFileSync(`${folder}/${fileName}.json`, JSON.stringify(podcast, null, 4), 'utf8')
    if (total) console.log(`Written to ${fileName}.json ::: Progress ~ ${(total * 100).toFixed(2)}%`)
  } catch (error) {
    logError(podcast, error)
  }
}

export function getFilesInFolder(folderName: string) {
  return fs.readdirSync(process.cwd() + `\/tmp\/dist/${folderName}`)
}

export function getFile(filePath: string) {
  return fs.readFileSync(process.cwd() + `\/tmp\/dist/${filePath}`, 'utf8')
}

export {
  getRssFeedsFromOPML,
  findNamedEntities,
  getDataFromXMLString,
  getDataFromXMLString2,
  writeToFile,
  prepare,
  parseRssXMLString,
  logError
}
