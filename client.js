

// our bot variable
var bot;

var onConnect = function() {
  //console.log("Connected to Toby!");
  app.online = true;
  bot.info("initial_info");
  document.onkeydown = checkKey;

}

var onDisconnect = function() {
  app.online = false;
  app.id = "";
  app.prompt = "username: ";
  app.lines = [];
}

var onMessage = function(message) {
  if (message.tags[0] == "initial_info") {
    app.type = message.payload.type;
    app.lines.push({text: "Connected!"});
    app.prompt = ">>> ";
    app.focus();
  } else if (message.tags[0] == "info") {
    app.displayInfo(message.payload);
  } else {

    var tags = " ";
    for (var i=0; i<message.tags.length; i++) {
      if (message.tags[i].length > 0)
        tags += "#" + message.tags[i] + " ";
    }

    // display message if available, otherwise stringify the payload
    if ('message' in message.payload) {
      app.lines.push({from: message.from, text: message.payload['message'] + tags, time: moment().format("H:mm:ss")});
    } else if ('png' in message.payload) {
      app.lines.push({from: message.from, image: "data:image/png;base64," + message.payload['png'], time: moment().format("H:mm:ss")});
    } else if ('online' in message.payload) {
      app.lines.push({text: message.payload['online'] + ' is online', time: moment().format("H:mm:ss"), color: "yellow"});
    } else if ('offline' in message.payload) {
      app.lines.push({text: message.payload['offline'] + ' is offline', time: moment().format("H:mm:ss"), color: "red"});
    } else {
      app.lines.push({from: message.from, text: JSON.stringify(message), time: moment().format("H:mm:ss")});
    }

    if ($.inArray(message.from, app.hidden) == -1) app.scrollDown();
  }
}

var app = new Vue({
  el: "#app",
  data: {
    id: "",
    type: "",
    command: "",
    prompt: "username: ",
    history: [],
    historyIndex: -1,
    online: false,
    lines: [],
    hidden: [],
    mainColor: "white",
    fromColor: "aqua",
    timeColor: "grey"
  },
  methods: {
    scrollDown: function() {
        setTimeout(function() {
          window.scrollTo(0,document.body.scrollHeight);
        }, 1); //small timeout
    },
    focus: function() {
      document.getElementById('prompt').focus();

    },
    println: function(text, from, color) {
        app.lines.push({text: text, from: from || false, color: color || app.mainColor});
        app.scrollDown();
    },
    focus: function(e) {
      document.getElementById('prompt').focus();
    },
    enterUsername: function(e) {
      e.preventDefault();
      app.id = app.command;
      app.command = "";
      app.prompt = "password: ";
    },
    enterPassword: function(e) {
      e.preventDefault();
      var sk = app.command;
      app.command = "";
      app.prompt = "";
      bot = new Bot(app.id, sk, onConnect, onDisconnect, onMessage);
      bot.start();
    },
    enterCommand: function(e) {
      e.preventDefault();

      var command = app.command;

      app.history.push(app.command);
      app.historyIndex = app.history.length;

      app.println(app.prompt + app.command);
      app.command = ""; // clear

      if (!command) return;
      var command_split = command.split(" ");

      switch(command_split[0]) {
        // send message
        case "s":
        case "send":
          var message = removeHashtags(command_split.slice(1).join(" "));
          var tags = findHashtags(command_split.slice(1).join(" "));
          bot.send({message: message}, tags, '');
          break;

        // get bot information
        case "i":
        case "info":
          bot.info('info');
          break;

        // follow tags (standard only)
        case "f":
        case "follow":
          if (command_split.length > 1) {
            bot.follow(findHashtags(command_split.splice(1).join(" ")), "followed");
            app.command = "";
          } else {
            app.println("usage: (f)ollow #tag1 #tag2 ...", false, red);
          }
          break;

        // unfollow tags (standard only)
        case "u":
        case "unfollow":
          if (command_split.length > 1) {
            bot.unfollow(findHashtags(command_split.splice(1).join(" ")), "unfollowed");
            app.command = "";
          } else {
            app.println("usage: (u)nfollow #tag1 #tag2 ...", false, red);
          }
          break;

        // for users, create bot
        // for standard bots, create socket
        case "c":
        case "create":
          if (app.type == "user") {
            if (command_split.length < 3) {
              println("usage: (c)reate <newBotId> <newBotSk>", false, "red");
              break;
            }
            bot.createBot(command_split[1], command_split[2], "created");

          } else if (app.type == "standard") {
            if (command_split.length < 2) {
              println("usage: (c)reate <persist>", false, "red");
              break;
            }
            bot.createSocket(command_split[1], "created");
          } else if (app.type == "socket") {
            println("warning: that will kick you off", false, "red");
          }

          break;

        case "r":
        case "rm":
        case "remove":
          if (app.type == "user") {
            if (command_split.length < 2) {
              println("usage: (r)emove <botId>", false, "red");
              break;
            }
            bot.removeBot(command_split[1], "removed");

          } else if (app.type == "standard") {
            if (command_split.length < 2) {
              println("usage: (r)emove <socketId>", false, "red");
              break;
            }
            bot.removeSocket(command_split[1], "removed");
          } else if (app.type == "socket") {
            println("warning: that will kick you off", false, "red");
          }
          break;

        case "on":
        case "hooks on":
          if (command_split.length > 1) {
            bot.enableHooks(command_split[1], "enabled");
          } else {
            app.println("usage: hooks (on) <hookSecret>", false, "red");
          }
          break;

        case "off":
        case "hooks off":
          bot.disableHooks("disabled");
          break;

        // hide bots
        case "hide":
          if (command_split.length > 1) {
            command_split.splice(1).forEach(function(id) {
              app.hidden.push(id);
            });
          } else {
            app.println("usage: hide <botId> ...");
          }
          break;

        // unhide all bots
        case "unhide":
          app.hidden = []; break;

        case "h":
        case "help":
          app.displayHelp(); break;

        // clear terminal
        case "cl":
        case "clear":
          app.lines = []; break;

        case "q":
        case "quit":
        case "logout":
        case "exit":
          location.reload();
        // empty
        case "":
          break;

        // command not found
        default:
          app.println('-toby: ' + command_split[0] + ": command not found", false, "red");
      }
    },

    // TODO
    displayInfo(info) {

      if (app.type == "user") {
        var bots = info.bots;
        var online = "";
        var offline = "";
        for (var i=0; i<bots.length; i++) {
          if (bots[i].online) online += bots[i].id + " ";
          else offline += bots[i].id + " ";
        }
        var divider = "- - - - - - - - - - - - - - - - - - - - - - - - - - - - -";

        app.println(divider, false, "yellow");
        app.println("ID: " + info.id, false, "springgreen");
        app.println("Type: " + info.type, false, "springgreen");
        app.println("Online bots: " + online, false, "springgreen");
        app.println("Offline bots: " + offline, false, "springgreen");
        app.println(divider, false, "yellow");

      } else if (app.type == "standard") {
        app.println(JSON.stringify(info), false, "yellow");
      } else if (app.type == "socket") {
        app.println(JSON.stringify(info), false, "yellow");
      }
    },

    displayHelp() {
      if (app.type == "user") app.println(["(i)nfo", "(s)end", "(c)reate bot", "(r)emove bot", "(q)uit"], false, "yellow");
      if (app.type == "standard") app.println(["(i)nfo", "(s)end", "(f)ollow", "(u)nfollow", "(c)reate socket", "(r)emove socket", "hooks (on)", "hooks (off)"], false, "yellow");
      if (app.type == "socket") app.println(["(i)nfo", "(s)end", "(q)uit"], false, "yellow");
    },

  }
});

focus = function() {
  document.getElementById('prompt').focus();
}

checkKey = function(e) {
  if (!app.online) return;
    switch (e.keyCode) {
        case 38:
            // up
            if (app.historyIndex > 0) {
              app.historyIndex -= 1;
              app.command = app.history[app.historyIndex];
            }
            break;
        case 40:
            // down
            if (app.historyIndex < app.history.length) {
              app.historyIndex += 1;
              app.command = app.history[app.historyIndex];
            }
            break;
    }
};
