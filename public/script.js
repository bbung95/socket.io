const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const screenVideo = document.createElement("video");
let myUserId;
const peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "443", // defualt 443
});

myVideo.muted = true;
const peers = [];

// 1. 사용자 비디오 오디오 권한 요청  
let myVideoStream;
let screenShare;
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    // 내가 접속시 비디오 표시
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    // 접속시 접속한 유저들 비디오 표시
    peer.on("call", (call) => {
      console.log("접속 유저들");
      console.log(call);

      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    // 다른 유저들 접속시 비디오 표시
    socket.on("user-connected", (userId) => {
      peers.push(userId);     
      console.log("다른유저 접속시" + userId);
      connectToNewUser(userId, stream);
    });
  });
  
  socket.on("user-disconnected", (userId) => {
    console.log("연결종료");
    if (peers[userId]) peers[userId].close();
  });
  
  
  ////// 화면 공유
  socket.on("screenShare", (screenStream)=>{
    console.log("화면공유 클라이언트");
    addVideoStream(screenVideo, screenStream);
    console.log(screenStream);
  })
  
  peer.on("open", (id) => {
    console.log(ROOM_ID + id);
    socket.emit("join-room", ROOM_ID, id);
});


// 유저 접속시 조인시 실행
const connectToNewUser = (userId, stream) => {
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;
}

// 화면공유
const shareDisplay = ()=>{

  const peer =  new Peer(undefined, {
    path: "/peerjs",
    host: "/",
    port: "443", // defualt 443
  });

  navigator.mediaDevices
  .getDisplayMedia({
    video: true,
  })
  .then((stream) => {

    screenShare = stream
    // 내가 접속시 비디오 표시
    
    addVideoStream(screenVideo, stream);

    // 접속시 접속한 유저들 비디오 표시
    for(var i in peers){
      console.log("피어반복");
      peer.call(i, stream);
    }

    peer.on("call", (call) => {
      console.log("접속 유저들");
      console.log(call);

      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    // // 다른 유저들 접속시 비디오 표시
    // socket.on("user-connected", (userId) => {
    //   myUserId = userId;
    //   console.log("다른유저 접속시" + userId);
    //   connectToNewUser(userId, stream);
    // });
  });
}


// 비디오 생성
const addVideoStream = (video, stream) => {

  console.log("비디오 생성")
  video.srcObject = stream; // 비디오 설정 셋팅??
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.appendChild(video);
}

// 마이크 뮤트
const setMuteButton = () =>{
  const html = '<i class="fas fa-microphone"></i>'
    + '<span>Mute</span>';
  document.querySelector('.main__mute_button').innerHTML = html;
}

const setUnMuteButton = () =>{
  const html = '<i class="unmute fa-microphone"></i>'
    + '<span>UnMute</span>';
  document.querySelector('.main__mute_button').innerHTML = html;
}

const muteUnmute = () =>{

  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if(enabled){
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnMuteButton();
  }else{
    myVideoStream.getAudioTracks()[0].enabled = true;
    setMuteButton();
  }
}
/////////////////////////

// 화면 끄기
const setPlayVideo = () =>{
  const html = '<i class="fas fa-video"></i>'
      +'<span>Play Video</span>';
  document.querySelector('.main__video_button').innerHTML = html;
}

const setStopVideo = () =>{
  const html = '<i class="stop fa-video"></i>'
      +'<span>Stop Video</span>';
  document.querySelector('.main__video_button').innerHTML = html;
}

const stopVideo = () =>{
  const enabled = myVideoStream.getVideoTracks()[0].enabled;

  if(enabled){
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  }else{
    myVideoStream.getVideoTracks()[0].enabled = true;
    setStopVideo();
  }
}
////////////////////////

const leaveVideo = () =>{
  close();
}