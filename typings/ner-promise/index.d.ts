/// <reference types="node" />

declare module 'ner-promise' {

  interface Entity{
    readonly type: string
    readonly list: string[]
  }

  export interface NerPromiseOptions{
    install_path: string;
    jar?: string = 'stanford-ner.jar';
    classifier?: string = 'english.all.3class.distsim.crf.ser.gz'
  }

  export default class NerPromise{
    constructor(options: NerPromiseOptions);

    readonly parse(parsed: any): Entity[];

    readonly async process(text: string): Promise<Entity[]>
  }

}
