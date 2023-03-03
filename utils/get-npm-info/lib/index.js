'use strict';
const semver = require('semver');
const urlJoin = require('url-join');
const axios = require('axios');

module.exports = { getNpmInfo, getNpmVersions, getLatestPkgVersion };

// 获取npm info
function getNpmInfo(pkgName, registry) {
  if (!pkgName) return null;
  const registryUrl = registry || getDefaultRegistry();
  const npmInfoUrl = urlJoin(registryUrl, pkgName);

  return axios
    .get(npmInfoUrl)
    .then((res) => {
      if (res.status === 200) {
        return res.data;
      }
      return null;
    })
    .catch((err) => {
      return Promise.reject(err);
    });
}

// 获取npm versions
async function getNpmVersions(pkgName, registry) {
  const data = await getNpmInfo(pkgName);
  if (data) {
    return Object.keys(data.versions);
  } else {
    return [];
  }
}

// 获取最新的版本
async function getLatestPkgVersion(basePkgVersion, pkgName, registry) {
  const versions = await getNpmVersions(pkgName);
  const gtCurVersions = getSemverPkgVersion(basePkgVersion, versions);

  if (gtCurVersions && gtCurVersions.length > 0) {
    return gtCurVersions[0];
  } else {
    return null;
  }
}

function getSemverPkgVersion(basePkgVersion, versions) {
  return versions
    .filter((version) => semver.satisfies(version, `>${basePkgVersion}`))
    .sort((a, b) => semver.gt(b, a));
}
function getDefaultRegistry(isOriginal = false) {
  return isOriginal
    ? 'https://registry.npmjs.org/'
    : 'https://registry.npmmirror.com/';
}
