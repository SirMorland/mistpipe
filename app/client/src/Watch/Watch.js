import React from 'react';
import io from 'socket.io-client';

import './Watch.css';

export default class Watch extends React.Component {
	constructor() {
		super();

		this.state = {
			youtubeStarted: false,
			nowPlaying: null,
			playlist: [],
			state: States.IDLE,
			volume: 100
		}

		this.startYoutube = this.startYoutube.bind(this);
		this.startVideo = this.startVideo.bind(this);
		this.play = this.play.bind(this);
		this.setTimeout = this.setTimeout.bind(this);
	}

	updateVolume = event => {
		let volume = parseInt(event.target.value);

		this.player.setVolume(volume);

		this.setState({
			volume
		});
	}

	componentDidMount() {
		this.socket = io('', {path: '/mistpipe/socket.io'});
		this.socket.emit('claim-authority');

		this.socket.on('playlist', message => {
			this.setState(state => {
				if(state.youtubeStarted &&
					state.state === States.PLAYING &&
					state.playlist.length <= 1 &&
					message.length > 0) {
					this.setTimeout();
				}

				return {
					playlist: message
				};
			}, () => {
				if(this.state.playlist.length > 0) {
					if(!this.state.youtubeStarted) {
						this.startYoutube();
					} else {
						if(this.state.state === States.IDLE) {
							this.startVideo();
						}
					}
				}

				if(this.state.state === States.PLAYING && !this.state.playlist.find(a => a.id === this.state.nowPlaying)) {
					if(this.state.playlist.length > 0) {
						this.setState({
							state: States.PREVIEWING
						});

						if(this.timeout) {
							clearTimeout(this.timeout);
						}
						this.timeout = setTimeout(this.startVideo, 4000);
					} else {
						this.setState({
							state: States.IDLE
						});
					}
				}
			});
		});
	}

	startYoutube() {
		// YouTube iFrame API
		let tag = document.createElement('script');
		tag.src = "https://www.youtube.com/iframe_api";
		let firstScriptTag = document.getElementsByTagName('script')[0];
		firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

		let video = this.state.playlist[0];
		this.setState({
			nowPlaying: video.id,
			youtubeStarted: true
		});

		window.onYouTubeIframeAPIReady = () => {
			this.player = new window.YT.Player('player', {
				height: '390',
				width: '640',
				videoId: video.videoId,
				events: {
				  'onReady': onPlayerReady,
				  'onStateChange': onPlayerStateChange
				},
				playerVars: {
					controls: 0,
					disablekb: 1
				}
			});
		}

		let onPlayerReady = (event) => {
			event.target.playVideo();
		}
		let onPlayerStateChange = (event) => {
			if(event.data === 0) {
				this.setState(state => {
					let id = state.nowPlaying;
					this.socket.emit('video-ended', id);
					let playlist = state.playlist.filter(a => a.id !== id);
					if(playlist.length > 0) {
						this.player.loadVideoById({
							videoId: playlist[0].videoId
						});

						return {
							playlist,
							nowPlaying: playlist[0].id
						};
					} else {
						return {
							state: States.IDLE
						}
					}
				});
			}
			if(event.data === 1) {
				this.play();
			}
		}
	}

	startVideo() {
		let video = this.state.playlist[0];
		console.log(`start video ${video.title}`);
		this.player.loadVideoById({
			videoId: video.videoId
		});

		this.setState({
			nowPlaying: video.id
		});
	}

	play() {
		let duration = this.player.getDuration();

		if(duration > 4) {
			this.setState({
				state: States.PLAYING
			});
			
			this.setTimeout();
		}
	}

	setTimeout() {
		let duration = this.player.getDuration();
		let position = this.player.getCurrentTime();

		if(this.timeout) {
			clearTimeout(this.timeout);
		}
		this.timeout = setTimeout(() => {
			this.setState(state  => {
				if(state.playlist.length > 1) {
					return {
						state: States.PREVIEWING
					}
				}
				return null;
			});
		}, (duration - position - 4) * 1000);
	}

	render() {
		let playlist = this.state.playlist.filter(a => a.id !== this.state.nowPlaying);

		return (
			<div id="watch">
				<div className="background">
					<h1>Mistpipe</h1>
				</div>
				<div className={`queue ${this.state.state === States.PREVIEWING ? "visible" : "hidden" }`}>
					<div className="card">
						<h2 className="title">Coming up next</h2>
						<div className="grid">
							{playlist.map((a, index) =>
								<div key={index} className="grid-item">
									<img src={a.thumbnails.medium.url} alt="" />
									<h3>{a.title}</h3>
								</div>
							)}
						</div>
					</div>
				</div>
				<div className="video-container">
					<div className={`video ${this.state.state}`}>
						<div id="player" />
					</div>
				</div>
				<div className="settings">
					<label htmlFor="volume">Volume</label>
					<input id="volume" type="range" min="0" max="100" name="volume" value={this.state.volume} onChange={this.updateVolume} />
				</div>
			</div>
		);
	}
}

const States = {
	IDLE: 'idle',
	PLAYING: 'playing',
	PREVIEWING: 'previewing'
};