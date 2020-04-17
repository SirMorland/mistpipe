import React from 'react';
import io from 'socket.io-client';

import GitHub from './GitHub-Mark-Light-32px.png';
import './Client.css';

export default class Client extends React.Component {
	constructor() {
		super();

		this.state = {
			video: '',
			playlist: [],
			users: 0
		}

		this.update = this.update.bind(this);
		this.submitVideo = this.submitVideo.bind(this);
		this.skipVideo = this.skipVideo.bind(this);
		this.removeVideo = this.removeVideo.bind(this);
	}

	componentDidMount() {
		this.socket = io('', {path: '/mistpipe/socket.io'});
		this.socket.emit('login');

		this.socket.on('playlist', message => {
			this.setState({
				playlist: message
			});
		});

		this.socket.on('users', message => {
			this.setState({
				users: message
			});
		});
	}

	update(event) {
		this.setState({
			[event.target.name]: event.target.value
		});
	}

	submitVideo(event) {
		event.preventDefault();

		this.socket.emit('add-video', this.state.video);

		this.setState({
			video: ''
		});
	}

	skipVideo(event) {
		this.socket.emit('skip-video', event.target.id);
	}

	removeVideo(event) {
		this.socket.emit('remove-video', event.target.id);
	}

	render() {
		return (
			<div id="client">
				<h1>Mistpipe</h1>
				<div className="card-collection">
					<form onSubmit={this.submitVideo} className="card" autoComplete="off">
						<h2 className="title">Add a video</h2>
						<div className="grid">
							<label htmlFor="video">YouTube video URL or ID</label>
							<input id="video" name="video" value={this.state.video} onChange={this.update} placeholder="URL or ID" required={true}/>
							<div className="grid-item">
								<button type="submit">SUBMIT</button>
							</div>
						</div>
					</form>
					<div className="card">
						<h2 className="title">Queue</h2>
						<div className="grid">
							{this.state.playlist.map((a, index) =>
								<div key={index} className="grid-item">
									<img src={a.thumbnails.medium.url} alt="" />
									<div>
										<h4>{a.title}</h4>
										<br />
										{a.adder === this.socket.id ?
											<button id={a.id} className="danger" onClick={this.removeVideo}>REMOVE</button>
										:
											<button id={a.id} onClick={this.skipVideo} disabled={a.skips.includes(this.socket.id)}>
												SKIP
											</button>
										}
										&nbsp;<span>{a.skips.length}/{Math.ceil(this.state.users / 2)}</span>
									</div>
								</div>
							)}
							{this.state.playlist.length === 0 && 
								<p>Queue is empty. Add some videos!</p>
							}
						</div>
					</div>
					<a href="https://github.com/SirMorland/mistpipe" rel="noopener noreferrer" target="_blank">
						<img src={GitHub} alt="GitHub" />
						https://github.com/SirMorland/mistpipe
					</a>
				</div>
			</div>
		);
	}
}