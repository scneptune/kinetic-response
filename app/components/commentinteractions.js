// @jsx React.DOM

React = require('react');
commentStore = require('../stores/commentstore.js');

CommentInteraction = React.createClass({
	handleClick: function (voteType) {
		var CommentId = this.props.commentId;
		console.log(CommentId, voteType, this.props.replyLink);
		console.log('this is the passed key ', this.props.commentId);
		switch (voteType) {
			case 'upvote':
			case 'downvote':
			case 'flag':
			break;
			case 'reply':
			this.commentStore(CommentId)
			break;
			default:
			console.log('no mutator');
			break;
		}
	},
	componentWillMount: function () {
	},
	componentWillUnmount: function () {
	},
	render: function () {
		var replyMarkup;
		if (this.props.replyLink) {
			replyMarkup = <a aria-label="Reply" className="comment-reply-link" onClick={this.handleClick.bind(this, 'reply')}> Reply <i className="fa fa-angle-right"></i></a>;
		} 
		return (
			<div className="comment-interaction">
	    		<div className="interaction pull-left">
	    			<a  aria-label="Vote Up" className="upvote" onClick={this.handleClick.bind(this, 'upvote')}>
	    				<i className="fa fa-thumbs-up"></i>
	    			</a>
	    			<a  aria-label="Vote Down" className="downvote" onClick={this.handleClick.bind(this, 'downvote')}>
	    				<i className="fa fa-thumbs-down"></i>
	    			</a>
	    		</div>
	    		<div className="interaction pull-right">
	    			<a  aria-label="Flag Comment" className="flag" onClick={this.handleClick.bind(this, 'flag')}>Flag</a>
	    			{replyMarkup}
	    		</div>
	    	</div>
		);
	}
});

module.exports = CommentInteraction;