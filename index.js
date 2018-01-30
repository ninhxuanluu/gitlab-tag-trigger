#!/usr/bin/env node
const request = require('request-promise');
const minimist = require('minimist');
const gitlabTagTrigger = require('./package.json');

/**
 * Create new issue on gitlab
 * @param projectId
 * @param token
 * @param data
 * @returns {*}
 */
const createNewIssue = (projectId, token, data) => {
  const defaultRequest = {
    title: '',
    description: '',
    confidential: false,
    assignee_ids: null,
    milestone_id: null,
    labels: null,
    created_at: null,
    due_date: null,
    merge_request_to_resolve_discussions_of: null,
    discussion_to_resolve: null,
    weight: null
  };
  const requestData = Object.assign(defaultRequest, data);
  const url = `https://gitlab.com/api/v4/projects/${projectId}/issues`;
  return request.post({
    method: 'POST',
    uri: url,
    headers: {
      'Content-Type': 'application/json',
      'PRIVATE-TOKEN': token
    },
    body: requestData,
    json: true
  });
};
/**
 * Create new branch on gitlab from ref
 * @param projectId
 * @param token
 * @param data
 * @returns {*}
 */
const createNewBranch = (projectId, token, data) => {
  const url = `https://gitlab.com/api/v4/projects/${projectId}/repository/branches`;
  return request.post({
    method: 'POST',
    uri: url,
    headers: {
      'Content-Type': 'application/json',
      'PRIVATE-TOKEN': token
    },
    body: data,
    json: true
  });
};
/**
 * Create new merge request from commit, branch, ref
 * @param projectId
 * @param token
 * @param data
 * @returns {*}
 */
const createNewMergeRequest = (projectId, token, data) => {
  const url = `https://gitlab.com/api/v4/projects/${projectId}/merge_requests`;
  return request.post({
    method: 'POST',
    uri: url,
    headers: {
      'Content-Type': 'application/json',
      'PRIVATE-TOKEN': token
    },
    body: data,
    json: true
  });
};
/**
 * Accept merge request and merge into master
 * @param projectId
 * @param token
 * @param mergeRequestIID
 * @param sha
 * @returns {*}
 */
const accpetMergeRequest = (projectId, token, mergeRequestIID, sha) => {
  const url = `https://gitlab.com/api/v4/projects/${projectId}/merge_requests/${mergeRequestIID}/merge`;
  return request.put({
    method: 'PUT',
    uri: url,
    headers: {
      'Content-Type': 'application/json',
      'PRIVATE-TOKEN': token
    },
    body: { sha },
    json: true
  });
};
/**
 * Accept merge request and merge into master
 * @param projectId
 * @param token
 * @param issueIID
 * @returns {*}
 */
const closeIssue = (projectId, token, issueIID) => {
  const url = `https://gitlab.com/api/v4/projects/${projectId}/issues/${issueIID}?state_event=close`;
  return request.put({
    method: 'PUT',
    uri: url,
    headers: {
      'Content-Type': 'application/json',
      'PRIVATE-TOKEN': token
    },
    json: true
  });
};
/**
 * Get raw content of file from filename
 * @param projectId
 * @param token
 * @param data
 * @returns {*}
 */
const getRawFile = (projectId, token, data) => {
  const url =
    `https://gitlab.com/api/v4/projects/${projectId}/repository/files/${data.filename}/raw?ref=${data.ref}`;
  return request.get({
    method: 'GET',
    uri: url,
    headers: {
      'Content-Type': 'application/json',
      'PRIVATE-TOKEN': token
    },
    json: true
  });
};
/**
 * Create commit of change files
 * @param projectId
 * @param token
 * @param data
 * @returns {*}
 */
const createNewCommitPackageJson = (projectId, token, data) => {
  const requestData = {
    branch: data.branch,
    commit_message: data.commitMessage,
    author_email: data.authorEmail,
    author_name: data.authorName,
    actions: data.actions
  };
  const url = `https://gitlab.com/api/v4/projects/${projectId}/repository/commits`;
  return request.post({
    method: 'POST',
    uri: url,
    headers: {
      'Content-Type': 'application/json',
      'PRIVATE-TOKEN': token
    },
    body: requestData,
    json: true
  });
};
/**
 * Get options from argument
 * Exit the program when arg do not have -v, -p, and -f
 * @param {any} args
 * @returns {object}
 */
const parseArgs = (args) => {
  const opts = minimist(args);
  if (!opts.l || !opts.v || !opts.p || !opts.t || !opts.m) {
    console.error(`Gitlab Tag Trigger v${gitlabTagTrigger.version}\nCommand error, use with args:  \n-l [name of library] \n-v [name of tag to update] \n-p [list of project id will be update , separate by comma] \n-t [token from gitlab] \n-m [true or false - is auto merge into master]\nExample: gitlab-tag-trigger -l lib-test-ci -v v1.3.3 -p 5265594,5297794 -t JJWpgybNt3LFKyGqy9tT -m true\n`);
    process.exit(1);
  }
  return opts;
};

/**
 *  Main function
 * @returns {Promise.<void>}
 */
const main = (projectId, token, libraryName, tagName, merge) => {
  console.log('ProjectID:', projectId, `0. Start process Update ${libraryName} to ${tagName}`);
  return getRawFile(projectId, token, {
    filename: 'package.json',
    ref: 'master'
  }).then((packagejson) => {
    const currentVersion = packagejson.dependencies[libraryName];
    if (!packagejson || !currentVersion) {
      return console.log('ProjectID:', projectId, `ERROR: Not found current version of ${libraryName} in package.json on master branch`);
    }
    const issueData = {
      title: `update version ${libraryName} to ${tagName}`,
      description: `update version ${libraryName} to ${tagName} automation by ci`,
    };
    return createNewIssue(projectId, token, issueData).then((issueObject) => {
      if (!issueObject) {
        return console.log('ProjectID:', projectId, `ERROR: Fail to create new issue ${issueData.title}`);
      }
      console.log('ProjectID:', projectId, '1. Created new Issue success :', issueObject.title);
      const issueIID = issueObject.iid;
      const branchName = `${issueIID}-${issueObject.title.replace(/ /g, '-')}`;
      return createNewBranch(projectId, token, {
        branch: branchName,
        ref: 'master'
      }).then((branchObject) => {
        if (!branchObject) {
          return console.log('ProjectID:', projectId, `ERROR: Fail to create branch ${branchName}`);
        }
        console.log('ProjectID:', projectId, '2. Created new Branch success :', branchObject.name);
        const tmpArr = currentVersion.split('#', 1);
        packagejson.dependencies[libraryName] = `${tmpArr[0]}#${tagName}`;
        return createNewCommitPackageJson(
          projectId,
          token, {
            branch: branchName,
            commitMessage: issueData.title,
            authorName: 'gitlab-automation',
            authorEmail: 'gitlab-automation@gitlab.com',
            actions: [
              {
                action: 'update',
                file_path: 'package.json',
                content: JSON.stringify(packagejson, null, 2),
                encoding: 'text'
              }
            ]
          }
        ).then((commit) => {
          if (!commit) {
            return console.log('ProjectID:', projectId, 'ERROR: Fail to commit');
          }
          console.log('ProjectID:', projectId, '3. Created new Commit success :', commit.id);
          return createNewMergeRequest(
            projectId,
            token,
            {
              source_branch: branchName,
              target_branch: 'master',
              title: `Resolve ${issueData.title}`,
              assignee_id: 0,
              milestone_id: null,
              labels: '',
              description: `Closes #${issueIID}`,
              state_event: null,
              remove_source_branch: false,
              squash: false,
              discussion_locked: false
            }
          ).then((mergeRequest) => {
            if (!mergeRequest) {
              return console.log('ProjectID:', projectId, 'ERROR: Fail to create merge request');
            }
            console.log('ProjectID:', projectId, '4. Created new Merge request success :', mergeRequest.title);
            if (merge === 'true') {
              return accpetMergeRequest(projectId, token, mergeRequest.iid, mergeRequest.sha)
                .then((accept) => {
                  if (!accept) {
                    return console.log('ProjectID:', projectId, 'Accepted merge request fail');
                  }
                  console.log('ProjectID:', projectId, '5. Accepted new Merge request success :', accept.title);
                  return closeIssue(projectId, token, issueIID)
                    .then((closedIssue) => {
                      if (closedIssue) {
                        return console.log('ProjectID:', projectId, `6. Close Issue success : #${issueIID} ${closedIssue.title}`);
                      }
                      return console.log('ProjectID:', projectId, 'ERROR: Close Issue fail');
                    }).catch(err => console.log('ProjectID:', projectId, 'ERROR: ', err.message ? err.message : err));
                }).catch(err => console.log('ProjectID:', projectId, 'ERROR: ', err.message ? err.message : err));
            }
            return null;
          }).catch(err => console.log('ProjectID:', projectId, 'ERROR: ', err.message ? err.message : err));
        }).catch(err => console.log('ProjectID:', projectId, 'ERROR: ', err.message ? err.message : err));
      }).catch(err => console.log('ProjectID:', projectId, 'ERROR: ', err.message ? err.message : err));
    }).catch(err => console.log('ProjectID:', projectId, 'ERROR: ', err.message ? err.message : err));
  }).catch(err => console.log('ProjectID:', projectId, 'ERROR: ', err.message ? err.message : err));
};

const opts = parseArgs(process.argv.slice(2));
const libraryName = opts.l;
const tagName = opts.v;
const projectIds = opts.p.toString().split(',');
const token = opts.t;
const merge = opts.m;

Promise
  .all(projectIds.map(projectId => main(
    projectId,
    token,
    libraryName,
    tagName,
    merge
  )))
  .then(() => console.log('Done !'))
  .catch(err => console.log('ERROR: ', err.message ? err.message : err));
