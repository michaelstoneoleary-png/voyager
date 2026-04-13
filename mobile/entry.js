// Custom entry point — installs global error handler BEFORE expo-router
// loads any route files, so we can catch the startup JS crash.
// Remove this file once the crash is diagnosed and fixed.

// Step log — collected and shown in error alerts
global.__log = [];
function _log(msg) { global.__log.push(msg); }

_log('1:entry.js start');

if (!__DEV__ && global.ErrorUtils) {
  _log('2:installing ErrorUtils handler');
  global.ErrorUtils.setGlobalHandler(function (error, isFatal) {
    try {
      var Alert = require('react-native').Alert;
      var msg = (error && error.message) ? error.message : 'Unknown error';
      var logStr = (global.__log || []).join(' | ');
      var stack = (error && error.stack) ? String(error.stack).slice(0, 500) : '';
      Alert.alert(
        isFatal ? 'Fatal JS Error' : 'JS Error',
        'Steps: ' + logStr + '\n\nError: ' + msg + '\n\n' + stack,
        [{ text: 'OK' }]
      );
    } catch (e) {
      // nothing we can do
    }
  });
  _log('3:handler installed');
}

_log('4:requiring expo-router/entry');
try {
  require('expo-router/entry');
  _log('5:expo-router/entry loaded OK');
} catch (e) {
  _log('5:expo-router/entry THREW: ' + String(e && e.message ? e.message : e));
  if (!__DEV__) {
    try {
      var Alert = require('react-native').Alert;
      Alert.alert(
        'Module Load Error',
        'Steps: ' + (global.__log || []).join(' | ') + '\n\nError: ' + String(e && e.message ? e.message : e) + '\n\n' + String(e && e.stack ? e.stack : '').slice(0, 500),
        [{ text: 'OK' }]
      );
    } catch (_) {}
  }
}
