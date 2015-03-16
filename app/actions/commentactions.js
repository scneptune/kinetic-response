/**

**/
commentDispatch = require('../dispatcher/commentdispatch.js');
ActionType = require('./constants').ActionTypes;

module.exports = {
	
	callCommentList: function () {
		commentDispatch.dispatch({
			type: ActionType.callCommentList,
			rawResults: rawResults
		});
	},

	populateConfig: function () {
		commentDispatch.dispatch({
			type: ActionType.populateConfig,
			rawConfig: rawConfig
		});
	},

	sortCommentList: function (sortVal) {
		commentDispatch.dispatch({
			type: ActionType.sortCommentList,
			sortVal: sortVal
		});
	},

	voteComment: function (id, voteVal) {
		commentDispatch.dispatch({
			type: ActionType.voteComment,
			id: id,
			voteVal: voteVal
		});
	},

	addComment: function (comment) {
		commentDispatch.dispatch({
			type: ActionType.addComment,
			comment: comment
		});
	},

	addReply: function (comment, idVal) {
		commentDispatch.dispatch({
			type: ActionType.addReply,
			comment: comment,
			idVal: idVal
		});
	},

	setReplyId: function (idVal) {
		commentDispatch.dispatch({
			type: ActionType.setReplyId,
			idVal: idVal
		});
	}

};