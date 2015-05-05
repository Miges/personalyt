
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


