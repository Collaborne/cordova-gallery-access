'use strict';

/**
 * Loads the most recent items from an album
 * @param  {String} [albumType='PHAssetCollectionSubtypeSmartAlbumUserLibrary']
 *         Album that should be loaded. Default is "Camera Roll"
 * @param  {Number} [limit=5]
 *         Maxmimum number of returned items (keep this number reasonable because loading photos is expensive)
 * @return {Promise}
 *         Promise that will return all items once it resolves
 */
const load = (albumType = 'PHAssetCollectionSubtypeSmartAlbumUserLibrary', limit = 5) => {
	if (!window.resolveLocalFileSystemURL) {
		throw new Error('This library only works within Cordova applications.');
	}
	if (!window.galleryAPI) {
		throw new Error('Gallery API is not available. Add https://github.com/SuryaL/cordova-gallery-api.git to your config.xml.');
	}

	let fileSystem;
	return _requestFileSystem(window.LocalFileSystem.TEMPORARY)
		.then(fs => {
			fileSystem = fs;

			return getAlbums();
		})
		.then(albums => {
			const cameraRoll = albums.find(album => album.type === albumType);
			return getMedia(cameraRoll);
		})
		.then(items => {
			// Limit number of items for which the data is looked up (because
			// it's expensive)
			const limitedItems = items.slice(0, limit);

			// Enrich photos by their thumbnail
			const promises = limitedItems.map(item =>
				getMediaThumbnail(item)
					.then(enrichedItem => resolveLocalFileSystemThumbnailURL(enrichedItem))
					.then(resolvedItem => _getFile(fileSystem, resolvedItem))
					.then(itemWithFile => _readAsDataURL(itemWithFile))
			);

			return Promise.all(promises);
		});
};

const getAlbums = () =>
	new Promise((resolve, reject) => {
		window.galleryAPI.getAlbums(albums => resolve(albums), e => reject(`Failed albums: ${e}`));
	});
const getMedia = (album) =>
	new Promise((resolve, reject) => {
		window.galleryAPI.getMedia(album, items => resolve(items), e => reject(`Failed loading items for album ${album.id}: ${e}`));
	});
const getMediaThumbnail = (item) =>
	new Promise((resolve, reject) => {
		window.galleryAPI.getMediaThumbnail(item, enrichedItem => resolve(enrichedItem), e => reject(`Failed to load thumbnail for item ${item.id}: ${e}`));
	});
const resolveLocalFileSystemThumbnailURL = (photo) =>
	new Promise((resolve, reject) => {
		const path = `file:///private/${photo.thumbnail}`;
		window.resolveLocalFileSystemURL(path, url => {
			const resolvedPhoto = Object.assign({}, photo, {
				url: url.toURL()
			});
			resolve(resolvedPhoto);
		}, e => reject(`Failed to resolve URL for path ${path}: ${e}`));
	});
const _requestFileSystem = (type) =>
	new Promise((resolve, reject) => {
		window.requestFileSystem(type, 0, fs => resolve(fs), e => reject(`Failed to request file system: ${e}`));
	});
const _getFile = (fs, item) =>
	new Promise((resolve, reject) => {
		const pathStrippedPrefix = item.url.substr('cdvfile://localhost/temporary'.length);
		const path = decodeURI(pathStrippedPrefix);
		fs.root.getFile(path, {}, file => {
			resolve(Object.assign({}, item, {
				file: resolve(file)
			}));
		}, e => reject(`Failed to get file ${path}: ${JSON.stringify(e)}`));
	});
const _readAsDataURL = (item) =>
	new Promise((resolve, reject) => {
		item.file(file => {
			const reader = new window.FileReader();
			reader.onloadend = function(e) {
				resolve(Object.assign({}, item, {
					dataUrl: e.target.result
				}));
			};
			reader.onerror = e => reject(`Failed to read file as data URL: ${JSON.stringify(e)}`);
			reader.readAsDataURL(file);
		}, e => reject(`Failed to retrieve file from entry: ${JSON.stringify(e)}`));
	});

module.exports = {
	load,
};
