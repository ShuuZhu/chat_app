const socket = io()

// Elements
const $messageForm = document.querySelector('#chat-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = () => {
  // new msg element
  const $newMessage = $messages.lastElementChild

  // Height of the new msg
  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

  // Visible height
  const visibleHeight = $messages.offsetHeight

  // Height of msgs container
  const containerHeight = $messages.scrollHeight

  // How far have I scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight
  }
}

socket.on('message', message => {
  const html = Mustache.render(messageTemplate, {
    message: message.text,
    createdAt: moment(message.createdAt).format('hh:mm a'),
    username: message.username
  })
  $messages.insertAdjacentHTML('beforeend', html)
  autoscroll()
})

socket.on('locationMessage', message => {
  const html = Mustache.render(locationTemplate, {
    url: message.url,
    createdAt: moment(message.createdAt).format('hh:mm a'),
    username: message.username
  })
  $messages.insertAdjacentHTML('beforeend', html)
  autoscroll()
})

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  })

  document.querySelector('#sidebar').innerHTML = html
})

document.querySelector('#chat-form').addEventListener('submit', e => {
  e.preventDefault()
  e.stopPropagation()

  $messageFormButton.setAttribute('disabled', 'disabled')

  socket.emit('sendMessage', e.target.elements.message.value, error => {
    if(error) {
      alert('Do NOT use dirty words!')
      // return console.log(error)
    } 
    $messageFormButton.removeAttribute('disabled')
    $messageFormInput.value = ''
    $messageFormInput.focus()

    // console.log('message', message)
  }) // sending callback
})

document.querySelector('#send-location').addEventListener('click', () => {
  if(!navigator.geolocation) return alert('Isnt support by your browser.')
  
  $locationButton.setAttribute('disabled', 'disabled')
  navigator.geolocation.getCurrentPosition((pos) => {
    socket.emit('sendLocation', {lat: pos.coords.latitude, lng: pos.coords.longitude}, msg => {
      console.log(msg)
      $locationButton.removeAttribute('disabled')
    })
  }, err => {
    console.log(err)
    $locationButton.removeAttribute('disabled')

  },{timeout: 20000})
})

socket.emit('join', { username, room }, error => {
    if(error) {
      alert(error)
      location.href = '/'  
    }
})
