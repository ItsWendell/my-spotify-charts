import React, { Component } from 'react';
import { BrowserRouter as Router } from "react-router-dom";
import moment from 'moment';
import { spotify } from 'src/providers/spotify';

// TODO: Implement molecules and atoms for these components.
import { Avatar, Spinner, ColumnLayout } from '@auth0/cosmos';
import styled from 'styled-components';

import Table from 'src/molecules/table';
import Button from 'src/atoms/button';
import PageLayout from 'src/molecules/page-layout';
import PageHero, { HeroTitle, HeroSubtitle } from 'src/molecules/page-hero';
import Cover from 'src/molecules/spotify-cover';
import Container from 'src/atoms/container';

const ColumnContainer = styled(ColumnLayout)`
	&& {
		align-items: center;
	}
`
export default class App extends Component {
	state = {
		playlists: [],
		loading: false,
		user: {},
	};

	componentDidMount() {
		spotify.detectAccessToken();
		if (spotify.getAccessToken()) {
			// this.getPlaylists();
			this.getMyTopTracks();
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
		const types = ['long_term', 'medium_term', 'short_term'];
		const names = {
			'long_term': 'Long Term',
			'medium_term': 'Medium Term',
			'short_term': 'Short Term',
		};

		types.forEach((type) => (
			spotify.getAllMyTopTracks({
				time_range: type,
			}).then((data) => (
				this.setState({
					playlists: [...this.state.playlists,
						{
							items: data.map((item) => ({
								track: item,
							})),
							name: names[type]
						}
					]
				})
			))
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

	renderCoverRow () {
		const topTracks = this.state.playlists.find((playlist) => playlist.name === 'Short Term');
		if (!topTracks) {
			return null;
		}

		console.log('TOP TRACKS', topTracks);

		const data = topTracks.items.slice(0, 6).map(({ track }, index) => ({
			key: track.id,
			name: track.name,
			previewUrl: track.preview_url,
			artist: track.artists && track.artists[0].name,
			releaseDate: moment(track.album.release_date).year(),
			cover: track.album.images &&
				track.album.images.length &&
				track.album.images[0].url,
		}));

		console.log('topTracks', topTracks);
		const Grid = styled.ul`
		    display: -moz-flex;
    		display: -ms-flexbox;
    		display: -ms-flex;
    		display: -webkit-box;
    		display: flex;
    		-ms-flex-flow: row wrap;
    		-webkit-box-orient: horizontal;
    		-webkit-box-direction: normal;
    		flex-flow: row wrap;
    		-moz-align-items: center;
    		-ms-align-items: center;
    		-webkit-box-align: center;
    		-ms-flex-align: center;
    		align-items: center;
    		-moz-justify-content: center;
    		-ms-justify-content: center;
    		-webkit-box-pack: center;
    		-ms-flex-pack: center;
    		justify-content: center;
    		width: 100%;
		`
		return (
			<Grid>
				{data.map((track) => (
					<li style={{ width: '33.33333333%', padding: '8px', float: 'left'}}>
						<Cover
							key={`cover-${track.id}`}
							cover={track.cover}
							artist={track.artist}
							name={track.name}
						/>
					</li>
				))}
			</Grid>
		)
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
			key: track.id,
			index: index,
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
			<div>
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
					<Table.Column truncate field="name" title="Name" />
					<Table.Column field="artist" title="Artist" />
					<Table.Column field="releaseDate" title="Release Date" />
					{this.state.playlists.map((playlist) => (
						// This mapping renders the positions of each playlist in a individual column.
						<Table.Column key={playlist.name} sortable field={`pos-${playlist.name}`} title={playlist.name}>
							{row => {
								const list = row.pos.find((positions) => (
									playlist.name === positions.name));
								return list.position >= 0 ? list.position : '-';
							}}
						</Table.Column>
					))}
				</Table>
			</div>
		);
	}

	renderLoggedInHero() {
		const userName = (this.state.user &&
			this.state.user.display_name &&
			this.state.user.display_name.split(' ', 1)[0]) || 'you';
		return (
			<Container>
				<ColumnContainer distribution="1/3 2/3">
					<div>
						<HeroTitle>Hi {userName}!</HeroTitle>
						<HeroSubtitle>Here's all your hot tracks over time!</HeroSubtitle>
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
					</div>
					{this.renderCoverRow()}
				</ColumnContainer>
			</Container>
		)
	}

	render () {
		return (
			<Router>
				<div>
					<PageHero
						title={this.state.user && this.state.user.display_name ?
							undefined :
							`Discover your music trends over the years`
						}
						fullPage={!spotify.getAccessToken()}
						center={!spotify.getAccessToken()}
					>
						{!spotify.getAccessToken() ? (
							<Container style={{ textAlign: 'center' }}>
								<HeroTitle>Discover Your Personal Taste Over Time on Spotify</HeroTitle>
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
							</Container>
						) : (
							this.renderLoggedInHero()
						)}
					</PageHero>
					{!!spotify.getAccessToken() && (
						<Container style={{ marginTop: '2rem', marginBottom: '2rem' }}>
							<PageLayout>
								<PageLayout.Content>
									{ this.state.loading && <Spinner size="large" />}
									{spotify.getAccessToken() && (
										this.renderDashboard()
									)}
								</PageLayout.Content>
							</PageLayout>
						</Container>
					)}
				</div>
			</Router>
		);
	}
}
