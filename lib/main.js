"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const config_1 = __importStar(require("./config"));
function getMilestoneNumber(milestones, _title) {
    const { number } = milestones.data.find(({ title }) => title === _title) || { number: null };
    return number;
}
function error(message) {
    const silent = core.getBooleanInput('silent');
    console.log(message);
    if (!silent) {
        throw Error(message);
    }
}
async function run() {
    const token = core.getInput('repo-token', { required: true });
    const configPath = core.getInput('configuration-path', { required: true });
    const force = core.getBooleanInput('force');
    const clear = core.getBooleanInput('clear');
    const pullRequest = github.context.payload.pull_request;
    if (!pullRequest) {
        error('Could not get pull_request from context, exiting');
        return;
    }
    const { milestone: currMilestone, number: prNumber, base: { ref: baseBranch }, head: { ref: headBranch }, } = pullRequest;
    core.setOutput('previous', currMilestone === null || currMilestone === void 0 ? void 0 : currMilestone.title);
    core.setOutput('milestone', currMilestone === null || currMilestone === void 0 ? void 0 : currMilestone.title);
    if (currMilestone) {
        console.log(`Milestone already exists: ${currMilestone.title}`);
        if (!force && !clear) {
            console.log('Exiting');
            return;
        }
    }
    const octokit = github.getOctokit(token);
    const configObject = await (0, config_1.default)(octokit, configPath);
    console.log('configObject base-branch', configObject.baseBranchList);
    console.log('configObject head-branch', configObject.headBranchList);
    const addMilestone = (0, config_1.match)(baseBranch, headBranch, configObject);
    if (addMilestone) {
        console.log(`Milestone hit: ${addMilestone}`);
        if ((currMilestone === null || currMilestone === void 0 ? void 0 : currMilestone.title) === addMilestone) {
            console.log(`Milestone already set to ${addMilestone}, exiting.`);
            return;
        }
        if (!currMilestone || force) {
            console.log(`Update of milestone from ${currMilestone === null || currMilestone === void 0 ? void 0 : currMilestone.title} to ${addMilestone}`);
            const milestones = await octokit.rest.issues.listMilestones({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
            });
            const newMilestone = getMilestoneNumber(milestones, addMilestone);
            if (!newMilestone) {
                error(`Milestone "${addMilestone}" not found, Please create it first.`);
                return;
            }
            await octokit.rest.issues.update({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                issue_number: prNumber,
                milestone: newMilestone,
            });
            core.setOutput('milestone', addMilestone);
        }
        else {
            console.log(`Do not correct milestone from ${currMilestone.title} to ${addMilestone}`);
        }
    }
    else if (clear && currMilestone) {
        console.log(`Clear milestone ${currMilestone.title} due to clear flag`);
        await octokit.rest.issues.update({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            issue_number: prNumber,
            milestone: null,
        });
        core.setOutput('milestone', null);
    }
    else {
        console.log(`Milestone not changed: ${currMilestone === null || currMilestone === void 0 ? void 0 : currMilestone.title}`);
    }
}
run().catch((err) => {
    core.setFailed(err.message);
});
