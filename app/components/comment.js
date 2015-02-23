// @jsx React.DOM

React = require('react');
cx = require('classnames');
prettyAgo = require('moment');
CommentForm = require('./commentform.js')
CommentInteractions = require('./commentinteractions.js');

var Comment = React.createClass({
	replies: function (comment) {
		if (comment.hasOwnProperty('replies') && comment.replies.length > 0 ) {
			var self = this;
		return (<ul className="comment-list with-replies media media-list depth-2">
					{comment.replies.map(function(child) {
				        return (<Comment key={child.id} config={self.props.config} comment={child} />);
				   	})}	
				</ul>);
		} 
	},
	setCommmentReply: function (newReplyComment) {
		this.props.comment.replies.push(newReplyComment);
		this.setState({data: this.props.comment,replyId: null});
	},
	render: function() {
		var badge, replyForm,
			forceHeight = {height: '40px'},
			comment = this.props.comment,
			depthLevel = (comment.hasOwnProperty('replies') ? 'depth-1' : 'depth-2'),
			commentTopClasses = cx(
				'comment-entry', 'media', 'comment',
				{'depth-1': comment.hasOwnProperty('replies')},
				{'depth-2': !comment.hasOwnProperty('replies')},
				{'with-replies': (comment.hasOwnProperty('replies') && comment.replies.length > 0)}
			);

		var allowReply = comment.hasOwnProperty('replies');
		var repliesList = this.replies(comment);
		if (this.state.replyId == comment.id) {
			replyForm = (<CommentForm config={this.props.config} onCommentSubmit={this.setCommmentReply} replyId={comment.id} />);
		}

		$key = this.props.key;

		if (comment.author.is_verified > 0) { badge = <span className="badge"><img src="/dxbug.png" className="small badge" /></span>}
		return (
			<li className={commentTopClasses} id={"#comment-" + comment.id }>
				<img src={comment.author.avatar} className="avatar pull-left media-object userpic pull-left media-object userpic avatar-60" width="40" height="40" style={forceHeight} />
				<div className="comment-body media-body">
			    	<h4 className="username media-heading">
			      		{comment.author.name} 
			    	</h4> 
			    	{badge}
			    	<time dateTime={comment.date}>
			    		<a href={"#comment-" + comment.id}>
			    			on {prettyAgo(comment.date).format('MMMM D, YYYY')}
			    		</a>
			    	</time>
				    <p>{comment.commentbody}</p>
				    <CommentInteractions key={$key} commentId={comment.id} replyLink={allowReply} />
		    	</div>
		    	{replyForm}
        		{repliesList}
        	</li>
		);
	}
});

module.exports = Comment;