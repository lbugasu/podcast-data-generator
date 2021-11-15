import path from 'path';
/*
Read from a folder and generate Named entities
*/
import fs from 'fs'
import slug from "slug"
import { findNamedEntities, logError } from "./helpers"


// Command line arguments
const commandLineArgs = process.argv
const startIndex = +commandLineArgs[2]
const endIndex = +commandLineArgs[3]
const index = +commandLineArgs[4]


async function ner(podcast: any): Promise<any>{
  const entities = await findNamedEntities(podcast['description'])
  // let episodesWithEntities: any = []
  // if (podcast.items) {
  //   episodesWithEntities = await Promise.all(
  //   podcast?.items?.map(async (episode: any) => {
  //       const description = (episode['content'] ?? '')
  //       return { ...episode, entities: await findNamedEntities(description) }
  //     })
  //   )
  // }
  podcast.entities = entities
  // delete podcast.items
  // podcast.episodes = episodesWithEntities ?? podcast.items
  return podcast
}


function generateNamedEntities(podcasts: any[]): Promise<boolean> {
  const pdcsts = Promise.all(podcasts.slice(startIndex, endIndex).map(async (podcast, i) => {

    const parsedRssFeed: any = await ner(JSON.parse(podcast))
      .catch((error: any) => console.log('Error: ', error.message))

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

// Read all the files from the folder
function getFile(filePath: string) {
    return fs.readFileSync(filePath, 'utf8')
}

function writeToFile(podcast: any, fileName?: string, folderName?: string,  total?: number) {
  try {
    fs.writeFileSync(`${folderName}\/${fileName}.json`, JSON.stringify(podcast, null, 4), 'utf8')
    if(total) console.log(`done ${(total * 100).toFixed(2)}% - ${fileName}.json`)
  } catch (error: any) {
    console.log('Error: ',error.message)
  }

}
const rootFolderPath = process.cwd()
const folderName = path.join(rootFolderPath, 'podcasts_palettes')


fs.readdir(folderName, function (err, files) {
  //handling error
  if (err) {
      return console.log('Unable to scan directory: ' + err);
  }
  const podcasts: any[]= []
  //listing all files using forEach
  files.forEach(function (fileName) {
      // Do whatever you want to do with the file
    const filePath = (rootFolderPath+ '/podcasts_palettes/'+ fileName)
    podcasts.push(getFile(filePath))
  });

  generateNamedEntities(podcasts)
});
