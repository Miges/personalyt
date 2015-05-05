Router.configure({
	layoutTemplate: 'layout',
});

Router.route('/', {
	name: 'main',
	waitOn: function () {
		return [
			Meteor.subscribe('tags'),
			Meteor.subscribe('songsInDB'),
		];
	},
});
