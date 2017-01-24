/* jshint node: true */
/* jshint expr: true */

'use strict';

const galleryAccess = require('../src/index.js');
const chai = require('chai');
const expect = chai.expect;

describe('Main', () => {
	describe('CameraRoll detection behavior', () => {
		it('finds iOS album', () => {
			const albums = [
				{ id: 'other-1' },
				{ id: 'iOS', type: 'PHAssetCollectionSubtypeSmartAlbumUserLibrary' },
				{ id: 'other-2' },
			];

			expect(galleryAccess._findCameraRollAlbum(albums).id).to.be.equal('iOS');
		});

		it('finds Android album', () => {
			const albums = [
				{ id: 'other-1' },
				{ id: 'Android', title: 'Camera' },
				{ id: 'other-2' },
			];

			expect(galleryAccess._findCameraRollAlbum(albums).id).to.be.equal('Android');
		});

		it('throws exception if no album was found', () => {
			const albums = [
				{ id: 'other-1' },
				{ id: 'other-2' },
			];

			expect(() => galleryAccess._findCameraRollAlbum(albums)).to.throw(Error);
		});
	});
});
