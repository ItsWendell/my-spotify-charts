import React from 'react';
import Store from 'src/providers/store';
import Router from 'src/providers/router';
import { render } from 'react-dom';

function App({ children }) {
	return (
		<Store>
			<Router />
		</Store>
	);
};

export default render(<App />, document.getElementById('root'));
