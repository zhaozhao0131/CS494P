// <!-- last edit Sat 7:18 PM June 8 2019 -->

// required components
var app = require('express')();
var http = require('http').Server(app)
var io = require('socket.io')(http);

var currentUser = [];
var currentSocket = [];
var currentUser_room = [];
var Rooms = ['room1', 'room2', 'room3'];

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    //if server receive socket with chat message flag, check receiver's name
    //and choose to send private msg or broadcast the msg to all

    renewUserList();

    socket.on('chat message', (userName, receiverName, msg, date) => {
        if (receiverName == 'all') {
            //send message to all client without self
            socket.broadcast.to(currentSocket.room).emit('chat message', userName, receiverName, msg, date);
        }
        else {
            if (currentUser_room[currentUser.indexOf(receiverName)] == currentSocket.room) {
                // console.log('receiver is in the same room');
                currentSocket[currentUser.indexOf(receiverName)].emit('chat message', userName, receiverName, msg, date);
            }
            else {
                // socket.broadcast.to(currentSocket.room).emit('error no user', receiverName, currentSocket.room);
                socket.emit('error no user', receiverName, currentSocket.room);
            }
            // currentSocket[currentUser.indexOf(receiverName)].emit('chat message', userName, receiverName, msg, date);
        }
        console.log(date + ' - ' + userName + ' to ' + receiverName + ' : ' + msg);
    })


    //when server receive socket of 'new user' event, store user's name and
    //response to cient.
    socket.on('new user', (userName) => { //function(userName) {}
        if (currentUser.indexOf(userName) == -1) {

            currentUser.push(userName);
            currentSocket.push(socket);
            currentUser_room.push('room1');

            currentSocket.room = 'room1';
            socket.join('room1');

            io.sockets.in(currentSocket.room).emit('msg user join', userName, currentSocket.room);
            // io.sockets.in(currentSocket.room).emit('update userList', userName, currentSocket.room);
            // io.emit('update userList', userName, currentSocket.room);
            io.in(currentSocket.room).emit('update userList', userName, currentSocket.room);

            console.log(userName + " join " + currentSocket.room);

            renewUserList();
        }
        else {
            socket.emit('alert userName exists', userName);
        }
    })

    //when server listen disconnect event
    socket.on('disconnect', () => {
        //when disconnect username doesn't null, show user left message
        if (currentSocket.indexOf(socket) != -1) {
            if (currentUser[currentSocket.indexOf(socket)] != null) {
                io.emit('msg user leave', currentUser[currentSocket.indexOf(socket)]);
                console.log(currentUser[currentSocket.indexOf(socket)] + ' leave the room');
            }
            //remove leaved user's name and socket
            currentUser.splice(currentSocket.indexOf(socket), 1);
            currentSocket.splice(currentSocket.indexOf(socket), 1);
            currentUser_room.splice(currentSocket.indexOf(socket), 1);
        }
    })

    //when server listen clinet send swith room event
    socket.on('switchRoom', (userName, currentRoom, newroom) => {
        if (currentUser.indexOf(userName) == -1) {

            currentUser.push(userName);
            currentSocket.push(socket);

        }

        socket.join(newroom);
        io.sockets.in(currentRoom).emit('msg user leave', currentUser[currentSocket.indexOf(socket)], currentSocket.room);

        currentSocket.room = newroom;
        currentUser_room[currentSocket.indexOf(socket)] = newroom;

        io.sockets.in(newroom).emit('msg user join', currentUser[currentSocket.indexOf(socket)], currentSocket.room);
        currentUser.room = newroom;

        renewUserList()
    })

    //once new client connected to server add users to client List selector
    function renewUserList() {
        // console.log('loop start');
        for (var i = 0; i < currentUser.length; ++i) {
            io.sockets.emit('update userList', currentUser[i], currentUser_room[i]);
            console.log('update ' + currentUser[i] + ' in ' + currentUser_room[i]);
            // console.log("currentUser.length = " + currentUser.length);
            // console.log('the ' + i + ' th; ');
            // console.log(currentUser[i] + ' ... ' + currentUser_room[i] + ' ... ' + currentSocket.room);
        }
    }
})

http.listen(process.env.PORT || 3000, function () {
    console.log('listening on http://localhost:3000/');
});