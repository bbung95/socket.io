const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const { v4: uuidV4 } = require("uuid");

app.set("view engine", "ejs");
app.use(express.static("public"));
// for parsing application/json
app.use(bodyParser.json());
// for parsing application/xwww-
app.use(bodyParser.urlencoded({ extended: true }));

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

var room = mongoose.Schema({
  roomName: "string",
});

// 로컬페이지 접속시 기본 출력 페이지
app.get("/", (req, res) => {
  var Room = mongoose.model("roomlists", room);
  Room.find(function (err, data) {
    console.log(data);
    res.render("list", { data: data });
  });
});

app.post("/create_protocol", (req, res) => {
  let post = req.body;
  let Room = mongoose.model("roomlist", room);
  let roomlist = new Room({ roomName: post.roomName });
  roomlist.save(function (err, data) {
    if (err) {
      console.log(error);
    } else {
      console.log("Saved!");
      res.redirect("/");
    }
  });
});

app.get("/room", (req, res) => {
  res.render("socket", { roomId: req.query.roomId });
});

io.on("connection", (user) => {
  // 접속시 io. 커넥션
  console.log("a user connected");

  let dis;
  //룸 조인
  user.on("roomjoin", (msg) => {
    dis = msg;
    // room_user list 추가
    let List = mongoose.model("room_" + msg.room, list);
    let newList = new List({ name: msg.name });
    newList.save(function (error, data) {
      if (error) {
        console.log(error);
      } else {
        console.log("user 추가");

        loadList(user, msg);
        loadChat(user, msg);
      }
      console.log(msg.name + "님이 " + msg.room + "에 입장하셨습니다.");
      //io.to(msg.room).emit("roomjoin", msg);
      user.join(msg.room, () => {});
    });
    ////////////////////////
  });

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
    var msg = dis;
    console.log(msg.name + "님이 " + msg.room + "에서 퇴장하셨습니다.");
    io.to(msg.room).emit("removelist", msg);

    // mongodb remove
    removeList(msg);
    ///////////////

    //io.to(msg.room).emit("roomleave", msg);
    user.leave(msg.room, () => {});
    console.log("user disconnected");
  });
});

// 3000포트로 접속시 콘솔 출력
server.listen(3000, () => {
  console.log("listening on * : 3000");
});

///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////

function chatList(msg) {
  var Chat = mongoose.model("chat_" + msg.room, chat);
  var newChat = new Chat({ name: msg.name, msg: msg.msg });
  newChat.save(function (error, data) {
    if (error) {
      console.log(error);
    } else {
      console.log("Saved!");
    }
  });
}
function loadChat(user,msg){
  var Chat = mongoose.model("chat_"+msg.room, chat);
  Chat.find(function(error,data){
    if (error) {
      console.log(error);
    } else {
      console.log(data);
      io.to(user.id).emit("loadchat", data);
      //io.sockets.socket(user.id).emit('loadlist', data);
    }
  })
}
function loadList(user, msg) {
  let List = mongoose.model("room_" + msg.room, list);
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
  if (msg) {
    let List = mongoose.model("room_" + msg.room, list);
    List.remove({ name: msg.name }, function (err, output) {
      console.log("user삭제");
      if (err) {
        console.log(error);
      }
    });
  }
}
