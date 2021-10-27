"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const config_1 = __importStar(require("./config"));
async function run() {
    const token = core.getInput('repo-token', { required: true });
    const configPath = core.getInput('configuration-path', { required: true });
    const pullRequest = github.context.payload.pull_request;
    if (!pullRequest) {
        console.log('Could not get pull_request from context, exiting');
        return;
    }
    const { milestone, number: prNumber, base: { ref: baseBranch }, head: { ref: headBranch }, } = pullRequest;
    if (milestone) {
        console.log('Milestone already exists, exiting');
        return;
    }
    const client = new github.GitHub(token);
    const configObject = await config_1.default(client, configPath);
    console.log('configObject base-branch', configObject.baseBranchList);
    console.log('configObject head-branch', configObject.headBranchList);
    const addMilestone = config_1.match(baseBranch, headBranch, configObject);
    if (!addMilestone) {
        console.log('Milestone not hit, exiting');
        return;
    }
    const milestones = await client.issues.listMilestonesForRepo({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
    });
    const { number: milestoneNumber } = milestones.data.find(({ title }) => title === addMilestone)
        || {};
    if (milestoneNumber) {
        await client.issues.update({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            issue_number: prNumber,
            milestone: milestoneNumber,
        });
        core.setOutput('milestone', addMilestone);
    }
    else {
        console.log(`Milestone not found, Please create it first "${addMilestone}".`);
    }
}
run().catch((error) => {
    core.setFailed(error.message);
});
