import * as core from '@actions/core';
import * as github from '@actions/github';
import * as yaml from 'js-yaml';
import { GitHub } from '@actions/github/lib/utils';

export interface ConfigObject {
  baseBranchList: RegExp[];
  headBranchList: RegExp[];
}

export const getContents = async (
  octokit: InstanceType<typeof GitHub>,
  configPath: string,
): Promise<string> => {
  const [configOwner, configRepo] = core.getInput('configuration-repo').split('/');
  const [_configPath, configSha] = configPath.split('@');
  const response = await octokit.rest.repos.getContent({
    owner: configOwner || github.context.repo.owner,
    repo: configRepo || github.context.repo.repo,
    path: _configPath,
    ref: configSha || github.context.sha,
  });
  return Buffer.from((response.data as { content: string }).content, 'base64').toString();
};

export const parse = (text: string) => {
  const config = (yaml.load(text) || {}) as {
    'base-branch'?: string[],
    'head-branch'?: string[],
  };

  const result: ConfigObject = {
    baseBranchList: [],
    headBranchList: [],
  };
  result.baseBranchList = (config['base-branch'] || []).map((item) => new RegExp(item));
  result.headBranchList = (config['head-branch'] || []).map((item) => new RegExp(item));

  return result;
};

export const match = (
  baseBranch: string,
  headBranch: string,
  configObject: ConfigObject,
): string|undefined => {
  let hit: string|undefined;
  configObject.baseBranchList.some((regexp) => {
    const m = baseBranch.match(regexp);
    if (m && m[1]) {
      ([, hit] = m);
    }
    return !!hit;
  });
  if (hit) {
    return hit;
  }

  configObject.headBranchList.some((regexp) => {
    const m = headBranch.match(regexp);
    if (m && m[1]) {
      ([, hit] = m);
    }
    return !!hit;
  });
  return hit;
};

export default async (
  octokit: InstanceType<typeof GitHub>,
  configPath: string,
): Promise<ConfigObject> => {
  const configText = await getContents(octokit, configPath);

  return parse(configText);
};
