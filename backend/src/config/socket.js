/** Socket.IO singleton — set during server bootstrap */
let io = null;

function setIO(instance) {
  io = instance;
}

function getIO() {
  return io;
}

module.exports = { setIO, getIO };
