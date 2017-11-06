'use strict'

import StackTrace from 'stacktrace-js'
import {initSourceMaps, getStackTrace} from 'react-native-source-maps'
import { Crashlytics } from 'react-native-fabric'
var assign = require('lodash.assign')

function init (sourcemapName = null) {
  if (__DEV__) {
    // Don't send exceptions from __DEV__, it's way too noisy!
    // Live reloading and hot reloading in particular lead to tons of noise...
    return
  }

  var originalHandler = global.ErrorUtils.getGlobalHandler()
  if (sourcemapName) {
    initSourceMaps({sourceMapBundle: sourcemapName})
  }
  async function errorHandler (e, isFatal) {
    let jsParsed = false
    // map the JS stacktrace using the sourcemap file given on init
    let trace = null
    if (sourcemapName) {
      try {
        trace = await getStackTrace(e)
      } catch (error) {
        // ignore and use the normal stack on the error
      }
    }
    if (!trace) {
      // record the exception with the info that we have
      let x = await StackTrace.fromError(e, {offline: true})
      trace = x.map((row) => (assign({}, row, {
        fileName: `${row.fileName}:${row.lineNumber || 0}:${row.columnNumber || 0}`
      })))
    }
    if (trace) {
      e.stack = trace
      Crashlytics.recordCustomExceptionName(e.message, e.message, e.stack)
      jsParsed = true
    }
    // And then re-throw the exception with the original handler
    if (originalHandler) {
      // If we want the App to actually exit on a fatal crash, we need to call the originalHandler with true as the 2nd arg
      // This will create a Fatal error with Non JS stacktrace but still, the JS trace will appear as Non fatal before
      // We also delay it a bit to give time for the custom exception to be sent
      setTimeout(() => {
        if (isFatal && jsParsed) {
          originalHandler(new Error('JS crash happened. Check Fabric dashboard for non fatal errors'), true)
        } else {
          originalHandler(e, isFatal)
        }
      }, 1000)
    }
  }
  global.ErrorUtils.setGlobalHandler(errorHandler)
}

module.exports = {
  init
}
