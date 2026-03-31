const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];
config.resolver.unstable_enablePackageExports = false;

// EAS Build 以外（Expo Go / ローカル開発）では広告モジュールをモックに差し替え
if (!process.env.EAS_BUILD) {
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === 'react-native-google-mobile-ads') {
      return { filePath: path.resolve(__dirname, 'src/lib/adsMock.js'), type: 'sourceFile' };
    }
    if (moduleName === 'expo-notifications') {
      return { filePath: path.resolve(__dirname, 'src/lib/notificationsMock.js'), type: 'sourceFile' };
    }
    return context.resolveRequest(context, moduleName, platform);
  };
}

module.exports = withNativeWind(config, { input: './global.css' });
