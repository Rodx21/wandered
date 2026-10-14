const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Support CSV assets for airports data
config.resolver.assetExts.push('csv');

module.exports = withNativeWind(config, { input: './global.css' });
