/** @jsx React.DOM **/

var React = require('react'),
	commentStore = require('../stores/commentstore.js'),
 	CommentForm = require('./commentform.js'),
 	Comment = require('./comment.js'),
 	SortComments = require('./sortcomments.js'),
	request = require('superagent');

var CommentComponent = React.createClass({
	handleCommentSubmit: function (comment) {
		var comments = this.state.data;
		console.log(comments);
		var newComments = comments.concat([comment]);
		this.setState({data: newComments});
		//TODO: submit to server and refresh
	},
	getInitialState: function () {
		return {
			data: [],
			replyId: null,
			config: commentStore.getConfig()
		};
	},
	componentDidMount: function (){
		commentStore.getInitialData();
		// commentStore.addChangeListener(this.updateCommentList);
	},
	setReplyId: function () {
		this.setState({
			replyId: commentStore.getReplyId()
		});
	},
	updateCommentList: function () {
		this.setState({
			data: commentStore.getCommentsList()
		});
	},
	componentWillMount: function () {
		commentStore.on('comment.loaded', this.updateCommentList);
		commentStore.on('comment.added', this.updateCommentList);
		commentStore.on('comment.replyset', this.setReplyId, this.updateCommentList);
	},
	componentWillUnmount: function () {
		commentStore.off('comment.loaded', this.updateCommentList);
		commentStore.off('comment.added', this.updateCommentList);
		commentStore.off('comment.replyset', this.setReplyId, this.updateCommentList);
		// commentStore.removeChangeListener(this.updateCommentList)
	},
	render: function () {
		var stdComment;
		if (!this.state.replyId) {
			stdComment = <CommentForm onCommentSubmit={this.handleCommentSubmit} replyId={this.state.replyId} />;
		}
		return(
			<div id="commentsWidget" className="comments-widget">
			<h4 className="comment-widget-title headingtooltip"><span className="comment-num">{this.state.config.commentsNumber}</span> Comments</h4>
				<section id="respond">
					{stdComment}
				</section>
				<SortComments />
				<section id="comments" className="comment-feed" itemProp="comment">
					<ul className="media-list comment-list" >
					{this.state.data.map(function (comment, index) {
						console.log(comment);
						return (<Comment key={index} comment={comment} />);
					})}
					</ul>
				</section>
			</div>
				);
	}
});

module.exports = CommentComponent;