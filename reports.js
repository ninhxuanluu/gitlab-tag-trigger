#!/usr/bin/env node
const axios = require('axios');
const moment = require('moment');
const get = require('lodash').get;
const minimist = require('minimist');

const ids = [
  1281929,// verik-iot
  5004286,// alexa-homeskill
  4449540,// gaction-smarthome
  4836986,// customskill
  1823561,// venus-customskill-intergration
  4781483,// gaction-customs
  3686842,// Wowza module
  3171321,// devices
  2248416,// venus-devices
  2285501,// fota-server
  1711596,// venus-dashboard-user
  // 0,// Benchmark new mqtt broker
  6378989,// zino-api
  6368238,// zinno-website
  6333313,// messenger-bot
];
console.log(ids.join(','));
/**
 * post gitlab
 * @param path
 * @param token
 * @param data
 * @returns {*}
 */
const postGitlab = (path, token, data) => axios({
  method: 'POST',
  url: `https://gitlab.com/api/v4${path}`,
  headers: {
    'Content-Type': 'application/json',
    'PRIVATE-TOKEN': token
  },
  data,
  responseType: 'json'
}).then(rs => rs.data).catch(err => console.log('postGitlab err :', err));

/**
 * get gitlab
 * @param path
 * @param token
 * @returns {*}
 */
const getGitlab = (path, token) => axios({
  method: 'GET',
  url: `https://gitlab.com/api/v4${path}`,
  headers: {
    'Content-Type': 'application/json',
    'PRIVATE-TOKEN': token
  },
  responseType: 'json'
}).then(rs => rs.data).catch(err => console.log('getGitlab err :', err));

const limitPromise = async (arr, limit, proms, ...args) => {
  let start = 0;
  while (start <= arr.length) {
    const end = start + limit;
    const tmpArr = arr.slice(start, end);
    for (let i = 0; i < tmpArr.length; i += 1) {
      const currentObject = tmpArr[i];
      await proms(currentObject, ...args);
    }
    start += limit;
  }
};

let i = 0;
const reportProject = async (projectId, token, from, to) => {
  const projectDetails = await getGitlab(`/projects/${projectId}`, token);
  console.log(`${i += 1}. ${projectDetails.name}`);
  const issues = await getGitlab(`/projects/${projectId}/issues?created_after=${from}&created_before=${to}`, token);
  if (issues.length === 0) {
    console.log(`\t No changes.`);
  }
  issues.map((issue, index2) => {
    console.log(`\t${index2 + 1}. ${get(issue, 'title', '')} - ${get(issue.assignees[0], 'name', '')} #${get(issue, 'iid', '')}`);
  });
  return projectDetails;
};
let j = 0;

const reportProjectWithState = async (projectId, token, status, from, to) => {
  const projectDetails = await getGitlab(`/projects/${projectId}`, token);
  console.log(`${j += 1}. ${projectDetails.name}`);
  const issues = await getGitlab(`/projects/${projectId}/issues?state=${status}&created_after=${from}&created_before=${to}`, token);
  if (issues.length === 0) {
    console.log(`\t No changes.`);
  }
  issues.map((issue, index2) => {
    console.log(`\t${index2 + 1}. ${get(issue, 'title', '')} - ${get(issue.assignees[0], 'name', '')} #${get(issue, 'iid', '')}`);
  });
  return projectDetails;
};
const weeklyReport = async (projectIdList, token, from, to) => {
  console.log('=========================== Planing ===================================');
  await limitPromise(projectIdList, 1, reportProject, token, from, to);
  console.log('=========================== Done ======================================');
  await limitPromise(projectIdList, 1, reportProjectWithState, token, 'closed', from, to);
};

const parseArgs = (args) => {
  const opts = minimist(args);
  if (!opts.p || !opts.w || !opts.t) {
    console.error(`
Gitlab Weekly Report Generator v1.0
  Command error for generate report, use with args:
  -p [list of project id will be report , separate by comma]
  -w [weekday]
  -t [token from gitlab]
  Example: gitlab-report-generator -p 5265616,5265594 -w 20 -t 11mHNS3Fzb4rvhy2sKyk
`);
    process.exit(1);
  }
  return opts;
};
const opts = parseArgs(process.argv.slice(2));
const token = opts.t;
const week = opts.w;
const projectIdList = opts.p.toString().split(',');

const from = moment().utcOffset(0).week(week).weekday(1).set({
  hour: 0,
  minute: 0,
  second: 0,
  millisecond: 0
}).toISOString();
const to = moment().utcOffset(0).week(week).weekday(7).set({
  hour: 23,
  minute: 59,
  second: 59,
  millisecond: 0
}).toISOString();
console.log(`GENERATING REPORT START : Week: ${week} from: ${from} to: ${to}`);
weeklyReport(projectIdList, token, from, to).then(() => console.log('GENERATING REPORT DONE !'))
  .catch(err => console.log('weeklyReport err :', err));
// node reports.js -w 20 -p 1281929,5004286,4449540,4836986,1823561,4781483,3686842,3171321,2248416,2285501,1711596,6378989,6368238,6333313 -t EMXyKW-KxtAqNG-hJDGS
