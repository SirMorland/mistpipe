const express = require('express');
const app = express();
const port = process.env.PORT || 3001;
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');

/*== Web sockets ==*/

const http = require('http').createServer(app);
const io = require('socket.io')(http);

const YOUTUBE_API_KEY = "INSERT API KEY HERE";

let playlist = [];
let authority = null;
let watchers = [];

io.on('connection', socket => {
	console.log(`${socket.id} connected`);

	socket.emit('playlist', playlist);

	socket.on('disconnect', () => {
		console.log(`${socket.id} disconnected`);
		if(authority === socket.id) {
			if(watchers.length > 0) {
				authority = watchers[0];
				watchers.shift();
				console.log(`${authority} was promoted to authority`);
			} else {
				authority = null;
				console.log(`no-one has authority`);
			}
		} else {
			watchers = watchers.filter(a => a !== socket.id);
		}
	});

	socket.on('claim-authority', () => {
		if(!authority) {
			authority = socket.id;
			console.log(`${authority} gained authority`);
		} else {
			watchers.push(socket.id);
			console.log(`${socket.id} became watcher`);
		}
	});

	socket.on('add-video', message => {
		let id = message;
		if(message.includes("youtube.com")) {
			let regex = /.*v=(?<id>[^&]+).*/;
			let match = regex.exec(message);
			if(match) {
				id = match.groups.id;
			}
		} else if(message.includes("youtu.be")) {
			let regex = /.*youtu.be\/(?<id>.+)/;
			let match = regex.exec(message);
			if(match) {
				id = match.groups.id;
			}
		}

		fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${id}&key=${YOUTUBE_API_KEY}`)
		.then(response => response.json())
		.then(json => {
			if(json.items[0]) {
				playlist.push({
					id: id,
					title: json.items[0].snippet.title,
					thumbnails: json.items[0].snippet.thumbnails,
					adder: socket.id
				});
		
				io.emit('playlist', playlist);
			}
		});
	});

	socket.on('video-ended', message => {
		if(!authority) {
			authority = socket.id;
			watchers = watchers.filter(a => a !== socket.id);
			console.log(`${authority} gained authority for finishing video`);
		}
		if(authority === socket.id) {
			playlist = playlist.filter(a => a.id !== message);
			io.emit('playlist', playlist);
		}
	});
});

/* Start React front end on production */

if(process.env.NODE_ENV === "production") {
	app.use("/", express.static('build'));

	app.get('*', function(request, response) {
		const filePath = path.resolve(__dirname, './build', 'index.html');
	
		fs.readFile(filePath, 'utf8', (error, data) => {
			if (error) {
				return console.log(error);
			}
			
			response.send(data);
		});
	});
}

/*== Hey, listen! ==*/

http.listen(port, () => console.log(`Listening on port ${port}`));