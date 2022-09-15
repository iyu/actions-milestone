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
exports.match = exports.parse = exports.getContents = void 0;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const yaml = __importStar(require("js-yaml"));
const getContents = async (octokit, configPath) => {
    const [configOwner, configRepo] = core.getInput('configuration-repo').split('/');
    const [_configPath, configSha] = configPath.split('@');
    const response = await octokit.rest.repos.getContent({
        owner: configOwner || github.context.repo.owner,
        repo: configRepo || github.context.repo.repo,
        path: _configPath,
        ref: configSha || github.context.sha,
    });
    return Buffer.from(response.data.content, 'base64').toString();
};
exports.getContents = getContents;
const parse = (text) => {
    const config = (yaml.load(text) || {});
    const result = {
        baseBranchList: [],
        headBranchList: [],
    };
    result.baseBranchList = (config['base-branch'] || []).map((item) => new RegExp(item));
    result.headBranchList = (config['head-branch'] || []).map((item) => new RegExp(item));
    return result;
};
exports.parse = parse;
const match = (baseBranch, headBranch, configObject) => {
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
exports.match = match;
exports.default = async (octokit, configPath) => {
    const configText = await (0, exports.getContents)(octokit, configPath);
    return (0, exports.parse)(configText);
};
