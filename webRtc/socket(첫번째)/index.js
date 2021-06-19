const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// 로컬페이지 접속시 기본 출력 페이지
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", (user) => {
  // 접속시 io. 커넥션
  console.log("a user connected");
  
  // 클라이언트가 보낸 메시지 socket.emit
  user.on("chat message", (msg) => {
    console.log("message :" + msg);
    io.emit('chat message', msg);
  });

  // 접속해제시 socket. 디스커넥션
  user.on("disconnect", () => {
    console.log("user disconnected");
  });
});

// 3000포트로 접속시 콘솔 출력
server.listen(3000, () => {
  console.log("listening on * : 3000");
});
