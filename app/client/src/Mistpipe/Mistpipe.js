import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import Client from '../Client/Client';
import Watch from '../Watch/Watch';

import './Mistpipe.css';

export default class SpellYeller extends React.Component {
	render() {
		return (
			<BrowserRouter basename="/mistpipe">
				<Switch>
					<Route exact path="/" component={Client} />
					<Route exact path="/watch" component={Watch} />
					<Route><h1>404</h1></Route>
				</Switch>
			</BrowserRouter>
		);
	}
}
