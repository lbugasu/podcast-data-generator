/* Imports */
import fs from 'fs'
import NerPromise, { Entity } from 'ner-promise'
import { opmlToJSON } from 'opml-to-json'
// import Parser from 'rss-parser'
import Parser from 'rss-parser'

import { Podcast } from './../models/index';

const rssUrlParser = require('rss-url-parser')
const parser = new Parser()

const nerParser = new NerPromise({
  install_path: 'tmp/stanford-ner-2020-11-17'
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

export type PodcastFeedData = {feed: Podcast, rssUrl: string}

async function getDataFromXMLString(rssUrl: string): Promise<PodcastFeedData> {
  const feed = await parseRssFeed(rssUrl)
  return { feed: feed, rssUrl: rssUrl }
}

function prepare() {
  const filePath = process.cwd() + '\/tmp\/dist/logs.md'
  const initLog = `## Data Collection and Generation\n\n`
  fs.writeFile(filePath, initLog, (err) => {
    if (err) console.log('error in logs: ', err.message)
    console.log("Beginning Logs")
  });
}

function logError(item: any, error: any){
  const filePath = process.cwd() + '\/tmp\/dist/logs.md'
  const logMessage = `\n\n${item?.title} failed to write to file: ${error.message}\n\n`
  fs.appendFile(filePath, logMessage, (err) => {
    if (err) console.log('error in logs: ', err.message)
    console.log("Logs updated")
  })
}

function writeToFile(podcast: any, fileName?: string, folderName?: string,  total?: number) {
  // console.log('saving: ', podcast?.title)
  const folder = process.cwd() + `\/tmp\/dist/${folderName}`
  try {
    fs.writeFileSync(`${folder}/${fileName}.json`, JSON.stringify(podcast, null, 4), 'utf8')
    if(total) console.log(`done ${(total * 100).toFixed(2)}% - ${fileName}.json`)
  } catch (error) {
    logError(podcast, error)
  }

}

export function getFilesInFolder(folderName: string) {
  return fs.readdirSync(process.cwd() + `\/tmp\/dist/${folderName}`);
}

export function getFile(filePath: string) {
  return fs.readFileSync(process.cwd() + `\/tmp\/dist/${filePath}`, 'utf8')
}

export { getRssFeedsFromOPML, findNamedEntities, getDataFromXMLString, writeToFile, prepare, parseRssXMLString, logError }
