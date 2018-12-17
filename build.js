const packageConfig = require('./package.json')
const semver = require('semver')
const _ = require('lodash')


// console.dir(process)
// console.dir(process.argv)
// console.dir(process.version)


const argv = process.argv

const versionRequirements = [
  {
    name: 'Node',
    currentVersion: semver.clean(process.version),
    versionRequirement: packageConfig.engines.node
  }
]

for (let versionRequirement of versionRequirements) {
  if (!semver.satisfies(versionRequirement.currentVersion, versionRequirement.versionRequirement)) {
    console.warn(`${versionRequirement.name} Version Should ${versionRequirement.versionRequirement}`)
  }
}

// console.log(argv)

let [command, commandFile, ...args] = argv

let result = split(args)
console.log(result)

/**
 * 格式化进程参数
 * @param args --key=value
 */
function split(args) {
  return _.fromPairs(args.map(item => {
    return _.trim(item, '--').split('=')
  }))
}
