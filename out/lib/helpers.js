"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logError = exports.parseRssXMLString = exports.prepare = exports.writeToFile = exports.getDataFromXMLString = exports.findNamedEntities = exports.getRssFeedsFromOPML = exports.getFile = exports.getFilesInFolder = void 0;
/* Imports */
const fs_1 = __importDefault(require("fs"));
const opml_to_json_1 = require("opml-to-json");
const rss_parser_1 = __importDefault(require("rss-parser"));
const core_nlp_ner_1 = require("core-nlp-ner");
const parser = new rss_parser_1.default();
const nerParser = new core_nlp_ner_1.EntityRecognizer({
    installPath: 'tmp/stanford-ner-2020-11-17'
});
async function getRssFeedsFromOPML(filePath) {
    const opmlContent = fs_1.default.readFileSync(filePath, 'utf8');
    const jsonData = await (0, opml_to_json_1.opmlToJSON)(opmlContent);
    return jsonData.children[0].children;
}
exports.getRssFeedsFromOPML = getRssFeedsFromOPML;
async function parseRssFeed(rssUrl) {
    return parser.parseURL(rssUrl);
}
async function parseRssXMLString(xmlString) {
    return parser.parseString(xmlString);
}
exports.parseRssXMLString = parseRssXMLString;
async function findNamedEntities(text) {
    if (text) {
        let entities = {};
        try {
            entities = await nerParser.processAsync(text);
        }
        catch (error) {
            return entities;
        }
        return entities;
    }
    else
        return {};
}
exports.findNamedEntities = findNamedEntities;
async function getDataFromXMLString(rssUrl) {
    const feed = await parseRssFeed(rssUrl);
    return { feed: feed, rssUrl: rssUrl };
}
exports.getDataFromXMLString = getDataFromXMLString;
function prepare() {
    const filePath = process.cwd() + '\/tmp\/dist/logs.md';
    const initLog = `## Data Collection and Generation\n\n`;
    fs_1.default.writeFile(filePath, initLog, (err) => {
        if (err)
            console.log('error in logs: ', err.message);
        console.log("Beginning Logs");
    });
}
exports.prepare = prepare;
function logError(item, error) {
    const filePath = process.cwd() + '\/tmp\/dist/logs.md';
    const logMessage = `\n\n${item === null || item === void 0 ? void 0 : item.title} failed to write to file: ${error.message}\n\n`;
    fs_1.default.appendFile(filePath, logMessage, (err) => {
        if (err)
            console.log('error in logs: ', err.message);
        console.log("Logs updated");
    });
}
exports.logError = logError;
function writeToFile(podcast, fileName, folderName, total) {
    const folder = process.cwd() + `\/tmp\/dist/${folderName}`;
    try {
        fs_1.default.writeFileSync(`${folder}/${fileName}.json`, JSON.stringify(podcast, null, 4), 'utf8');
        if (total)
            console.log(`done ${(total * 100).toFixed(2)}% - ${fileName}.json`);
    }
    catch (error) {
        logError(podcast, error);
    }
}
exports.writeToFile = writeToFile;
function getFilesInFolder(folderName) {
    return fs_1.default.readdirSync(process.cwd() + `\/tmp\/dist/${folderName}`);
}
exports.getFilesInFolder = getFilesInFolder;
function getFile(filePath) {
    return fs_1.default.readFileSync(process.cwd() + `\/tmp\/dist/${filePath}`, 'utf8');
}
exports.getFile = getFile;
