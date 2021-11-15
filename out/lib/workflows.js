"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _JobCreator_template;
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const lodash_1 = require("lodash");
const path_1 = __importDefault(require("path"));
const helpers_1 = require("./helpers");
const opmlFilePath = path_1.default.resolve(process.cwd(), './data/podcasts_opml.xml');
var JobsPerSystem;
(function (JobsPerSystem) {
    JobsPerSystem[JobsPerSystem["ubuntu"] = 20] = "ubuntu";
    JobsPerSystem[JobsPerSystem["macos"] = 5] = "macos";
})(JobsPerSystem || (JobsPerSystem = {}));
class WorkFlow {
    constructor(system, tasks, starterYml, jobYml, wrapUp) {
        this.system = 'ubuntu';
        this.jobsPerSystem = JobsPerSystem.ubuntu;
        this.splitTemplate = { taskPerJob: 0, remainder: 0 };
        this.jobs = [];
        this.workFlow = (0, lodash_1.cloneDeep)(starterYml);
        this.jobCreator = new JobCreator(jobYml);
        this.system = system;
        this.jobsPerSystem = JobsPerSystem[system];
        this.createBatches(tasks);
        this.generateJobs();
        this.wrapUp(wrapUp);
    }
    createBatches(tasks) {
        const taskPerJob = Math.floor(tasks / this.jobsPerSystem);
        const remainder = tasks % this.jobsPerSystem;
        this.splitTemplate = { taskPerJob, remainder };
    }
    generateJobs() {
        for (let i = 0; i < this.jobsPerSystem; i++) {
            this.addJob(i == this.jobsPerSystem - 1, i);
        }
    }
    addJob(finalJob, index) {
        const jobs = finalJob ?
            this.splitTemplate.remainder + this.splitTemplate.taskPerJob :
            this.splitTemplate.taskPerJob;
        const startIndex = index * this.splitTemplate.taskPerJob;
        const endIndex = startIndex + jobs;
        const jobName = `group-${index}`;
        this.jobs.push(jobName);
        this.workFlow['jobs'][jobName] = this.jobCreator.createJob(index, startIndex, endIndex);
    }
    generateWorkflow() {
        return js_yaml_1.default.dump(this.workFlow);
    }
    wrapUp(wrapUp) {
        wrapUp['needs'] = this.jobs;
        this.workFlow['jobs']['wrap-up'] = (wrapUp);
    }
    print() {
        console.log(JSON.stringify(this.workFlow, null, 2));
    }
}
class JobCreator {
    constructor(template) {
        _JobCreator_template.set(this, void 0);
        __classPrivateFieldSet(this, _JobCreator_template, template, "f");
    }
    createJob(jobIndex, startIndex, endIndex) {
        const _job = (0, lodash_1.cloneDeep)(__classPrivateFieldGet(this, _JobCreator_template, "f"));
        const runSteps = _job['steps'][4]['run'].split('\n');
        const createFolder = `${runSteps[0]}${jobIndex}`;
        const nodeCmd = `${runSteps[1]} ${startIndex} ${endIndex} ${jobIndex}`;
        const _newSteps = createFolder + '\n' + nodeCmd + '\n';
        _job['steps'][4]['run'] = _newSteps;
        _job['steps'][5]['id'] = `${_job['steps'][5]['id']}${jobIndex}`;
        _job['steps'][5]['with']['path'] = `${_job['steps'][5]['with']['path']}${jobIndex}`;
        _job['steps'][5]['with']['key'] = `${_job['steps'][5]['with']['key']}${jobIndex}`;
        const commitSteps = _job['steps'][6]['run'].split('\n');
        commitSteps[2] = `${commitSteps[2]}${jobIndex}`;
        commitSteps[3] = `${commitSteps[3]}${jobIndex}"`;
        _job['steps'][6]['run'] = commitSteps.join('\n');
        return _job;
    }
}
_JobCreator_template = new WeakMap();
const workFlowPath = process.cwd() + '\/scripts\/templates\/';
const jobPath = workFlowPath + 'job.yml';
const starterPath = workFlowPath + 'starter.yml';
const wrapUpPath = workFlowPath + 'wrap-up.yml';
const job = js_yaml_1.default.load(fs_1.default.readFileSync(jobPath, 'utf8'));
const starter = js_yaml_1.default.load(fs_1.default.readFileSync(starterPath, 'utf8'));
const wrapUp = js_yaml_1.default.load(fs_1.default.readFileSync(wrapUpPath, 'utf8'));
function writeYmlToActions(yamlFile) {
    const filePath = path_1.default.resolve(process.cwd(), 'tmp/tasks.yml');
    fs_1.default.writeFileSync(filePath, yamlFile);
}
async function splitJobs() {
    const feeds = await (0, helpers_1.getRssFeedsFromOPML)(opmlFilePath);
    const noTasks = feeds.length;
    const worker = new WorkFlow('ubuntu', noTasks, starter, job, wrapUp);
    const yamlFile = worker.generateWorkflow();
    // worker.print()
    writeYmlToActions(yamlFile);
}
splitJobs();
