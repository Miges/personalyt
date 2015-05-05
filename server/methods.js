YoutubeApi.authenticate({
	type: 'key',
	key: 'AIzaSyAxBzQ6zj0tJnGg_MXJ9ApbrvGIn3jmAaQ'
});

Meteor.methods({
	'searchVideos': function(search) {
		var response = Async.runSync(function(done) {
			YoutubeApi.search.list({
				part: "id,snippet",
				type: "video",
				maxResults: 5,
				q: search,
				maxResults: 50,
			}, function(err,res)
			{
				done(err, res);
			});
		});

		return response.result;
		//var x = YoutubeApi.search.list({
		//	part: "id",
		//	type: "video",
		//	maxResults: 5,
		//	q: search,
		//	maxResults: 50,
		//}, function()
		//{
		//	console.log(arguments);
		//});
	}
});