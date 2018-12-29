/**
 * Helper module to ensure that certain permissions are granted by the user.
 * This requires (cordova-plugin-android-permission)[https://github.com/NeoLSN/cordova-plugin-android-permission]
 * to be installed for Android 6 permission checks.
 */

type Permission = 'get-album';

interface Status {
	hasPermission: boolean;
}

/**
 * Ensure that the user granted a specific permission.
 * @param permission Permission that should be granted
 * @return Resolves if the permission was granted. Rejects if the permission was not granted.
 */
export function ensurePermission(permission: Permission): Promise<boolean> {
	if (!(window as any).cordova || !(window as any).cordova.plugins || !(window as any).cordova.plugins.permissions) {
		// Assume the permission is there if not Android 6 permission system
		return Promise.resolve(true);
	}

	let devicePermission: string;
	switch (permission) {
		case 'get-album':
			devicePermission = (window as any).cordova.plugins.permissions.READ_EXTERNAL_STORAGE;
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

function hasPermission(permission: string): Promise<Status> {
	return new Promise((resolve, reject) => {
		(window as any).cordova.plugins.permissions.hasPermission(
			permission,
			(status: Status) => resolve(status),
			(e: Error) => reject(e),
		);
	});
}

function requestPermission(permission: string): Promise<boolean> {
	return new Promise((resolve, reject) => {
		(window as any).cordova.plugins.permissions.requestPermission(
			permission,
			(status: Status) => {
				if (status.hasPermission) {
					resolve(true);
				} else {
					reject(false);
				}
			},
			(e: Error) => reject(e),
		);
	});
}
