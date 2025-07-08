// Learn more https://docs.expo.io/guides/customizing-metro
const {getDefaultConfig} = require('expo/metro-config');

module.exports = (() => {
  const defaultConfig = getDefaultConfig(__dirname);
  const {assetExts} = defaultConfig.resolver;
  return {
    ...defaultConfig,
    resolver: {
      ...defaultConfig.resolver,
      // Add bin to assetExts
      assetExts: [...assetExts, 'bin'],
    },
  };
})();
