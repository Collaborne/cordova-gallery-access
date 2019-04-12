import { ensurePermission } from './permissions-checker';

const DEFAULT_COUNT = 5;

export interface Album {
	id: string;
	title?: string;
	type?: string;
}

interface MediaItem {
	id: string;
	thumbnail: string;
}

type FileFunction = (success: (file: FileEntry) => any, error: (e: Error) => any) => any;
export interface FileEntry {
	name: string;
	size: number;
	type: string;
	file: FileFunction;
	toInternalURL: () => string;
}

interface Options {
	/** Maxmimum number of returned items */
	count?: number;
}

/**
 * Loads the most recent items from the Camera Roll
 */
function load(options: Options): Promise<MediaItem[]> {
	if (!(window as any).galleryAPI) {
		throw new Error('Gallery API is not available. Add https://github.com/SuryaL/cordova-gallery-api.git to your config.xml.');
	}

	const count = options.count || DEFAULT_COUNT;

	return ensurePermission('get-album')
		.then(() => getAlbums())
		.then(albums => {
			const album = _findCameraRollAlbum(albums);

			return getMedia(album);
		})
		.then(items => {
			// Limit number of items for which the data is looked up (because
			// it's expensive)
			const limitedItems = items.slice(0, count);

			// Enrich items with their thumbnail
			const promises = limitedItems.map(item => getMediaThumbnail(item));

			return Promise.all(promises);
		});
}

/**
 * Finds in the list of available albums the one pointing to the device camera:
 * - iOS: type is "PHAssetCollectionSubtypeSmartAlbumUserLibrary"
 * - Android: title is "Camera"
 * @param albums List of all available albums
 * @return Album representing the Camera Roll
 */
function _findCameraRollAlbum(albums: Album[]): Album {
	const isCameraRollAlbum = albums.find(album => album.type === 'PHAssetCollectionSubtypeSmartAlbumUserLibrary');
	if (isCameraRollAlbum) {
		return isCameraRollAlbum;
	}

	const androidCameraRollAlbum = albums.find(album => album.title === 'Camera');
	if (androidCameraRollAlbum) {
		return androidCameraRollAlbum;
	}

	throw new Error(`Can't find Camera Roll album. Available albums: ${JSON.stringify(albums)}`);
}

function getAlbums(): Promise<Album[]> {
	return new Promise((resolve, reject) => {
		(window as any).galleryAPI.getAlbums(
			(albums: Album[]) => resolve(albums),
			(e: Error) => reject(`Failed to get albums: ${e}`),
		);
	});
}

function getMedia(album: Album): Promise<MediaItem[]> {
	return new Promise((resolve, reject) => {
		(window as any).galleryAPI.getMedia(
			album,
			(items: MediaItem[]) => resolve(items),
			(e: Error) => reject(`Failed to load items for album ${album.id}: ${e}`),
		);
	});
}

function getMediaThumbnail(item: MediaItem): Promise<MediaItem> {
	return new Promise((resolve, reject) => {
		(window as any).galleryAPI.getMediaThumbnail(
			item,
			(enrichedItem: MediaItem) => resolve(enrichedItem),
			(e: Error) => reject(`Failed to load thumbnail for item ${item.id}: ${e}`),
		);
	});
}

/**
 * Gets the filepath to the high quality version of the mediaitem
 * @param  {Object} item Media item for which the HQ version should be looked up
 * @return Path to the HQ version of the mediaitem
 */
function getHQImageData(item: MediaItem): Promise<string> {
	return new Promise((resolve, reject) => {
		(window as any).galleryAPI.getHQImageData(
			item,
			(hqFilePath: string) => resolve(`file://${hqFilePath}`),
			(e: Error) => reject(`Failed to load HQ image data for item ${item.id}: ${e}`),
		);
	});
}

/**
 * Resolve the fileEntry for a path
 * @param filePath Path
 * @return Resolved fileEntry
 */
function resolveLocalFileSystemURL(filePath: string): Promise<FileEntry> {
	return new Promise((resolve, reject) => {
		(window as any).resolveLocalFileSystemURL(
			filePath,
			(fileEntry: FileEntry) => resolve(fileEntry),
			(e: Error) => reject(`Failed to resolve URL for path ${filePath}: ${JSON.stringify(e)}`),
		);
	});
}

/**
 * Gets a reference to a local file
 * @param filePath Path of the to be loaded file
 * @return reference to a local file
 */
function getFile(filePath: string): Promise<FileEntry> {
	return resolveLocalFileSystemURL(filePath)
		.then(fileEntry => enrichFile(fileEntry));
}

/**
 * Enriches the file entry with size and type by resolving the file entry
 * @param fileEntry File entry to be resolved
 * @return File entry with the size and type field
 */
function enrichFile(fileEntry: FileEntry): Promise<FileEntry> {
	return new Promise((resolve, reject) => {
		fileEntry.file(
			(file: FileEntry) => {
				fileEntry.name = file.name;
				fileEntry.size = file.size;
				fileEntry.type = file.type;
				resolve(fileEntry);
			},
			(e: Error) => reject(`Failed to resolve file entry ${fileEntry}: ${JSON.stringify(e)}`),
		);
	});
}

/**
 * Checks if all required libaries are available to load galley items. Use this
 * check to verify if the app runs in a Cordova environment.
 *
 * @return True if items can be loaded from the gallery
 */
function isSupported(): boolean {
	return Boolean((window as any).galleryAPI);
}

export {
	load,
	getHQImageData,
	getFile,
	isSupported,

	// Visible for testing
	_findCameraRollAlbum,
};
