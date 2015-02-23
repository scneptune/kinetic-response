// @jsx React.DOM

React = require('react');
moment = require('moment');

RateBox = require('./ratebox.js')
addons = require('classnames');

var CommentForm = React.createClass({
	componentWillMount: function () {
	},
	componentWillUnmount: function () {
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
			'id': 14,
			'commentbody': comment, 
			'author': {
					'name': author, 
					'email': email, 
					'url': '',
					'avatar': 'http://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50?f=y',
					}
		};

		//send it to the validator for errors
		// this.validateSubmission(newComment);

		if (this.props.replyId) {
			newComment.replyTo = this.props.replyId;
		} else {
			newComment.replies = [];
		}


		//submit our model and reset the form
		this.props.onCommentSubmit(newComment);
		this.refs.comment.getDOMNode().value = '';
		this.refs.author.getDOMNode().value = '';
		this.refs.email.getDOMNode().value = '';
		return;
	},

	render: function () {
		var cx = addons;
		var withOrWithoutRating = cx({
			'form-fields': true,
			'withratebox': this.props.config.rating,
			'noratebox': !this.props.config.rating
		});
		var rateComponent;
		if (this.props.config.rating) {
			rateComponent = <RateBox config={this.props.config} />;
		}
		return (
			<form id="commentform" noValidate className="comment-form" onSubmit={this.handleSubmit}>
				{rateComponent}
				<div className={withOrWithoutRating}>
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