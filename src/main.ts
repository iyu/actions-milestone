import * as core from '@actions/core';
import * as github from '@actions/github';
import { WebhookPayload } from '@actions/github/lib/interfaces';

import config, { match } from './config';

interface PullRequestWebhookPayload extends WebhookPayload {
  // eslint-disable-next-line camelcase
  pull_request?: {
    [key: string]: any;
    number: number;
    // eslint-disable-next-line camelcase
    html_url?: string;
    body?: string;

    milestone?: string;
    base: {
      ref: string;
    },
    head: {
      ref: string;
    },
  },
}

async function run() {
  const token = core.getInput('repo-token', { required: true });
  const configPath = core.getInput('configuration-path', { required: true });
  const silent = core.getBooleanInput('silent');

  const pullRequest = (github.context.payload as PullRequestWebhookPayload).pull_request;
  if (!pullRequest) {
    const message = 'Could not get pull_request from context, exiting';
    console.log(message);
    if (!silent) {
      throw Error(message);
    }
    return;
  }

  const {
    milestone,
    number: prNumber,
    base: { ref: baseBranch },
    head: { ref: headBranch },
  } = pullRequest;

  if (milestone) {
    console.log('Milestone already exists, exiting');
    return;
  }

  const client = new github.GitHub(token);

  const configObject = await config(client, configPath);
  console.log('configObject base-branch', configObject.baseBranchList);
  console.log('configObject head-branch', configObject.headBranchList);

  const addMilestone = match(baseBranch, headBranch, configObject);

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
  } else {
    const message = `Milestone not found, Please create it first "${addMilestone}".`;
    console.log(message);
    if (!silent) {
      throw Error(message);
    }
  }
}

run().catch((error) => {
  core.setFailed(error.message);
});
