
Urls = new Mongo.Collection('ytlist');

var played = [];
var ready = false;
var readyCollection = false;
if (Meteor.isClient) {



  // counter starts at 0



  onYouTubeIframeAPIReady = function () {

    console.log("************************ ready set");
    // New Video Player, the first argument is the id of the div.
    // Make sure it's a global variable.
ready = true;
  };

  YT.load();


  Template.hello.onRendered(function(){
    this.subscribe('urls', function(){
      console.log("loaded collection");
      readyCollection = true;
    });
    timeLoop();
  });

  var timeLoop = function()
  {
    console.log("inTL");
    if (!ready || !readyCollection)
      {
        Meteor.setTimeout(timeLoop, 1000);
        console.log("not ready");
      }
      else
        {
          console.log("ready");
          setupYT();
        }
  };

  var setupYT = function()
  {
    var x = Urls.findOne();
    console.log("V ID", x);
    played.push(x.url);
    player = new YT.Player("player", {

      height: "400",
      width: "600",

      // videoId is the "v" in URL (ex: http://www.youtube.com/watch?v=LdH1hSWGFGU, videoId = "LdH1hSWGFGU")
      videoId: x.url,
      playerVars:
      {
        controls: 0,
      },
      // Events like ready, state change,
      events: {

        onReady: function (event) {

          // Play video when player ready.
          event.target.playVideo();
        },

        onStateChange: function (event) {
          console.log("STATE CHANGE!", event, arguments);
          //A video ended
          if (event.data === 0)
            {
              var x = Urls.findOne({url: { $nin: played}});
              played.push(x.url);
              console.log("PLAYED:", played);
              player.loadVideoById(x.url);
            }
          },

        }

      });

  }




  Template.hello.helpers({
    yturl: function () {
      return Urls.find({}, {sort: { dateAdded: 1} });
    }
  });

  Template.hello.events({
    'submit #formid': function (event) {
      console.log(event);
      // increment the counter when button is clicked
      Urls.insert({url: event.target.yturl.value, dateAdded: new Date()}, function(err)
      {
        console.log(err);
      });
      return false;
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
  Meteor.publish('urls', function()
  {
    return Urls.find();
  });


  
}
