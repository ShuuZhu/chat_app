
const express = require('express')
const http = require('http')
const path = require('path')
const socketio = require('socket.io')
const Filter = require('bad-words')
const publicDir = path.join(__dirname, '../public')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)
const ADMIN = 'Admin'

app.use(express.static(publicDir))
const port = process.env.PORT ||  9898
const sendRoomData = user => {
  io.to(user.room).emit('roomData', {
    room: user.room,
    users: getUsersInRoom(user.room)
  })
}
io.on('connection', (socket) => { // socket is an object

  socket.on('join', (options, callback) => {
    const { error, user } = addUser({id: socket.id, ...options })

    if(error) {
      return callback(error)
    }


    socket.join(user.room)

    socket.emit('message', generateMessage(ADMIN, 'Welcome!'))
    socket.broadcast.to(user.room).emit('message', generateMessage(ADMIN, `A new user ${user.username} just join this chat.`))
    sendRoomData(user)

    callback()
    // socket.emit => just client side
    // io.emit => everybody
    // socket.broadcast.emit => everybody except itself
    // io.to.emit => everybody in specific room
    // socket.broadcast.to.emit => everybody in specific room except itself
  })

  socket.on('sendMessage', (message, callback) => {
    const filter = new Filter()

    if (filter.isProfane(message)) {
      return callback('error msg')
    }

    const user = getUser(socket.id)
    if (user) {
      io.to(user.room).emit('message', generateMessage(user.username, message))
      callback()
    }
  })

  socket.on('disconnect', () => {
    const user = removeUser(socket.id)

    if (user) {
      io.to(user.room).emit('message', generateMessage(ADMIN, `${user.username} has left.`))
      sendRoomData(user)
    }
  })

  socket.on('sendLocation', (data, callback) => {
    const user = getUser(socket.id)
    if (user) {
      socket.broadcast.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${data.lat},${data.lng}`))
      callback('Location shared!')
      }
  })
})

server.listen(port, () => {
  console.log(`this server is up by port ${port}!`)
})