# Gitlab tag trigger

### Prerequisites


```
node --version >=v4.8.7
```

### Installing

```
npm install -g gitlab-tag-trigger
```
View [gitlab-tag-trigger](https://www.npmjs.com/package/gitlab-tag-trigger) from npm

## Usage

Simple node command

```
gitlab-tag-trigger [args]

```
For update package.json, use with args:
```
-l [name of library]
-v [name of tag to update]
-p [list of project id will be update , separate by comma]
-t [token from gitlab]
-m [true or false - is auto merge into master]
-a [assignee_id - user assigne for merge request]
```

Example:
```
gitlab-tag-trigger -l lib-test-ci -v v1.3.3 -p 5265594,5297794 -t 11mHNS3Fzb4rvhy2sKyk -m true -a 192301
```

For update file, use with args:
```
-i [source file path] 
-o [destination file path] 
-o [source project ID] 
-u [list of project id will be update , separate by comma] 
-t [token from gitlab] 
-m [true or false - is auto merge into master]
-a [assignee_id - user assigne for merge request]
```
Example:
```
Example: gitlab-tag-trigger -i lib/test.js -o lib/test.js -s 5265616 -u 5265594 -t 11mHNS3Fzb4rvhy2sKyk  -m true -a 192301
```

## Built With

* [nodejs](https://nodejs.org) - NodeJS
* [axios](https://github.com/axios/axios) - Promise based HTTP client for the browser and node.js.

## Authors

* **Luu Ninh**
