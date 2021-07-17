const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "443",
});
myVideo.muted = true;
const peers = {};

// 1. 사용자 비디오 오디오 권한 요청
let myVideoStream;
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: false,
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
