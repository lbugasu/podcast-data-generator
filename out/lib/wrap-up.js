"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const { promises: { readdir } } = require('fs');
const path_1 = __importDefault(require("path"));
const ncp_1 = require("ncp");
async function getDirectories(sourceDir) {
    const fileInDirectory = await readdir(sourceDir, { withFileTypes: true });
    const folderNames = fileInDirectory.filter((dirent) => dirent.isDirectory()).map((dirent) => dirent.name);
    return folderNames;
}
/**
 * Read all the folders in the tmp
 * Combine and place the files in the podcasts folder
 */
async function wrapUp() {
    const sourceDir = path_1.default.resolve(process.cwd(), 'temp');
    const folderNames = await getDirectories(sourceDir);
    const target = path_1.default.resolve(process.cwd(), 'podcasts');
    /* For all the files in each directory,
    *  copy the file to the podcasts folder */
    return Promise.all(folderNames.map(async (folderName) => {
        const source = path_1.default.resolve(sourceDir, folderName);
        await (0, ncp_1.ncp)(source, target, (err) => {
            if (err) {
                console.error('Error copying things in folder:: ', err.message);
            }
        });
    }));
}
wrapUp().then(() => {
    console.log('Done Copying');
}).catch((err) => {
    console.error('Error copying: ', err.message);
});
