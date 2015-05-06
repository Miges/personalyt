var ready = false;
var readyCollection = false;
var searchResults = new ReactiveVar([]);

var theParentTemp;
if (Meteor.isClient) {


	onYouTubeIframeAPIReady = function () {
		// New Video Player, the first argument is the id of the div.
		// Make sure it's a global variable.
		ready = true;
	};

	YT.load();

	Template.searchResult.onRendered(function() {
		Session.set('songsPlayed',[]);
		this.autorun(function () {
			var temp = Template.instance();
			var vid = Template.currentData().id.videoId;
			var theSong = SongsInDB.findOne({"youtube.videoId": vid});
			var initRating =  50;
			if (theSong && theSong.rating)
			{
				initRating = theSong.rating;
			}
			temp.$('#slider' + vid).noUiSlider({
				start: [initRating],
				range: {
					'min': 1,
					'max': 100
				},
				format: wNumb({
					decimals: 0
				}),
			}, true);


			resetTagControls(temp);


			if (!theSong || !theSong.tagIds){
				temp.$('#at' + vid.toString()).val("");
				return;
			}
			var initVal = "";
			theSong.tagIds.forEach(function (tag_id) {
				var theTag = Tags.findOne({_id: tag_id});
				initVal += "#" + theTag.text + " ";
			});
			temp.$('#at' + vid.toString()).val(initVal);


		});

	});

	var resetTagControls = function (temp) {
		var allTags = Tags.find().fetch();
		var acData = _.map(allTags, function (tag) {
			return tag.text;
		});

		temp.$('.tags-ac').atwho({
			at: "#",
			data: acData,
		});
	};

	Template.searchResult.helpers({
		'alreadyInMySongs': function () {
			var vid = this && this.id && this.id.videoId;
			var theSong = SongsInDB.findOne({"youtube.videoId": vid });
			if(theSong)
			{
				return "alreadyInMySongs";
			}

		}
	});
	Template.searchResult.events({
		'change .slider': function (event, template) {

			var theSong = SongsInDB.findOne({"youtube.videoId": template.data.id.videoId});
			var song_id = theSong && theSong._id;
			if (!theSong)
				{
					theSong = {};
					theSong.rating = 50;
					theSong.dateAdded = new Date();
					theSong.youtube = {
						videoId: template.data.id.videoId
					};
					try {
						theSong.name = template.data.snippet.title;

						theSong.thumbnailUrl = template.data.snippet.thumbnails.default.url;
					}
					catch(e)
					{}
					song_id = SongsInDB.insert(theSong);
				}
			var newRatingStr = template.$('#' + event.target.id).val();
			var newRating = Number(newRatingStr);
			SongsInDB.update({ _id: song_id}, { $set: { rating: newRating }});

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
				theSong.rating = 50;
				theSong.dateAdded = new Date();
				theSong.youtube = {
					videoId: template.data.id.videoId
				};
				try {
					console.log(template.data);
					theSong.name = template.data.snippet.title;

					theSong.thumbnailUrl = template.data.snippet.thumbnails.default.url;
				}
				catch(e)
				{}
				song_id = SongsInDB.insert(theSong);
			}
			var tagIds = [];
			tagsInput.forEach(function (tag) {
				var theTag = tag.trim();
				console.log(theTag);

				if (theTag === "") {
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
					resetTagControls(template);
					resetTagControls(theParentTemp);
				}
			});
			SongsInDB.update({ _id: song_id}, { $set: { tagIds: tagIds }});

		},

	});

	Template.main.onRendered(function(){
		this.subscribe('tags', function(){
		});

		this.subscribe('songsInDB', function(){
			readyCollection = true;
		});
		timeLoop();
theParentTemp = this;
		resetTagControls(this);
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
		var temp = Template.instance();
		var theTags = getInputTags(theParentTemp);
		var theSong = getWeightedSong(theTags);
		Session.set('songsPlayed',[theSong.youtube.videoId]);
		player = new YT.Player("player", {

			height: "400",
			width: "600",

			videoId: theSong.youtube.videoId,
			playerVars:
			{
				controls: 1,
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
						var theTags = getInputTags(theParentTemp);
						var theSong = getWeightedSong(theTags);
						var playedArr = Session.get('songsPlayed');
						playedArr.push(theSong.youtube.videoId);
						//theSong = SongsInDB.findOne({"youtube.videoId": { $nin: playedArr}});
						player.loadVideoById(theSong.youtube.videoId);

						Session.set('songsPlayed',playedArr);
					}
				},

			}

		});

	}




	Template.main.helpers({
		songs: function () {
			return SongsInDB.find({}, {sort: { dateAdded: -1} });
		},
		searchResults: function () {
			return searchResults.get();
		},
		tagText: function (tag_id) {
			var x = Tags.findOne(tag_id);
			return x && x.text;
		},
	});

	Template.main.events({
		'submit #search': function (event) {
			Meteor.call('searchVideos', event.target.query.value , function(err, res)
			{
				searchResults.set(res.items);
			});
			return false;
		},
		'click .remove-song': function (event,template) {
			var songId = event.target.dataset.songid;
			if(songId)			{
				SongsInDB.remove({_id: songId});
			}
		},
		'click .changeSong': function (event,template) {
			var videoId = event.target.dataset.vid;

			var playedArr = Session.get('songsPlayed');
			playedArr.push(videoId);

			player.loadVideoById(videoId);

			Session.set('songsPlayed',playedArr);
		},
		'submit #tagsForm': function (event) {
			event.preventDefault();
			var theTags = getInputTags(theParentTemp);
			var theSong = getWeightedSong(theTags);
			var playedArr = Session.get('songsPlayed');
			playedArr.push(theSong.youtube.videoId);
			//theSong = SongsInDB.findOne({"youtube.videoId": { $nin: playedArr}});
			player.loadVideoById(theSong.youtube.videoId);

			Session.set('songsPlayed',playedArr);

			return false;
		},
	});
}
var getWeightedSong = function(hashTags)
{
	var theTags = Tags.find({ text: { $in : hashTags }}).fetch();
	var tagIds = _.map(theTags, function(each){ return each._id; });
	var allSongs = SongsInDB.find({ 'tagIds' : { $in: tagIds} }).fetch();
	if (!allSongs || allSongs.length === 0)
		{
			allSongs = SongsInDB.find({}).fetch();
		}
		console.log(allSongs);
		var totalCount = 0;
		allSongs.forEach(function(each){
			if(!each.rating){
				return;
			}
			totalCount += each.rating;
		});
		var theSong;
		var theNumber = Math.floor(Math.random() * totalCount);
		var currentNum = 0;
		allSongs.forEach(function(each){
			var maxNum = currentNum;
			if(each.rating){
				maxNum += each.rating;
			}
			console.log(totalCount, theNumber, currentNum, maxNum);
			if (currentNum <= theNumber && maxNum >= theNumber)
				{
					theSong = each;
				}
				currentNum = maxNum;
		});
return theSong;

}

var getInputTags = function(template)
{
	var theTags = [""];
	try
	{
		var theTagString = template.$('#tagToPlay').val();
		var tagsSplit = theTagString.split("#");
		theTags = _.map(tagsSplit, function(tag){return tag.trim();})
	}
	catch(e)
	{}
	return theTags;
}
