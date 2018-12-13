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
import { spotifyClient, audioFeatures } from 'src/providers/spotify';

// TODO: Implement molecules and atoms for these components.
import { Spinner, Heading, ButtonGroup } from '@auth0/cosmos';
import { Row, Col, BackTop, Layout, Slider, Select } from 'antd';

import Button from 'src/atoms/button';
import PageLayout from 'src/molecules/page-layout';
import PageHero, { HeroTitle, HeroSubtitle } from 'src/molecules/page-hero';
import Cover from 'src/molecules/spotify-cover';
import Container from 'src/atoms/container';
import TrackTable from 'src/organisms/track-table/track-table';

import { logout, fetchUser } from 'src/ducks/user';
import CheckableTag from 'antd/lib/tag/CheckableTag';

class App extends Component {

	constructor () {
		super();
		this.state = {
			playlists: [],
			loading: false,
			user: {},
			tracks: [],
			timeRanges: Object.keys(topTracksTimeRanges) || [],
			audioFeatures: {},
			selectedGenres: [],
			generatedPlaylist: {},
		};
	}


	componentDidMount() {
		const {
			logoutAction,
			fetchUserAction
		} = this.props;

		fetchUserAction()
			.catch(() => logoutAction())

		spotifyClient.getAvailableGenreSeeds().then((data) => {
			this.setState({ genreSeeds: data.genres });
		});

		spotifyClient.getFeaturedPlaylists().then((data) => {
			this.setState({ playlists:
				data &&
				data.playlists &&
				data.playlists.items
			});
		});
	}

	authenticate = () => {
		spotifyClient.authenticate(window.location.href, [
			'user-top-read',
			'playlist-read-private',
			'user-library-read'
		]);
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

		const data = topTracks.items.slice(0, 18).map(({ track }, index) => ({
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
				<Row type="flex" gutter={16}>
					{data.map((track) => (
						<Col key={track.id} span={4} style={{ padding: '0.5rem' }}>
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


	renderPlaylistsWall() {
		const { playlists } = this.state;

		if (!playlists) {
			return null;
		}

		const data = playlists.slice(0, 12).map((playlist) => ({
			id: playlist.snapshot_id,
			name: playlist.name,
			cover: playlist.images &&
				playlist.images.length &&
				playlist.images[0].url,
		}));

		return (
			<Container>
				<Row type="flex" gutter={16}>
					{data.map((playlist) => (
						<Col key={playlist.id} span={4} style={{ padding: '0.5rem' }}>
							<Cover
								cover={playlist.cover}
								// artist={playlist.name}
							/>
						</Col>
					))}
				</Row>
			</Container>
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
		const { generatedPlaylist } = this.state;

		const tracks = generatedPlaylist.tracks;

		if (!tracks) {
			return null;
		}

		return (
			<Row>
				<h2>Generated Playlist</h2>
				<Row>
					<TrackTable tracks={tracks} />
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
				<Row type="flex" align="middle">
					<Col span={24}>
						{this.renderPlaylistsWall()}
					</Col>
				</Row>
			</PageHero>
		);
	}

	renderRecommendationSliders() {
		return (
			<Row type="flex" align="middle" justify="center" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
				{Object.keys(audioFeatures).map((audioFeature) => {
					return (
						<Col
							key={`slider-${audioFeature}`}
							span={3}
							style={{
								display: 'flex',
								alignItems: 'center',
								flexDirection: 'column',
							}}
						>
							<Slider
								style={{ minHeight: '12rem' }}
								key={audioFeature}
								vertical
								min={0}
								max={100}
								defaultValue={0}
								step={1}
								onChange={(value) => this.setState({
									audioFeatures: {
										...this.state.audioFeatures,
										[audioFeature]: value / 100,
									}
								})}
							/>
							<label
								style={{ fontWeight: 'bold', marginTop: '1rem' }}
							>
								{audioFeatures[audioFeature]}
							</label>
						</Col>
					);
				})}
			</Row>
		)
	}

	handleGenreChange(tag, checked) {
		const { selectedGenres } = this.state;
		const nextSelectedTags = checked
			? [...selectedGenres, tag]
			: selectedGenres.filter(t => t !== tag);
		this.setState({ selectedGenres: nextSelectedTags });
	}

	submitPlaylist = () => {
		const { audioFeatures, selectedGenres } = this.state;
		spotifyClient.getRecommendations({
			...Object.keys(audioFeatures)
				.reduce((features, audioFeature) => {
					features[`target_${audioFeature}`] = audioFeatures[audioFeature];
					return features;
				}, {}),
			seed_genres: selectedGenres.join(',')
		})
			.then((data) => {
				console.log('Seeded Playlist', data);
				this.setState({ generatedPlaylist: data });
			})
	}


	render () {
		const { user } = this.props;
		const { genreSeeds } = this.state;
		return (
			<Layout>
				<BackTop />
				<Layout.Header style={{ backgroundColor: 'white' }}>
					<Row gutter={16} type="flex" align="middle" justify="space-between" style={{ height: '100%' }}>
						<Col span={18}>
							<h3 style={{ marginBottom: '0' }}>Spotify Playlist Generator</h3>
						</Col>
						<Col span={6} style={{ textAlign: 'right' }}>
							{!user ? (
								<Button onClick={() => this.authenticate()}>Login to Spotify</Button>
							) : (
								<Button>Logout</Button>
							)}
						</Col>
					</Row>
				</Layout.Header>
				<Layout.Content>
					{this.renderHero()}
					<section id="audio-features">
						<Container style={{ marginTop: '2rem' }}>
							<h2>Audio Features</h2>
							{this.renderRecommendationSliders()}
						</Container>
					</section>
					<section id="audio-features">
						<Container style={{ marginTop: '2rem', marginBottom: '2rem' }}>
							<h2>Genres</h2>
							<Select
								mode="tags"
								placeholder="Select genres for this playlist (optional)"
								onChange={checked => this.setState({ selectedGenres: checked })}
								style={{ width: '100%' }}
							>
								{genreSeeds && genreSeeds.map(tag => (
									<Select.Option
										key={tag}
										checked={this.state.selectedGenres.indexOf(tag) > -1}
										style={{
											marginBottom: '1rem',
											textTransform: 'capitalize',
										}}
									>
										{tag}
									</Select.Option>
								))}
							</Select>
						</Container>
					</section>
					<section id="submit">
						<Container>
							<Row align="middle" justify="space-around">
								<Col span={24}>
									<Button onClick={this.submitPlaylist}>Generate Playlist</Button>
								</Col>
							</Row>
						</Container>
					</section>
					<section id="results">
						<Container>
							<Row align="middle" justify="center" >
								<Col span={24}>
									{
										this.state.generatedPlaylist &&
										this.renderPlaylists()
									}
								</Col>
							</Row>
						</Container>
					</section>
				</Layout.Content>
			</Layout>
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
