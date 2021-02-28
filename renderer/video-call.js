const { ipcRenderer } = require('electron');

// const socket = io.connect('http://34.93.56.182:3000')
const socket = io.connect('http://localhost:3000')

ipcRenderer.send('get_chat_data')

var chatId, friend, username;

ipcRenderer.on('chat_data', (event, chatIdName, friendName, user_name) => {
  chatId = chatIdName;
  friend = friendName;
  username = user_name;
  console.log("Chat id is " + chatId);
  console.log("Friend is " + friend);
  console.log("Username is " + username);
})

const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer({
  host: '127.0.0.1',
  port: '3001',
  debug: 3
})
const myVideo = document.createElement('video')
myVideo.muted = true
const peers = {}

var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

myPeer.on('call', function(call) {
  getUserMedia({video: true, audio: true}, function(stream) {
    call.answer(stream); 
    const video = document.createElement('video')
    call.on('stream', function(remoteStream) {
      addVideoStream(video, remoteStream)
    });
    call.on('close', () => {
      video.remove()
    })
  }, function(err) {
    console.log('Failed to get local stream', err);
  });
});

navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true,
}).then(stream => {
  addVideoStream(myVideo, stream)

  socket.on('user-connected', userId => {
    console.log("User connected to the room : " + userId);
    connectToNewUser(userId, stream)
  })
})

socket.on('user-disconnected', userId => {
  console.log("Peer's user id is " + peers[userId]);
  if (peers[userId]) peers[userId].close()
})

myPeer.on('open', id => {
    console.log("Joining room: " + chatId);
    socket.emit('join-room', chatId, id)
})

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  console.log("Calling new user: " + userId);
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