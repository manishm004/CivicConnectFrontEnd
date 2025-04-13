const { getDefaultConfig } = require('expo/metro-config');

module.exports = (async () => {
  const defaultConfig = await getDefaultConfig(__dirname);

  defaultConfig.resolver = {
    ...defaultConfig.resolver,
    sourceExts: [...defaultConfig.resolver.sourceExts, 'cjs', 'mjs'],  // Merge default extensions with new ones
    assetExts: [...defaultConfig.resolver.assetExts, 'glb', 'gltf', 'png', 'jpg', 'json'], // Merge asset extensions
  };

  return defaultConfig;
})();
