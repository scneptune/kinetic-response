// @jsx React.DOM

React = require('react');
Comment = require('./comment.js');
commentStore = require ('../stores/commentstore.js');

var CommentList = React.createClass({
	componentWillMount: function () {
		
	},
	componentWillUnmount: function () {
	},
	handleCommentReply: function (replyIdVal){
		this.props.handleReplyLink(replyIdVal);
	},
	getInitialState: function () {
		return {
			data: commentStore.getCommentList(),
			replyId: commentStore.getReplyId(),
			config: getConfig(),
		}
	},
	render: function () {
		var self = this,
		commentNodes = this.state.data.map(function (comment, index) {
			return (
				<Comment key={index} comment={comment} config={self.props.config} setCommmentReply={self.handleCommentReply} />
			);
		});
		return (
			<ul className="media-list comment-list" >
				{commentNodes}
			</ul>
			);
	}
});


module.exports = CommentList;
