const Package = require('@cc-cli-dev/package');
const path = require('path');
const log = require('@cc-cli-dev/log');

const filePath = {
  init: '@imooc-cli/init',
};

const CACHE_DIR = 'dependencies';

async function exec() {
  let targetPath = process.env.CLI_TARGET_PATH;
  const homePath = process.env.CLI_HOME_PATH;
  let storeDir = '';
  let pkg;
  const commandObject = arguments[arguments.length - 1];
  const packageName = filePath[commandObject.name()];
  const packageVersion = 'latest';

  if (!targetPath) {
    targetPath = path.resolve(homePath, CACHE_DIR);
    storeDir = path.resolve(targetPath, 'node_modules');
    log.verbose('targetPath', targetPath);
    log.verbose('storeDir', storeDir);

    pkg = new Package({
      targetPath,
      storeDir,
      packageName,
      packageVersion,
    });

    if (await pkg.exists()) {
      // 更新package
      await pkg.update();
    } else {
      // 安装package
      await pkg.install();
    }
  } else {
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion,
    });
  }

  const rootFile = pkg.getRootFilePath();

  if (rootFile) {
    require(rootFile).apply(null, arguments);
  }
}

module.exports = exec;
