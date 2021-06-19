(async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    document.getElementById('localVideo').srcObject = mediaStream;
  
    // 이후 코드는 모두 이 async 함수 안에 작성한다.
    const rtcPeerConnection = new RTCPeerConnection();
mediaStream.getTracks().forEach(track => rtcPeerConnection.addTrack(track));
  
/*앞의 코드에 이어서*/
onMessage('SDP', async sdpOffer => {  
  // caller 에서 넘어온 sdp 데이터를 이용해서 remote session description을 설정  
  await rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(sdpOffer)); 

  // answer 타입의 session description을 생성해서 local에 설정
  const sdpAnswer = await rtcPeerConnection.createAnswer();
  await rtcPeerConnection.setLocalDescription(sdpAnswer);

  // caller에게 응답을 되돌려줌
  sendMessage('SDP', sdpAnswer);
}); 

/*앞의 코드에 이어서*/
rtcPeerConnection.addEventListener('track', e => {
  document.getElementById('remoteVideo').srcObject = new MediaStream([e.track])
});

})();