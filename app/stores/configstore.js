Flux = require('flux-react');

var ConfigStore = Flux.createStore({
	config: {
		rating: true,
		commentsNumber: 6,
		fiveRateNumber: 30,
		voteRateTotal: 45,
		albumArt: 'http://hiphopdx.local/s/img/album_thumbnail.png',
		commentsUrl: 'http://localhost:8000/commentdata.json',
		pageNumber: 0,
		postId: 1118,
		sortBy: 'latest'
	},
	actions: [
		configAction.sortChange,
		configAction.incrementCommentNum,
		configAction.pageNumber
	],
	exports: {
		config : config
	} 
});

module.exports = ConfigStore;