module.exports = core;

const semver = require('semver');
const colors = require('colors/safe');
const log = require('@cc-cli-dev/log');
const path = require('path');
const userHome = require('user-home');
const pathExists = require('path-exists');
const commander = require('commander');

const pkgFile = require('../package.json');
const { LOWER_NODE_VERSION, DEFAULT_CLI_HOME } = require('./constant');

const program = new commander.Command();

async function core() {
  try {
    checkPkgVersion(pkgFile);
    checkNodeVersion();
    checkRoot();
    checkUserHome();
    // checkInputArgs();
    checkEnv();
    await checkUserPkgVersion();
    registerCommand();
  } catch (e) {
    log.error(e.message);
  }
}

// 注册命令
function registerCommand() {
  program
    .name(Object.keys(pkgFile.bin)[0])
    .usage('<command> [options]')
    .version(pkgFile.name)
    .option('-d, --debug', '是否开启调试模式', false);

  program.on('option:debug', () => {
    checkArgs(program.opts());
    log.verbose('test');
  });

  program.on('command:*', (obj) => {
    const availableCommand = program.commands.map((cmd) => cmd.name());
    log.error('error', `未知的命令 <${colors.red(obj[0])}>`);
    if (availableCommand.length > 0) {
      console.log('可用的命令', availableCommand.join(','));
    }
  });

  program.parse(process.argv);

  if (program.args && program.args.length < 1) {
    program.outputHelp();
    console.log();
  }
}

// 检查环境
async function checkEnv() {
  const envPath = path.resolve(userHome, '.env');
  if (await pathExists(envPath)) {
    require('dotenv').config({
      path: envPath,
    });

    createDefaultConfig();
    // log.verbose('环境变量', envConfig, process.env.CLI_HOME);
  }
}

function createDefaultConfig() {
  const cliConfig = new Map();
  cliConfig.set('home', 'userHome');

  process.env.CLI_HOME
    ? cliConfig.set('cliHome', path.join(userHome, process.env.CLI_HOME))
    : cliConfig.set('cliHome', path.join(userHome, DEFAULT_CLI_HOME));

  process.env.CLI_HOME = cliConfig.get('cliHome');
}

// 检查 Node 版本
function checkNodeVersion() {
  const usrNodeVersion = process.version;
  const lowerNodeVersion = LOWER_NODE_VERSION;
  if (!semver.gte(usrNodeVersion, lowerNodeVersion)) {
    throw new Error(
      colors.red(
        `cc-cli 需要安装 v${lowerNodeVersion} 以上版本的 Node.js 环境`,
      ),
    );
  }
}

// 检查 Package 版本
function checkPkgVersion(pkgFile) {
  log.info('version', pkgFile.version);
}

// 检查 root 账号
function checkRoot() {
  const rootCheck = require('root-check');

  rootCheck();
}

// 检查 用户主目录
async function checkUserHome() {
  if (!userHome || !(await pathExists(userHome))) {
    throw new Error(colors.red('当前登录用户主目录不存在！'));
  }
}

// 检查用户输入参数
function checkInputArgs() {
  const minimist = require('minimist');
  const args = minimist(process.argv.slice(2));
  checkArgs(args);
}

function checkArgs(args) {
  process.env.LOG_LEVEL = args.debug ? 'verbose' : 'info';
  log.level = process.env.LOG_LEVEL;
}

// 检查用户版本
async function checkUserPkgVersion() {
  const { version: pkgVersion, name: pkgName } = pkgFile;

  const { getLatestPkgVersion } = require('@cc-cli-dev/get-npm-info');
  const latestVersion = await getLatestPkgVersion(pkgVersion, pkgName);

  if (latestVersion && semver.gt(latestVersion, pkgVersion)) {
    log.warn(
      colors.yellow(`请手动更新 ${pkgName}，当前版本：${pkgVersion}，最新版本：${latestVersion}
                更新命令： npm install -g ${pkgName}`),
    );
  }
}
