'use strict';

const express = require('express');
const socketIO = require('socket.io');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const io = socketIO(server, {
  cors: {
    origin: '*',
  }
});;

let rooms = {};

io.on('connection', (socket) => {
  console.log('Client connected ' + socket.id);
  // socket.on('disconnect', () => {
  //   users = users.filter(x => x.userID !== socket.id);
  //   console.log('Client disconnected')
  //   io.sockets.emit("users", users);
  // });
  // socket.on('callUserName', (data) => {
  //   users.forEach(u => {
  //     if (u.username == data.username) {
  //       io.to(u.userID).emit('newMessage', data.message);
  //     }
  //   })
  // });
  // // for (let [id, socket] of io.of("/").sockets) {
  // // }
  // var cUserName = socket.handshake.query.username;
  // users.push({
  //   userID: socket.id,
  //   username: cUserName,
  // });
  // // socket.emit("users", users);
  // socket.join(cUserName);
  // io.sockets.emit("users", users);

  //// New Code
  socket.on('room_join_request', payload => {
    socket.join(payload.roomName)
    // console.log('Request for  room ' + payload.roomName);
    // const clients = io.in(payload.roomName).allSockets();
    // const clients = io.sockets.adapter.rooms.get(payload.roomName);
    if (rooms[payload.roomName]) {
      rooms[payload.roomName].push(socket.id);
    } else {
      rooms[payload.roomName] = [socket.id];
    }
    // io.in(payload.roomName).emit('room_users', rooms[payload.roomName]) // send to all room memeber include current
    socket.to(payload.roomName).emit('room_users', [socket.id]); // send to all room memeber exclude current
    // socket.to(payload.roomName).emit('room_users', rooms[payload.roomName]); // send to all room memeber exclude current
    // socket.join(payload.roomName, err => {
    //   console.log('clients')
    //   if (!err) {
    //     io.in(payload.roomName).clients((err, clients) => {
    //       console.log('clients')
    //       if (!err) {
    //         io.in(payload.roomName).emit('room_users', clients)
    //       }
    //     });
    //   }
    // })
  })

  socket.on('offer_signal', payload => {
    io.to(payload.calleeId).emit('offer', { signalData: payload.signalData, callerId: payload.callerId });
  });

  socket.on('answer_signal', payload => {
    io.to(payload.callerId).emit('answer', { signalData: payload.signalData, calleeId: socket.id });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected ' + socket.id);
    RemoveSocketFromRoom(socket.id);
    io.emit('room_left', { type: 'disconnected', socketId: socket.id })
  })
});
function RemoveSocketFromRoom(socketId = '') {
  Object.keys(rooms).forEach((cRoom, index) => {
    console.log(`${socketId} removed from ${index}`)
    rooms[cRoom] = rooms[cRoom].filter(x => x !== socketId);
  });
}

io.of("/").adapter.on("create-room", (room) => {
  // console.log(`room ${room} was created`);
});
io.of("/").adapter.on("leave-room", (room, id) => {
  // if (!rooms[room]) {
  //   rooms[room] = [];
  // }
  // rooms[room] = rooms[room].filter(x => x !== id);
  // console.log(room + ' members ' + rooms[room]);
  // console.log(`socket ${id} has left room ${room}`);
});

io.of("/").adapter.on("join-room", (room, id) => {
  // console.log(room + ' members ' + rooms[room]);
  // console.log(`socket ${id} has joined room ${room}`);
});

// setInterval(() => io.emit('time', new Date().toTimeString()), 1000);
