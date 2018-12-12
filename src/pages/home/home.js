import React, { Component, Fragment } from 'react';

import { connect } from 'react-redux';
import {
	selectPlaylists,
	selectPlaylistsLoading,
	fetchMyTopTracks,
	selectAllTracks,
	topTracksTimeRanges
} from 'src/ducks/playlists';

import moment from 'moment';
import { spotifyClient } from 'src/providers/spotify';

// TODO: Implement molecules and atoms for these components.
import { Spinner, Heading, ButtonGroup } from '@auth0/cosmos';
import { Row, Col, BackTop } from 'antd';

import Button from 'src/atoms/button';
import PageLayout from 'src/molecules/page-layout';
import PageHero, { HeroTitle, HeroSubtitle } from 'src/molecules/page-hero';
import Cover from 'src/molecules/spotify-cover';
import Container from 'src/atoms/container';
import TrackTable from 'src/organisms/track-table/track-table';

import { logout, fetchUser } from 'src/ducks/user';

class App extends Component {

	constructor () {
		super();
		this.state = {
			playlists: [],
			loading: false,
			user: {},
			tracks: [],
			timeRanges: Object.keys(topTracksTimeRanges) || [],
		};
	}


	componentDidMount() {
		const {
			fetchMyTopTracksAction,
			logoutAction,
			fetchUserAction
		} = this.props;

		fetchUserAction()
			.then(() => fetchMyTopTracksAction())
			.catch(() => logoutAction())
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

	renderCoverRow () {
		const { playlists } = this.props;

		if (!playlists) {
			return null;
		}

		const topTracks = playlists.find((playlist) => playlist.time_range === 'short_term');

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

		return (
			<Fragment>
				<HeroSubtitle>Your recently hot tracks...</HeroSubtitle>
				<Row type="flex" gutter={16}>
					{data.map((track) => (
						<Col key={track.id} span={8} style={{ padding: '0.5rem' }}>
							<Cover
								cover={track.cover}
								artist={track.artist}
								name={track.name}
							/>
						</Col>
					))}
				</Row>
			</Fragment>
		)
	}

	toggleTimeRange = (value) => {
		if (this.state.timeRanges.includes(value)) {
			this.setState({
				timeRanges: this.state.timeRanges.filter((time_range) => (
					time_range !== value
				))
			});

			return;
		}

		this.setState({
			timeRanges: [ ...this.state.timeRanges, value ]
		});
	}

	/**
	 * Render the playlists and positions based on the first playlist in the state.
	 */
	renderPlaylists() {
		const { playlists, allTracks } = this.props;

		const filteredTracks = allTracks
			.filter((track) =>
				this.state.timeRanges.includes(track.time_range)
			);

		return (
			<Row>
				<Heading size={2}>Your Hot Tracks...</Heading>
				<ButtonGroup style={{ marginBottom: '2rem' }}>
					{topTracksTimeRanges && Object.keys(topTracksTimeRanges).map((time_range) => {
						return (
							<Button
								icon={this.state.timeRanges.includes(time_range) ? 'check' : null}
								onClick={() => this.toggleTimeRange(time_range)}>
								{topTracksTimeRanges[time_range]}
							</Button>
						);
					})}
				</ButtonGroup>
				<Row>
					<TrackTable playlists={playlists} tracks={filteredTracks} />
				</Row>
			</Row>
		);
	}

	renderHero() {
		const { user } = this.props;

		if (!user) {
			return null;
		}

		const userName = (user &&
			user.display_name &&
			user.display_name.split(' ', 1)[0]) || 'you';

		const { logoutAction } = this.props;
		return (
			<PageHero>
				<Container>
					<Row type="flex" align="middle">
						<Col span={8}>
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
						</Col>
						<Col span={14}>
							{this.renderCoverRow()}
						</Col>
					</Row>
				</Container>
			</PageHero>
		);
	}

	render () {

		return (
			<div>
				<BackTop />
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
