const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const mongoose = require("mongoose");

////////

mongoose.connect("mongodb://localhost:27017/socket", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
// 3. 연결된 testDB 사용
var db = mongoose.connection;
// 4. 연결 실패
db.on("error", function () {
  console.log("Connection Failed!");
});
// 5. 연결 성공
db.once("open", function () {
  console.log("Connected!");
});

var chat = mongoose.Schema({
  name: "string",
  msg: "string",
});

var list = mongoose.Schema({
  name: "string",
});

// 7. 정의된 스키마를 객체처럼 사용할 수 있도록 model() 함수로 컴파일
//var Chat = mongoose.model('Schema', chat);

// 8. Student 객체를 new 로 생성해서 값을 입력

// // 10. Student 레퍼런스 전체 데이터 가져오기
// Chat.find(function(error, chat){
//   console.log('--- Read all ---');
//   if(error){
//       console.log(error);
//   }else{
//       console.log(chat);
//   }
// })
/////////

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
  user.on("create", (msg) => {
    io.emit("create", msg);
  });

  let dis;
  //룸 조인
  user.on("roomjoin", (msg) => {
    dis = msg;
    // room_user list 추가
    let List = mongoose.model(msg.room + "_user", list);
    var newList = new List({ name: msg.name });
    newList.save(function (error, data) {
      if (error) {
        console.log(error);
      } else {
        console.log("user 추가");

        loadList(user,msg);
      }
      console.log(msg.name + "님이 " + msg.room + "에 입장하셨습니다.");
      io.to(msg.room).emit("roomjoin", msg);
      user.join(msg.room, () => {});
    });
    ////////////////////////
  });

  // user.on('userlist', (msg) =>{
  //   user.to(msg.room).emit('userlist', msg);
  // })

  user.on("roomleave", (msg) => {
    console.log(msg.name + "님이 " + msg.room + "에서 퇴장하셨습니다.");
    io.to(msg.room).emit("removelist", msg);

    // mongodb remove
    removeList(msg);
    ///////////////

    io.to(msg.room).emit("roomleave", msg);
    user.leave(msg.room, () => {});
  });
  //////////////////////////

  // 클라이언트가 보낸 메시지 user.emit
  user.on("chat message", (msg) => {
    console.log("message :" + msg.msg);

    // mongodb insert
    chatList(msg);
    /////////////////

    io.to(msg.room).emit("chat message", `${msg.name} : ${msg.msg}`);
  });

  // 접속해제시 socket. 디스커넥션
  user.on("disconnect", () => {
    removeList(dis);
    console.log("user disconnected");
    // user.broadcast.emit("chat message", `님이 나가셨습니다.`);
  });
});

// 3000포트로 접속시 콘솔 출력
server.listen(3000, () => {
  console.log("listening on * : 3000");
});

function chatList(msg) {
  var Chat = mongoose.model(msg.room, chat);
  var newChat = new Chat({ name: msg.name, msg: msg.msg });
  newChat.save(function (error, data) {
    if (error) {
      console.log(error);
    } else {
      console.log("Saved!");
    }
  });
}

function loadList(user, msg) {
  let List = mongoose.model(msg.room + "_user", list);
  List.find(function (error, data) {
    if (error) {
      console.log(error);
    } else {
      console.log(data);
      io.to(user.id).emit("loadlist", data);
      //io.sockets.socket(user.id).emit('loadlist', data);
      user.to(msg.room).emit("addlist", msg);
    }
  });
}

function removeList(msg) {
  if(msg){
  let List = mongoose.model(msg.room + "_user", list);
  List.remove({ name: msg.name }, function (err, output) {
    console.log("user삭제");
    if (err) {
      console.log(error);
    }
  });
}
}
