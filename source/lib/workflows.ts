import fs from 'fs'
import yaml from 'js-yaml'
import { cloneDeep } from 'lodash'
import path from 'path'

import { getRssFeedsFromOPML } from './helpers'

const opmlFilePath = path.resolve(process.cwd(), './data/podcasts_opml.xml')



type System = 'ubuntu' | 'macos'
enum JobsPerSystem {
    ubuntu = 20,
    macos = 5
}

type Yml = { [key: string]: any }

type SplitTemplate = { taskPerJob: number, remainder: number }

class WorkFlow {

    system: System = 'ubuntu'
    jobsPerSystem: JobsPerSystem = JobsPerSystem.ubuntu
    splitTemplate: SplitTemplate = { taskPerJob: 0, remainder: 0 }

    workFlow!: Yml
    jobCreator!: JobCreator

    constructor(system: System, tasks: number, starterYml: Yml, jobYml: Yml){
        this.workFlow = cloneDeep(starterYml)
        this.jobCreator = new JobCreator(jobYml)

        this.system = system
        this.jobsPerSystem = JobsPerSystem[system]

        this.createBatches(tasks)
        this.generateJobs()
    }

    createBatches(tasks: number) {
        const taskPerJob = Math.floor(tasks / this.jobsPerSystem)
        const remainder = tasks % this.jobsPerSystem
        this.splitTemplate =  { taskPerJob, remainder }
    }

    generateJobs(){
        for(let i = 0; i < this.jobsPerSystem; i++){
            this.addJob(i == this.jobsPerSystem-1, i)
        }
    }

    addJob(finalJob: boolean, index: number){
        const jobs = finalJob ?
            this.splitTemplate.remainder + this.splitTemplate.taskPerJob:
            this.splitTemplate.taskPerJob
        const startIndex = index * this.splitTemplate.taskPerJob
        const endIndex = startIndex + jobs
        this.workFlow['jobs'][`group-${index}`] = this.jobCreator.createJob(index, startIndex, endIndex)
    }

    generateWorkflow(){
        return yaml.dump(this.workFlow)
    }

    print(){
        console.log(JSON.stringify(this.workFlow, null, 2))
    }

}

class JobCreator{
    readonly #template!: Yml
    constructor(template: Yml){
        this.#template = template

    }
    createJob(jobIndex: number, startIndex: number, endIndex: number){
      const _job = cloneDeep(this.#template)
      const runSteps = _job['steps'][1]['run'].split('\n')
      const createFolder = `${runSteps[0]}${jobIndex}`
      const nodeCmd = `${runSteps[1]} ${startIndex} ${endIndex} ${jobIndex}`
      const _newSteps =  createFolder + '\n' + nodeCmd + '\n'
      _job['steps'][1]['run'] = _newSteps
      _job['steps'][2]['id'] = `${_job['steps'][2]['id']}${jobIndex}`

      _job['steps'][2]['with']['path'] = `${_job['steps'][2]['with']['path']}${jobIndex}`
      _job['steps'][2]['with']['key'] = `${_job['steps'][2]['with']['key'] }${jobIndex}`
      return _job
    }

}

const workFlowPath = process.cwd() + '\/scripts\/templates\/'

const jobPath = workFlowPath + 'job.yml'
const starterPath = workFlowPath + 'starter.yml'

const job = yaml.load(fs.readFileSync(jobPath, 'utf8')) as Yml
const starter = yaml.load(fs.readFileSync(starterPath, 'utf8')) as Yml

starter['jobs'] = {}

function writeYmlToActions(yamlFile: string){
    const filePath = path.resolve(process.cwd(), 'tmp/tasks.yml')
    fs.writeFileSync(filePath, yamlFile)
}

async function splitJobs(){
    const feeds = await getRssFeedsFromOPML(opmlFilePath)
    const noTasks =  feeds.length
    const worker = new WorkFlow('ubuntu', noTasks, starter, job)
    const yamlFile = worker.generateWorkflow()
    // worker.print()
    writeYmlToActions(yamlFile)
}

splitJobs()
