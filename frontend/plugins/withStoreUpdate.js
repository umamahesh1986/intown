const { withAppBuildGradle, withMainApplication, withDangerousMod, withXcodeProject, IOSConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withStoreUpdate(config) {
  config = withAppBuildGradle(config, config => {
    const dependency = 'implementation("com.google.android.play:app-update:2.1.0")';
    if (!config.modResults.contents.includes(dependency)) config.modResults.contents = config.modResults.contents.replace('dependencies {', `dependencies {\n    ${dependency}`);
    return config;
  });
  config = withMainApplication(config, config => {
    if (!config.modResults.contents.includes('add(StoreUpdatePackage())')) config.modResults.contents = config.modResults.contents.replace('PackageList(this).packages.apply {', 'PackageList(this).packages.apply {\n              add(StoreUpdatePackage())');
    return config;
  });
  config = withDangerousMod(config, ['android', async config => {
    const packageName = config.android?.package;
    if (!packageName) throw new Error('Android package is required for the store update module.');
    const directory = path.join(config.modRequest.platformProjectRoot, 'app/src/main/java', ...packageName.split('.'));
    fs.mkdirSync(directory, { recursive: true });
    for (const file of ['StoreUpdateModule.kt', 'StoreUpdatePackage.kt']) {
      const content = fs.readFileSync(path.join(__dirname, 'native', file), 'utf8').replace('package com.intown.andriod', `package ${packageName}`);
      fs.writeFileSync(path.join(directory, file), content);
    }
    return config;
  }]);
  config = withDangerousMod(config, ['ios', async config => {
    const name = IOSConfig.XcodeUtils.getProjectName(config.modRequest.projectRoot);
    const directory = path.join(config.modRequest.platformProjectRoot, name);
    fs.mkdirSync(directory, { recursive: true });
    fs.copyFileSync(path.join(__dirname, 'native', 'Storefront.m'), path.join(directory, 'Storefront.m'));
    return config;
  }]);
  return withXcodeProject(config, config => {
    const project = config.modResults;
    const name = IOSConfig.XcodeUtils.getProjectName(config.modRequest.projectRoot);
    const group = project.findPBXGroupKey({ name });
    if (!group) throw new Error('Could not find the iOS app group for the store update module.');
    if (!project.hasFile(`${name}/Storefront.m`)) project.addSourceFile(`${name}/Storefront.m`, {}, group);
    if (!project.hasFile('StoreKit.framework')) project.addFramework('StoreKit.framework');
    for (const file of Object.values(project.pbxFileReferenceSection())) {
      if (file && typeof file === 'object') {
        if (file.explicitFileType === undefined || file.explicitFileType === 'undefined') delete file.explicitFileType;
        if (file.fileEncoding === undefined || file.fileEncoding === 'undefined') delete file.fileEncoding;
      }
    }
    return config;
  });
};
