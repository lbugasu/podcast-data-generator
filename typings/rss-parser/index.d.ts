/// <reference types="node" />
export * from  require('rss-parser');

declare module 'rss-parser' {

  export interface Item {
    [key: string]: any;
    type: string
    text: string
    xmlurl: string,
    folder: string
  }

  export * from 'rss-parser'
}
