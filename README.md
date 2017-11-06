
react-native-fabric-crashlytics
===============================

Reports javascript exceptions in React Native to the Crashlytics server, using the react-native-fabric library.

Dependencies
-----

You need to install react-native-fs and link it to your main project to run this:

```
npm install -S react-native-fs
react-native link react-native-fs
```

Setup iOS
-----

On your iOS project select the right target scheme and then go to "Build Phases" => "Bundle React Native code and images" and replace the shell code by this:

```
export NODE_BINARY=node
if [ "${CONFIGURATION}" = "Release" ]
then ../node_modules/react-native-fabric-crashlytics/release-with-sourcemap.sh
else ../node_modules/react-native/scripts/react-native-xcode.sh
fi
```

Create an empty file named **main.jsbundle.map** on "PATH_TO_YOUR_PROJECT/ios", drag and drop it to the project navigator  just below the "main.jsbundle" file on XCode and, on the popup that appears, uncheck all the targets.
Once that's done, delete the empty file from the folder (but keep the reference on the project)

Setup Android
-----

Go to the file "PATH_TO_YOUR_PROJECT/android/app/build.gradle" and change `project.ext.react` to have `extraPackagerArgs` or, if you don't have `project.ext.react`, create it like below:

```
project.ext.react = [
  extraPackagerArgs: [ "--sourcemap-output", "$buildDir/intermediates/assets/release/index.android.bundle.map" ]
]
```

Usage
-----

To use, add this code to your index.ios.js and index.android.js (or some library included by both).

```
// Already assumes that Fabric is initialized/configured properly in the iOS and Android app startup code.
import { Platform } from 'react-native'
import crashlytics from 'react-native-fabric-crashlytics';
crashlytics.init(Platform.OS === 'ios' ? 'main.jsbundle.map' : 'index.android.bundle.map')
```
