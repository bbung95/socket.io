const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const screenVideo = document.createElement("video");
let myUserId;
let check = true;
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
let shareId;
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
socket.on("screenShare", (screenStream) => {
  console.log("화면공유 클라이언트");
  addVideoStream(screenVideo, screenStream);
  console.log(screenStream);
});

peer.on("open", (id) => {
  console.log("식별:" + ROOM_ID + id);
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
};

// 화면공유
function shareVideo() {
  const peer = new Peer(undefined, {
    path: "/peerjs",
    host: "/",
    port: "82", // defualt 443
  });

  navigator.mediaDevices
    .getDisplayMedia({
      video: true,
    })
    .then((stream) => {
      screenShare = stream;
      // 내가 접속시 비디오 표시

      addVideoStream(screenVideo, stream);

      // 접속시 접속한 유저들 비디오 표시
      for (var i in peers) {
        console.log("피어반복");
        peer.call(i, stream);
      }

      peer.on("call", (call) => {
        console.log(call);
        call.answer(stream);
        const video = document.createElement("video");
        call.on("stream", (userVideoStream) => {
          addVideoStream(video, userVideoStream);
        });
      });

      $(".sharebtn").attr("class", "btn btn-danger sharebtn");
      $(".bi-play-circle-fill").attr("class", "bi bi-stop-fill");
      $("#vidio-grid").prepend($("video:last-child"));

      // 공유 중지시
      screenShare.getVideoTracks()[0].addEventListener("ended", () => {
        $(".sharebtn").attr("class", "btn btn-primary sharebtn");
        $(".bi-play-circle-fill").attr("class", "bi bi-play-circle-fill");
        $("video:last-child").remove();
      });
    });
}

// 비디오 생성
const addVideoStream = (video, stream) => {
  console.log("비디오 생성");
  video.srcObject = stream; // 비디오 설정 셋팅??
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });

  videoGrid.appendChild(video);
};

// 마이크 뮤트
const setMuteButton = () => {
  $(".bi-mic-mute-fill").attr("class", "bi bi-mic-fill");
};

const setUnMuteButton = () => {
  $(".bi-mic-fill").attr("class", "bi bi-mic-mute-fill");
};

const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnMuteButton();
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    setMuteButton();
  }
};
/////////////////////////

// 화면 끄기
const setPlayVideo = () => {
  $(".bi-camera-video-fill").attr("class", "bi bi-camera-video-off-fill");
};

const setStopVideo = () => {
  $(".bi-camera-video-off-fill").attr("class", "bi bi-camera-video-fill");
};

const stopVideo = () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;

  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    setStopVideo();
  }
};
////////////////////////

const leaveVideo = () => {
  close();
};
