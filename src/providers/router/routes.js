import React from 'react';
import { Route, Switch } from 'react-router-dom';

import Home from 'src/pages/home';
import ProtectedRoute from './protected-route';
import Login from 'src/pages/login';

/**
 * Switch of general routes for this app.
 *
 * @return {ReactElement}
 */
export default function Routes() {
	return (
		<Switch>
			<ProtectedRoute exact path="/" component={Home} />
			<Route exact path="/login" component={Login} />
			<Route render={() => <h1>404 - Page not found</h1>} />
		</Switch>
	);
}
