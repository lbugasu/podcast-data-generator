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

    constructor(system: System, tasks: number, starter: Yml, job: Yml){
        this.workFlow = cloneDeep(starter)
        this.jobCreator = new JobCreator(job)

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
        this.workFlow['jobs'][`group-${index}`] = this.jobCreator.createJob(startIndex, endIndex)
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
    createJob(startIndex: number, endIndex: number){
        const _job = cloneDeep(this.#template)
        const nodeCmd = `${_job['steps'][0]['run']} ${startIndex} ${endIndex}`
        _job['steps'][0]['run'] = nodeCmd
        return _job
    }

}

const workFlowPath = process.cwd() + '\/scripts\/templates\/'

const artefactsPath = workFlowPath + 'artifacts.yml'
const jobPath = workFlowPath + 'job.yml'
const starterPath = workFlowPath + 'starter.yml'

const artifacts = yaml.load(fs.readFileSync(artefactsPath, 'utf8')) as Yml
const job = yaml.load(fs.readFileSync(jobPath, 'utf8')) as Yml
const starter = yaml.load(fs.readFileSync(starterPath, 'utf8')) as Yml

starter['jobs'] = {}


console.log(JSON.stringify(artifacts, null, 2))
console.log(JSON.stringify(job, null, 2))


function writeYmlToActions(yamlFile: string){
    const filePath = path.resolve(process.cwd(), 'dist/.github/workflows/tasks.yml')
    fs.writeFileSync(filePath, yamlFile)
}

async function splitJobs(){
    const feeds = await getRssFeedsFromOPML(opmlFilePath)
    const noTasks =  feeds.length
    const worker = new WorkFlow('ubuntu', noTasks, starter, job)
    const yamlFile = worker.generateWorkflow()
    worker.print()
    writeYmlToActions(yamlFile)
}

splitJobs()