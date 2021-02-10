const { ipcRenderer } = require('electron');

// const socket = io.connect('http://34.93.56.182:3000')
const socket = io.connect('http://localhost:3000')

const { v4: uuidV4 } = require('uuid')

ipcRenderer.send('get_chat_data')

var chatId, friend;

ipcRenderer.on('chat_data', (event, chatIdName, friendName) => {
  chatId = chatIdName;
  friend = friendName;
  console.log("Chat id is " + chatId);
  console.log("Friend is " + friend);
})

const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined, {
  host: '127.0.0.1',
  port: '3001'
})
const myVideo = document.createElement('video')
myVideo.muted = true
const peers = {}
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  addVideoStream(myVideo, stream)

  myPeer.on('call', call => {
    call.answer(stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
  })

  socket.on('user-connected', userId => {
    connectToNewUser(userId, stream)
  })
})

socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close()
})

myPeer.on('open', id => {
    console.log("Joining room: " + chatId);
    socket.emit('join-room', chatId, id)
})

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  })
  call.on('close', () => {
    video.remove()
  })

  peers[userId] = call
}

function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
}