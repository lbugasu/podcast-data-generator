import Parser from 'rss-parser';
import { Podcast } from './../models/index';
declare function getRssFeedsFromOPML(filePath: string): Promise<any[]>;
declare function parseRssXMLString(xmlString: string): Promise<{
    [key: string]: any;
} & Parser.Output<{
    [key: string]: any;
}>>;
declare function findNamedEntities(text?: string): Promise<any>;
export declare type PodcastFeedData = {
    feed: Podcast;
    rssUrl: string;
};
declare function getDataFromXMLString(rssUrl: string): Promise<PodcastFeedData>;
declare function prepare(): void;
declare function logError(item: any, error: any): void;
declare function writeToFile(podcast: any, fileName?: string, folderName?: string, total?: number): void;
export declare function getFilesInFolder(folderName: string): string[];
export declare function getFile(filePath: string): string;
export { getRssFeedsFromOPML, findNamedEntities, getDataFromXMLString, writeToFile, prepare, parseRssXMLString, logError };
