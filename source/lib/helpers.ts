/* Imports */
import fs from 'fs'
import { opmlToJSON } from "opml-to-json";
import Parser, { Item } from 'rss-parser'
import NerPromise, { Entity } from 'ner-promise'

async function getRssFeedsFromOPML(filePath: string): Promise<Item[]> {
  const opmlContent = fs.readFileSync(filePath, 'utf8')
  const jsonData = await opmlToJSON(opmlContent);
  return jsonData.children[0].children as Item[]
}

export function parseRssFeed(rssUrl: string) {
  const parser = new Parser();
  return parser.parseURL(rssUrl);
}

async function findNamedEntities(text?: string): Promise<Entity[]> {
  const nerParser = new NerPromise({
    install_path: "tmp/stanford-ner-2020-11-17",
  })
  if(text)
    return nerParser.process(text);
  else return []
}

async function getDataFromRssFeed(rssUrl: string) {
  return parseRssFeed(rssUrl);
}

export { getRssFeedsFromOPML, findNamedEntities, getDataFromRssFeed }
