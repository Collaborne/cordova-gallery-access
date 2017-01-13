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
				throw new Error(`Album of type ${albumType} is unknown. Available albums: ${albums}`);
			}

			return getMedia(album);
		})
		.then(items => {
			// Limit number of items for which the data is looked up (because
			// it's expensive)
			const limitedItems = items.slice(0, count);

			// Enrich items with their thumbnail
			const promises = limitedItems
				.map(item => getMediaThumbnail(item)
					.then(itemWithThumbnail => Object.assign(itemWithThumbnail, {
						source: 'device-gallery'
					})));

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
 * Checks if all required libaries are available to load galley items. Use this
 * check to verify if the app runs in a Cordova environment.
 * @return {Boolean} True if items can be loaded from the gallery
 */
const isSupported = () => Boolean(window.galleryAPI);

module.exports = {
	load,
	getHQImageData,
	isSupported,
};
