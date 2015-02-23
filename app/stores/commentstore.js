var Flux = require('flux-react'),
	actionComment = require('../actions/commentactions'),
	configStore = require('./configstore.js'),
	request = require('superagent'),
	validate = require('validate.js');

var CommentStore = Flux.createStore({
	data: [],
	replyId: null,
	errors: {},
	actions: [
		actionComment.addComment,
		actionComment.validateComment
		actionComment.addReply,
		actionComment.setReplyId,
		actionComment.formErrors
	],
	populateCommentList: function () {
		self = this;
		request.get(configStore.config.commentsUrl).set('Accept', 'application/json').end(function(res){
			self.data.push(res.body)});
		});
	}
	addComment: function (commentObj) {	
	var comments = this.data;
		this.errors = this.validateComment(commentObj);
		this.emit('errors.updated');
		// if (this.errors.code == 0) {
			comments.push(commentObj);
			this.emit('comment.added');
		// } 
	},
	validateComment: function (commentObj) {
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
	exports: {
		data : data
	} 
});

module.exports = CommentStore;