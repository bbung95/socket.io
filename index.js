const express = require("express");
const app = express();
const PORT = process.env.PORT || 82;
const server = require("http").Server(app);
const io = require("socket.io")(server, { cors: { origin: "*" } });
const mongoose = require("mongoose");
const { v4: uuidV4 } = require("uuid");
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

// 업로드
const multer = require("multer");
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, __dirname + "/public/imgFile");
    },
    filename: function (req, file, cb) {
      cb(
        null,
        new Date().valueOf() +
          file.originalname.slice(
            file.originalname.lastIndexOf("."),
            file.originalname.length
          )
      );
    },
  }),
});

// 현재시간
const moment = require("moment");
require("moment-timezone");
moment.tz.setDefault("Asia/Seoul");
var date = moment().format('a HH:mm');


////////////////// mongodb///////////////
mongoose.connect(
  "mongodb+srv://mongo:mongodb@cluster0.atnbf.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

var db = mongoose.connection;

db.on("error", function () {
  // 연결실패
  console.log("Connection Failed!");
});

db.once("open", function () {
  // 연결성공
  console.log("Connected!");
});

var chat = mongoose.Schema({
  userId: "string",
  msg: "string",
  img: "string",
  name: "string",
  profile: "string",
  date : "string",
});

var list = mongoose.Schema({
  userId: "string",
});

var room = mongoose.Schema({
  userId: "String",
  roomNo: "string",
  target: "String",
  name: "string",
  profile: "string",
  type: "string",
});
////////////////////////////////////////

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use("/peerjs", peerServer);

app.get("/", (req, res) => {
  res.redirect(`/${uuidV4()}`);
});

app.get("/chatList", (req, res) => {
  console.log(req.query);
  console.log("채팅목록");
  res.render("chatList", req.query);
});

app.get("/chat", (req, res) => {
  console.log("채팅입장");
  console.log(req.query);
  if (req.query.type == 1) {
    res.render("chatRoom", req.query);
  } else {
    res.render("groupRoom", req.query);
  }
});

app.get("/:room", (req, res) => {
  // 1:1 화상채팅
  res.render("room", { roomId: req.params.room });
});

app.get("/group/:room", (req, res) => {
  // 그룹 화상채팅
  res.render("room", { roomId: req.params.room });
});

app.post("/upload", upload.single("uploadFile"), (req, res) => {
  console.log(req.file); // 클라이언트에서 넘어온 파일에 대한 정보가 req.file에 FILE 객체로 저장되어 있습니다.
  res.send(req.file);
});

io.on("connection", (socket) => {
  // 접속시 io. 커넥션
  console.log("a user connected");

  ///////// RTC////////////
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId);

    
    
    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", userId);
    });
  });
  
  socket.on("screenShare", (roomId, screenStream)=>{
    console.log(screenStream);
    io.emit("screenShare");
  })

  ////////// CHAT//////////
  socket.on("roomlist", (data) => {
    var Room = mongoose.model("roomlists", room);
    Room.find({ userId: data.userId, type: data.type }, function (err, data) {
      console.log(data);
      io.to(socket.id).emit("roomlist", data);
    });
  });

  let dis;
  //룸 조인
  socket.on("roomjoin", (msg) => {
    // room_user list 추가

    let Room = mongoose.model("roomlists", room);
    let uuid = `${uuidV4()}`;
    let roomlist;
    if (msg.type == 1) {
      roomlist = new Room({
        userId: msg.userId,
        target: msg.target,
        roomNo: uuid,
        name: msg.targetName,
        profile: msg.targetProfile,
        type: msg.type,
      });
    } else {
      roomlist = new Room({
        userId: msg.userId,
        target: msg.target,
        roomNo: msg.roomNo,
        name: msg.targetName,
        profile: msg.targetProfile,
        type: msg.type,
      });
    }
    Room.findOne(
      { userId: msg.userId, target: msg.target, type: msg.type },
      function (error, data) {
        if (error) {
          console.log(error);
        } else {
          if (data == null || data == "") {
            console.log("방이 없습니다.");
            roomlist.save(function (err, data) {
              // Room.findOne(
              //   { userId: msg.userId, target: msg.target },
              //   function (error, data) {
              dis = data;
              saveList(socket, data);
              console.log("방 번호 : " + uuid);
              io.to(socket.id).emit("roomjoin", uuid);
              socket.join(data.roomNo);
            });
            // });
          } else {
            console.log("방이 존재합니다.");
            dis = data;
            saveList(socket, data);
            console.log("방 번호 : " + data.roomNo);
            io.to(socket.id).emit("roomjoin", data.roomNo);
            socket.join(data.roomNo);
          }
          console.log(msg.userId + " // roomjoin");
        }
      }
    );

    ////////////////////////
  });

  // 클라이언트가 보낸 메시지 user.emit
  socket.on("chat message", (msg) => {
    console.log("message :" + msg.msg);

    let Room = mongoose.model("roomlists", room);
    let roomlist = new Room({
      userId: msg.target,
      target: msg.userId,
      roomNo: msg.roomNo,
      name: msg.name,
      profile: msg.profile,
      type: msg.type,
    });
    if (msg.type == 1) {
      loadList(socket, msg);
      Room.findOne(
        { userId: msg.target, target: msg.userId, roomNo: msg.roomNo },
        function (error, data) {
          if (error) {
            console.log(error);
          } else {
            if (data == null) {
              roomlist.save(function (err, data) {});
            }
          }
        }
      );
    }

    // mongodb insert
    if (msg.img != 0) {
      setTimeout(chatList, 3000, msg);
    } else {
      chatList(msg);
    }
  });

  // 접속해제시 socket. 디스커넥션
  socket.on("disconnect", () => {
    var msg = dis;
    if (msg != null) {
      console.log(msg.userId + "님이 " + msg.roomNo + "에서 퇴장하셨습니다.");
      // io.to(msg.roomNo).emit("removelist", msg);

      // // mongodb remove
      leaveRoom(msg);

      // //io.to(msg.room).emit("roomleave", msg);
      socket.leave(msg.roomNo, () => {});
    }
    console.log("user disconnected");
  });
});

// 3000포트로 접속시 콘솔 출력
server.listen(PORT, () => {
  console.log("listening on * : 82");
});

///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////

function chatList(msg) {
  var Chat = mongoose.model("chat_" + msg.roomNo, chat);
  console.log(msg.img);
  var newChat = new Chat({
    userId: msg.userId,
    msg: msg.msg,
    img: msg.img,
    name: msg.name,
    profile: msg.profile,
    date : date,
  });
  newChat.save(function (error, data) {
    if (error) {
      console.log(error);
    } else {
      console.log("Saved!");
      io.to(msg.roomNo).emit("chat message", {
        userId: msg.userId,
        msg: msg.msg,
        img: msg.img,
        name: msg.name,
        profile: msg.profile,
        date: date,
      });
    }
  });
}

function loadChat(socket, msg) {
  var Chat = mongoose.model("chat_" + msg.roomNo, chat);
  Chat.find(function (error, data) {
    if (error) {
      console.log(error);
    } else {
      console.log("채팅목록");
      console.log(data);
      io.to(socket.id).emit("loadchat", data);
      //io.sockets.socket(user.id).emit('loadlist', data);
    }
  });
}

function loadList(socket, msg) {
  let List = mongoose.model("list_" + msg.roomNo, list);
  List.find({ userId: msg.target }, function (error, data) {
    if (error) {
      console.log(error);
    } else {
      console.log("유저리스트" + data);
      if (data == null || data == "") {
        console.log("채팅 알림");
        io.to(msg.roomNo).emit("chat notice", msg);
      }
      //io.to(socket.id).emit("loadlist", data);
      //io.sockets.socket(user.id).emit('loadlist', data);
      //socket.to(msg.roomNo).emit("addlist", msg);
    }
  });
}

function leaveRoom(msg) {
  if (msg) {
    let List = mongoose.model("list_" + msg.roomNo, list);
    List.remove({ userId: msg.userId }, function (err, output) {
      console.log("user삭제");
      if (err) {
        console.log(error);
      }
    });
  }
}

function saveList(socket, data) {
  let List = mongoose.model("list_" + data.roomNo, list);
  let newList = new List({ userId: data.userId });
  newList.save(function (error, data) {
    if (error) {
      console.log(error);
    } else {
      console.log("user 추가");
    }
    //io.to(msg.room).emit("roomjoin", msg);
  });
  //loadList(socket, data);
  loadChat(socket, data);
}
