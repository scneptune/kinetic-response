// @jsx React.DOM

React = require('react');
Comment = require('./comment.js');
var CommentList = React.createClass({
	handleCommentReply: function (replyIdVal){
		this.props.handleReplyLink(replyIdVal);
	},
	render: function () {
		var self = this,
		commentNodes = this.props.data.map(function (comment, index) {
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
