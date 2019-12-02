import * as fs from 'fs';
import * as path from 'path';

import { match, parse } from '../src/config';

describe('config', () => {
  test.todo('#getContents');

  test('#parse', () => {
    const text = fs.readFileSync(path.join(__dirname, './milestone.yml')).toString();
    const configObject = parse(text);
    expect(configObject).toEqual({
      baseBranchList: [
        /(master)/,
        /releases\/(v\d+)/,
      ],
      headBranchList: [
        /feature\/(v\d+)\/.+/,
      ],
    });
  });

  describe('#match', () => {
    const configObject = {
      baseBranchList: [
        /(master)/,
        /releases\/(v\d+)/,
      ],
      headBranchList: [
        /feature\/(v\d+)\/.+/,
      ],
    };
    test.each([
      ['master', 'changed', 'master'],
      ['releases/v12', 'changed', 'v12'],
      ['v12.0', 'feature/v12/changed', 'v12'],
    ])('#match', (a: string, b: string, expected: string | undefined) => {
      expect(match(a, b, configObject)).toBe(expected);
    });
  });

  test.todo('#default');
});
