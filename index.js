const express = require("express");
const app = express();
const PORT = process.env.PORT||3000;
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { v4: uuidV4 } = require("uuid");

//const { PeerServer } = require('peer');
//const peerServer = PeerServer({ port: 9000, path: '/myapp' });

///// 외부 명령어 실행
const exec = require('child_process').exec;

var prces = exec('peerjs --port 3001');

prces.stdout.on('data', function(data) {
  console.log(data.toString());
}); // 실행 결과

prces.stderr.on('data', function(data) {
  console.error(data.toString());
});

//////



app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect(`/${uuidV4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (user) => {
  user.on("join-room", (roomId, userId) => {
    user.join(roomId);
    user.to(roomId).emit('uesr-connected', userId);

    user.on('disconnect', ()=>{
        user.to(roomId).emit('user-disconnected',userId);
    })
  });
});

server.listen(PORT, () => {
  console.log("listening on * : 3000");
});
