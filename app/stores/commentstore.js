var flux = require('flux-react'),
	request = require('superagent'),
	validate = require('validate.js'),
	actionComment = require('../actions/commentactions');

var CommentStore = flux.createStore({
	data: [],
	replyId: null,
	errors: {},
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
		actionComment.addComment,
		actionComment.validateComment,
		actionComment.addReply,
		actionComment.setReplyId,
		actionComment.populateConfig,
		actionComment.callCommentList
	],
	callCommentList: function () {
		var InitedData,
			self = this;
		request.get(this.config.commentsUrl).set('Accept', 'application/json').end(
			function (res) {
			this.data = res.body;
			this.emit('comment.loaded');
		}.bind(this));
	
		// this.data = self.data;
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
	validateComment: function (commentObj) {
		this.errors = {};
		//run throught a validator to check the input out.
		var constraints = {
			'author' : {presence: true, length: {minimum: 2, maximum: 20} },
			'email': {presence: true, email: true},
			'comment' : {presence: true},
		};
		var validateSubmission = validate({
			'comment': commentObj.commentbody,
			'email': commentObj.author.email, 
			'author': commentObj.author.name},
		constraints);
		//TODO Make error states 
		if (validateSubmission) {
			console.log(validateSubmission);
			return;
		}
	},
	setReplyId: function (id) {
		this.replyId = id;
		this.emit('comment.replyset');
	},
	addComment: function (commentObj) {	
	var comments = this.data;
		this.errors = this.validateComment(commentObj);
		this.emit('errors.updated');
		// if (this.errors.code == 0) {
			comments.concat([commentObj]);
			this.emit('comment.added');
		// } 
	},
	addReply: function (commentObj, replyId) {
		var comments = this.data,
			chosenReply = this.objectFindByKey(comments, 'id', replyId);
		this.errors = this.validateComment(commentObj);
		this.emit('errors.updated');
		commentObj.id = 19;
		chosenReply.replies.push(commentObj);
		this.replyId = null;
		this.emit('comment.added');
		this.emit('comment.replyset');
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
		}
	} 
});

module.exports = CommentStore;