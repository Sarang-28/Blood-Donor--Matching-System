const { Server } = require('socket.io');

let io;

const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*", // Adjust as needed based on CORS policies
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // Join a specific match tracking room
        socket.on('join_tracking_room', ({ matchId, role }) => {
            if (!matchId) return;
            const roomName = `tracking_${matchId}`;
            socket.join(roomName);
            console.log(`Socket ${socket.id} (${role || 'unknown'}) joined room ${roomName}`);
        });

        // Leave tracking room
        socket.on('leave_tracking_room', ({ matchId }) => {
            if (!matchId) return;
            const roomName = `tracking_${matchId}`;
            socket.leave(roomName);
            console.log(`Socket ${socket.id} left room ${roomName}`);
        });

        // Handle donor location updates
        socket.on('location_update', ({ matchId, latitude, longitude }) => {
            if (!matchId || !latitude || !longitude) return;
            const roomName = `tracking_${matchId}`;
            // Broadcast to everyone else in the room (the requester)
            socket.to(roomName).emit('donor_location_updated', {
                latitude,
                longitude,
                timestamp: new Date().toISOString()
            });
        });

        // Requester explicitly asks for an immediate location update
        socket.on('request_current_location', ({ matchId }) => {
            if (!matchId) return;
            const roomName = `tracking_${matchId}`;
            socket.to(roomName).emit('location_requested');
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIo = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

module.exports = {
    initializeSocket,
    getIo
};
