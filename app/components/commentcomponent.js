/** @jsx React.DOM **/

var React = require('react');
var CommentList = require('./commentlist.js');
var CommentForm = require('./commentform.js');
var SortComments = require('./sortcomments.js')
var request = require('superagent');

var CommentComponent = React.createClass({
	componentWillMount: function () {
	},
	componentWillUnmount: function () {
	},
	loadCommentsFromServer: function (){
		var self = this;
		//TODO: send params to the url
		request.get(self.props.url).set('Accept', 'application/json').end(function(res){
			self.setState({data: res.body});
		});
	},
	handleCommentSubmit: function (comment) {
		var comments = this.state.data;
		console.log(comments);
		var newComments = comments.concat([comment]);
		this.setState({data: newComments});
		//TODO: submit to server and refresh
	},
	setConfig: function (sortOrder, key) {
		prevConfig = this.state.config;
		prevConfig[key] = sortOrder;
		this.setState({
			config: prevConfig
		});
		console.log(this.state.config);
	},
	setReply: function (replyIdVal) {
		if (!this.state.replyId) {
				this.setState({replyId: replyIdVal});
			} else {
				this.setState({replyId: null});
			}
	},
	getInitialState: function() {
		return {
			data: [], 
			config: {
				rating: true,
				commentsNumber: 6,
				fiveRateNumber: 30,
				voteRateTotal: 45,
				albumArt: 'http://hiphopdx.local/s/img/album_thumbnail.png',
				pageNumber: 0,
				postId: 1118,
				sortBy: 'latest'
			},
			replyId: null
		};
	},
	componentDidMount: function(){
		this.loadCommentsFromServer();
		setInterval(this.loadCommentsFromServer, this.props.pollInterval);
	},
	render: function () {
		var maincomment;
		if (!this.state.replyId ) {
			maincomment = <CommentForm config={this.state.config} onCommentSubmit={this.handleCommentSubmit} replyId={this.state.replyId} />;
		}
		return(
			<div id="commentsWidget" className="comments-widget">
			<button onClick={this.setReply}> Test</button>
			<h4 className="comment-widget-title headingtooltip"><span className="comment-num">{this.state.config.commentsNumber}</span> Comments</h4>
				<section id="respond">
					{maincomment}
				</section>
				<SortComments sortBy={this.state.config.sortBy} onSendSort={this.setConfig} />
				<section id="comments" className="comment-feed" itemProp="comment">
					<CommentList config={this.state.config} data={this.state.data} handleReplyLink={this.setReply} />
				</section>
			</div>
				);
	}
});

module.exports = CommentComponent;