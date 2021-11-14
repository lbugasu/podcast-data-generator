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
    var _a;
    const entities = await (0, helpers_1.findNamedEntities)(podcast['description']);
    let episodesWithEntities = [];
    if (podcast.items) {
        episodesWithEntities = await Promise.all((_a = podcast === null || podcast === void 0 ? void 0 : podcast.items) === null || _a === void 0 ? void 0 : _a.map(async (episode) => {
            var _a;
            const description = ((_a = episode['content']) !== null && _a !== void 0 ? _a : '');
            return Object.assign(Object.assign({}, episode), { entities: await (0, helpers_1.findNamedEntities)(description) });
        }));
    }
    podcast.entities = entities;
    delete podcast.items;
    podcast.episodes = episodesWithEntities !== null && episodesWithEntities !== void 0 ? episodesWithEntities : podcast.items;
    return podcast;
}
function generateNamedEntities(podcasts) {
    const pdcsts = Promise.all(podcasts.slice(startIndex, endIndex).map(async (podcast, i) => {
        const parsedRssFeed = await ner(podcast)
            .catch((error) => console.log('Error: '));
        if (parsedRssFeed) {
            (0, helpers_1.writeToFile)(parsedRssFeed, (0, slug_1.default)(parsedRssFeed.title), `temp/podcasts_palettes_ner_${index}`, (i / podcasts.length));
        }
        console.log(`Parsing Json Feeds: ${(((i + 1) / podcasts.length) * 100).toFixed(2)}%`);
        return parsedRssFeed;
    }));
    return pdcsts.then((pdcsts) => console.log('\n👅-------------DONE Generating Named Entities-------------🤩\n\n')).then(() => {
        return Promise.resolve(true);
    });
}
const folderName = path_1.default.resolve(process.cwd(), 'podcasts_palettes');
// Read all the files from the folder
fs_1.default.readdir(folderName, function (err, files) {
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
