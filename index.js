const express = require("express");
const app = express();
const PORT = process.env.PORT||3030;
const server = require("http").Server(app);
const io = require("socket.io")(server, { cors: { origin: "*" } });
//const ioo = require("socket.io")(server, { cors: { origin: "*" } });
const mongoose = require("mongoose");
const { v4: uuidV4 } = require("uuid");
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, { 
  debug : true
});

////////////////// mongodb///////////////
mongoose.connect(
  "mongodb+srv://mongo:mongodb@cluster0.atnbf.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

var db = mongoose.connection;

db.on("error", function () { // 연결실패
  console.log("Connection Failed!");
});

db.once("open", function () { // 연결성공
  console.log("Connected!");
});

var chat = mongoose.Schema({ // chat schema
  userId: "string",
  msg: "string",
  img: "string",
  nickname: "string",
  profile: "string",
});

var list = mongoose.Schema({ // list schema
  userId: "string",
});

var room = mongoose.Schema({ // room schema
  userId: "String",
  roomNo: "string",
  target: "String",
});
////////////////////////////////////////

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use("/peerjs", peerServer);

app.get("/", (req, res) => {
  res.redirect(`/${uuidV4()}`);
});

app.get("/:room", (req, res) => { // 1:1 화상채팅
  res.render("room", { roomId: req.params.room });
});

app.get("/group/:room", (req, res) => { // 그룹 화상채팅
  res.render("room", { roomId: req.params.room });
});

///////// RTC////////////
io.on("connection", (socket) => {
  console.log("RTC접속");
  socket.on("join-room", (roomId, userId) => {
    console.log(roomId);
    socket.join(roomId);
    socket.to(roomId).emit('uesr-connected', userId);
    
    socket.on('disconnect', ()=>{
      console.log("exit");
      socket.to(roomId).emit('user-disconnected',userId);
    })
  });

  socket.on("screenShare", (roomId)=>{
    console.log("화면공유");
    console.log(roomId);
    io.emit('screenShare');
  })
});
//////////////////////////

////////// CHAT ///////////
io.on("connection", (socket) => {
  // 접속시 io. 커넥션
  console.log("a user connected");

  socket.on("roomlist", (userId) => {
    var Room = mongoose.model("roomlists", room);
    Room.find({ userId: userId }, function (err, data) {
      console.log(data);
      io.to(socket.id).emit("roomlist", data);
    });
  });

  let dis;
  //룸 조인
  socket.on("roomjoin", (msg) => {
    // room_user list 추가

    let Room = mongoose.model("roomlists", room);
    let roomlist = new Room({
      userId: msg.userId,
      target: msg.target,
      roomNo: `${uuidV4()}`,
    });
    Room.findOne(
      { userId: msg.userId, target: msg.target },
      function (error, data) {
        if (error) {
          console.log(error);
        } else {
          if (data == null || data == "") {
            console.log("방이 없습니다.");
            roomlist.save(function (err, data) {
              Room.findOne(
                { userId: msg.userId, target: msg.target },
                function (error, data) {
                  dis = data;
                  saveList(socket, data);
                  console.log("ddd"+data.roomNo);
                  io.to(socket.id).emit("roomjoin", data.roomNo);
                  socket.join(data.roomNo, () => {});
                }
              );
            });
          } else {
            console.log("방이 존재합니다.");
            dis = data;
            saveList(socket, data);
            console.log("ddd"+data.roomNo);
            io.to(socket.id).emit("roomjoin", data.roomNo);
            socket.join(data.roomNo, () => {});
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
    });
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
    
    // mongodb insert
    if(msg.img != 0 ){
      setTimeout(chatList, 6000, msg)
    }else{
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
///////////////////////////

server.listen(PORT, () => {
  console.log("listening on * : 3030");
});

///////////////// chat function////////////////////
function chatList(msg) {
  var Chat = mongoose.model("chat_" + msg.roomNo, chat);
  console.log(msg.img);
  var newChat = new Chat({ userId: msg.userId, msg: msg.msg , img: msg.img , nickname:msg.nickname , profile:msg.profile});
  newChat.save(function (error, data) {
    if (error) {
      console.log(error);
    } else {
      console.log("Saved!");
      io.to(msg.roomNo).emit("chat message", {userId : msg.userId , msg :msg.msg , img: msg.img, nickname:msg.nickname , profile:msg.profile});
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
      console.log("유저리스트"+data);
      if(data == null || data == ''){
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
