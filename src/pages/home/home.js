import React, { Component } from 'react';

import { connect } from 'react-redux';
import {
	selectPlaylists,
	selectPlaylistsLoading,
	fetchMyTopTracks,
	selectAllTracks
} from 'src/ducks/playlists';

import moment from 'moment';
import { spotifyClient } from 'src/providers/spotify';

// TODO: Implement molecules and atoms for these components.
import { Avatar, Spinner, ColumnLayout } from '@auth0/cosmos';
import styled from 'styled-components';

import Table from 'src/molecules/table';
import Button from 'src/atoms/button';
import PageLayout from 'src/molecules/page-layout';
import PageHero, { HeroTitle, HeroSubtitle } from 'src/molecules/page-hero';
import Cover from 'src/molecules/spotify-cover';
import Container from 'src/atoms/container';
import { logout, fetchUser } from 'src/ducks/user';

const ColumnContainer = styled(ColumnLayout)`
	&& {
		align-items: center;
	}
`
class App extends Component {
	state = {
		playlists: [],
		loading: false,
		user: {},
		tracks: [],
	};

	componentDidMount() {
		const {
			fetchMyTopTracksAction,
			logoutAction,
			user,
		} = this.props;

		if (user) {
			fetchMyTopTracksAction();
		}

		if (!user) {
			fetchUser()
				.then(() => fetchMyTopTracksAction())
				.catch(() => logoutAction())
		}
	}

	/**
	 * Render the playlist table.
	 */
	renderDashboard() {
		const { playlists } = this.props;
		return !this.state.loading && playlists && playlists.length > 0 && (
			this.renderPlaylists()
		);
	}

	/**
	 * Find the positions of a trackId in the other playlist within the state.
	 * @param {String} trackId
	 */
	findPositions(trackId) {
		const { playlists } = this.props;
		const positions = playlists
			.map((playlist) => {
				const position = playlist.items.findIndex((item) => item.track.id === trackId);
				return {
					name: playlist.name,
					position: position >= 0 ? position + 1 : position,
				}});

		return positions;
	}

	renderCoverRow () {
		const { playlists } = this.props;
		if (!playlists) {
			return null;
		}
		const topTracks = playlists.find((playlist) => playlist.name === 'Short Term');

		if (!topTracks) {
			return null;
		}

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
		const { playlists, allTracks } = this.props;

		console.log('all tracks', allTracks);

		// Map the playlist items with only the data we need.
		const tableRows = allTracks.map((track, index) => ({
			key: track.id,
			index: index,
			id: track.id,
			pos: this.findPositions(track.id),
			name: track.name,
			previewUrl: track.preview_url,
			artist: track.artists && track.artists[0].name,
			releaseDate: track.album && moment(track.album.release_date).year(),
			cover: track.album && track.album.images &&
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
					<Table.Column truncate field="name" sortable title="Name" />
					<Table.Column field="artist" sortable title="Artist" />
					<Table.Column field="releaseDate" title="Release Date" />
					{playlists.map((playlist) => (
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

	renderHero() {
		const { user } = this.props;

		const userName = (user &&
			user.display_name &&
			user.display_name.split(' ', 1)[0]) || 'you';

		const { logoutAction } = this.props;
		return (
			<PageHero>
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
									logoutAction().then(() => {
										window.location.reload();
									})
								}}
							>
								Logout
							</Button>
						</div>
						{this.renderCoverRow()}
					</ColumnContainer>
				</Container>
			</PageHero>
		);
	}

	render () {

		return (
			<div>
				{this.renderHero()}
				<Container style={{ marginTop: '2rem', marginBottom: '2rem' }}>
					<PageLayout>
						<PageLayout.Content>
							{ this.state.loading && <Spinner size="large" />}
							{spotifyClient.getAccessToken() && (
								this.renderDashboard()
							)}
						</PageLayout.Content>
					</PageLayout>
				</Container>
			</div>
		);
	}
}

export default connect(
	state => ({
		playlists: selectPlaylists(state),
		allTracks: selectAllTracks(state),
		isLoading: selectPlaylistsLoading(state),
		user: state && state.user && state.user.user,
	}),
	{
		fetchMyTopTracksAction: fetchMyTopTracks,
		fetchUserAction: fetchUser,
		logoutAction: logout,
	}
)(App);
