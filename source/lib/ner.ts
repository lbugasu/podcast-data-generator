import path from 'path';
/*
Read from a folder and generate Named entities
*/
import fs from 'fs'
import slug from "slug"
import { findNamedEntities, writeToFile } from "./helpers"


// Command line arguments
const commandLineArgs = process.argv
const startIndex = +commandLineArgs[2]
const endIndex = +commandLineArgs[3]
const index = +commandLineArgs[4]


async function ner(podcast: any): Promise<any>{
  const entities = await findNamedEntities(podcast['description'])
  let episodesWithEntities: any = []
  if (podcast.items) {
    episodesWithEntities = await Promise.all(
    podcast?.items?.map(async (episode: any) => {
        const description = (episode['content'] ?? '')
        return { ...episode, entities: await findNamedEntities(description) }
      })
    )
  }
  podcast.entities = entities
  delete podcast.items
  podcast.episodes = episodesWithEntities ?? podcast.items
  return podcast
}


function generateNamedEntities(podcasts: any[]): Promise<boolean> {
  const pdcsts = Promise.all(podcasts.slice(startIndex, endIndex).map(async (podcast, i) => {

    const parsedRssFeed: any = await ner(podcast)
      .catch((error: any) => console.log('Error: '))

    if (parsedRssFeed) {
      writeToFile(parsedRssFeed, slug(parsedRssFeed.title), `temp/podcasts_palettes_ner_${index}`, (i/podcasts.length))
    }
    console.log(`Parsing Json Feeds: ${ (((i+1)/podcasts.length)*100).toFixed(2)}%`)
    return parsedRssFeed
  }))
  return pdcsts.then((pdcsts) => console.log('\n👅-------------DONE Generating Named Entities-------------🤩\n\n')).then(() => {
    return Promise.resolve(true)
  })
}

const folderName = path.resolve(process.cwd(), 'podcasts_palettes')

// Read all the files from the folder

fs.readdir(folderName, function (err, files) {
  //handling error
  if (err) {
      return console.log('Unable to scan directory: ' + err);
  } 
  //listing all files using forEach
  files.forEach(function (file) {
      // Do whatever you want to do with the file
      console.log(file); 
  });
});