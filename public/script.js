const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "443", // defualt 443
});
myVideo.muted = true;
const peers = {};

// 1. 사용자 비디오 오디오 권한 요청
let myVideoStream
let myShareStream
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
      console.log("접속 유저들" + call);
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    // 다른 유저들 접속시 비디오 표시
    socket.on("uesr-connected", (userId) => {
      console.log("다른유저 접속시" + userId);
      connectToNewUser(userId, stream);
    });
  });

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close();
});

socket.on("screenShare", ()=>{
  console.log("화면공유 클라이언트");
  const screenVideo = document.createElement("video");
  addVideoStream(screenVideo,myShareStream);
})

peer.on("open", (id) => {
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

// 비디오 생성
const addVideoStream = (video, stream) => {
  video.srcObject = stream; // 비디오 설정 셋팅??
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.appendChild(video);
}

// 화면공유
const shareDisplay = ()=>{
  navigator.mediaDevices
  .getDisplayMedia({
    video: true,
    audio: true,
  }).then((screenStream)=>{
    myShareStream = screenStream;
    socket.emit("screenShare", ROOM_ID);

  })
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