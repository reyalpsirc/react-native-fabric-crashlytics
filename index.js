'use strict';

import { Platform } from 'react-native';
import StackTrace from 'stacktrace-js';
import {initSourceMaps, getStackTrace} from 'react-native-source-maps';
import { Crashlytics } from 'react-native-fabric';
var assign = require('lodash.assign');

function init(sourcemapName = null) {
  if (__DEV__) {
    // Don't send exceptions from __DEV__, it's way too noisy!
    // Live reloading and hot reloading in particular lead to tons of noise...
    return;
  }

  var originalHandler = global.ErrorUtils.getGlobalHandler();
  if (sourcemapName) {
    initSourceMaps({sourceMapBundle: sourcemapName});
  }
  async function errorHandler(e, isFatal) {
    if (sourcemapName) {
      // map the JS stacktrace using the sourcemap file given on init
      let jsParsed = false
      try {
        e.stack = await getStackTrace(e);
        if (e.stack) {
          Crashlytics.recordCustomExceptionName(e.message, e.message, e.stack)
          jsParsed = true
        }
      } catch (error) {
        // ignore and use the normal stack on the error
      }
      // And then re-throw the exception with the original handler
      if (originalHandler) {
        // If we want the App to actually exit on a fatal crash, we need to call the originalHandler with true as the 2nd arg
        // This will create a Fatal error with Non JS stacktrace but still, the JS trace will appear as Non fatal before
        // We also delay it a bit to give time for the custom exception to be sent
        setTimeout(() => {
          if (isFatal && jsParsed) {
            originalHandler(new Error('JS crash happened. Check Fabric dashboard for non fatal errors'), true);
          } else {
            originalHandler(e, isFatal);
          }
        }, 1000);
      }
    } else {
      // record the exception with the info that we have
      StackTrace.fromError(e, {offline: true}).then((x) => {
        Crashlytics.recordCustomExceptionName(e.message, e.message, x.map((row) => (assign({}, row, {
          fileName: `${row.fileName}:${row.lineNumber || 0}:${row.columnNumber || 0}`,
        }))))
      });
      // And then re-throw the exception with the original handler
      if (originalHandler) {
        if (Platform.OS === 'ios') {
          originalHandler(e, isFatal);
        } else {
          // On Android, throwing the original exception immediately results in the
          // recordCustomExceptionName() not finishing before the app crashes and therefore not logged
          // Add a delay to give it time to log the custom JS exception before crashing the app.
          // The user facing effect of this delay is that separate JS errors will appear as separate
          // issues in the Crashlytics dashboard.
          setTimeout(() => {
            originalHandler(e, isFatal);
          }, 500);
        }
      }
    }
  }
  global.ErrorUtils.setGlobalHandler(errorHandler);
}

module.exports = {
  init,
}
