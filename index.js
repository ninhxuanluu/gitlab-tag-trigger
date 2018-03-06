#!/usr/bin/env node
const axios = require('axios');
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
  return axios({
    method: 'POST',
    url,
    headers: {
      'Content-Type': 'application/json',
      'PRIVATE-TOKEN': token
    },
    data: requestData,
    responseType: 'json'
  }).then(rs => rs.data);
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
  return axios({
    method: 'POST',
    url,
    headers: {
      'Content-Type': 'application/json',
      'PRIVATE-TOKEN': token
    },
    data,
    responseType: 'json'
  }).then(rs => rs.data);
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
  return axios({
    method: 'POST',
    url,
    headers: {
      'Content-Type': 'application/json',
      'PRIVATE-TOKEN': token
    },
    data,
    responseType: 'json'
  }).then(rs => rs.data);
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
  return axios({
    method: 'PUT',
    url,
    headers: {
      'Content-Type': 'application/json',
      'PRIVATE-TOKEN': token
    },
    data: { sha },
    responseType: 'json'
  }).then(rs => rs.data);
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
  return axios({
    method: 'PUT',
    url,
    headers: {
      'Content-Type': 'application/json',
      'PRIVATE-TOKEN': token
    },
    responseType: 'json'
  }).then(rs => rs.data);
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
  return axios({
    method: 'GET',
    url,
    headers: {
      'Content-Type': 'application/json',
      'PRIVATE-TOKEN': token
    },
    responseType: 'text',
    transformResponse: [txt => txt]
  }).then(rs => rs.data);
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
  return axios({
    method: 'POST',
    url,
    headers: {
      'Content-Type': 'application/json',
      'PRIVATE-TOKEN': token
    },
    data: requestData,
    responseType: 'json'
  }).then(rs => rs.data);
};
/**
 * Get options from argument
 * Exit the program when arg do not have -v, -p, and -f
 * @param {any} args
 * @returns {object}
 */
const parseArgs = (args) => {
  const opts = minimist(args);
  if (opts.i || opts.o || opts.s || opts.u) {
    if (!opts.i || !opts.o || !opts.s || !opts.u || !opts.t || !opts.m) {
      console.error(`Gitlab Tag Trigger v${gitlabTagTrigger.version}
    Command error 
    for UPDATE FILE, use with args:
    -i [source file path]
    -o [destination file path]
    -o [source project ID]
    -u [list of project id will be update , separate by comma]
    -t [token from gitlab]
    -m [true or false - is auto merge into master]
    Example: gitlab-tag-trigger -i lib/test.js -o lib/test.js -s 5265616 -u 5265594 -t 11mHNS3Fzb4rvhy2sKyk  -m true

    for UPDATE package.json, use with args:  
    -l [name of library] 
    -v [name of tag to update] 
    -p [list of project id will be update , separate by comma] 
    -t [token from gitlab] 
    -m [true or false - is auto merge into master]
    Example: gitlab-tag-trigger -l lib-test-ci -v v1.3.3 -p 5265594,5297794 -t 11mHNS3Fzb4rvhy2sKyk -m true
`);
      process.exit(1);
    }
    return opts;
  }
  if (!opts.l || !opts.v || !opts.p || !opts.t || !opts.m) {
    console.error(`Gitlab Tag Trigger v${gitlabTagTrigger.version}
    Command error
    for UPDATE FILE, use with args:
    -i [source file path]
    -o [destination file path]
    -o [source project ID]
    -u [list of project id will be update , separate by comma]
    -t [token from gitlab]
    -m [true or false - is auto merge into master]
    Example: gitlab-tag-trigger -i lib/test.js -o lib/test.js -s 5265616 -u 5265594 -t 11mHNS3Fzb4rvhy2sKyk  -m true

    for UPDATE package.json, use with args:  
    -l [name of library] 
    -v [name of tag to update] 
    -p [list of project id will be update , separate by comma] 
    -t [token from gitlab] 
    -m [true or false - is auto merge into master]
    Example: gitlab-tag-trigger -l lib-test-ci -v v1.3.3 -p 5265594,5297794 -t 11mHNS3Fzb4rvhy2sKyk -m true
`);
    process.exit(1);
  }
  return opts;
};

/**
 *  Main function
 * @returns {Promise.<void>}
 */
const updatePackageJSON =
  (projectId,
   token,
   libraryName,
   tagName,
   merge) => {
    console.log('ProjectID:', projectId, `0. Start process Update ${libraryName} to ${tagName}`);
    return getRawFile(projectId, token, {
      filename: 'package.json',
      ref: 'master'
    }).then((packagejsonText) => {
      const packagejson = JSON.parse(packagejsonText);
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
                        return console.log('projectIdToUpdate:', projectId, 'ERROR: Close Issue fail');
                      }).catch(err => console.log('ERROR closeIssue, projectId:', projectId, 'ERROR: ', err.message ? err.message : err));
                  }).catch(err => console.log('ERROR accpetMergeRequest, projectId:', projectId, 'ERROR: ', err.message ? err.message : err));
              }
              return null;
            }).catch(err => console.log('ERROR createMergeRequest, projectId:', projectId, 'message: ', err.message ? err.message : err));
          }).catch(err => console.log('ERROR createCommit, projectId:', projectId, 'message: ', err.message ? err.message : err));
        }).catch(err => console.log('ERROR createNewBranch, projectId:', projectId, 'message: ', err.message ? err.message : err));
      }).catch(err => console.log('ERROR createNewIssue, projectId:', projectId, 'message: ', err.message ? err.message : err));
    }).catch(err => console.log('ERROR getRawFile, projectID: ', projectId, ' message: ', err.message ? err.message : err));
  };
/**
 *  Main function
 * @returns {Promise.<void>}
 */
const updateFile =
  (projectIdSource,
   projectIdToUpdate,
   sourceFilePath,
   updateFilePath,
   token,
   merge) => {
    console.log('ProjectID:', projectIdToUpdate, `0. Start process Update file : ${updateFilePath}`);
    return getRawFile(projectIdSource, token, {
      filename: encodeURIComponent(sourceFilePath),
      ref: 'master'
    }).then((fileContent) => {
      if (!fileContent) {
        return console.log('projectIdSource:', projectIdSource, `ERROR: File ${sourceFilePath} doesn't exist on master branch`);
      }
      const issueData = {
        title: `update filename ${updateFilePath}`,
        description: `update filename ${updateFilePath} automation by ci`,
      };
      return createNewIssue(projectIdToUpdate, token, issueData).then((issueObject) => {
        if (!issueObject) {
          return console.log('projectIdToUpdate:', projectIdToUpdate, `ERROR: Fail to create new issue ${issueData.title}`);
        }
        console.log('projectIdToUpdate:', projectIdToUpdate, '1. Created new Issue success :', issueObject.title);
        const issueIID = issueObject.iid;
        let branchName = `${issueIID}-${issueObject.title.replace(/ /g, '-')}`;
        branchName = branchName.replace(/\//g, '-');
        return createNewBranch(projectIdToUpdate, token, {
          branch: branchName,
          ref: 'master'
        }).then((branchObject) => {
          if (!branchObject) {
            return console.log('projectIdToUpdate:', projectIdToUpdate, `ERROR: Fail to create branch ${branchName}`);
          }
          console.log('projectIdToUpdate:', projectIdToUpdate, '2. Created new Branch success :', branchObject.name);
          const requestUpdate = {
            branch: branchName,
            commitMessage: issueData.title,
            authorName: 'gitlab-automation',
            actions: [
              {
                action: 'update',
                file_path: updateFilePath,
                content: fileContent,
                encoding: 'text'
              }
            ]
          };
          return createNewCommitPackageJson(
            projectIdToUpdate,
            token, requestUpdate
          ).then((commit) => {
            if (!commit) {
              return console.log('projectIdToUpdate:', projectIdToUpdate, 'ERROR: Fail to commit');
            }
            console.log('projectIdToUpdate:', projectIdToUpdate, '3. Created new Commit success :', commit.id);
            return createNewMergeRequest(
              projectIdToUpdate,
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
                return console.log('projectIdToUpdate:', projectIdToUpdate, 'ERROR: Fail to create merge request');
              }
              console.log('projectIdToUpdate:', projectIdToUpdate, '4. Created new Merge request success :', mergeRequest.title);
              if (merge === 'true') {
                return accpetMergeRequest(
                  projectIdToUpdate,
                  token,
                  mergeRequest.iid,
                  mergeRequest.sha
                )
                  .then((accept) => {
                    if (!accept) {
                      return console.log('projectIdToUpdate:', projectIdToUpdate, 'Accepted merge request fail');
                    }
                    console.log('projectIdToUpdate:', projectIdToUpdate, '5. Accepted new Merge request success :', accept.title);
                    return closeIssue(projectIdToUpdate, token, issueIID)
                      .then((closedIssue) => {
                        if (closedIssue) {
                          return console.log('projectIdToUpdate:', projectIdToUpdate, `6. Close Issue success : #${issueIID} ${closedIssue.title}`);
                        }
                        return console.log('projectIdToUpdate:', projectIdToUpdate, 'ERROR: Close Issue fail');
                      }).catch(err => console.log('ERROR closeIssue, projectId:', projectIdToUpdate, 'ERROR: ', err.message ? err.message : err));
                  }).catch(err => console.log('ERROR accpetMergeRequest, projectId:', projectIdToUpdate, 'ERROR: ', err.message ? err.message : err));
              }
              return null;
            }).catch(err => console.log('ERROR createMergeRequest, projectId:', projectIdToUpdate, 'message: ', err.message ? err.message : err));
          }).catch(err => console.log('ERROR createCommit, projectId:', projectIdToUpdate, 'message: ', err.message ? err.message : err));
        }).catch(err => console.log('ERROR createNewBranch, projectId:', projectIdToUpdate, 'message: ', err.message ? err.message : err));
      }).catch(err => console.log('ERROR createNewIssue, projectId:', projectIdToUpdate, 'message: ', err.message ? err.message : err));
    }).catch(err => console.log('ERROR getRawFile, projectID: ', projectIdToUpdate, ' message: ', err.message ? err.message : err));
  };

/**
 * UPDATE package.json
 * -l Library name to update in package.json
 * -v Tag name to update
 * -p List of projectId to update package.json separate by comma
 * -t Access Token
 * -m Is auto merge ? true or false
 * UPDATE FILE
 * -i Source file path
 * -o Destination file path
 * -s Source project ID
 * -u Destination project ID
 */
const opts = parseArgs(process.argv.slice(2));
const token = opts.t;
const merge = opts.m;

if (opts.i && opts.i !== '') {
  const sourceFilePath = opts.i;
  const updateFilePath = opts.o;
  const projectIdSource = opts.s;
  const projectIdToUpdate = opts.u.toString().split(',');
  Promise
    .all(
      projectIdToUpdate.map(
        pId => updateFile(projectIdSource, pId, sourceFilePath, updateFilePath, token, merge)
      )
    )
    .then(() => console.log('Done !'))
    .catch(err => console.log('ERROR: ', err));
} else {
  const libraryName = opts.l;
  const tagName = opts.v;
  const projectIds = opts.p.toString().split(',');
  Promise
    .all(projectIds.map(projectId => updatePackageJSON(
      projectId,
      token,
      libraryName,
      tagName,
      merge
    )))
    .then(() => console.log('Done !'))
    .catch(err => console.log('ERROR: ', err));
}

