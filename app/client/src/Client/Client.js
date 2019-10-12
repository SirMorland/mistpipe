import React from 'react';
import io from 'socket.io-client';

import './Client.css';

export default class Client extends React.Component {
	constructor() {
		super();

		this.state = {
			video: '',
			playlist: []
		}

		this.update = this.update.bind(this);
		this.submitVideo = this.submitVideo.bind(this);
	}

	componentDidMount() {
		this.socket = io('', {path: '/mistpipe/socket.io'});

		this.socket.on('playlist', message => {
			this.setState({
				playlist: message
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
									<h3>{a.title}</h3>
								</div>
							)}
							{this.state.playlist.length === 0 && 
								<p>Queue is empty. Add some videos!</p>
							}
						</div>
					</div>
				</div>
			</div>
		);
	}
}