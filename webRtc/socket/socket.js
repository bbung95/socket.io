const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// 로컬페이지 접속시 기본 출력 페이지
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/socket.html");
});

// app.get("/room" , (req,res) =>{
//   res.sendFile(__dirname+"/socket.html");
// });

io.on("connection", (user) => {
  // 접속시 io. 커넥션
  console.log("a user connected");

  // room 생성
  //////////////////////
  user.on('create', (msg) => {
    io.emit('create', msg);
  })

  //룸 조인
  user.on("roomjoin", (msg) => {
    console.log(msg.name+'님이 '+msg.room+'에 입장하셨습니다.');
    io.to(msg.room).emit('roomjoin', msg);
    user.join(msg.room, () =>{
    });
    io.to(msg.room).emit('addlist', msg);
  })

  // user.on('userlist', (msg) =>{
  //   user.to(msg.room).emit('userlist', msg);
  // })

  user.on('roomleave', (msg) =>{
    console.log(msg.name+'님이 '+msg.room+'에서 퇴장하셨습니다.')
    io.to(msg.room).emit('removelist', msg);
    io.to(msg.room).emit('roomleave', msg);
    user.leave(msg.room, ()=>{
    })
  })
  //////////////////////////

  // 클라이언트가 보낸 메시지 user.emit
  user.on("chat message", (msg) => {
    console.log("message :" + msg.msg);
    io.to(msg.room).emit("chat message", `${msg.name} : ${msg.msg}`);
  });

  // 접속해제시 socket. 디스커넥션
  user.on("disconnect", () => {
    console.log("user disconnected");
   // user.broadcast.emit("chat message", `님이 나가셨습니다.`);
  });
});

// 3000포트로 접속시 콘솔 출력
server.listen(3000, () => {
  console.log("listening on * : 3000");
});
