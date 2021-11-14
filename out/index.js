"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const slug_1 = __importDefault(require("slug"));
const helpers_1 = require("./lib/helpers");
const opmlFilePath = path_1.default.resolve(process.cwd(), './data/podcasts_opml.xml');
async function downloadFeeds() {
    const feeds = await (0, helpers_1.getRssFeedsFromOPML)(opmlFilePath);
    const podcasts = Promise.all(feeds.map(async (feed, i) => {
        console.log(`Downloading Feeds: ${(((i + 1) / feeds.length) * 100).toFixed(2)}%`);
        return (0, helpers_1.getDataFromXMLString)(feed.xmlurl)
            .catch((error) => {
            console.log(`error parsing rss feed- ${i}: `, error.message);
        });
    }));
    return (await podcasts).filter((podcast) => podcast);
}
function write(podcasts) {
    podcasts.forEach((podcast, i) => {
        if (!podcast)
            return;
        (0, helpers_1.writeToFile)(podcast, podcast.title, 'podcasts', ((i + 1) / podcasts.length));
    });
}
const _pods = [];
function saveFeedsToFolder(podData) {
    podData.filter((pod) => !!pod).forEach((pod, i) => {
        _pods.push(pod.feed);
        (0, helpers_1.writeToFile)(pod.feed, (0, slug_1.default)(pod.rssUrl), 'feeds', ((i + 1) / podData.length));
    });
    return Promise.resolve(true);
}
// Prepare folders for dist
(0, helpers_1.prepare)();
// Action
downloadFeeds()
    .then((feeds) => {
    try {
        return saveFeedsToFolder(feeds);
    }
    catch (error) {
        console.log('error saving feeds to folder', error.message);
        return Promise.resolve(false);
    }
})
    .then(() => {
    console.log('\n💃-------------Done Generating Podcast Data-------------🥁\n\n');
});
