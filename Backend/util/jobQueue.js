const Queue = require("bull");

const Job = require("../models/Job");

const { executeC, executeCpp } = require("../compiler/executeCAndCpp.js");
const executeJS = require("../compiler/executeJS.js");
const executeJava = require("../compiler/executeJava.js");
const executePy = require("../compiler/executePy.js");

const deleteFile = require("../util/deleteFile.js");

const jobQueue = new Queue("job-queue");
const NUM_OF_WORKERS = 5;

//Here we perform a job(means execute code file) by a process in the background.
//And we can have 5 process running simultaneously.
jobQueue.process(NUM_OF_WORKERS, async ({ data }) => {
    const { id: jobId } = data;
    const job = await Job.findById(jobId);

    if (!job) {
        throw new Error("invalid job id");
    }

    let output;
    try {
        job.startedAt = new Date();
        if (job.language === "c") {
            
            output = await executeC(job.filepath, job.inputpath);
        } else if (job.language === "cpp") {
            
            
            output = await executeCpp(job.filepath, job.inputpath);
        } else if (job.language === 'js') {
            
            
            output = await executeJS(job.filepath);
        } else if (job.language === "java") {
           
            
            output = await executeJava(job.filepath, job.inputpath);
        } else if (job.language === "py") {
           
           
            output = await executePy(job.filepath, job.inputpath);
        }
        job.completedAt = new Date();
        job.status = "Success";
        job.output = output.stdout;
    } catch (error) {
        job.completedAt = new Date();
        job.status = "Error";
        job.output = error.stderr;
    }
    try {
        await job.save();
    } catch (error) { }
    deleteFile(job.filepath);
});

jobQueue.on("failed", (error) => { }); //Here we handles error which we get if the above process fails.


const addJobToQueue = async (jobId) => {
    await jobQueue.add({ id: jobId });
};

module.exports = { addJobToQueue };