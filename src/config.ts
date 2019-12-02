import * as github from '@actions/github';
import * as yaml from 'js-yaml';

export interface ConfigObject {
  baseBranchList: RegExp[];
  headBranchList: RegExp[];
}

export const getContents = async (client: github.GitHub, configPath: string): Promise<string> => {
  const response = await client.repos.getContents({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    path: configPath,
    ref: github.context.sha,
  });
  return Buffer.from((response.data as { content: string }).content, 'base64').toString();
};

export const parse = (text: string) => {
  const config: {
    'base-branch'?: string[],
    'head-branch'?: string[],
  } = yaml.safeLoad(text) || {};

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

export default async (client: github.GitHub, configPath: string): Promise<ConfigObject> => {
  const configText = await getContents(client, configPath);

  return parse(configText);
};
