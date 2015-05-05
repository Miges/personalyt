
Urls = new Mongo.Collection('ytlist');
Tags = new Mongo.Collection('tags');

var played = [];
var ready = false;
var readyCollection = false;
if (Meteor.isClient) {

	var searchResults = new ReactiveVar([]);



	// counter starts at 0



	onYouTubeIframeAPIReady = function () {

		console.log("************************ ready set");
		// New Video Player, the first argument is the id of the div.
		// Make sure it's a global variable.
		ready = true;
	};

	YT.load();


var getSelect2Data = function () {
	var tags = Tags.find().fetch();
	var currentId = 0;
	var select2data = _.map(tags, function (val) {
		return _.extend({id: currentId++}, val);
	});

	return select2data;
}
var SetupSelect2 = function (element) {
	element.select2({
		allowClear: true,
		data: getSelect2Data(),
		tags: "true",
		createSearchChoice: function (term) {
			return {id: -1, text: term, isANewTag: true};
		},
		initSelection: function (element, callback) {
			//callback(initTags);
		}

	});
};

	var ResetSelect2s = function () {
		$('.select2').select2({
			allowClear: true,
			data: getSelect2Data(),
			tags: "true",
			createSearchChoice: function (term) {
				return {id: -1, text: term, isANewTag: true};
			},
			initSelection: function (element, callback) {
				//callback(initTags);
			}

		});
	}
	Template.searchResult.onRendered(function() {
		console.log( '#select2' + this.data.id.videoId.toString);
		console.log( this.$('#select2' + this.data.id.videoId.toString()));
		SetupSelect2(this.$('#select2' + this.data.id.videoId.toString()));

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
	});

	Template.searchResult.events({
		'change .slider': function (event, template) {
			console.log(event.target.dataset.videoid);
			console.log(template.$('#' + event.target.id).val());
		},

		'change .select2': function (event, template) {
			var thePage = template.data;
			//I.e. it was cleared.
			if (!event.added && event.removed)
			{

			}
			//I.e. it was changed.
			else if (event.added)
			{
					if (event.added.isANewTag)
					{
						event.added.isANewTag = undefined;
						event.added.id = undefined;
						Tags.insert(event.added);
					}
			}
			else
			{

			}
		}
	});

	Template.hello.onRendered(function(){
		this.subscribe('tags', function(){
		});

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
		},
		searchResults: function () {
			return searchResults.get();

		},
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
		},
		'submit #search': function (event) {
			event.preventDefault();
			Meteor.call('searchVideos', event.target.query.value , function(err, res)
			{
				searchResults.set(res.items);
				console.log(res.items);
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
	Meteor.publish('tags', function()
	{
		return Tags.find();
	});



}
