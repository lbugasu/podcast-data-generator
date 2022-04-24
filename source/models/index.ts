import { Output } from 'rss-parser'

export type Podcast = {
  [key: string]: any
} & Output<{
  [key: string]: any
}>
