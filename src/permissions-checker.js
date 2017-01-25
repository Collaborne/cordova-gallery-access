'use strict';

/**
 * Helper module to ensure that certain permissions are granted by the user.
 * This requires (cordova-plugin-android-permission)[https://github.com/NeoLSN/cordova-plugin-android-permission]
 * to be installed for Android 6 permission checks.
 */

const Permission = {
	GET_ALBUMS: 'get-album'
}

/**
 * Ensure that the user granted a specific permission.
 * @param  {string} permission
 *         Permission that should be granted
 * @return {Promise}
 *         Resolves if the permission was granted. Rejects if the permission
 *         was not granted.
 */
function ensurePermission(permission) {
	if (!window.cordova || !window.cordova.plugins || !window.cordova.plugins.permissions) {
		// Assume the permission is there if not Android 6 permission system
		Promise.resolve();
	}

	let devicePermission;
	switch (permission) {
		case Permission.GET_ALBUMS:
			devicePermission = window.cordova.plugins.permissions.READ_EXTERNAL_STORAGE;
			break;
		default:
			throw new Error(`Unsupported permission ${permission}.`);
	}

	return hasPermission(devicePermission).then(status => {
		if (status.hasPermission) {
			return true;
		}

		return requestPermission(devicePermission);
	});
}

function hasPermission(permission) {
	return new Promise((resolve, reject) => {
		window.cordova.plugins.permissions.hasPermission(
			permission,
			status => resolve(status),
			e => reject(e)
		);
	});
}

function requestPermission(permission) {
	return new Promise((resolve, reject) => {
		window.cordova.plugins.permissions.requestPermission(
			permission,
			status => {
				if (status.hasPermission) {
					resolve(status);
				} else {
					reject(status)
				}
			},
			e => reject(e)
		);
	});
}

module.exports = {
	ensurePermission,
	Permission,
};
