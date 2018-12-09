import React, { Component } from 'react';
import { BrowserRouter as Router } from "react-router-dom";
import moment from 'moment';
import { spotify } from 'src/providers/spotify';

// TODO: Implement molecules and atoms for these components.
import { Avatar, Spinner, PageHeader, Well } from '@auth0/cosmos';

import Table from 'src/molecules/table';
import Button from 'src/atoms/button';
import PageLayout from 'src/molecules/page-layout';
import PageHero from 'src/molecules/page-hero';

export default class App extends Component {
	state = {
		playlists: [],
		loading: false,
		user: {},
	};

	componentDidMount() {
		spotify.detectAccessToken();
		if (spotify.getAccessToken()) {
			this.getPlaylists();
			spotify.getMe().then((user) => {
				this.setState({ user })
			});
		}
	}

	getPlaylists() {
		this.setState({ loading:  true });
		spotify.getAllUserPlaylists()
			.then((data) => (
				spotify.getTracksFromPlaylists(data
					.filter((playlist) =>
						playlist && playlist.name && playlist.name.includes('Your')
					)
				)
			))
			.then((playlists) => {
				this.setState({
					loading: false,
					playlists: [
						...this.state.playlists,
						...playlists
					]
				});

				this.getMyTopTracks();
			});
	}

	/**
	 * Get current top tracks and save in state in playlist format.
	 */
	getMyTopTracks() {
		spotify.getAllMyTopTracks().then((data) => (
			this.setState({
				playlists: [...this.state.playlists,
					{
						items: data.map((item) => ({
							track: item,
						})),
						name: 'My Top Tracks'
					}
				]
			})
		));
	}

	/**
	 * Render the playlist table.
	 */
	renderDashboard() {
		return !this.state.loading && this.state.playlists.length > 0 && (
			this.renderPlaylists()
		);
	}

	/**
	 * Find the positions of a trackId in the other playlist within the state.
	 * @param {String} trackId
	 */
	findPositions(trackId) {
		const positions = this.state.playlists
			.map((playlist) => {
				const position = playlist.items.findIndex((item) => item.track.id === trackId);
				return {
					name: playlist.name,
					position: position >= 0 ? position + 1 : position,
				}});

		return positions;
	}

	/**
	 * Render the playlists and positions based on the first playlist in the state.
	 */
	renderPlaylists() {
		const playlist = this.state.playlists[0];
		if (!playlist || !playlist.items) {
			return null;
		}

		// Map the playlist items with only the data we need.
		const tableRows = playlist.items.map(({ track }, index) => ({
			id: track.id,
			pos: this.findPositions(track.id),
			name: track.name,
			previewUrl: track.preview_url,
			artist: track.artists && track.artists[0].name,
			releaseDate: moment(track.album.release_date).year(),
			cover: track.album.images &&
			track.album.images.length &&
			track.album.images[0].url,
		}));

		return (
			<Table
				items={tableRows}
			>
				<Table.Column field="cover" title="Cover">
					{row => (
						<Avatar
							type="resource"
							image={row.cover}
							size="xsmall"
						/>
					)}
				</Table.Column>
				{ this.state.playlists.map((playlist) => (
					// This mapping renders the positions of each playlist in a individual column.
					<Table.Column sortable field="pos" title={playlist.name}>
						{row => {
							const list = row.pos.find((positions) => (
								playlist.name === positions.name));
							return list.position >= 0 ? list.position : '-';
						}}
					</Table.Column>
				))}
				<Table.Column truncate field="name" title="Name" />
				<Table.Column field="artist" title="Artist" />
				<Table.Column field="releaseDate" title="Release Date" />
			</Table>
		);
	}

	render () {
		return (
			<Router>
				<div>
					<PageHero
						title={this.state.user && this.state.user.display_name ?
							`Hi ${this.state.user.display_name}!` :
							`Discover your music trends over the years`
						}
						fullPage={!spotify.getAccessToken()}
					>
						{!spotify.getAccessToken() ? (
							<Button
								size="default"
								appearance="cta"
								icon="lock"
								iconAlign="left"
								onClick={() => spotify.authenticate(window.location.href, [
									'user-top-read',
									'playlist-read-private',
									'user-library-read'
								])}
							>
								Login to Spotify
							</Button>
						) : (
							<Button
								size="default"
								icon="lock"
								iconAlign="left"
								onClick={() => {
									spotify.logout();
									window.location.reload();
								}}
							>
								Logout
							</Button>
						)}
					</PageHero>
					{!!spotify.getAccessToken() && (
						<Well>
							<PageLayout>
								<PageLayout.Header>
									<PageHeader
										title="My Spotify Trends"
										description={<span>Figure out the trends in music over the years based on your top tracks of all the years we can find!</span>}
									/>
								</PageLayout.Header>
								<PageLayout.Content>
									{ this.state.loading && <Spinner size="large" />}
									{spotify.getAccessToken() && (
										this.renderDashboard()
									)}
								</PageLayout.Content>
							</PageLayout>
						</Well>
					)}
				</div>
			</Router>
		);
	}
}
