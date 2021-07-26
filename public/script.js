const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const screenVideo = document.createElement("video");
let userId;
const peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "82", // defualt 443
});
myVideo.muted = true;
const peers = {};

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
      console.log("접속 유저들" + call);

      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    // 다른 유저들 접속시 비디오 표시
    socket.on("user-connected", (userId) => {
      console.log("다른유저 접속시" + userId);
      myUserId = userId;
      connectToNewUser(userId, stream);
    });
  });

socket.on("user-disconnected", (userId) => {
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
const shareDisplay = async()=>{
  screenShare = await navigator.mediaDevices.getDisplayMedia();

  connectToNewUser(myUserId,screenShare);

  const call = peer.call(myUserId, screenShare);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });


}

// 비디오 생성
const addVideoStream = (video, stream) => {
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