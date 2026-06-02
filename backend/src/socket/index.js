const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { jwtSecret, corsOrigins } = require('../config/env');
const { setIO } = require('../config/socket');
const { formatNotification } = require('../utils/queryHelpers');

function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigins,
      credentials: true,
    },
    path: '/socket.io',
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Unauthorized'));

      const decoded = jwt.verify(token, jwtSecret);
      const user = await User.findById(decoded.id).select('_id status role name');
      if (!user || user.status === 'disabled') return next(new Error('Unauthorized'));

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    const room = `user:${socket.userId}`;
    socket.join(room);

    try {
      const unread = await Notification.countDocuments({
        user: socket.userId,
        read: false,
      });
      socket.emit('notification:unread', { count: unread });

      const recent = await Notification.find({ user: socket.userId })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean();
      socket.emit('notification:history', recent.map(formatNotification));
    } catch (err) {
      console.error('[Socket] bootstrap error:', err.message);
    }

    socket.on('disconnect', () => {
      socket.leave(room);
    });
  });

  setIO(io);
  console.log('[Socket.IO] Real-time notifications enabled');
  return io;
}

module.exports = { initializeSocket };
