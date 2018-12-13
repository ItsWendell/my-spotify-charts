import React from 'react';
import { Image, ContentOverlay, CoverContainer, ContentDetails, ArtistDetail, NameDetail } from './elements';

export default function Cover(props) {
	return (
		<CoverContainer>
			<figure>
				<Image src={props.cover} />
				<ContentOverlay>
					<ContentDetails>
						<NameDetail>{props.name}</NameDetail>
						<ArtistDetail>{props.artist}</ArtistDetail>
					</ContentDetails>
				</ContentOverlay>
			</figure>
		</CoverContainer>
	);
}
