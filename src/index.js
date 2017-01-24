'use strict';

/**
 * Loads the most recent items from an album
 * @param  {String} [albumType='PHAssetCollectionSubtypeSmartAlbumUserLibrary']
 *         Album that should be loaded. Default is "Camera Roll"
 * @param  {Number} [count=5]
 *         Maxmimum number of returned items
 * @return {Promise}
 *         Promise that will return all items once it resolves
 */
const load = ({ albumType = 'PHAssetCollectionSubtypeSmartAlbumUserLibrary', count = 5 } = {}) => {
	if (!window.galleryAPI) {
		throw new Error('Gallery API is not available. Add https://github.com/SuryaL/cordova-gallery-api.git to your config.xml.');
	}

	return getAlbums()
		.then(albums => {
			const album = albums.find(album => album.type === albumType);
			if (!album) {
				throw new Error(`Album of type ${albumType} is unknown. Available albums: ${JSON.stringify(albums)}`);
			}

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
};

const getAlbums = () =>
	new Promise((resolve, reject) => {
		window.galleryAPI.getAlbums(
			albums => resolve(albums),
			e => reject(`Failed to get albums: ${e}`)
		);
	});
const getMedia = (album) =>
	new Promise((resolve, reject) => {
		window.galleryAPI.getMedia(
			album,
			items => resolve(items),
			e => reject(`Failed to load items for album ${album.id}: ${e}`)
		);
	});
const getMediaThumbnail = (item) =>
	new Promise((resolve, reject) => {
		window.galleryAPI.getMediaThumbnail(
			item,
			enrichedItem => resolve(enrichedItem),
			e => reject(`Failed to load thumbnail for item ${item.id}: ${e}`)
		);
	});

/**
 * Gets the filepath to the high quality version of the mediaitem
 * @param  {Object} item Media item for which the HQ version should be looked up
 * @return {String}      Path to the HQ version of the mediaitem
 */
const getHQImageData = (item) =>
	new Promise((resolve, reject) => {
		window.galleryAPI.getHQImageData(
			item,
			hqFilePath => resolve(hqFilePath),
			e => reject(`Failed to load HQ image data for item ${item.id}: ${e}`)
		);
	});

/**
 * Gets a reference to a local file
 * @param  {String} filePath Path of the to be loaded file
 * @return {Object}
 */
const getFile = (filePath) => {
	return resolveLocalFileSystemURL(filePath)
		.then(fileEntry => enrichFileSize(fileEntry));
};
/**
 * Resolve the fileEntry for a path
 * @param  {String} filePath Path
 * @return {FileEntry}       Resolved fileEntry
 */
const resolveLocalFileSystemURL = (filePath) =>
	new Promise((resolve, reject) => {
		const path = `file:///private/${filePath}`;
		window.resolveLocalFileSystemURL(
			path,
			fileEntry => resolve(fileEntry),
			e => reject(`Failed to resolve URL for path ${filePath}: ${e}`)
		);
	});
/**
 * Adds the size to the file entry by resolving the file entry
 * @param  {FileEntry} fileEntry File entry to be resolved
 * @return {FileEntry}           File entry with the size field
 */
const enrichFileSize = (fileEntry) =>
	new Promise((resolve, reject) => {
		fileEntry.file(
			file => {
				fileEntry.size = file.size;
				resolve(fileEntry);
			},
			e => reject(`Failed to resolve file entry ${fileEntry}: ${JSON.stringify(e)}`)
		);
	});

/**
 * Removes the prefix from a string. Returns the same string if it doesn't
 * start with the prefix.
 * @param  {String} str    String from which the prefix should be stripped
 * @param  {String} prefix Prefix to be removed
 * @return {String}
 */
const stripPrefix = (str, prefix) =>
	str.startsWith(prefix) ? str.substr(prefix.length) : str;

/**
 * Checks if all required libaries are available to load galley items. Use this
 * check to verify if the app runs in a Cordova environment.
 * @return {Boolean} True if items can be loaded from the gallery
 */
const isSupported = () => Boolean(window.galleryAPI);

module.exports = {
	load,
	getHQImageData,
	getFile,
	isSupported,
};
