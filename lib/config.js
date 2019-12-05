"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const github = __importStar(require("@actions/github"));
const yaml = __importStar(require("js-yaml"));
exports.getContents = async (client, configPath) => {
    const response = await client.repos.getContents({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        path: configPath,
        ref: github.context.sha,
    });
    return Buffer.from(response.data.content, 'base64').toString();
};
exports.parse = (text) => {
    const config = yaml.safeLoad(text) || {};
    const result = {
        baseBranchList: [],
        headBranchList: [],
    };
    result.baseBranchList = (config['base-branch'] || []).map((item) => new RegExp(item));
    result.headBranchList = (config['head-branch'] || []).map((item) => new RegExp(item));
    return result;
};
exports.match = (baseBranch, headBranch, configObject) => {
    let hit;
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
exports.default = async (client, configPath) => {
    const configText = await exports.getContents(client, configPath);
    return exports.parse(configText);
};
