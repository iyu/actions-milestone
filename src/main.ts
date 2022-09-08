import * as core from '@actions/core';
import * as github from '@actions/github';
import { WebhookPayload } from '@actions/github/lib/interfaces';

import config, { match } from './config';

interface Milestone {
  number: number;
  title: string;
  state: string;
  description: string;
  due_on: string;
}

interface PullRequestWebhookPayload extends WebhookPayload {
  // eslint-disable-next-line camelcase
  pull_request?: {
    [key: string]: any;
    number: number;
    // eslint-disable-next-line camelcase
    html_url?: string;
    body?: string;

    milestone?: Milestone;
    base: {
      ref: string;
    },
    head: {
      ref: string;
    },
  },
}

function getMilestoneNumber(
  milestones: any,
  _title: string,
): number | null {
  const { number } = milestones.data.find(({ title }) => title === _title) || { number: null };
  return number;
}

function error(message: string): void {
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

  const pullRequest = (github.context.payload as PullRequestWebhookPayload).pull_request;
  if (!pullRequest) {
    error('Could not get pull_request from context, exiting');
    return;
  }

  const {
    milestone: currMilestone,
    number: prNumber,
    base: { ref: baseBranch },
    head: { ref: headBranch },
  } = pullRequest;

  core.setOutput('previous', currMilestone?.title);
  core.setOutput('milestone', currMilestone?.title);

  if (currMilestone) {
    console.log(`Milestone already exists: ${currMilestone.title}`);
    if (!force && !clear) {
      console.log('Exiting');
      return;
    }
  }

  const client = new github.GitHub(token);
  const configObject = await config(client, configPath);
  console.log('configObject base-branch', configObject.baseBranchList);
  console.log('configObject head-branch', configObject.headBranchList);

  const addMilestone = match(baseBranch, headBranch, configObject);

  if (addMilestone) {
    console.log(`Milestone hit: ${addMilestone}`);
    if (currMilestone?.title === addMilestone) {
      console.log(`Milestone already set to ${addMilestone}, exiting.`);
      return;
    }

    if (!currMilestone || force) {
      console.log(`Update of milestone from ${currMilestone?.title} to ${addMilestone}`);
      const milestones = await client.issues.listMilestonesForRepo({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
      });
      const newMilestone = getMilestoneNumber(milestones, addMilestone);
      if (!newMilestone) {
        error(`Milestone "${addMilestone}" not found, Please create it first.`);
        return;
      }
      await client.issues.update({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: prNumber,
        milestone: newMilestone,
      });
      core.setOutput('milestone', addMilestone);
    } else {
      console.log(`Do not correct milestone from ${currMilestone.title} to ${addMilestone}`);
    }
  } else if (clear && currMilestone) {
    console.log(`Clear milestone ${currMilestone.title} due to clear flag`);
    await client.issues.update({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: prNumber,
      milestone: null,
    });
    core.setOutput('milestone', null);
  } else {
    console.log(`Milestone not changed: ${currMilestone?.title}`);
  }
}

run().catch((err) => {
  core.setFailed(err.message);
});
