// @jsx React.DOM

React = require('react');
commentStore = require('../stores/commentstore.js');
action = require('../actions/commentactions.js');
cx = require('classnames');

CommentInteraction = React.createClass({
	handleClick: function (voteType) {
		var CommentId = this.props.commentId;
		switch (voteType) {
			case 'upvote':
			action.voteComment(CommentId, 'upvote');
			this.setState({
				upvote: true,
				downvote: false,
				flag: false
			});
			break;
			case 'downvote':
			action.voteComment(CommentId, 'downvote');
			this.setState({
				upvote: false,
				downvote: true,
				flag: false
			})
			break;
			case 'flag':
			action.voteComment(CommentId, 'flag');
			this.setState({
				upvote: false,
				downvote: false,
				flag: true
			})
			break;
			case 'reply':
			action.setReplyId(CommentId);
			break;
			default:
			break;
		}
	},
	getInitialState: function () {
		return { 
			upvote: false,
			downvote: false,
			flag: false
		};
	},
	render: function () {
		var replyMarkup;
		if (this.props.replyLink) {
			replyMarkup = <a aria-label="Reply" className="comment-reply-link" onClick={this.handleClick.bind(this, 'reply')}> Reply <i className={cx('fa',{'fa-angle-right': !commentStore.getReplyId()}, {'fa-angle-down': commentStore.getReplyId()})}></i></a>;
		}
		return (
			<div className="comment-interaction">
	    		<div className="interaction pull-left">
	    			<a  aria-label="Vote Up" className={cx('upvote', {'voted': this.state.upvote})} onClick={this.handleClick.bind(this, 'upvote')}>
	    				<i className="fa fa-thumbs-up"></i>
	    			</a>
	    			<a  aria-label="Vote Down" className={cx('downvote', {'voted': this.state.downvote})} onClick={this.handleClick.bind(this, 'downvote')}>
	    				<i className="fa fa-thumbs-down"></i>
	    			</a>
	    		</div>
	    		<div className="interaction pull-right">
	    			<a  aria-label="Flag Comment" className={cx('flag', {'voted': this.state.flag})} onClick={this.handleClick.bind(this, 'flag')}>Flag</a>
	    			{replyMarkup}
	    		</div>
	    	</div>
		);
	}
});

module.exports = CommentInteraction;