const pkgDir = require('pkg-dir').sync;
const path = require('path');
const { isObject } = require('@cc-cli-dev/utils');
const formatPath = require('@cc-cli-dev/format-path');
const pathExists = require('path-exists').sync;
const npminstall = require('npminstall');
const fse = require('fs-extra');

const {
  getDefaultRegistry,
  getNpmLatestVersion,
} = require('@cc-cli-dev/get-npm-info');

class Package {
  constructor(options) {
    if (!options) {
      throw new Error('请输入配置');
    }

    if (!isObject(options)) {
      throw new Error('Package类需要传入对象类型');
    }

    this.targetPath = options.targetPath;
    this.storeDir = options.storeDir;
    this.packageName = options.packageName;
    this.packageVersion = options.packageVersion;
    this.cachePackageNamePrefix = this.packageName.replace('/', '_');
  }

  async prepare() {
    if (this.storeDir && !pathExists(this.storeDir)) {
      fse.mkdirpSync(this.storeDir);
    }

    if (this.packageVersion === 'latest') {
      this.packageVersion = await getNpmLatestVersion(this.packageName);
    }
  }

  get cachePackagePath() {
    return path.resolve(
      this.storeDir,
      `_${this.cachePackageNamePrefix}@${this.packageVersion}@${this.packageName}`,
    );
  }

  getSpecificCachePackagePath(pkgVersion) {
    return path.resolve(
      this.storeDir,
      `_${this.cachePackageNamePrefix}@${pkgVersion}@${this.packageName}`,
    );
  }

  // package是否存在
  async exists() {
    if (this.storeDir) {
      // 处理缓存
      await this.prepare();
      return pathExists(this.cachePackagePath);
    } else {
      return pathExists(this.targetPath);
    }
  }

  // 安装package
  async install() {
    try {
      await this.prepare();
      await npminstall({
        root: this.targetPath,
        storeDir: this.storeDir,
        registry: getDefaultRegistry(),
        pkgs: [
          {
            name: this.packageName,
            version: this.packageVersion,
          },
        ],
      });
    } catch (err) {
      console.error(err);
    }
  }

  // 更新package
  async update() {
    await this.prepare();
    // 获取最新的npm模块版本号
    const latestPkgVersion = await getNpmLatestVersion(this.packageName);
    // 查看缓存版本路径
    const latestPackagePath =
      this.getSpecificCachePackagePath(latestPkgVersion);
    // 判断本地缓存路径是否存在
    if (!pathExists(latestPackagePath)) {
      await npminstall({
        root: this.targetPath,
        storeDir: this.storeDir,
        registry: getDefaultRegistry(),
        pkgs: [
          {
            name: this.packageName,
            version: latestPkgVersion,
          },
        ],
      });
      this.packageVersion = latestPkgVersion;
    }
  }

  // 获取入口文件路径
  getRootFilePath() {
    function _getRootFilePath(filePath) {
      const dir = pkgDir(filePath);
      if (dir) {
        const packageFile = require(path.resolve(dir, './package.json'));
        if (packageFile && packageFile.main) {
          return formatPath(path.resolve(dir, packageFile.main));
        }
      }
      return null;
    }
    if (this.storeDir) {
      return _getRootFilePath(this.cachePackagePath);
    } else {
      return _getRootFilePath(this.targetPath);
    }
  }
}

module.exports = Package;
