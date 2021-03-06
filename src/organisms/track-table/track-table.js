import React from 'react';
import Table from 'src/molecules/table';
import moment from 'moment';
import { Avatar } from '@auth0/cosmos';

export default function TrackTable({ playlists, tracks }) {
	console.log('tracksTable', tracks);
	const dataSource = tracks
		// Filter out double track id's
		.filter((track, index, all) =>
			index === all.findIndex((result) => (
				result.id === track.id
			))
		)
		// Mapping the data only to what we need
		.map((track, index) => ({
			key: track.id,
			index: index,
			id: track.id,
			name: track.name,
			previewUrl: track.preview_url,
			artist: track.artists && track.artists[0].name,
			year: track.album && moment(track.album.release_date).year(),
			cover: track.album && track.album.images &&
				track.album.images.length &&
				track.album.images[0].url,
			positions: playlists
				.reduce((positions, list) => {
					const position = list.items.findIndex((item) => item.track.id === track.id);
					positions[list.time_range] = position >= 0 ? position : null;
					return positions;
				}, {}),
		}));

	// Defining the columms, sorting and optionally rendering
	const columns = [
		{
			dataIndex: 'cover',
			render: (cover) => (
				<Avatar
					type="resource"
					size="large"
					image={cover}
				/>
			)
		},
		{
			title: 'Name',
			dataIndex: 'name',
			width: '20%',
			sorter: (a, b) => a.name.localeCompare(b.name),
		},
		{
			title: 'Artist',
			dataIndex: 'artist',
			primary: true,
			filters: [...new Set(dataSource.map((track) => track.artist))]
				.map((artist) => ({
					text: artist,
					value: artist,
				})),
			onFilter: (value, track) =>
				track.artist.indexOf(value) === 0,
			sorter: (a, b) => a.artist.localeCompare(b.artist),
		},
		{
			title: 'Year',
			dataIndex: 'year',
			sorter: (a, b) => a.year - b.year,
		},
		...playlists.map((playlist) => ({
			title: playlist.name,
			dataIndex: `position-${playlist.time_range}`,
			render: (value, track) => {
				const position = track.positions[playlist.time_range];
				return position !== null ? position + 1 : '-';
			},
			sorter: (aObject, bObject) => {
				const a = aObject.positions[playlist.time_range];
				const b = bObject.positions[playlist.time_range];
				return a - b;
			}
		})),
	];


	return (
		<Table
			pagination={false}
			columns={columns}
			dataSource={dataSource}
		>
		</Table>
	);
}
