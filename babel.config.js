module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // 'expo-router/babel' is deprecated since Expo SDK 50; the preset already
    // includes the necessary configuration.
    plugins: ['react-native-reanimated/plugin'],
  };
};
