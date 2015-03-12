var flux = require('flux-react'),
	request = require('superagent'),
	validate = require('validate.js'),
	actionComment = require('../actions/commentactions');

var CommentStore = flux.createStore({
	data: [],
	replyId: null,
	errors: {},		
	sortBy: 'latest',
	config: {
		rating: false,
		commentsNumber: 0,
		fiveRateNumber: 30,
		voteRateTotal: 45,
		albumArt: 'http://hiphopdx.local/s/img/album_thumbnail.png',
		commentsUrl: 'http://hiphopdx.local/comment/215',
		pageNumber: 0,
		postId: 1118,
	},
	actions: [
		actionComment.addComment,
		actionComment.addReply,
		actionComment.setReplyId,
		actionComment.populateConfig,
		actionComment.callCommentList,
		actionComment.sortCommentList,
		actionComment.voteComment
	],
	callCommentList: function () {
		//this is the mainquery to establish an ajax request to populate the `this.data` store within this flux store.
		//sortBy is also passed so we can reuse this with the sortIncator actions. 
		var self = this, 
			sortOrder = this.sortBy;
		request.get(this.config.commentsUrl).query({'sort': sortOrder, 'action': 'get'}).set('Accept', 'application/json').end(
			function (res) {
			this.data = res.body;
			this.assessCommentCount();
			this.emit('comment.loaded');
		}.bind(this));
		
		// this.data = self.data;
	},
	sortCommentList: function (newSort) {
		this.sortBy = newSort;
		this.emit('sort.changed')
		this.callCommentList();
	},
	voteComment: function (id, action) {
		request.post(this.config.commentsUrl).withCredentials().type('application/json;charset=UTF-8').send({'id': id, 'action': action}).end(
			function (res) {
				console.log(res.body);
		});
	},
	setReplyId: function (id) {
		this.replyId = id;
		this.emit('comment.replyset');
	},
	addComment: function (commentObj) {	
		console.log(this.data, 'before');
		this.validateComment(commentObj);
		if (this.errors) {
			this.emit('errors.updated');
			return;
		}
		commentObj.id = 20;
		commentObj.replies = [];
		// request.post(this.config.commentsUrl).withCredentials().type('application/json;charset=UTF-8').send(commentObj).end(function (res) {
		// 	console.log(res);
		// })
		// if (this.errors.code == 0) {
		this.data.push(commentObj);
	
		console.log(this.data, 'after');
		this.emit('comment.added');	
		this.assessCommentCount();
		// } 
	},
	addReply: function (commentObj, replyId) {
		var comments = this.data,
			chosenReply = this.objectFindByKey(comments, 'id', replyId);
		this.validateComment(commentObj);
		this.emit('errors.updated');
		commentObj.id = 19;
		chosenReply.replies.push(commentObj);
		this.replyId = null;

		this.emit('comment.added');
		this.assessCommentCount();
		this.emit('comment.replyset');
	},
	validateComment: function (commentObj) {
		this.errors = {};
		//run throught a validator to check the input out.
		var constraints = {
			'author' : {presence: true, length: {minimum: 2, maximum: 20} },
			'email': {presence: true, email: true},
			'comment' : {presence: true},
		};
		var validateSubmission = validate({
			'comment': commentObj.comment,
			'email': commentObj.author.email, 
			'author': commentObj.author.name},
		constraints);
		this.errors = validateSubmission;
	},
	populateConfig: function () {
		//TODO: move the configs of the json out to this list. or we can technically grab it from the document as an embed json object. 
	},
	objectFindByKey: function (array, key, value) {
	    for (var i = 0; i < array.length; i++) {
	        if (array[i][key] === value) {
	            return array[i];
	        }
	    }
	    return null;
	},
	assessCommentCount: function () {
		toCount = this.data;
		baseCount = toCount.length;
		for (var it = 0, len = baseCount; it < len; it++ ) {
			if (toCount[it].replies) {
				baseCount += toCount[it].replies.length;
			}
		}
		this.config.commentsNumber = baseCount;
		this.emit('config.addedComment');
	},
	exports: {
		getInitialData: function () {
			return this.callCommentList();
		},
		getCommentsList: function() {
			return this.data;
		},
		getReplyId: function () {
			return this.replyId;
		},
		getConfig: function () {
		 	return this.config; 
		},
		getErrors: function() {
			return this.errors;
		}
	} 
});

module.exports = CommentStore;