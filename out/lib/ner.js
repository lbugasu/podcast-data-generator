"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
/*
Read from a folder and generate Named entities
*/
const fs_1 = __importDefault(require("fs"));
const slug_1 = __importDefault(require("slug"));
const helpers_1 = require("./helpers");
// Command line arguments
const commandLineArgs = process.argv;
const startIndex = +commandLineArgs[2];
const endIndex = +commandLineArgs[3];
const index = +commandLineArgs[4];
async function ner(podcast) {
    console.log(podcast['title']);
    console.log(podcast['description']);
    const entities = await (0, helpers_1.findNamedEntities)(podcast['description']);
    //   let episodesWithEntities: any = []
    //   if (podcast.items) {
    //     episodesWithEntities = await Promise.all(
    //     podcast?.items?.map(async (episode: any) => {
    //         const description = (episode['content'] ?? '')
    //         return { ...episode, entities: await findNamedEntities(description) }
    //       })
    //     )
    //   }
    //   console.log(entities)
    podcast.entities = entities;
    //   delete podcast.items
    //   podcast.episodes = episodesWithEntities ?? podcast.items
    return podcast;
}
function generateNamedEntities(podcasts) {
    const pdcsts = Promise.all(podcasts.slice(startIndex, endIndex).map(async (podcast, i) => {
        const parsedRssFeed = await ner(JSON.parse(podcast))
            .catch((error) => console.log('Error: ', error.message));
        // if (parsedRssFeed) {
        writeToFile(parsedRssFeed, (0, slug_1.default)(parsedRssFeed.title), `temp/podcasts_palettes_ner-${index}`, (i / podcasts.length));
        // }
        console.log(`Parsing Json Feeds: ${(((i + 1) / podcasts.length) * 100).toFixed(2)}%`);
        return parsedRssFeed;
    }));
    return pdcsts.then((pdcsts) => console.log('\n👅-------------DONE Generating Named Entities-------------🤩\n\n')).then(() => {
        return Promise.resolve(true);
    });
}
// Read all the files from the folder
function getFile(filePath) {
    return fs_1.default.readFileSync(filePath, 'utf8');
}
function writeToFile(podcast, fileName, folderName, total) {
    const folder = process.cwd() + `\/${folderName}`;
    console.log(`Writing to file: ${folder}\/${fileName}.json`);
    try {
        fs_1.default.writeFileSync(`${folder}/${fileName}.json`, JSON.stringify(podcast, null, 4), 'utf8');
        if (total)
            console.log(`done ${(total * 100).toFixed(2)}% - ${fileName}.json`);
    }
    catch (error) {
        console.log('Error: ', error.message);
    }
}
const rootFolderPath = process.cwd();
const folderName = path_1.default.join(rootFolderPath, 'podcasts_palettes');
fs_1.default.readdir(folderName, function (err, files) {
    //handling error
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }
    const podcasts = [];
    //listing all files using forEach
    files.forEach(function (fileName) {
        // Do whatever you want to do with the file
        const filePath = (rootFolderPath + '/podcasts_palettes/' + fileName);
        podcasts.push(getFile(filePath));
    });
    generateNamedEntities(podcasts);
});
