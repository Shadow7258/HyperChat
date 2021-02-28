const { ipcRenderer } = require('electron');
const fs = require('fs');

// const socket = io.connect('http://34.93.56.182:3000')
const socket = io.connect('http://localhost:3000')

ipcRenderer.send('get_chat_data')

var chatId, friend, username, userImage, friendImage;

ipcRenderer.on('chat_data', (event, chatIdName, friendName, user_name) => {
  chatId = chatIdName;
  friend = friendName;
  username = user_name;
  console.log("Chat id is " + chatId);
  console.log("Friend is " + friend);
  console.log("Username is " + username);
  
  let filename = './profile-pics/' + username.split(' ').join('')
  userImage = fs.readFileSync(filename);

  let friendfilename = './profile-pics/' + friend.split(' ').join('')
  friendImage = fs.readFileSync(friendfilename);

  voiceCall();
})

function voiceCall() {
  const audioGrid = document.getElementById('video-grid')
  const myPeer = new Peer({
    host: '127.0.0.1',
    port: '3001',
    debug: 3
  })
  console.log("User image is " + userImage);
  const myAudioElement = document.createElement('div')
  myAudioElement.id = 'voiceCallGrid'
  var pfp = document.createElement('img')
  pfp.src = userImage;
  myAudioElement.appendChild(pfp);
  myAudioElement.muted = true
  const peers = {}
  
  var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
  
  myPeer.on('call', function(call) {
    getUserMedia({video: false, audio: true}, function(stream) {
      call.answer(stream); 
      const audioElement = document.createElement('div')
      audioElement.id = 'voiceCallGrid'
      var pfp = document.createElement('img')
      pfp.src = friendImage;
      audioElement.appendChild(pfp);
      call.on('stream', function(remoteStream) {
        addAudioStream(audioElement, remoteStream)
      });
      call.on('close', () => {
        audioElement.remove()
      })
    }, function(err) {
      console.log('Failed to get local stream', err);
    });
  });
  
  navigator.mediaDevices.getUserMedia({
    video: false,
    audio: true,
  }).then(stream => {
    addAudioStream(myAudioElement, stream)
  
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
    const audioElement = document.createElement('div')
    audioElement.id = 'voiceCallGrid'
    var pfp = document.createElement('img')
    pfp.src = friendImage;
    audioElement.appendChild(pfp);
    call.on('stream', userAudioStream => {
      addAudioStream(audioElement, userAudioStream)
    })
    call.on('close', () => {
      audioElement.remove()
    })
  
    peers[userId] = call
  }
  
  function addAudioStream(video, stream) {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
      video.play()
    })
    audioGrid.append(video)
  }
}

