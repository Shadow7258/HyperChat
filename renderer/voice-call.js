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
  const audioGrid = document.getElementById('call-grid')
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

  socket.on('room-length', roomLength => {
    setTimeout(() => {
      console.log("Room length is now " + roomLength);
      switch (roomLength) {
        case 0:
          $('#call-grid').css('grid-template-columns', '1fr')
          $('#call-grid').css('grid-template-rows', '1fr')
          $('img').css('height', '60%')
          $('img').css('width', 'auto')
          $('img').css('padding', '0')
          break;
        case 1:
          $('#call-grid').css('grid-template-columns', '1fr')
          $('#call-grid').css('grid-template-rows', '1fr')
          $('img').css('height', '60%')
          $('img').css('width', 'auto')
          $('img').css('padding', '0')
          break;
        case 2:
          $('#call-grid').css('grid-template-columns', '1fr 1fr')
          $('#call-grid').css('grid-template-rows', '1fr')       
          $('img').css('height', '40%')
          $('img').css('width', 'auto')
          $('img').css('padding', '0')
          break;
        case 3:
          $('#call-grid').css('grid-template-columns', '1fr 1fr')
          $('#call-grid').css('grid-template-rows', '1fr 1fr')
          $('#call-grid').css('grid-template-areas', '"a b" "c c"')
          $('#voiceCallGrid:eq(0)').css('grid-area', 'a')
          $('#voiceCallGrid:eq(1)').css('grid-area', 'b')
          $('#voiceCallGrid:eq(2)').css('grid-area', 'c')
          $('img').css('height', '32%')
          $('img').css('width', '80%')
          $('img').css('padding', '0')
          break;
        case 4:
          $('#call-grid').css('grid-template-columns', '1fr 1fr')
          $('#call-grid').css('grid-template-rows', '1fr 1fr')
          $('#call-grid').css('grid-template-areas', '"a b" "c d"')
          $('#voiceCallGrid:eq(0)').css('grid-area', 'a')
          $('#voiceCallGrid:eq(1)').css('grid-area', 'b')
          $('#voiceCallGrid:eq(2)').css('grid-area', 'c')
          $('#voiceCallGrid:eq(3)').css('grid-area', 'd')
          $('img').css('height', '55%')
          $('img').css('width', 'auto')
          $('img').css('padding', '0')
          break;
        case 5:
          $('#call-grid').css('grid-template-columns', '1fr 1fr 1fr')
          $('#call-grid').css('grid-template-rows', '1fr 1fr')
          $('#call-grid').css('grid-template-areas', '"a b" "c d" "e e"')
          $('#voiceCallGrid:eq(0)').css('grid-area', 'a')
          $('#voiceCallGrid:eq(1)').css('grid-area', 'b')
          $('#voiceCallGrid:eq(2)').css('grid-area', 'c')
          $('#voiceCallGrid:eq(3)').css('grid-area', 'd')
          $('#voiceCallGrid:eq(4)').css('grid-area', 'e')
          $('img').css('height', '55%')
          $('img').css('width', 'auto')
          $('img').css('padding', '0')
          break;
        case 6:
          $('#call-grid').css('grid-template-columns', '1fr 1fr')
          $('#call-grid').css('grid-template-rows', '1fr 1fr 1fr')
          $('#call-grid').css('grid-template-areas', '"a b" "c d" "e f"')
          $('#voiceCallGrid:eq(0)').css('grid-area', 'a')
          $('#voiceCallGrid:eq(1)').css('grid-area', 'b')
          $('#voiceCallGrid:eq(2)').css('grid-area', 'c')
          $('#voiceCallGrid:eq(3)').css('grid-area', 'd')
          $('#voiceCallGrid:eq(4)').css('grid-area', 'e')
          $('#voiceCallGrid:eq(5)').css('grid-area', 'f')
          $('img').css('height', '70%')
          $('img').css('width', 'auto')
          $('img').css('padding', '50')
          break;
        case 7:
          $('#call-grid').css('grid-template-columns', '1fr 1fr 1fr')
          $('#call-grid').css('grid-template-rows', '1fr 1fr 1fr')
          $('#call-grid').css('grid-template-areas', '"a b c" "d e f" "g g g"')
          $('#voiceCallGrid:eq(0)').css('grid-area', 'a')
          $('#voiceCallGrid:eq(1)').css('grid-area', 'b')
          $('#voiceCallGrid:eq(2)').css('grid-area', 'c')
          $('#voiceCallGrid:eq(3)').css('grid-area', 'd')
          $('#voiceCallGrid:eq(4)').css('grid-area', 'e')
          $('#voiceCallGrid:eq(5)').css('grid-area', 'f')
          $('#voiceCallGrid:eq(6)').css('grid-area', 'g')
          $('img').css('height', '70%')
          $('img').css('width', 'auto')
          $('img').css('padding', '0')
          break;
        case 8:
          $('#call-grid').css('grid-template-columns', '1fr 1fr 1fr')
          $('#call-grid').css('grid-template-rows', '1fr 1fr 1fr')
          $('#call-grid').css('grid-template-areas', '"a b c" "d e f" "g h h"')
          $('#voiceCallGrid:eq(0)').css('grid-area', 'a')
          $('#voiceCallGrid:eq(1)').css('grid-area', 'b')
          $('#voiceCallGrid:eq(2)').css('grid-area', 'c')
          $('#voiceCallGrid:eq(3)').css('grid-area', 'd')
          $('#voiceCallGrid:eq(4)').css('grid-area', 'e')
          $('#voiceCallGrid:eq(5)').css('grid-area', 'f')
          $('#voiceCallGrid:eq(6)').css('grid-area', 'g')
          $('#voiceCallGrid:eq(7)').css('grid-area', 'h')
          $('img').css('height', '70%')
          $('img').css('width', 'auto')
          $('img').css('padding', '0')
          break;
        case 9:
          $('#call-grid').css('grid-template-columns', '1fr 1fr 1fr')
          $('#call-grid').css('grid-template-rows', '1fr 1fr 1fr')
          $('#call-grid').css('grid-template-columns', '1fr 1fr 1fr')
          $('#call-grid').css('grid-template-rows', '1fr 1fr 1fr')
          $('#call-grid').css('grid-template-areas', '"a b c" "d e f" "g h i"')
          $('#voiceCallGrid:eq(0)').css('grid-area', 'a')
          $('#voiceCallGrid:eq(1)').css('grid-area', 'b')
          $('#voiceCallGrid:eq(2)').css('grid-area', 'c')
          $('#voiceCallGrid:eq(3)').css('grid-area', 'd')
          $('#voiceCallGrid:eq(4)').css('grid-area', 'e')
          $('#voiceCallGrid:eq(5)').css('grid-area', 'f')
          $('#voiceCallGrid:eq(6)').css('grid-area', 'g')
          $('#voiceCallGrid:eq(7)').css('grid-area', 'h')
          $('#voiceCallGrid:eq(8)').css('grid-area', 'i')
          $('img').css('height', '70%')
          $('img').css('width', 'auto')
          $('img').css('padding', '0')
          break;
        default:
          $('#call-grid').css('grid-template-columns', '1fr 1fr 1fr')
          $('#call-grid').css('grid-template-rows', '1fr 1fr 1fr')
          $('img').css('height', '70%')
          $('img').css('width', 'auto')
          $('img').css('padding', '0')
          break;
      }
    }, 300);
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

