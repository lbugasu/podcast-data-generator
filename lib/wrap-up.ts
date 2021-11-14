
const { promises: { readdir } } = require('fs')
import path from 'path'
import { ncp } from 'ncp'

async function getDirectories(sourceDir: string) {
    const fileInDirectory = await readdir(sourceDir, { withFileTypes: true })
    const folderNames = fileInDirectory.filter((dirent: any) => dirent.isDirectory()).map((dirent: any) => dirent.name)
    return folderNames
}
  

/**
 * Read all the folders in the tmp
 * Combine and place the files in the podcasts folder
 */
async function wrapUp(){
    const sourceDir = path.resolve(process.cwd(), 'tmp')
    const folderNames = await getDirectories(sourceDir)
    const target = path.resolve(process.cwd(), 'podcasts')
    /* For all the files in each directory, 
    *  copy the file to the podcasts folder */
   return Promise.all(folderNames.map(async (folderName: string) => {
    const source = path.resolve(sourceDir, folderName)
    await ncp(source, target, (err: any) => {
        if (err) {
            console.error(err.message)
        }
    })
   }))
}

wrapUp().then(() => {
    console.log('Done Copying')
}).catch((err: any) => {
    console.error('Error copying: ', err.message)
})