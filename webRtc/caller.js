(async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    document.getElementById('localVideo').srcObject = mediaStream;
  
    // 이후 코드는 모두 이 async 함수 안에 작성한다.
    const rtcPeerConnection = new RTCPeerConnection();
mediaStream.getTracks().forEach(track => rtcPeerConnection.addTrack(track));

/*앞의 코드에 이어서*/ 
rtcPeerConnection.addEventListener('negotiationneeded', async () => {
  // 이쪽편에 접속하기 위한 정보를 생성해서 local session description에 설정
  const sdpOffer = await rtcPeerConnection.createOffer(); // { type: 'offer', sdp: '...' }
  rtcPeerConnection.setLocalDescription(sdpOffer);
  
  // 상대편에게 전송 -> callee.js, onMessage('SDP')
  sendMessage('SDP', sdpOffer) 
});

onMessage('SDP', sdpAnswer => { 
  // callee 에서 넘어온 sdp 데이터를 이용해서 remote session description을 설정  
  rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(sdpAnswer)); 
});

/*앞의 코드에 이어서*/
rtcPeerConnection.addEventListener('track', e => {
  document.getElementById('remoteVideo').srcObject = new MediaStream([e.track])
});

})();