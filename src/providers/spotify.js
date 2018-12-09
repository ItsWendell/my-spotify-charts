import SpotifyAPI from 'spotify-web-api-js';
import { createInstance } from 'react-async';

/** @inheritdoc */
class Spotify extends SpotifyAPI {
	/** @inheritdoc */
	constructor() {
		super();
		this.accessTokenKey = 'spotifyAccessToken';
		this.clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
	}

	/** @inheritdoc */
	getAccessToken() {
		const storageToken = localStorage.getItem(this.accessTokenKey);
		if (storageToken && !super.getAccessToken()) {
			super.setAccessToken(storageToken);
		}
		return storageToken || super.getAccessToken();
	}

	/** @inheritdoc */
	setAccessToken(accessToken) {
		localStorage.setItem(this.accessTokenKey, accessToken);
		super.setAccessToken(accessToken);
	}

	/**
	 * Returns the authentication url
	 * @param {string} redirectUrl
	 * @param {Array} scopes
	 */
	getAuthenticationUrl(redirectUrl, scopes = []) {
		return `https://accounts.spotify.com/authorize`
			+ `?client_id=${this.clientId}`
			+ `&response_type=token`
			+ `&redirect_uri=${redirectUrl}`
			+ `&scope=${scopes.join(' ')}`;
	}

	/**
	 * The CallAgain method calls the provided function twice
	 * @param {string} redirectUrl
	 * @param {Array} scopes
	 */
	authenticate = (redirectUrl = window.location.href, scopes = []) => {
		if (!this.getAccessToken()) {
			window.location.href = this.getAuthenticationUrl(redirectUrl, scopes);
		}
	}

	/**
	 * Detects if there's an access token in the location hash, sets the access token if it can find one.
	 */
	detectAccessToken() {
		if (window.location.hash) {
			const accessToken = new URLSearchParams(window.location.hash.substr(1)).get('access_token');
			if (accessToken) {
				this.setAccessToken(accessToken);
				window.history.replaceState(null, null, ' ');
			}
		}
	}

	/**
	 * Clears the local storage access token.
	 */
	logout() {
		localStorage.removeItem(this.accessTokenKey);
	}

	/**
	 * Fetches the next page based on the response from an other request
	 * @param {} response
	 * @returns {Promise}
	 */
	getNextPage(response) {
		return this.getGeneric(response.next);
	}

	/**
	 * Returns a promise for getting all the pages from a resource
	 * @param {Object} response
	 * @returns {Promise}
	 */
	getAllPages(response) {
		let promises = [];

		promises.push(response.items);

		if (response.next != null) {
			promises.push(this.getNextPage(response).then((response) => {
				return this.getAllPages(response)
			}));
		}

		return Promise.all(promises);
	}

	/**
	 * Get's all the playlists from a user.
	 * @param {string} userId
	 * @returns {Promise}
	 */
	getAllUserPlaylists(userId = undefined) {
		return new Promise((resolve, reject) => {
			let depth = 5;
			this.getUserPlaylists()
				.then((response) => {
					depth = Math.round(response.total / response.limit);
					return this.getAllPages(response);
				})
				.then((data) => resolve(data.flat(depth)))
				.catch((error) => reject(error));
		});
	}

	/**
	 * Get's all the top tracks of the current user.
	 * @returns {Promise}
	 */
	getAllMyTopTracks() {
		return new Promise((resolve, reject) => {
			let depth = 5;
			this.getMyTopTracks()
				.then((response) => {
					depth = Math.round(response.total / response.limit);
					return this.getAllPages(response);
				})
				.then((data) => resolve(data.flat(depth)))
				.catch((error) => reject(error));
		});
	}

	/**
	 * Attaches the actual tracks to the laylists from an array.
	 * @param {Array} playlists
	 */
	getTracksFromPlaylists(playlists = []) {
		return Promise.all(playlists
			.map(async (playlist) => ({
				...await this.getGeneric(playlist.tracks.href),
				...playlist,
			}))
		);
	}
}

export const spotify = new Spotify();

/**
 * Export a predefined React Async component instance.
 * This creates a custom context for improved nesting and predefines the promise.
 *
 * @see    https://github.com/ghengeveld/react-async
 * @return {React.Component}
 */
export const AsyncUser = createInstance({ promiseFn: spotify.getMe });
