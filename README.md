# cordova-gallery-access [![Build Status](https://travis-ci.org/Collaborne/cordova-gallery-access.svg)](https://travis-ci.org/Collaborne/cordova-gallery-access)

Reads photos & videos from an album (e.g. Camera Roll)

Tested for iOS and Android. Likely works also for other platforms (but not tested).

This [blog post](https://medium.com/collaborne-engineering/my-cordova-nightmares-accessing-photos-from-the-phones-gallery-7528a0860555#.jq0oqswb8) explains the challenges that this library addresses and the approach how it solves them.

The module can automatically check if the user granted the required permission.
For Android 6 permission checks this requires to add [cordova-plugin-android-permission](https://github.com/NeoLSN/cordova-plugin-android-permission) to the Cordova application.


## Install

~~~~
npm install cordova-gallery-access --save
~~~~

The library uses the Cordova plugin [cordova-gallery-api](https://github.com/SuryaL/cordova-gallery-api.git),
which you therefore need to install to your Cordova application:

```bash
cordova plugin add https://github.com/SuryaL/cordova-gallery-api.git --save
```

## Usage

This examples shows the recently taken photos from the Camera Roll:

```javascript

const cordovaGallery = require('cordova-gallery-access');

cordovaGallery.load().then(items => {
    let html = '';
    items.forEach(item => {
        html += `<img src="file://${item.thumbnail}"></img>`;
    });

    document.getElementById("content").innerHTML = html;
}).catch(e => console.error(e));
```

The `load` method supports optional parameters:

```javascript
Collaborne.CordovaGallery.load({
    albumType: 'PHAssetCollectionSubtypeSmartAlbumUserLibrary',
    count: 10
});
```

Supported options:

| Option        | Description                                          |
| ------------- | ---------------------------------------------------- |
| **albumType** | Type of the album from which the items will be taken |
| **count**     | Maximal number of items that will be returned        |
