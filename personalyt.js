
SongsInDB = new Mongo.Collection('songsInDB');
Tags = new Mongo.Collection('tags');

var played = new ReactiveVar([]);
var ready = false;
var readyCollection = false;
if (Meteor.isClient) {

	var searchResults = new ReactiveVar([]);



	// counter starts at 0



	onYouTubeIframeAPIReady = function () {
		// New Video Player, the first argument is the id of the div.
		// Make sure it's a global variable.
		ready = true;
	};

	YT.load();

	Template.searchResult.onRendered(function() {
		this.$('#slider' + this.data.id.videoId.toString()).noUiSlider({
			start: [50],
			range: {
				'min': 0,
				'max': 100
			},
			format: wNumb({
				decimals: 0
			}),
		});

		var theSong = SongsInDB.findOne({ "youtube.videoId": this.data.id.videoId });
		if (theSong)
		{
			console.log("SONG!", theSong);
		}
		if (theSong && theSong.tagIds)
		{
			console.log();
			var theTagsString = "";
			theSong.tagIds.forEach(function (eachTagId) {
				var theTag = Tags.findOne(eachTagId);
				theTagsString += "#" + theTag.text + " ";
			});
			this.$('#' + this.data.id.videoId).val(theTagsString);
		}
		else
		{
			this.$('#' + this.data.id.videoId).val("");
		}

	});

	Template.searchResult.helpers({
		settings: function() {
			return {
				position: "bottom",
				limit: 20,
				rules: [
					{
						token: '#',
						collection: Tags,
						field: "text",
						template: Template.tag,
					},
				]
			};
		}
	});
	Template.searchResult.events({
		'change .slider': function (event, template) {
			console.log(event.target.dataset.videoid);
			console.log(template.$('#' + event.target.id).val());
		},

		'blur .tags-ac': function (event, template) {
			var tagsInput = event.target.value.split("#");
			if (tagsInput.length === 0 || (tagsInput.length === 1 && tagsInput[0].trim() === ""))			{
				return;
			}

			var theSong = SongsInDB.findOne({"youtube.videoId": template.data.id.videoId});
			var song_id = theSong && theSong._id;
			if (!theSong)
			{
				theSong = {};
				theSong.youtube = {
					videoId: template.data.id.videoId
				};
				song_id = SongsInDB.insert(theSong);
			}
			var tagIds = [];
			tagsInput.forEach(function (tag) {
				var theTag = tag.trim();
				console.log(theTag);
				if (theTag == "") {
					console.log("IS NULL");
					return;
				}
				var inDB = Tags.findOne({text: theTag});
				if (inDB) {
					tagIds.push(inDB._id);
					console.log("IS IN DB");
					return;
				}
				else {
					console.log("INSERTING!");
					var _id = Tags.insert({text: theTag});
					tagIds.push(_id);setTimeout
				}
			});
			SongsInDB.update({ _id: song_id}, { $set: { tagIds: tagIds }});
		},
	});

	Template.hello.onRendered(function(){
		this.subscribe('tags', function(){
		});

		this.subscribe('songsInDB', function(){
			readyCollection = true;
		});
		timeLoop();
	});

	var timeLoop = function()
	{
		if (!ready || !readyCollection)
		{
			Meteor.setTimeout(timeLoop, 1000);
		}
		else
		{
			setupYT();
		}
	};

	var setupYT = function()
	{
		var theSong = SongsInDB.findOne();
		played.set(played.get().push(theSong.youtube.videoId));
		player = new YT.Player("player", {

			height: "400",
			width: "600",

			// videoId is the "v" in URL (ex: http://www.youtube.com/watch?v=LdH1hSWGFGU, videoId = "LdH1hSWGFGU")
			videoId: theSong.youtube.videoId,
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
						theSong = SongsInDB.findOne({"youtube.videoId": { $nin: played.get()}});
						played.push(theSong.youtube.videoId);
						player.loadVideoById(theSong.youtube.videoId);
					}
				},

			}

		});

	}




	Template.hello.helpers({
		songs: function () {
			return SongsInDB.find({}, {sort: { dateAdded: 1} });
		},
		searchResults: function () {
			return searchResults.get();

		},
	});

	Template.hello.events({
		'submit #formid': function (event) {
			// increment the counter when button is clicked
			SongsInDB.insert({youtube: {videoId: event.target.yturl.value }, dateAdded: new Date()}, function(err)
			{
				console.log(err);
			});
			return false;
		},
		'submit #search': function (event) {
			event.preventDefault();
			Meteor.call('searchVideos', event.target.query.value , function(err, res)
			{
				searchResults.set(res.items);
			});
			return false;
		}
	});
}

if (Meteor.isServer) {
	Meteor.startup(function () {
		// code to run on server at startup
	});
	Meteor.publish('songsInDB', function()
	{
		return SongsInDB.find();
	});
	Meteor.publish('tags', function()
	{
		return Tags.find();
	});



}
