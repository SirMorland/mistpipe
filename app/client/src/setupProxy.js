const proxy = require('http-proxy-middleware');

module.exports = app => {
    app.use(proxy('/socket.io', { target: 'ws://localhost:3001', ws: true }));
}