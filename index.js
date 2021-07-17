const express = require("express");
const app = express();
const PORT = process.env.PORT||3030;
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { v4: uuidV4 } = require("uuid");
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, { 
  debug : true
});

///// 외부 명령어 실행
// const exec = require('child_process').exec;

// var prces = exec('peerjs --port 3001');

// prces.stdout.on('data', function(data) {
//   console.log(data.toString());
// }); // 실행 결과

// prces.stderr.on('data', function(data) {
//   console.error(data.toString());
// });

//////
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use("/peerjs", peerServer);

app.get("/", (req, res) => {
  res.redirect(`/${uuidV4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit('uesr-connected', userId);

    socket.on('disconnect', ()=>{
      socket.to(roomId).emit('user-disconnected',userId);
    })
  });
});

server.listen(PORT, () => {
  console.log("listening on * : 3000");
});
