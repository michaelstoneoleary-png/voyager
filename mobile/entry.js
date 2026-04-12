// Custom entry point — installs global error handler BEFORE expo-router
// loads any route files, so we can catch the startup JS crash.
// Remove this file once the crash is diagnosed and fixed.

if (!__DEV__ && global.ErrorUtils) {
  global.ErrorUtils.setGlobalHandler(function (error, isFatal) {
    // We can't import Alert at module level, so require it lazily
    try {
      var Alert = require('react-native').Alert;
      var msg = (error && error.message) ? error.message : 'Unknown error';
      var stack = (error && error.stack) ? String(error.stack).slice(0, 800) : '';
      Alert.alert(
        isFatal ? 'Fatal JS Error' : 'JS Error',
        msg + '\n\n' + stack,
        [{ text: 'OK' }]
      );
    } catch (e) {
      // If Alert itself fails, nothing we can do
    }
  });
}

require('expo-router/entry');
