// @jsx React.DOM

React = require('react');
RateBox = require('./ratebox.js')
addons = require('classnames');
commentStore = require ('../stores/commentstore.js');
action = require('../actions/commentactions.js');

var CommentForm = React.createClass({
	getInitialState: function () {
		return {
			config: commentStore.getConfig(),
			errors: {}
		};
	},
	handleSubmit: function (e) {
		e.preventDefault();
		var comment = this.refs.comment.getDOMNode().value.trim();
		var author = this.refs.author.getDOMNode().value.trim();
		var email = this.refs.email.getDOMNode().value.trim();
		
		//preFlight stripping of link anchor tags
		findATags = /<\s*a(\s+.*?>|>).*?<\s*\/a\s*>/ig;
		comment = comment.replace(findATags, ' ');

		//serialize our data as a comment object
		newComment = {
			'commentbody': comment, 
			'author': {
					'name': author, 
					'email': email, 
					'url': '',
					'avatar': 'http://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50?f=y',
					}
		};

		//submit our model and reset the form
		this.props.onCommentSubmit(newComment);
		this.refs.comment.getDOMNode().value = '';
		this.refs.author.getDOMNode().value = '';
		this.refs.email.getDOMNode().value = '';
		return;
	},
	cancelReply: function () {
		action.setReplyId(null);
	},
	render: function () {
		var cx = addons;
		var withOrWithoutRating = cx({
			'form-fields': true,
			'withratebox': this.state.config.rating,
			'noratebox': !this.state.config.rating
		});
		var rateComponent, closeAdd;
		if (this.state.config.rating) {
			rateComponent = <RateBox postId={this.state.config} />;
		}
		if (commentStore.getReplyId()) {
			closeAdd = <a aria-label="Cancel Reply" className="cancel-comment-reply" onClick={this.cancelReply}><i className="fa fa-times-circle"></i></a>;
		}
		return (
			<form id="commentform" noValidate className="comment-form" onSubmit={this.handleSubmit}>
				{rateComponent}
				<div className={withOrWithoutRating}>
					{closeAdd}
					<textarea name="comment" className="form-control" rows="6" aria-required="true" required placeholder="Join the discussion" ref="comment"></textarea>
					<div className="form-row">
						<div className="col-1">
							<div className="form-group">
								<input type="text" id="author" className="form-control" aria-required="true" required name="author" placeholder="Name" ref="author" />
							</div>
						</div>
						<div className="col-1">
							<div className="form-group">
								<input type="email" id="email" className="form-control" aria-required="true" required name="email" placeholder="Email" ref="email" />
							</div>
						</div>
					</div>
					<div className="form-row">
						<input name="submit" type="submit" value="Submit" id="submit" className="comment-submit" /> 
					</div>
				</div>

			</form>
		);
	}
});

module.exports = CommentForm;