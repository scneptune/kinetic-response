(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"./specs/App-spec.js":[function(require,module,exports){
var App = require('./../app/main.js');
var TestUtils = require('react-addons').TestUtils;

describe("App", function() {

  it("should be wrapped with a div", function() {
    var app = TestUtils.renderIntoDocument(App());
    expect(app.getDOMNode().tagName).toEqual('DIV');
  });

});
},{"./../app/main.js":"/Users/SoPitted/Work/reactcomment/app/main.js","react-addons":"react-addons"}],"/Users/SoPitted/Work/reactcomment/app/actions/commentactions.js":[function(require,module,exports){
var flux = require('flux-react');

module.exports = flux.createActions([
  'addComment',
  'addReply',
  'setReplyId',
  'callCommentList',
  'populateConfig',
  'sortCommentList',
  'voteComment'
]);
},{"flux-react":"flux-react"}],"/Users/SoPitted/Work/reactcomment/app/components/comment.js":[function(require,module,exports){
// @jsx React.DOM

React = require('react');
cx = require('classnames');
prettyAgo = require('moment');
CommentForm = require('./commentform.js');
commentStore = require('../stores/commentstore.js');
action = require('../actions/commentactions.js');
CommentInteractions = require('./commentinteractions.js');

var Comment = React.createClass({displayName: "Comment",
	handleReplySubmit: function (comment) {
		action.addReply(comment, this.props.comment.id);
	},
	replies: function (comment) {
		if (comment.hasOwnProperty('replies') && comment.replies.length > 0 ) {
			var self = this;
			return (React.createElement("ul", {className: "comment-list with-replies media media-list depth-2"}, 
						comment.replies.map(function(child) {
					        return (React.createElement(Comment, {key: child.id, comment: child}));
					   	})	
					));
		} 
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

		var currentReplyID = commentStore.getReplyId();
		if (currentReplyID == comment.id) {
			replyForm = (React.createElement(CommentForm, {onCommentSubmit: this.handleReplySubmit, replyId: comment.id}));
		}

		if (comment.author.is_verified > 0) { badge = React.createElement("span", {className: "badge"}, React.createElement("img", {src: "/dxbug.png", className: "small badge"}))}
		return (
			React.createElement("li", {className: commentTopClasses, id: "#comment-" + comment.id}, 
				React.createElement("img", {src: comment.author.avatar, className: "avatar pull-left media-object userpic pull-left media-object userpic avatar-60", width: "40", height: "40", style: forceHeight}), 
				React.createElement("div", {className: "comment-body media-body"}, 
			    	React.createElement("h4", {className: "username media-heading"}, 
			      		comment.author.name
			    	), 
			    	badge, 
			    	React.createElement("time", {dateTime: comment.date}, 
			    		React.createElement("a", {href: "#comment-" + comment.id}, 
			    			"on ", prettyAgo(comment.date).format('MMMM D, YYYY')
			    		)
			    	), 
				    React.createElement("p", null, comment.commentbody), 
				    React.createElement(CommentInteractions, {key: this.props.key, commentId: comment.id, replyLink: comment.hasOwnProperty('replies')})
		    	), 
		    	replyForm, 
        		this.replies(comment)
        	)
		);
	}
});

module.exports = Comment;
},{"../actions/commentactions.js":"/Users/SoPitted/Work/reactcomment/app/actions/commentactions.js","../stores/commentstore.js":"/Users/SoPitted/Work/reactcomment/app/stores/commentstore.js","./commentform.js":"/Users/SoPitted/Work/reactcomment/app/components/commentform.js","./commentinteractions.js":"/Users/SoPitted/Work/reactcomment/app/components/commentinteractions.js","classnames":"/Users/SoPitted/Work/reactcomment/node_modules/classnames/index.js","moment":"/Users/SoPitted/Work/reactcomment/node_modules/moment/moment.js","react":"react"}],"/Users/SoPitted/Work/reactcomment/app/components/commentcomponent.js":[function(require,module,exports){
/** @jsx React.DOM **/

var React = require('react'),
	commentStore = require('../stores/commentstore.js'),
 	CommentForm = require('./commentform.js'),
 	action = require('../actions/commentactions.js')
 	Comment = require('./comment.js'),
 	SortComments = require('./sortcomments.js'),
	request = require('superagent');

var CommentComponent = React.createClass({displayName: "CommentComponent",
	handleCommentSubmit: function (comment) {
		//simply take the new comment object and post it back to the addComment Action.
		action.addComment(comment);
	},
	getInitialState: function () {
		return {
			data: [],
			replyId: null,
			config: commentStore.getConfig()
		};
	},
	componentDidMount: function (){
		// under normal circumstances this should be called with action.callCommentList(), 
		// but for performance reasons it appears that the export getInitialData is slightly faster. 
		commentStore.getInitialData();
	},
	setReplyId: function () {
		this.setState({
			replyId: commentStore.getReplyId()
		});
	},
	updateCommentList: function () {
		this.setState({
			data: commentStore.getCommentsList(),
		});
	},
	updateConfig: function () {
		this.setState({
			config: commentStore.getConfig()
		});
	},
	componentWillMount: function () {
		//Eventwatcher2 actions inside the store for updates, on updates rerender.
		commentStore.on('comment.loaded', this.updateCommentList);
		commentStore.on('comment.added', this.updateCommentList);
		commentStore.on('config.addedComment', this.updateConfig);
		commentStore.on('comment.replyset', this.setReplyId, this.updateCommentList);
	},
	componentWillUnmount: function () {
		//Eventwatcher 2 remove these compoents when the elements are unbound. 
		commentStore.off('comment.loaded', this.updateCommentList);
		commentStore.off('comment.added', this.updateCommentList);
		commentStore.off('config.addedComment', this.updateConfig);
		commentStore.off('comment.replyset', this.setReplyId, this.updateCommentList);
		// commentStore.removeChangeListener(this.updateCommentList)
	},
	render: function () {
		var stdComment;
		if (!this.state.replyId) {
			stdComment = React.createElement(CommentForm, {onCommentSubmit: this.handleCommentSubmit, replyId: this.state.replyId});
		}
		return(
			React.createElement("div", {id: "commentsWidget", className: "comments-widget"}, 
			React.createElement("h4", {className: "comment-widget-title headingtooltip"}, React.createElement("span", {className: "comment-num"}, this.state.config.commentsNumber), " Comments"), 
				React.createElement("section", {id: "respond"}, 
					stdComment
				), 
				React.createElement(SortComments, null), 
				React.createElement("section", {id: "comments", className: "comment-feed", itemProp: "comment"}, 
					React.createElement("ul", {className: "media-list comment-list"}, 
					this.state.data.map(function (comment, index) {
						return (React.createElement(Comment, {key: index, comment: comment}));
					})
					)
				)
			)
				);
	}
});

module.exports = CommentComponent;
},{"../actions/commentactions.js":"/Users/SoPitted/Work/reactcomment/app/actions/commentactions.js","../stores/commentstore.js":"/Users/SoPitted/Work/reactcomment/app/stores/commentstore.js","./comment.js":"/Users/SoPitted/Work/reactcomment/app/components/comment.js","./commentform.js":"/Users/SoPitted/Work/reactcomment/app/components/commentform.js","./sortcomments.js":"/Users/SoPitted/Work/reactcomment/app/components/sortcomments.js","react":"react","superagent":"/Users/SoPitted/Work/reactcomment/node_modules/superagent/lib/client.js"}],"/Users/SoPitted/Work/reactcomment/app/components/commentform.js":[function(require,module,exports){
// @jsx React.DOM

React = require('react');
RateBox = require('./ratebox.js')
cx = require('classnames');
commentStore = require ('../stores/commentstore.js');
action = require('../actions/commentactions.js');

var CommentForm = React.createClass({displayName: "CommentForm",
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
		//this closes out the form if it is attached to a comment by removing the ReplyId
		action.setReplyId(null);
	},
	render: function () {
		var withOrWithoutRating = cx({
			'form-fields': true,
			'withratebox': this.state.config.rating,
			'noratebox': !this.state.config.rating
		});
		var rateComponent, closeAdd;
		if (this.state.config.rating) {
			rateComponent = React.createElement(RateBox, {postId: this.state.config});
		}
		if (commentStore.getReplyId()) {
			closeAdd = React.createElement("a", {"aria-label": "Cancel Reply", className: "cancel-comment-reply", onClick: this.cancelReply}, React.createElement("i", {className: "fa fa-times-circle"}));
		}
		return (
			React.createElement("form", {id: "commentform", noValidate: true, className: "comment-form", onSubmit: this.handleSubmit}, 
				rateComponent, 
				React.createElement("div", {className: withOrWithoutRating}, 
					closeAdd, 
					React.createElement("textarea", {name: "comment", className: "form-control", rows: "6", "aria-required": "true", required: true, placeholder: "Join the discussion", ref: "comment"}), 
					React.createElement("div", {className: "form-row"}, 
						React.createElement("div", {className: "col-1"}, 
							React.createElement("div", {className: "form-group"}, 
								React.createElement("input", {type: "text", id: "author", className: "form-control", "aria-required": "true", required: true, name: "author", placeholder: "Name", ref: "author"})
							)
						), 
						React.createElement("div", {className: "col-1"}, 
							React.createElement("div", {className: "form-group"}, 
								React.createElement("input", {type: "email", id: "email", className: "form-control", "aria-required": "true", required: true, name: "email", placeholder: "Email", ref: "email"})
							)
						)
					), 
					React.createElement("div", {className: "form-row"}, 
						React.createElement("input", {name: "submit", type: "submit", value: "Submit", id: "submit", className: "comment-submit"})
					)
				)

			)
		);
	}
});

module.exports = CommentForm;
},{"../actions/commentactions.js":"/Users/SoPitted/Work/reactcomment/app/actions/commentactions.js","../stores/commentstore.js":"/Users/SoPitted/Work/reactcomment/app/stores/commentstore.js","./ratebox.js":"/Users/SoPitted/Work/reactcomment/app/components/ratebox.js","classnames":"/Users/SoPitted/Work/reactcomment/node_modules/classnames/index.js","react":"react"}],"/Users/SoPitted/Work/reactcomment/app/components/commentinteractions.js":[function(require,module,exports){
// @jsx React.DOM

React = require('react');
commentStore = require('../stores/commentstore.js');
action = require('../actions/commentactions.js');
cx = require('classnames');

CommentInteraction = React.createClass({displayName: "CommentInteraction",
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
			replyMarkup = React.createElement("a", {"aria-label": "Reply", className: "comment-reply-link", onClick: this.handleClick.bind(this, 'reply')}, " Reply ", React.createElement("i", {className: "fa fa-angle-right"}));
		}
		return (
			React.createElement("div", {className: "comment-interaction"}, 
	    		React.createElement("div", {className: "interaction pull-left"}, 
	    			React.createElement("a", {"aria-label": "Vote Up", className: cx('upvote', {'voted': this.state.upvote}), onClick: this.handleClick.bind(this, 'upvote')}, 
	    				React.createElement("i", {className: "fa fa-thumbs-up"})
	    			), 
	    			React.createElement("a", {"aria-label": "Vote Down", className: cx('downvote', {'voted': this.state.downvote}), onClick: this.handleClick.bind(this, 'downvote')}, 
	    				React.createElement("i", {className: "fa fa-thumbs-down"})
	    			)
	    		), 
	    		React.createElement("div", {className: "interaction pull-right"}, 
	    			React.createElement("a", {"aria-label": "Flag Comment", className: cx('flag', {'voted': this.state.flag}), onClick: this.handleClick.bind(this, 'flag')}, "Flag"), 
	    			replyMarkup
	    		)
	    	)
		);
	}
});

module.exports = CommentInteraction;
},{"../actions/commentactions.js":"/Users/SoPitted/Work/reactcomment/app/actions/commentactions.js","../stores/commentstore.js":"/Users/SoPitted/Work/reactcomment/app/stores/commentstore.js","classnames":"/Users/SoPitted/Work/reactcomment/node_modules/classnames/index.js","react":"react"}],"/Users/SoPitted/Work/reactcomment/app/components/ratebox.js":[function(require,module,exports){
// @jsx React.DOM

React = require('react');
addons = require('classnames');
commentStore = require('../stores/commentstore.js');

var RateIcon = React.createClass({displayName: "RateIcon",
	render: function () {
	var cx = addons;
	var classInsert = cx({
		'star': true,
		'filled': this.props.toggled 
	});
	return (React.createElement("li", {className: classInsert, onMouseMove: this.props.onMouseEnter, onClick: this.props.onClickRating}, React.createElement("span", null, "X"))); 
	}
});

var RateBox = React.createClass({displayName: "RateBox",
	getInitialState: function () {
		return {
			post_id: this.props.postId,
			currentRating: this.props.currentRating || 0,
			currentRating_hover: 0,
			hovering: false
		};
	},
	onMouseEnter: function (currentRating, e, id) {
		var rating = currentRating;
		if ((e.nativeEvent.clientX) < (e.target.offsetLeft + (e.target.offsetWidth / 2))) {
			rating -= 0.5;
		}
		this.setState({
			currentRating_hover: rating,
			hovering: true
		});
	},
	onMouseLeave: function (currentRating, e, id) {
		this.setState({
			hovering: false,
			currentRating_hover: 0
		});
	},
	onClickRating: function (currentRating, e, id) {
		this.setState({
			currentRating: this.state.currentRating_hover
		});
		if (this.props.onChange) {
			this.props.onChange(currentRating);
		}
	},
	render: function () {
		var ratings =[];
		var toggled = false;
		var rating, halfClassName,
			f = function () {},
			onMouseEnter = this.props.viewOnly ? f : this.onMouseEnter,
			onClickRating = this.props.viewOnly ? f : this.onClickRating;
		curhover = this.state.hovering;
		var config = commentStore.getConfig();
		for (var i = 1; i <= 5; ++i) {
			rating = this.state['currentRating' + (curhover ? '_hover' : '')];
			toggled = (i <= Math.round(rating) ? true : false);
			halfClassName = null;
			if ( this.props.halfClassName &&
				 Math.round(rating) == i &&
				 Math.floor(rating) != rating ) {
				halfClassName = this.props.halfClassName;
			}
			ratings.push(
				React.createElement(RateIcon, {key: i, toggledClassName: halfClassName || this.props.toggledClassName, onMouseEnter: onMouseEnter.bind(this, i), onClickRating: onClickRating.bind(this, i), toggled: toggled})
			);
		}
		return (
			React.createElement("div", {className: "ratebox"}, 
                React.createElement("div", {className: "rateitem"}, 
                    React.createElement("p", null, "Rate this Album"), 
                    React.createElement("ul", {className: "rating", onMouserLeave: this.onMouserLeave}, 
                    ratings
                    )
                ), 
                React.createElement("figure", {className: "album-art"}, 
                    React.createElement("img", {src: config.albumArt, width: "100", height: "100"}), 
                    React.createElement("figcaption", {className: "vote-info"}, 
                        React.createElement("p", null, " ", React.createElement("span", {className: "count"}, config.fiveRateNumber), " have voted"), 
                        React.createElement("p", null, " ", React.createElement("span", {className: "count"}, config.voteRateTotal), " people gave it 5/5 ")
                    )
                )
            )
		);
	}
});

module.exports = RateBox;
},{"../stores/commentstore.js":"/Users/SoPitted/Work/reactcomment/app/stores/commentstore.js","classnames":"/Users/SoPitted/Work/reactcomment/node_modules/classnames/index.js","react":"react"}],"/Users/SoPitted/Work/reactcomment/app/components/sortcomments.js":[function(require,module,exports){
// @jsx React.DOM

React = require('react');
cx = require('classnames');
actions = require('../actions/commentactions.js');

var SortIndicator = React.createClass({displayName: "SortIndicator",
	render: function () {
		var self = this,
			itemSort = this.props.sortItem,
			iconName = itemSort.icon;
			iconSet = cx('fa', iconName);
			sortSelect = cx({'active': itemSort.active}, 'sortoption');		
		return (React.createElement("div", {className: sortSelect, onClick: this.props.handleSortChange}, 
					React.createElement("div", {className: "sorttext"}, " ", React.createElement("i", {className: iconSet})), 
					React.createElement("div", {className: "sorttext"}, itemSort.label)
				));
	}
})

var SortComments = React.createClass({displayName: "SortComments",
	getInitialState: function () {
		return {sorts: [
			{'active': true, 'label': 'Latest', 'icon': 'fa-clock-o', 'value': 'latest'}, 
			{'active': false, 'label': 'Best', 'icon': 'fa-thumbs-up', 'value': 'up'},
			{'active' : false, 'label': 'Worst', 'icon': 'fa-thumbs-down', 'value': 'down'}
		]};
	},
	handleSortChange: function (newvalue) {
		newSort = [];
		//loop throught all the sort states and see if this sortItem matches our desired sort state. 
		for (var i = 0, slen = this.state.sorts.length; i < slen; i++) {
			currentSort = this.state.sorts[i];
			if (newvalue == currentSort) {
				//if we get a match set this state to true, for the appearances of the active class
				currentSort.active = true;
				//then send the action out to set this value on the commentStore
				actions.sortCommentList(newvalue.value);
			} else {
				//else set all the other active classes to false
				currentSort.active = false;
			}
			newSort.push(currentSort);
		}
		return this.setState({sorts: newSort});
	},
	render: function () {
		var sortArr = this.state.sorts,
			self = this;
			sortIndics = sortArr.map(function (sortItem, i) {
				//iterate over our simple SortIndicator React classes and seed them with the initial state data. 
				return (React.createElement(SortIndicator, {key: sortItem.value, keyId: i, handleSortChange: self.handleSortChange.bind(self, sortItem), sortItem: sortItem}));
			});
		return (
			React.createElement("div", {className: "comment-sort clearfix", "data-toggle": "sorttext"}, 
				sortIndics
			)
		);
	}
});

module.exports = SortComments;

},{"../actions/commentactions.js":"/Users/SoPitted/Work/reactcomment/app/actions/commentactions.js","classnames":"/Users/SoPitted/Work/reactcomment/node_modules/classnames/index.js","react":"react"}],"/Users/SoPitted/Work/reactcomment/app/main.js":[function(require,module,exports){
/** @jsx React.DOM */
var React = require('react');
var CommentComponent = require('./components/commentcomponent.js');
React.render(React.createElement(CommentComponent, {url: "http://localhost:8000/commentdata.json", pollInterval: 10000000}), document.getElementById('content'));
},{"./components/commentcomponent.js":"/Users/SoPitted/Work/reactcomment/app/components/commentcomponent.js","react":"react"}],"/Users/SoPitted/Work/reactcomment/app/stores/commentstore.js":[function(require,module,exports){
var flux = require('flux-react'),
	request = require('superagent'),
	validate = require('validate.js'),
	actionComment = require('../actions/commentactions');

var CommentStore = flux.createStore({
	data: [],
	replyId: null,
	errors: {},		
	sortBy: 'latest',
	config: {
		rating: true,
		commentsNumber: 0,
		fiveRateNumber: 30,
		voteRateTotal: 45,
		albumArt: 'http://hiphopdx.local/s/img/album_thumbnail.png',
		commentsUrl: 'http://localhost:8000/commentdata.json',
		pageNumber: 0,
		postId: 1118,
	},
	actions: [
		actionComment.addComment,
		actionComment.addReply,
		actionComment.setReplyId,
		actionComment.populateConfig,
		actionComment.callCommentList,
		actionComment.sortCommentList,
		actionComment.voteComment
	],
	callCommentList: function () {
		//this is the mainquery to establish an ajax request to populate the `this.data` store within this flux store.
		//sortBy is also passed so we can reuse this with the sortIncator actions. 
		var self = this, 
			sortOrder = this.sortBy;
		request.get(this.config.commentsUrl).query({'action': 'get'}).query({'sort': sortOrder}).set('Accept', 'application/json').end(
			function (res) {
			this.data = res.body;
			this.assessCommentCount();
			this.emit('comment.loaded');
		}.bind(this));
		
		// this.data = self.data;
	},
	sortCommentList: function (newSort) {
		this.sortBy = newSort;
		this.emit('sort.changed')
		this.callCommentList();
	},
	voteComment: function (id, action) {
		request.post(this.config.commentsUrl).type('application/json').send({'action': action}).send({'id': id}).end(
			function (res) {
				console.log(res.body);
		});
	},
	setReplyId: function (id) {
		this.replyId = id;
		this.emit('comment.replyset');
	},
	addComment: function (commentObj) {	
		console.log(this.data, 'before');
		// this.errors = this.validateComment(commentObj);
		this.emit('errors.updated');
		commentObj.id = 20;
		commentObj.replies = [];
		// if (this.errors.code == 0) {
		this.data.push(commentObj);
	
		console.log(this.data, 'after');
		this.emit('comment.added');	
		this.assessCommentCount();
		// } 
	},
	addReply: function (commentObj, replyId) {
		var comments = this.data,
			chosenReply = this.objectFindByKey(comments, 'id', replyId);
		
		this.errors = this.validateComment(commentObj);
		this.emit('errors.updated');
		commentObj.id = 19;
		chosenReply.replies.push(commentObj);
		this.replyId = null;

		this.emit('comment.added');
		this.assessCommentCount();
		this.emit('comment.replyset');
	},
	validateComment: function (commentObj) {
		this.errors = {};
		//run throught a validator to check the input out.
		var constraints = {
			'author' : {presence: true, length: {minimum: 2, maximum: 20} },
			'email': {presence: true, email: true},
			'comment' : {presence: true},
		};
		var validateSubmission = validate({
			'comment': commentObj.commentbody,
			'email': commentObj.author.email, 
			'author': commentObj.author.name},
		constraints);

		//TODO Make error states 
		if (validateSubmission) {
			console.log(validateSubmission);
			return;
		}
	},
	populateConfig: function () {
		//TODO: move the configs of the json out to this list. or we can technically grab it from the document as an embed json object. 
	},
	objectFindByKey: function (array, key, value) {
	    for (var i = 0; i < array.length; i++) {
	        if (array[i][key] === value) {
	            return array[i];
	        }
	    }
	    return null;
	},
	assessCommentCount: function () {
		toCount = this.data;
		baseCount = toCount.length;
		for (var it = 0, len = this.data.length; it < len; it++ ) {
			baseCount += toCount[it].replies.length;
		}
		this.config.commentsNumber = baseCount;
		this.emit('config.addedComment');
	},
	exports: {
		getInitialData: function () {
			return this.callCommentList();
		},
		getCommentsList: function() {
			return this.data;
		},
		getReplyId: function () {
			return this.replyId;
		},
		getConfig: function () {
		 	return this.config; 
		},
		getErrors: function() {
			return this.errors;
		}
	} 
});

module.exports = CommentStore;
},{"../actions/commentactions":"/Users/SoPitted/Work/reactcomment/app/actions/commentactions.js","flux-react":"flux-react","superagent":"/Users/SoPitted/Work/reactcomment/node_modules/superagent/lib/client.js","validate.js":"/Users/SoPitted/Work/reactcomment/node_modules/validate.js/validate.js"}],"/Users/SoPitted/Work/reactcomment/node_modules/classnames/index.js":[function(require,module,exports){
function classNames() {
	var args = arguments;
	var classes = [];

	for (var i = 0; i < args.length; i++) {
		var arg = args[i];
		if (!arg) {
			continue;
		}

		if ('string' === typeof arg || 'number' === typeof arg) {
			classes.push(arg);
		} else if ('object' === typeof arg) {
			for (var key in arg) {
				if (!arg.hasOwnProperty(key) || !arg[key]) {
					continue;
				}
				classes.push(key);
			}
		}
	}
	return classes.join(' ');
}

// safely export classNames in case the script is included directly on a page
if (typeof module !== 'undefined' && module.exports) {
	module.exports = classNames;
}

},{}],"/Users/SoPitted/Work/reactcomment/node_modules/moment/moment.js":[function(require,module,exports){
(function (global){
//! moment.js
//! version : 2.9.0
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

(function (undefined) {
    /************************************
        Constants
    ************************************/

    var moment,
        VERSION = '2.9.0',
        // the global-scope this is NOT the global object in Node.js
        globalScope = (typeof global !== 'undefined' && (typeof window === 'undefined' || window === global.window)) ? global : this,
        oldGlobalMoment,
        round = Math.round,
        hasOwnProperty = Object.prototype.hasOwnProperty,
        i,

        YEAR = 0,
        MONTH = 1,
        DATE = 2,
        HOUR = 3,
        MINUTE = 4,
        SECOND = 5,
        MILLISECOND = 6,

        // internal storage for locale config files
        locales = {},

        // extra moment internal properties (plugins register props here)
        momentProperties = [],

        // check for nodeJS
        hasModule = (typeof module !== 'undefined' && module && module.exports),

        // ASP.NET json date format regex
        aspNetJsonRegex = /^\/?Date\((\-?\d+)/i,
        aspNetTimeSpanJsonRegex = /(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/,

        // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
        // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
        isoDurationRegex = /^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/,

        // format tokens
        formattingTokens = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Q|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,4}|x|X|zz?|ZZ?|.)/g,
        localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,

        // parsing token regexes
        parseTokenOneOrTwoDigits = /\d\d?/, // 0 - 99
        parseTokenOneToThreeDigits = /\d{1,3}/, // 0 - 999
        parseTokenOneToFourDigits = /\d{1,4}/, // 0 - 9999
        parseTokenOneToSixDigits = /[+\-]?\d{1,6}/, // -999,999 - 999,999
        parseTokenDigits = /\d+/, // nonzero number of digits
        parseTokenWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i, // any word (or two) characters or numbers including two/three word month in arabic.
        parseTokenTimezone = /Z|[\+\-]\d\d:?\d\d/gi, // +00:00 -00:00 +0000 -0000 or Z
        parseTokenT = /T/i, // T (ISO separator)
        parseTokenOffsetMs = /[\+\-]?\d+/, // 1234567890123
        parseTokenTimestampMs = /[\+\-]?\d+(\.\d{1,3})?/, // 123456789 123456789.123

        //strict parsing regexes
        parseTokenOneDigit = /\d/, // 0 - 9
        parseTokenTwoDigits = /\d\d/, // 00 - 99
        parseTokenThreeDigits = /\d{3}/, // 000 - 999
        parseTokenFourDigits = /\d{4}/, // 0000 - 9999
        parseTokenSixDigits = /[+-]?\d{6}/, // -999,999 - 999,999
        parseTokenSignedNumber = /[+-]?\d+/, // -inf - inf

        // iso 8601 regex
        // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
        isoRegex = /^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,

        isoFormat = 'YYYY-MM-DDTHH:mm:ssZ',

        isoDates = [
            ['YYYYYY-MM-DD', /[+-]\d{6}-\d{2}-\d{2}/],
            ['YYYY-MM-DD', /\d{4}-\d{2}-\d{2}/],
            ['GGGG-[W]WW-E', /\d{4}-W\d{2}-\d/],
            ['GGGG-[W]WW', /\d{4}-W\d{2}/],
            ['YYYY-DDD', /\d{4}-\d{3}/]
        ],

        // iso time formats and regexes
        isoTimes = [
            ['HH:mm:ss.SSSS', /(T| )\d\d:\d\d:\d\d\.\d+/],
            ['HH:mm:ss', /(T| )\d\d:\d\d:\d\d/],
            ['HH:mm', /(T| )\d\d:\d\d/],
            ['HH', /(T| )\d\d/]
        ],

        // timezone chunker '+10:00' > ['10', '00'] or '-1530' > ['-', '15', '30']
        parseTimezoneChunker = /([\+\-]|\d\d)/gi,

        // getter and setter names
        proxyGettersAndSetters = 'Date|Hours|Minutes|Seconds|Milliseconds'.split('|'),
        unitMillisecondFactors = {
            'Milliseconds' : 1,
            'Seconds' : 1e3,
            'Minutes' : 6e4,
            'Hours' : 36e5,
            'Days' : 864e5,
            'Months' : 2592e6,
            'Years' : 31536e6
        },

        unitAliases = {
            ms : 'millisecond',
            s : 'second',
            m : 'minute',
            h : 'hour',
            d : 'day',
            D : 'date',
            w : 'week',
            W : 'isoWeek',
            M : 'month',
            Q : 'quarter',
            y : 'year',
            DDD : 'dayOfYear',
            e : 'weekday',
            E : 'isoWeekday',
            gg: 'weekYear',
            GG: 'isoWeekYear'
        },

        camelFunctions = {
            dayofyear : 'dayOfYear',
            isoweekday : 'isoWeekday',
            isoweek : 'isoWeek',
            weekyear : 'weekYear',
            isoweekyear : 'isoWeekYear'
        },

        // format function strings
        formatFunctions = {},

        // default relative time thresholds
        relativeTimeThresholds = {
            s: 45,  // seconds to minute
            m: 45,  // minutes to hour
            h: 22,  // hours to day
            d: 26,  // days to month
            M: 11   // months to year
        },

        // tokens to ordinalize and pad
        ordinalizeTokens = 'DDD w W M D d'.split(' '),
        paddedTokens = 'M D H h m s w W'.split(' '),

        formatTokenFunctions = {
            M    : function () {
                return this.month() + 1;
            },
            MMM  : function (format) {
                return this.localeData().monthsShort(this, format);
            },
            MMMM : function (format) {
                return this.localeData().months(this, format);
            },
            D    : function () {
                return this.date();
            },
            DDD  : function () {
                return this.dayOfYear();
            },
            d    : function () {
                return this.day();
            },
            dd   : function (format) {
                return this.localeData().weekdaysMin(this, format);
            },
            ddd  : function (format) {
                return this.localeData().weekdaysShort(this, format);
            },
            dddd : function (format) {
                return this.localeData().weekdays(this, format);
            },
            w    : function () {
                return this.week();
            },
            W    : function () {
                return this.isoWeek();
            },
            YY   : function () {
                return leftZeroFill(this.year() % 100, 2);
            },
            YYYY : function () {
                return leftZeroFill(this.year(), 4);
            },
            YYYYY : function () {
                return leftZeroFill(this.year(), 5);
            },
            YYYYYY : function () {
                var y = this.year(), sign = y >= 0 ? '+' : '-';
                return sign + leftZeroFill(Math.abs(y), 6);
            },
            gg   : function () {
                return leftZeroFill(this.weekYear() % 100, 2);
            },
            gggg : function () {
                return leftZeroFill(this.weekYear(), 4);
            },
            ggggg : function () {
                return leftZeroFill(this.weekYear(), 5);
            },
            GG   : function () {
                return leftZeroFill(this.isoWeekYear() % 100, 2);
            },
            GGGG : function () {
                return leftZeroFill(this.isoWeekYear(), 4);
            },
            GGGGG : function () {
                return leftZeroFill(this.isoWeekYear(), 5);
            },
            e : function () {
                return this.weekday();
            },
            E : function () {
                return this.isoWeekday();
            },
            a    : function () {
                return this.localeData().meridiem(this.hours(), this.minutes(), true);
            },
            A    : function () {
                return this.localeData().meridiem(this.hours(), this.minutes(), false);
            },
            H    : function () {
                return this.hours();
            },
            h    : function () {
                return this.hours() % 12 || 12;
            },
            m    : function () {
                return this.minutes();
            },
            s    : function () {
                return this.seconds();
            },
            S    : function () {
                return toInt(this.milliseconds() / 100);
            },
            SS   : function () {
                return leftZeroFill(toInt(this.milliseconds() / 10), 2);
            },
            SSS  : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            SSSS : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            Z    : function () {
                var a = this.utcOffset(),
                    b = '+';
                if (a < 0) {
                    a = -a;
                    b = '-';
                }
                return b + leftZeroFill(toInt(a / 60), 2) + ':' + leftZeroFill(toInt(a) % 60, 2);
            },
            ZZ   : function () {
                var a = this.utcOffset(),
                    b = '+';
                if (a < 0) {
                    a = -a;
                    b = '-';
                }
                return b + leftZeroFill(toInt(a / 60), 2) + leftZeroFill(toInt(a) % 60, 2);
            },
            z : function () {
                return this.zoneAbbr();
            },
            zz : function () {
                return this.zoneName();
            },
            x    : function () {
                return this.valueOf();
            },
            X    : function () {
                return this.unix();
            },
            Q : function () {
                return this.quarter();
            }
        },

        deprecations = {},

        lists = ['months', 'monthsShort', 'weekdays', 'weekdaysShort', 'weekdaysMin'],

        updateInProgress = false;

    // Pick the first defined of two or three arguments. dfl comes from
    // default.
    function dfl(a, b, c) {
        switch (arguments.length) {
            case 2: return a != null ? a : b;
            case 3: return a != null ? a : b != null ? b : c;
            default: throw new Error('Implement me');
        }
    }

    function hasOwnProp(a, b) {
        return hasOwnProperty.call(a, b);
    }

    function defaultParsingFlags() {
        // We need to deep clone this object, and es5 standard is not very
        // helpful.
        return {
            empty : false,
            unusedTokens : [],
            unusedInput : [],
            overflow : -2,
            charsLeftOver : 0,
            nullInput : false,
            invalidMonth : null,
            invalidFormat : false,
            userInvalidated : false,
            iso: false
        };
    }

    function printMsg(msg) {
        if (moment.suppressDeprecationWarnings === false &&
                typeof console !== 'undefined' && console.warn) {
            console.warn('Deprecation warning: ' + msg);
        }
    }

    function deprecate(msg, fn) {
        var firstTime = true;
        return extend(function () {
            if (firstTime) {
                printMsg(msg);
                firstTime = false;
            }
            return fn.apply(this, arguments);
        }, fn);
    }

    function deprecateSimple(name, msg) {
        if (!deprecations[name]) {
            printMsg(msg);
            deprecations[name] = true;
        }
    }

    function padToken(func, count) {
        return function (a) {
            return leftZeroFill(func.call(this, a), count);
        };
    }
    function ordinalizeToken(func, period) {
        return function (a) {
            return this.localeData().ordinal(func.call(this, a), period);
        };
    }

    function monthDiff(a, b) {
        // difference in months
        var wholeMonthDiff = ((b.year() - a.year()) * 12) + (b.month() - a.month()),
            // b is in (anchor - 1 month, anchor + 1 month)
            anchor = a.clone().add(wholeMonthDiff, 'months'),
            anchor2, adjust;

        if (b - anchor < 0) {
            anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor - anchor2);
        } else {
            anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor2 - anchor);
        }

        return -(wholeMonthDiff + adjust);
    }

    while (ordinalizeTokens.length) {
        i = ordinalizeTokens.pop();
        formatTokenFunctions[i + 'o'] = ordinalizeToken(formatTokenFunctions[i], i);
    }
    while (paddedTokens.length) {
        i = paddedTokens.pop();
        formatTokenFunctions[i + i] = padToken(formatTokenFunctions[i], 2);
    }
    formatTokenFunctions.DDDD = padToken(formatTokenFunctions.DDD, 3);


    function meridiemFixWrap(locale, hour, meridiem) {
        var isPm;

        if (meridiem == null) {
            // nothing to do
            return hour;
        }
        if (locale.meridiemHour != null) {
            return locale.meridiemHour(hour, meridiem);
        } else if (locale.isPM != null) {
            // Fallback
            isPm = locale.isPM(meridiem);
            if (isPm && hour < 12) {
                hour += 12;
            }
            if (!isPm && hour === 12) {
                hour = 0;
            }
            return hour;
        } else {
            // thie is not supposed to happen
            return hour;
        }
    }

    /************************************
        Constructors
    ************************************/

    function Locale() {
    }

    // Moment prototype object
    function Moment(config, skipOverflow) {
        if (skipOverflow !== false) {
            checkOverflow(config);
        }
        copyConfig(this, config);
        this._d = new Date(+config._d);
        // Prevent infinite loop in case updateOffset creates new moment
        // objects.
        if (updateInProgress === false) {
            updateInProgress = true;
            moment.updateOffset(this);
            updateInProgress = false;
        }
    }

    // Duration Constructor
    function Duration(duration) {
        var normalizedInput = normalizeObjectUnits(duration),
            years = normalizedInput.year || 0,
            quarters = normalizedInput.quarter || 0,
            months = normalizedInput.month || 0,
            weeks = normalizedInput.week || 0,
            days = normalizedInput.day || 0,
            hours = normalizedInput.hour || 0,
            minutes = normalizedInput.minute || 0,
            seconds = normalizedInput.second || 0,
            milliseconds = normalizedInput.millisecond || 0;

        // representation for dateAddRemove
        this._milliseconds = +milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 36e5; // 1000 * 60 * 60
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = +days +
            weeks * 7;
        // It is impossible translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = +months +
            quarters * 3 +
            years * 12;

        this._data = {};

        this._locale = moment.localeData();

        this._bubble();
    }

    /************************************
        Helpers
    ************************************/


    function extend(a, b) {
        for (var i in b) {
            if (hasOwnProp(b, i)) {
                a[i] = b[i];
            }
        }

        if (hasOwnProp(b, 'toString')) {
            a.toString = b.toString;
        }

        if (hasOwnProp(b, 'valueOf')) {
            a.valueOf = b.valueOf;
        }

        return a;
    }

    function copyConfig(to, from) {
        var i, prop, val;

        if (typeof from._isAMomentObject !== 'undefined') {
            to._isAMomentObject = from._isAMomentObject;
        }
        if (typeof from._i !== 'undefined') {
            to._i = from._i;
        }
        if (typeof from._f !== 'undefined') {
            to._f = from._f;
        }
        if (typeof from._l !== 'undefined') {
            to._l = from._l;
        }
        if (typeof from._strict !== 'undefined') {
            to._strict = from._strict;
        }
        if (typeof from._tzm !== 'undefined') {
            to._tzm = from._tzm;
        }
        if (typeof from._isUTC !== 'undefined') {
            to._isUTC = from._isUTC;
        }
        if (typeof from._offset !== 'undefined') {
            to._offset = from._offset;
        }
        if (typeof from._pf !== 'undefined') {
            to._pf = from._pf;
        }
        if (typeof from._locale !== 'undefined') {
            to._locale = from._locale;
        }

        if (momentProperties.length > 0) {
            for (i in momentProperties) {
                prop = momentProperties[i];
                val = from[prop];
                if (typeof val !== 'undefined') {
                    to[prop] = val;
                }
            }
        }

        return to;
    }

    function absRound(number) {
        if (number < 0) {
            return Math.ceil(number);
        } else {
            return Math.floor(number);
        }
    }

    // left zero fill a number
    // see http://jsperf.com/left-zero-filling for performance comparison
    function leftZeroFill(number, targetLength, forceSign) {
        var output = '' + Math.abs(number),
            sign = number >= 0;

        while (output.length < targetLength) {
            output = '0' + output;
        }
        return (sign ? (forceSign ? '+' : '') : '-') + output;
    }

    function positiveMomentsDifference(base, other) {
        var res = {milliseconds: 0, months: 0};

        res.months = other.month() - base.month() +
            (other.year() - base.year()) * 12;
        if (base.clone().add(res.months, 'M').isAfter(other)) {
            --res.months;
        }

        res.milliseconds = +other - +(base.clone().add(res.months, 'M'));

        return res;
    }

    function momentsDifference(base, other) {
        var res;
        other = makeAs(other, base);
        if (base.isBefore(other)) {
            res = positiveMomentsDifference(base, other);
        } else {
            res = positiveMomentsDifference(other, base);
            res.milliseconds = -res.milliseconds;
            res.months = -res.months;
        }

        return res;
    }

    // TODO: remove 'name' arg after deprecation is removed
    function createAdder(direction, name) {
        return function (val, period) {
            var dur, tmp;
            //invert the arguments, but complain about it
            if (period !== null && !isNaN(+period)) {
                deprecateSimple(name, 'moment().' + name  + '(period, number) is deprecated. Please use moment().' + name + '(number, period).');
                tmp = val; val = period; period = tmp;
            }

            val = typeof val === 'string' ? +val : val;
            dur = moment.duration(val, period);
            addOrSubtractDurationFromMoment(this, dur, direction);
            return this;
        };
    }

    function addOrSubtractDurationFromMoment(mom, duration, isAdding, updateOffset) {
        var milliseconds = duration._milliseconds,
            days = duration._days,
            months = duration._months;
        updateOffset = updateOffset == null ? true : updateOffset;

        if (milliseconds) {
            mom._d.setTime(+mom._d + milliseconds * isAdding);
        }
        if (days) {
            rawSetter(mom, 'Date', rawGetter(mom, 'Date') + days * isAdding);
        }
        if (months) {
            rawMonthSetter(mom, rawGetter(mom, 'Month') + months * isAdding);
        }
        if (updateOffset) {
            moment.updateOffset(mom, days || months);
        }
    }

    // check if is an array
    function isArray(input) {
        return Object.prototype.toString.call(input) === '[object Array]';
    }

    function isDate(input) {
        return Object.prototype.toString.call(input) === '[object Date]' ||
            input instanceof Date;
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2, dontConvert) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if ((dontConvert && array1[i] !== array2[i]) ||
                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    function normalizeUnits(units) {
        if (units) {
            var lowered = units.toLowerCase().replace(/(.)s$/, '$1');
            units = unitAliases[units] || camelFunctions[lowered] || lowered;
        }
        return units;
    }

    function normalizeObjectUnits(inputObject) {
        var normalizedInput = {},
            normalizedProp,
            prop;

        for (prop in inputObject) {
            if (hasOwnProp(inputObject, prop)) {
                normalizedProp = normalizeUnits(prop);
                if (normalizedProp) {
                    normalizedInput[normalizedProp] = inputObject[prop];
                }
            }
        }

        return normalizedInput;
    }

    function makeList(field) {
        var count, setter;

        if (field.indexOf('week') === 0) {
            count = 7;
            setter = 'day';
        }
        else if (field.indexOf('month') === 0) {
            count = 12;
            setter = 'month';
        }
        else {
            return;
        }

        moment[field] = function (format, index) {
            var i, getter,
                method = moment._locale[field],
                results = [];

            if (typeof format === 'number') {
                index = format;
                format = undefined;
            }

            getter = function (i) {
                var m = moment().utc().set(setter, i);
                return method.call(moment._locale, m, format || '');
            };

            if (index != null) {
                return getter(index);
            }
            else {
                for (i = 0; i < count; i++) {
                    results.push(getter(i));
                }
                return results;
            }
        };
    }

    function toInt(argumentForCoercion) {
        var coercedNumber = +argumentForCoercion,
            value = 0;

        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
            if (coercedNumber >= 0) {
                value = Math.floor(coercedNumber);
            } else {
                value = Math.ceil(coercedNumber);
            }
        }

        return value;
    }

    function daysInMonth(year, month) {
        return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    }

    function weeksInYear(year, dow, doy) {
        return weekOfYear(moment([year, 11, 31 + dow - doy]), dow, doy).week;
    }

    function daysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    function checkOverflow(m) {
        var overflow;
        if (m._a && m._pf.overflow === -2) {
            overflow =
                m._a[MONTH] < 0 || m._a[MONTH] > 11 ? MONTH :
                m._a[DATE] < 1 || m._a[DATE] > daysInMonth(m._a[YEAR], m._a[MONTH]) ? DATE :
                m._a[HOUR] < 0 || m._a[HOUR] > 24 ||
                    (m._a[HOUR] === 24 && (m._a[MINUTE] !== 0 ||
                                           m._a[SECOND] !== 0 ||
                                           m._a[MILLISECOND] !== 0)) ? HOUR :
                m._a[MINUTE] < 0 || m._a[MINUTE] > 59 ? MINUTE :
                m._a[SECOND] < 0 || m._a[SECOND] > 59 ? SECOND :
                m._a[MILLISECOND] < 0 || m._a[MILLISECOND] > 999 ? MILLISECOND :
                -1;

            if (m._pf._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
                overflow = DATE;
            }

            m._pf.overflow = overflow;
        }
    }

    function isValid(m) {
        if (m._isValid == null) {
            m._isValid = !isNaN(m._d.getTime()) &&
                m._pf.overflow < 0 &&
                !m._pf.empty &&
                !m._pf.invalidMonth &&
                !m._pf.nullInput &&
                !m._pf.invalidFormat &&
                !m._pf.userInvalidated;

            if (m._strict) {
                m._isValid = m._isValid &&
                    m._pf.charsLeftOver === 0 &&
                    m._pf.unusedTokens.length === 0 &&
                    m._pf.bigHour === undefined;
            }
        }
        return m._isValid;
    }

    function normalizeLocale(key) {
        return key ? key.toLowerCase().replace('_', '-') : key;
    }

    // pick the locale from the array
    // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
    // substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
    function chooseLocale(names) {
        var i = 0, j, next, locale, split;

        while (i < names.length) {
            split = normalizeLocale(names[i]).split('-');
            j = split.length;
            next = normalizeLocale(names[i + 1]);
            next = next ? next.split('-') : null;
            while (j > 0) {
                locale = loadLocale(split.slice(0, j).join('-'));
                if (locale) {
                    return locale;
                }
                if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                    //the next array item is better than a shallower substring of this one
                    break;
                }
                j--;
            }
            i++;
        }
        return null;
    }

    function loadLocale(name) {
        var oldLocale = null;
        if (!locales[name] && hasModule) {
            try {
                oldLocale = moment.locale();
                require('./locale/' + name);
                // because defineLocale currently also sets the global locale, we want to undo that for lazy loaded locales
                moment.locale(oldLocale);
            } catch (e) { }
        }
        return locales[name];
    }

    // Return a moment from input, that is local/utc/utcOffset equivalent to
    // model.
    function makeAs(input, model) {
        var res, diff;
        if (model._isUTC) {
            res = model.clone();
            diff = (moment.isMoment(input) || isDate(input) ?
                    +input : +moment(input)) - (+res);
            // Use low-level api, because this fn is low-level api.
            res._d.setTime(+res._d + diff);
            moment.updateOffset(res, false);
            return res;
        } else {
            return moment(input).local();
        }
    }

    /************************************
        Locale
    ************************************/


    extend(Locale.prototype, {

        set : function (config) {
            var prop, i;
            for (i in config) {
                prop = config[i];
                if (typeof prop === 'function') {
                    this[i] = prop;
                } else {
                    this['_' + i] = prop;
                }
            }
            // Lenient ordinal parsing accepts just a number in addition to
            // number + (possibly) stuff coming from _ordinalParseLenient.
            this._ordinalParseLenient = new RegExp(this._ordinalParse.source + '|' + /\d{1,2}/.source);
        },

        _months : 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
        months : function (m) {
            return this._months[m.month()];
        },

        _monthsShort : 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
        monthsShort : function (m) {
            return this._monthsShort[m.month()];
        },

        monthsParse : function (monthName, format, strict) {
            var i, mom, regex;

            if (!this._monthsParse) {
                this._monthsParse = [];
                this._longMonthsParse = [];
                this._shortMonthsParse = [];
            }

            for (i = 0; i < 12; i++) {
                // make the regex if we don't have it already
                mom = moment.utc([2000, i]);
                if (strict && !this._longMonthsParse[i]) {
                    this._longMonthsParse[i] = new RegExp('^' + this.months(mom, '').replace('.', '') + '$', 'i');
                    this._shortMonthsParse[i] = new RegExp('^' + this.monthsShort(mom, '').replace('.', '') + '$', 'i');
                }
                if (!strict && !this._monthsParse[i]) {
                    regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                    this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (strict && format === 'MMMM' && this._longMonthsParse[i].test(monthName)) {
                    return i;
                } else if (strict && format === 'MMM' && this._shortMonthsParse[i].test(monthName)) {
                    return i;
                } else if (!strict && this._monthsParse[i].test(monthName)) {
                    return i;
                }
            }
        },

        _weekdays : 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
        weekdays : function (m) {
            return this._weekdays[m.day()];
        },

        _weekdaysShort : 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
        weekdaysShort : function (m) {
            return this._weekdaysShort[m.day()];
        },

        _weekdaysMin : 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
        weekdaysMin : function (m) {
            return this._weekdaysMin[m.day()];
        },

        weekdaysParse : function (weekdayName) {
            var i, mom, regex;

            if (!this._weekdaysParse) {
                this._weekdaysParse = [];
            }

            for (i = 0; i < 7; i++) {
                // make the regex if we don't have it already
                if (!this._weekdaysParse[i]) {
                    mom = moment([2000, 1]).day(i);
                    regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
                    this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (this._weekdaysParse[i].test(weekdayName)) {
                    return i;
                }
            }
        },

        _longDateFormat : {
            LTS : 'h:mm:ss A',
            LT : 'h:mm A',
            L : 'MM/DD/YYYY',
            LL : 'MMMM D, YYYY',
            LLL : 'MMMM D, YYYY LT',
            LLLL : 'dddd, MMMM D, YYYY LT'
        },
        longDateFormat : function (key) {
            var output = this._longDateFormat[key];
            if (!output && this._longDateFormat[key.toUpperCase()]) {
                output = this._longDateFormat[key.toUpperCase()].replace(/MMMM|MM|DD|dddd/g, function (val) {
                    return val.slice(1);
                });
                this._longDateFormat[key] = output;
            }
            return output;
        },

        isPM : function (input) {
            // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
            // Using charAt should be more compatible.
            return ((input + '').toLowerCase().charAt(0) === 'p');
        },

        _meridiemParse : /[ap]\.?m?\.?/i,
        meridiem : function (hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? 'pm' : 'PM';
            } else {
                return isLower ? 'am' : 'AM';
            }
        },


        _calendar : {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[Last] dddd [at] LT',
            sameElse : 'L'
        },
        calendar : function (key, mom, now) {
            var output = this._calendar[key];
            return typeof output === 'function' ? output.apply(mom, [now]) : output;
        },

        _relativeTime : {
            future : 'in %s',
            past : '%s ago',
            s : 'a few seconds',
            m : 'a minute',
            mm : '%d minutes',
            h : 'an hour',
            hh : '%d hours',
            d : 'a day',
            dd : '%d days',
            M : 'a month',
            MM : '%d months',
            y : 'a year',
            yy : '%d years'
        },

        relativeTime : function (number, withoutSuffix, string, isFuture) {
            var output = this._relativeTime[string];
            return (typeof output === 'function') ?
                output(number, withoutSuffix, string, isFuture) :
                output.replace(/%d/i, number);
        },

        pastFuture : function (diff, output) {
            var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
            return typeof format === 'function' ? format(output) : format.replace(/%s/i, output);
        },

        ordinal : function (number) {
            return this._ordinal.replace('%d', number);
        },
        _ordinal : '%d',
        _ordinalParse : /\d{1,2}/,

        preparse : function (string) {
            return string;
        },

        postformat : function (string) {
            return string;
        },

        week : function (mom) {
            return weekOfYear(mom, this._week.dow, this._week.doy).week;
        },

        _week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        },

        firstDayOfWeek : function () {
            return this._week.dow;
        },

        firstDayOfYear : function () {
            return this._week.doy;
        },

        _invalidDate: 'Invalid date',
        invalidDate: function () {
            return this._invalidDate;
        }
    });

    /************************************
        Formatting
    ************************************/


    function removeFormattingTokens(input) {
        if (input.match(/\[[\s\S]/)) {
            return input.replace(/^\[|\]$/g, '');
        }
        return input.replace(/\\/g, '');
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens), i, length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = '';
            for (i = 0; i < length; i++) {
                output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {
        if (!m.isValid()) {
            return m.localeData().invalidDate();
        }

        format = expandFormat(format, m.localeData());

        if (!formatFunctions[format]) {
            formatFunctions[format] = makeFormatFunction(format);
        }

        return formatFunctions[format](m);
    }

    function expandFormat(format, locale) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return locale.longDateFormat(input) || input;
        }

        localFormattingTokens.lastIndex = 0;
        while (i >= 0 && localFormattingTokens.test(format)) {
            format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
            localFormattingTokens.lastIndex = 0;
            i -= 1;
        }

        return format;
    }


    /************************************
        Parsing
    ************************************/


    // get the regex to find the next token
    function getParseRegexForToken(token, config) {
        var a, strict = config._strict;
        switch (token) {
        case 'Q':
            return parseTokenOneDigit;
        case 'DDDD':
            return parseTokenThreeDigits;
        case 'YYYY':
        case 'GGGG':
        case 'gggg':
            return strict ? parseTokenFourDigits : parseTokenOneToFourDigits;
        case 'Y':
        case 'G':
        case 'g':
            return parseTokenSignedNumber;
        case 'YYYYYY':
        case 'YYYYY':
        case 'GGGGG':
        case 'ggggg':
            return strict ? parseTokenSixDigits : parseTokenOneToSixDigits;
        case 'S':
            if (strict) {
                return parseTokenOneDigit;
            }
            /* falls through */
        case 'SS':
            if (strict) {
                return parseTokenTwoDigits;
            }
            /* falls through */
        case 'SSS':
            if (strict) {
                return parseTokenThreeDigits;
            }
            /* falls through */
        case 'DDD':
            return parseTokenOneToThreeDigits;
        case 'MMM':
        case 'MMMM':
        case 'dd':
        case 'ddd':
        case 'dddd':
            return parseTokenWord;
        case 'a':
        case 'A':
            return config._locale._meridiemParse;
        case 'x':
            return parseTokenOffsetMs;
        case 'X':
            return parseTokenTimestampMs;
        case 'Z':
        case 'ZZ':
            return parseTokenTimezone;
        case 'T':
            return parseTokenT;
        case 'SSSS':
            return parseTokenDigits;
        case 'MM':
        case 'DD':
        case 'YY':
        case 'GG':
        case 'gg':
        case 'HH':
        case 'hh':
        case 'mm':
        case 'ss':
        case 'ww':
        case 'WW':
            return strict ? parseTokenTwoDigits : parseTokenOneOrTwoDigits;
        case 'M':
        case 'D':
        case 'd':
        case 'H':
        case 'h':
        case 'm':
        case 's':
        case 'w':
        case 'W':
        case 'e':
        case 'E':
            return parseTokenOneOrTwoDigits;
        case 'Do':
            return strict ? config._locale._ordinalParse : config._locale._ordinalParseLenient;
        default :
            a = new RegExp(regexpEscape(unescapeFormat(token.replace('\\', '')), 'i'));
            return a;
        }
    }

    function utcOffsetFromString(string) {
        string = string || '';
        var possibleTzMatches = (string.match(parseTokenTimezone) || []),
            tzChunk = possibleTzMatches[possibleTzMatches.length - 1] || [],
            parts = (tzChunk + '').match(parseTimezoneChunker) || ['-', 0, 0],
            minutes = +(parts[1] * 60) + toInt(parts[2]);

        return parts[0] === '+' ? minutes : -minutes;
    }

    // function to convert string input to date
    function addTimeToArrayFromToken(token, input, config) {
        var a, datePartArray = config._a;

        switch (token) {
        // QUARTER
        case 'Q':
            if (input != null) {
                datePartArray[MONTH] = (toInt(input) - 1) * 3;
            }
            break;
        // MONTH
        case 'M' : // fall through to MM
        case 'MM' :
            if (input != null) {
                datePartArray[MONTH] = toInt(input) - 1;
            }
            break;
        case 'MMM' : // fall through to MMMM
        case 'MMMM' :
            a = config._locale.monthsParse(input, token, config._strict);
            // if we didn't find a month name, mark the date as invalid.
            if (a != null) {
                datePartArray[MONTH] = a;
            } else {
                config._pf.invalidMonth = input;
            }
            break;
        // DAY OF MONTH
        case 'D' : // fall through to DD
        case 'DD' :
            if (input != null) {
                datePartArray[DATE] = toInt(input);
            }
            break;
        case 'Do' :
            if (input != null) {
                datePartArray[DATE] = toInt(parseInt(
                            input.match(/\d{1,2}/)[0], 10));
            }
            break;
        // DAY OF YEAR
        case 'DDD' : // fall through to DDDD
        case 'DDDD' :
            if (input != null) {
                config._dayOfYear = toInt(input);
            }

            break;
        // YEAR
        case 'YY' :
            datePartArray[YEAR] = moment.parseTwoDigitYear(input);
            break;
        case 'YYYY' :
        case 'YYYYY' :
        case 'YYYYYY' :
            datePartArray[YEAR] = toInt(input);
            break;
        // AM / PM
        case 'a' : // fall through to A
        case 'A' :
            config._meridiem = input;
            // config._isPm = config._locale.isPM(input);
            break;
        // HOUR
        case 'h' : // fall through to hh
        case 'hh' :
            config._pf.bigHour = true;
            /* falls through */
        case 'H' : // fall through to HH
        case 'HH' :
            datePartArray[HOUR] = toInt(input);
            break;
        // MINUTE
        case 'm' : // fall through to mm
        case 'mm' :
            datePartArray[MINUTE] = toInt(input);
            break;
        // SECOND
        case 's' : // fall through to ss
        case 'ss' :
            datePartArray[SECOND] = toInt(input);
            break;
        // MILLISECOND
        case 'S' :
        case 'SS' :
        case 'SSS' :
        case 'SSSS' :
            datePartArray[MILLISECOND] = toInt(('0.' + input) * 1000);
            break;
        // UNIX OFFSET (MILLISECONDS)
        case 'x':
            config._d = new Date(toInt(input));
            break;
        // UNIX TIMESTAMP WITH MS
        case 'X':
            config._d = new Date(parseFloat(input) * 1000);
            break;
        // TIMEZONE
        case 'Z' : // fall through to ZZ
        case 'ZZ' :
            config._useUTC = true;
            config._tzm = utcOffsetFromString(input);
            break;
        // WEEKDAY - human
        case 'dd':
        case 'ddd':
        case 'dddd':
            a = config._locale.weekdaysParse(input);
            // if we didn't get a weekday name, mark the date as invalid
            if (a != null) {
                config._w = config._w || {};
                config._w['d'] = a;
            } else {
                config._pf.invalidWeekday = input;
            }
            break;
        // WEEK, WEEK DAY - numeric
        case 'w':
        case 'ww':
        case 'W':
        case 'WW':
        case 'd':
        case 'e':
        case 'E':
            token = token.substr(0, 1);
            /* falls through */
        case 'gggg':
        case 'GGGG':
        case 'GGGGG':
            token = token.substr(0, 2);
            if (input) {
                config._w = config._w || {};
                config._w[token] = toInt(input);
            }
            break;
        case 'gg':
        case 'GG':
            config._w = config._w || {};
            config._w[token] = moment.parseTwoDigitYear(input);
        }
    }

    function dayOfYearFromWeekInfo(config) {
        var w, weekYear, week, weekday, dow, doy, temp;

        w = config._w;
        if (w.GG != null || w.W != null || w.E != null) {
            dow = 1;
            doy = 4;

            // TODO: We need to take the current isoWeekYear, but that depends on
            // how we interpret now (local, utc, fixed offset). So create
            // a now version of current config (take local/utc/offset flags, and
            // create now).
            weekYear = dfl(w.GG, config._a[YEAR], weekOfYear(moment(), 1, 4).year);
            week = dfl(w.W, 1);
            weekday = dfl(w.E, 1);
        } else {
            dow = config._locale._week.dow;
            doy = config._locale._week.doy;

            weekYear = dfl(w.gg, config._a[YEAR], weekOfYear(moment(), dow, doy).year);
            week = dfl(w.w, 1);

            if (w.d != null) {
                // weekday -- low day numbers are considered next week
                weekday = w.d;
                if (weekday < dow) {
                    ++week;
                }
            } else if (w.e != null) {
                // local weekday -- counting starts from begining of week
                weekday = w.e + dow;
            } else {
                // default to begining of week
                weekday = dow;
            }
        }
        temp = dayOfYearFromWeeks(weekYear, week, weekday, doy, dow);

        config._a[YEAR] = temp.year;
        config._dayOfYear = temp.dayOfYear;
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function dateFromConfig(config) {
        var i, date, input = [], currentDate, yearToUse;

        if (config._d) {
            return;
        }

        currentDate = currentDateArray(config);

        //compute day of the year from weeks and weekdays
        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
            dayOfYearFromWeekInfo(config);
        }

        //if the day of the year is set, figure out what it is
        if (config._dayOfYear) {
            yearToUse = dfl(config._a[YEAR], currentDate[YEAR]);

            if (config._dayOfYear > daysInYear(yearToUse)) {
                config._pf._overflowDayOfYear = true;
            }

            date = makeUTCDate(yearToUse, 0, config._dayOfYear);
            config._a[MONTH] = date.getUTCMonth();
            config._a[DATE] = date.getUTCDate();
        }

        // Default to current date.
        // * if no year, month, day of month are given, default to today
        // * if day of month is given, default month and year
        // * if month is given, default only year
        // * if year is given, don't default anything
        for (i = 0; i < 3 && config._a[i] == null; ++i) {
            config._a[i] = input[i] = currentDate[i];
        }

        // Zero out whatever was not defaulted, including time
        for (; i < 7; i++) {
            config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
        }

        // Check for 24:00:00.000
        if (config._a[HOUR] === 24 &&
                config._a[MINUTE] === 0 &&
                config._a[SECOND] === 0 &&
                config._a[MILLISECOND] === 0) {
            config._nextDay = true;
            config._a[HOUR] = 0;
        }

        config._d = (config._useUTC ? makeUTCDate : makeDate).apply(null, input);
        // Apply timezone offset from input. The actual utcOffset can be changed
        // with parseZone.
        if (config._tzm != null) {
            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
        }

        if (config._nextDay) {
            config._a[HOUR] = 24;
        }
    }

    function dateFromObject(config) {
        var normalizedInput;

        if (config._d) {
            return;
        }

        normalizedInput = normalizeObjectUnits(config._i);
        config._a = [
            normalizedInput.year,
            normalizedInput.month,
            normalizedInput.day || normalizedInput.date,
            normalizedInput.hour,
            normalizedInput.minute,
            normalizedInput.second,
            normalizedInput.millisecond
        ];

        dateFromConfig(config);
    }

    function currentDateArray(config) {
        var now = new Date();
        if (config._useUTC) {
            return [
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate()
            ];
        } else {
            return [now.getFullYear(), now.getMonth(), now.getDate()];
        }
    }

    // date from string and format string
    function makeDateFromStringAndFormat(config) {
        if (config._f === moment.ISO_8601) {
            parseISO(config);
            return;
        }

        config._a = [];
        config._pf.empty = true;

        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var string = '' + config._i,
            i, parsedInput, tokens, token, skipped,
            stringLength = string.length,
            totalParsedInputLength = 0;

        tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];

        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
            if (parsedInput) {
                skipped = string.substr(0, string.indexOf(parsedInput));
                if (skipped.length > 0) {
                    config._pf.unusedInput.push(skipped);
                }
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
                totalParsedInputLength += parsedInput.length;
            }
            // don't parse if it's not a known token
            if (formatTokenFunctions[token]) {
                if (parsedInput) {
                    config._pf.empty = false;
                }
                else {
                    config._pf.unusedTokens.push(token);
                }
                addTimeToArrayFromToken(token, parsedInput, config);
            }
            else if (config._strict && !parsedInput) {
                config._pf.unusedTokens.push(token);
            }
        }

        // add remaining unparsed input length to the string
        config._pf.charsLeftOver = stringLength - totalParsedInputLength;
        if (string.length > 0) {
            config._pf.unusedInput.push(string);
        }

        // clear _12h flag if hour is <= 12
        if (config._pf.bigHour === true && config._a[HOUR] <= 12) {
            config._pf.bigHour = undefined;
        }
        // handle meridiem
        config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR],
                config._meridiem);
        dateFromConfig(config);
        checkOverflow(config);
    }

    function unescapeFormat(s) {
        return s.replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
            return p1 || p2 || p3 || p4;
        });
    }

    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function regexpEscape(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    // date from string and array of format strings
    function makeDateFromStringAndArray(config) {
        var tempConfig,
            bestMoment,

            scoreToBeat,
            i,
            currentScore;

        if (config._f.length === 0) {
            config._pf.invalidFormat = true;
            config._d = new Date(NaN);
            return;
        }

        for (i = 0; i < config._f.length; i++) {
            currentScore = 0;
            tempConfig = copyConfig({}, config);
            if (config._useUTC != null) {
                tempConfig._useUTC = config._useUTC;
            }
            tempConfig._pf = defaultParsingFlags();
            tempConfig._f = config._f[i];
            makeDateFromStringAndFormat(tempConfig);

            if (!isValid(tempConfig)) {
                continue;
            }

            // if there is any input that was not parsed add a penalty for that format
            currentScore += tempConfig._pf.charsLeftOver;

            //or tokens
            currentScore += tempConfig._pf.unusedTokens.length * 10;

            tempConfig._pf.score = currentScore;

            if (scoreToBeat == null || currentScore < scoreToBeat) {
                scoreToBeat = currentScore;
                bestMoment = tempConfig;
            }
        }

        extend(config, bestMoment || tempConfig);
    }

    // date from iso format
    function parseISO(config) {
        var i, l,
            string = config._i,
            match = isoRegex.exec(string);

        if (match) {
            config._pf.iso = true;
            for (i = 0, l = isoDates.length; i < l; i++) {
                if (isoDates[i][1].exec(string)) {
                    // match[5] should be 'T' or undefined
                    config._f = isoDates[i][0] + (match[6] || ' ');
                    break;
                }
            }
            for (i = 0, l = isoTimes.length; i < l; i++) {
                if (isoTimes[i][1].exec(string)) {
                    config._f += isoTimes[i][0];
                    break;
                }
            }
            if (string.match(parseTokenTimezone)) {
                config._f += 'Z';
            }
            makeDateFromStringAndFormat(config);
        } else {
            config._isValid = false;
        }
    }

    // date from iso format or fallback
    function makeDateFromString(config) {
        parseISO(config);
        if (config._isValid === false) {
            delete config._isValid;
            moment.createFromInputFallback(config);
        }
    }

    function map(arr, fn) {
        var res = [], i;
        for (i = 0; i < arr.length; ++i) {
            res.push(fn(arr[i], i));
        }
        return res;
    }

    function makeDateFromInput(config) {
        var input = config._i, matched;
        if (input === undefined) {
            config._d = new Date();
        } else if (isDate(input)) {
            config._d = new Date(+input);
        } else if ((matched = aspNetJsonRegex.exec(input)) !== null) {
            config._d = new Date(+matched[1]);
        } else if (typeof input === 'string') {
            makeDateFromString(config);
        } else if (isArray(input)) {
            config._a = map(input.slice(0), function (obj) {
                return parseInt(obj, 10);
            });
            dateFromConfig(config);
        } else if (typeof(input) === 'object') {
            dateFromObject(config);
        } else if (typeof(input) === 'number') {
            // from milliseconds
            config._d = new Date(input);
        } else {
            moment.createFromInputFallback(config);
        }
    }

    function makeDate(y, m, d, h, M, s, ms) {
        //can't just apply() to create a date:
        //http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
        var date = new Date(y, m, d, h, M, s, ms);

        //the date constructor doesn't accept years < 1970
        if (y < 1970) {
            date.setFullYear(y);
        }
        return date;
    }

    function makeUTCDate(y) {
        var date = new Date(Date.UTC.apply(null, arguments));
        if (y < 1970) {
            date.setUTCFullYear(y);
        }
        return date;
    }

    function parseWeekday(input, locale) {
        if (typeof input === 'string') {
            if (!isNaN(input)) {
                input = parseInt(input, 10);
            }
            else {
                input = locale.weekdaysParse(input);
                if (typeof input !== 'number') {
                    return null;
                }
            }
        }
        return input;
    }

    /************************************
        Relative Time
    ************************************/


    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
        return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function relativeTime(posNegDuration, withoutSuffix, locale) {
        var duration = moment.duration(posNegDuration).abs(),
            seconds = round(duration.as('s')),
            minutes = round(duration.as('m')),
            hours = round(duration.as('h')),
            days = round(duration.as('d')),
            months = round(duration.as('M')),
            years = round(duration.as('y')),

            args = seconds < relativeTimeThresholds.s && ['s', seconds] ||
                minutes === 1 && ['m'] ||
                minutes < relativeTimeThresholds.m && ['mm', minutes] ||
                hours === 1 && ['h'] ||
                hours < relativeTimeThresholds.h && ['hh', hours] ||
                days === 1 && ['d'] ||
                days < relativeTimeThresholds.d && ['dd', days] ||
                months === 1 && ['M'] ||
                months < relativeTimeThresholds.M && ['MM', months] ||
                years === 1 && ['y'] || ['yy', years];

        args[2] = withoutSuffix;
        args[3] = +posNegDuration > 0;
        args[4] = locale;
        return substituteTimeAgo.apply({}, args);
    }


    /************************************
        Week of Year
    ************************************/


    // firstDayOfWeek       0 = sun, 6 = sat
    //                      the day of the week that starts the week
    //                      (usually sunday or monday)
    // firstDayOfWeekOfYear 0 = sun, 6 = sat
    //                      the first week is the week that contains the first
    //                      of this day of the week
    //                      (eg. ISO weeks use thursday (4))
    function weekOfYear(mom, firstDayOfWeek, firstDayOfWeekOfYear) {
        var end = firstDayOfWeekOfYear - firstDayOfWeek,
            daysToDayOfWeek = firstDayOfWeekOfYear - mom.day(),
            adjustedMoment;


        if (daysToDayOfWeek > end) {
            daysToDayOfWeek -= 7;
        }

        if (daysToDayOfWeek < end - 7) {
            daysToDayOfWeek += 7;
        }

        adjustedMoment = moment(mom).add(daysToDayOfWeek, 'd');
        return {
            week: Math.ceil(adjustedMoment.dayOfYear() / 7),
            year: adjustedMoment.year()
        };
    }

    //http://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
    function dayOfYearFromWeeks(year, week, weekday, firstDayOfWeekOfYear, firstDayOfWeek) {
        var d = makeUTCDate(year, 0, 1).getUTCDay(), daysToAdd, dayOfYear;

        d = d === 0 ? 7 : d;
        weekday = weekday != null ? weekday : firstDayOfWeek;
        daysToAdd = firstDayOfWeek - d + (d > firstDayOfWeekOfYear ? 7 : 0) - (d < firstDayOfWeek ? 7 : 0);
        dayOfYear = 7 * (week - 1) + (weekday - firstDayOfWeek) + daysToAdd + 1;

        return {
            year: dayOfYear > 0 ? year : year - 1,
            dayOfYear: dayOfYear > 0 ?  dayOfYear : daysInYear(year - 1) + dayOfYear
        };
    }

    /************************************
        Top Level Functions
    ************************************/

    function makeMoment(config) {
        var input = config._i,
            format = config._f,
            res;

        config._locale = config._locale || moment.localeData(config._l);

        if (input === null || (format === undefined && input === '')) {
            return moment.invalid({nullInput: true});
        }

        if (typeof input === 'string') {
            config._i = input = config._locale.preparse(input);
        }

        if (moment.isMoment(input)) {
            return new Moment(input, true);
        } else if (format) {
            if (isArray(format)) {
                makeDateFromStringAndArray(config);
            } else {
                makeDateFromStringAndFormat(config);
            }
        } else {
            makeDateFromInput(config);
        }

        res = new Moment(config);
        if (res._nextDay) {
            // Adding is smart enough around DST
            res.add(1, 'd');
            res._nextDay = undefined;
        }

        return res;
    }

    moment = function (input, format, locale, strict) {
        var c;

        if (typeof(locale) === 'boolean') {
            strict = locale;
            locale = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c = {};
        c._isAMomentObject = true;
        c._i = input;
        c._f = format;
        c._l = locale;
        c._strict = strict;
        c._isUTC = false;
        c._pf = defaultParsingFlags();

        return makeMoment(c);
    };

    moment.suppressDeprecationWarnings = false;

    moment.createFromInputFallback = deprecate(
        'moment construction falls back to js Date. This is ' +
        'discouraged and will be removed in upcoming major ' +
        'release. Please refer to ' +
        'https://github.com/moment/moment/issues/1407 for more info.',
        function (config) {
            config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
        }
    );

    // Pick a moment m from moments so that m[fn](other) is true for all
    // other. This relies on the function fn to be transitive.
    //
    // moments should either be an array of moment objects or an array, whose
    // first element is an array of moment objects.
    function pickBy(fn, moments) {
        var res, i;
        if (moments.length === 1 && isArray(moments[0])) {
            moments = moments[0];
        }
        if (!moments.length) {
            return moment();
        }
        res = moments[0];
        for (i = 1; i < moments.length; ++i) {
            if (moments[i][fn](res)) {
                res = moments[i];
            }
        }
        return res;
    }

    moment.min = function () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isBefore', args);
    };

    moment.max = function () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isAfter', args);
    };

    // creating with utc
    moment.utc = function (input, format, locale, strict) {
        var c;

        if (typeof(locale) === 'boolean') {
            strict = locale;
            locale = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c = {};
        c._isAMomentObject = true;
        c._useUTC = true;
        c._isUTC = true;
        c._l = locale;
        c._i = input;
        c._f = format;
        c._strict = strict;
        c._pf = defaultParsingFlags();

        return makeMoment(c).utc();
    };

    // creating with unix timestamp (in seconds)
    moment.unix = function (input) {
        return moment(input * 1000);
    };

    // duration
    moment.duration = function (input, key) {
        var duration = input,
            // matching against regexp is expensive, do it on demand
            match = null,
            sign,
            ret,
            parseIso,
            diffRes;

        if (moment.isDuration(input)) {
            duration = {
                ms: input._milliseconds,
                d: input._days,
                M: input._months
            };
        } else if (typeof input === 'number') {
            duration = {};
            if (key) {
                duration[key] = input;
            } else {
                duration.milliseconds = input;
            }
        } else if (!!(match = aspNetTimeSpanJsonRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            duration = {
                y: 0,
                d: toInt(match[DATE]) * sign,
                h: toInt(match[HOUR]) * sign,
                m: toInt(match[MINUTE]) * sign,
                s: toInt(match[SECOND]) * sign,
                ms: toInt(match[MILLISECOND]) * sign
            };
        } else if (!!(match = isoDurationRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            parseIso = function (inp) {
                // We'd normally use ~~inp for this, but unfortunately it also
                // converts floats to ints.
                // inp may be undefined, so careful calling replace on it.
                var res = inp && parseFloat(inp.replace(',', '.'));
                // apply sign while we're at it
                return (isNaN(res) ? 0 : res) * sign;
            };
            duration = {
                y: parseIso(match[2]),
                M: parseIso(match[3]),
                d: parseIso(match[4]),
                h: parseIso(match[5]),
                m: parseIso(match[6]),
                s: parseIso(match[7]),
                w: parseIso(match[8])
            };
        } else if (duration == null) {// checks for null or undefined
            duration = {};
        } else if (typeof duration === 'object' &&
                ('from' in duration || 'to' in duration)) {
            diffRes = momentsDifference(moment(duration.from), moment(duration.to));

            duration = {};
            duration.ms = diffRes.milliseconds;
            duration.M = diffRes.months;
        }

        ret = new Duration(duration);

        if (moment.isDuration(input) && hasOwnProp(input, '_locale')) {
            ret._locale = input._locale;
        }

        return ret;
    };

    // version number
    moment.version = VERSION;

    // default format
    moment.defaultFormat = isoFormat;

    // constant that refers to the ISO standard
    moment.ISO_8601 = function () {};

    // Plugins that add properties should also add the key here (null value),
    // so we can properly clone ourselves.
    moment.momentProperties = momentProperties;

    // This function will be called whenever a moment is mutated.
    // It is intended to keep the offset in sync with the timezone.
    moment.updateOffset = function () {};

    // This function allows you to set a threshold for relative time strings
    moment.relativeTimeThreshold = function (threshold, limit) {
        if (relativeTimeThresholds[threshold] === undefined) {
            return false;
        }
        if (limit === undefined) {
            return relativeTimeThresholds[threshold];
        }
        relativeTimeThresholds[threshold] = limit;
        return true;
    };

    moment.lang = deprecate(
        'moment.lang is deprecated. Use moment.locale instead.',
        function (key, value) {
            return moment.locale(key, value);
        }
    );

    // This function will load locale and then set the global locale.  If
    // no arguments are passed in, it will simply return the current global
    // locale key.
    moment.locale = function (key, values) {
        var data;
        if (key) {
            if (typeof(values) !== 'undefined') {
                data = moment.defineLocale(key, values);
            }
            else {
                data = moment.localeData(key);
            }

            if (data) {
                moment.duration._locale = moment._locale = data;
            }
        }

        return moment._locale._abbr;
    };

    moment.defineLocale = function (name, values) {
        if (values !== null) {
            values.abbr = name;
            if (!locales[name]) {
                locales[name] = new Locale();
            }
            locales[name].set(values);

            // backwards compat for now: also set the locale
            moment.locale(name);

            return locales[name];
        } else {
            // useful for testing
            delete locales[name];
            return null;
        }
    };

    moment.langData = deprecate(
        'moment.langData is deprecated. Use moment.localeData instead.',
        function (key) {
            return moment.localeData(key);
        }
    );

    // returns locale data
    moment.localeData = function (key) {
        var locale;

        if (key && key._locale && key._locale._abbr) {
            key = key._locale._abbr;
        }

        if (!key) {
            return moment._locale;
        }

        if (!isArray(key)) {
            //short-circuit everything else
            locale = loadLocale(key);
            if (locale) {
                return locale;
            }
            key = [key];
        }

        return chooseLocale(key);
    };

    // compare moment object
    moment.isMoment = function (obj) {
        return obj instanceof Moment ||
            (obj != null && hasOwnProp(obj, '_isAMomentObject'));
    };

    // for typechecking Duration objects
    moment.isDuration = function (obj) {
        return obj instanceof Duration;
    };

    for (i = lists.length - 1; i >= 0; --i) {
        makeList(lists[i]);
    }

    moment.normalizeUnits = function (units) {
        return normalizeUnits(units);
    };

    moment.invalid = function (flags) {
        var m = moment.utc(NaN);
        if (flags != null) {
            extend(m._pf, flags);
        }
        else {
            m._pf.userInvalidated = true;
        }

        return m;
    };

    moment.parseZone = function () {
        return moment.apply(null, arguments).parseZone();
    };

    moment.parseTwoDigitYear = function (input) {
        return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
    };

    moment.isDate = isDate;

    /************************************
        Moment Prototype
    ************************************/


    extend(moment.fn = Moment.prototype, {

        clone : function () {
            return moment(this);
        },

        valueOf : function () {
            return +this._d - ((this._offset || 0) * 60000);
        },

        unix : function () {
            return Math.floor(+this / 1000);
        },

        toString : function () {
            return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
        },

        toDate : function () {
            return this._offset ? new Date(+this) : this._d;
        },

        toISOString : function () {
            var m = moment(this).utc();
            if (0 < m.year() && m.year() <= 9999) {
                if ('function' === typeof Date.prototype.toISOString) {
                    // native implementation is ~50x faster, use it when we can
                    return this.toDate().toISOString();
                } else {
                    return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
                }
            } else {
                return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
            }
        },

        toArray : function () {
            var m = this;
            return [
                m.year(),
                m.month(),
                m.date(),
                m.hours(),
                m.minutes(),
                m.seconds(),
                m.milliseconds()
            ];
        },

        isValid : function () {
            return isValid(this);
        },

        isDSTShifted : function () {
            if (this._a) {
                return this.isValid() && compareArrays(this._a, (this._isUTC ? moment.utc(this._a) : moment(this._a)).toArray()) > 0;
            }

            return false;
        },

        parsingFlags : function () {
            return extend({}, this._pf);
        },

        invalidAt: function () {
            return this._pf.overflow;
        },

        utc : function (keepLocalTime) {
            return this.utcOffset(0, keepLocalTime);
        },

        local : function (keepLocalTime) {
            if (this._isUTC) {
                this.utcOffset(0, keepLocalTime);
                this._isUTC = false;

                if (keepLocalTime) {
                    this.subtract(this._dateUtcOffset(), 'm');
                }
            }
            return this;
        },

        format : function (inputString) {
            var output = formatMoment(this, inputString || moment.defaultFormat);
            return this.localeData().postformat(output);
        },

        add : createAdder(1, 'add'),

        subtract : createAdder(-1, 'subtract'),

        diff : function (input, units, asFloat) {
            var that = makeAs(input, this),
                zoneDiff = (that.utcOffset() - this.utcOffset()) * 6e4,
                anchor, diff, output, daysAdjust;

            units = normalizeUnits(units);

            if (units === 'year' || units === 'month' || units === 'quarter') {
                output = monthDiff(this, that);
                if (units === 'quarter') {
                    output = output / 3;
                } else if (units === 'year') {
                    output = output / 12;
                }
            } else {
                diff = this - that;
                output = units === 'second' ? diff / 1e3 : // 1000
                    units === 'minute' ? diff / 6e4 : // 1000 * 60
                    units === 'hour' ? diff / 36e5 : // 1000 * 60 * 60
                    units === 'day' ? (diff - zoneDiff) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
                    units === 'week' ? (diff - zoneDiff) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
                    diff;
            }
            return asFloat ? output : absRound(output);
        },

        from : function (time, withoutSuffix) {
            return moment.duration({to: this, from: time}).locale(this.locale()).humanize(!withoutSuffix);
        },

        fromNow : function (withoutSuffix) {
            return this.from(moment(), withoutSuffix);
        },

        calendar : function (time) {
            // We want to compare the start of today, vs this.
            // Getting start-of-today depends on whether we're locat/utc/offset
            // or not.
            var now = time || moment(),
                sod = makeAs(now, this).startOf('day'),
                diff = this.diff(sod, 'days', true),
                format = diff < -6 ? 'sameElse' :
                    diff < -1 ? 'lastWeek' :
                    diff < 0 ? 'lastDay' :
                    diff < 1 ? 'sameDay' :
                    diff < 2 ? 'nextDay' :
                    diff < 7 ? 'nextWeek' : 'sameElse';
            return this.format(this.localeData().calendar(format, this, moment(now)));
        },

        isLeapYear : function () {
            return isLeapYear(this.year());
        },

        isDST : function () {
            return (this.utcOffset() > this.clone().month(0).utcOffset() ||
                this.utcOffset() > this.clone().month(5).utcOffset());
        },

        day : function (input) {
            var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
            if (input != null) {
                input = parseWeekday(input, this.localeData());
                return this.add(input - day, 'd');
            } else {
                return day;
            }
        },

        month : makeAccessor('Month', true),

        startOf : function (units) {
            units = normalizeUnits(units);
            // the following switch intentionally omits break keywords
            // to utilize falling through the cases.
            switch (units) {
            case 'year':
                this.month(0);
                /* falls through */
            case 'quarter':
            case 'month':
                this.date(1);
                /* falls through */
            case 'week':
            case 'isoWeek':
            case 'day':
                this.hours(0);
                /* falls through */
            case 'hour':
                this.minutes(0);
                /* falls through */
            case 'minute':
                this.seconds(0);
                /* falls through */
            case 'second':
                this.milliseconds(0);
                /* falls through */
            }

            // weeks are a special case
            if (units === 'week') {
                this.weekday(0);
            } else if (units === 'isoWeek') {
                this.isoWeekday(1);
            }

            // quarters are also special
            if (units === 'quarter') {
                this.month(Math.floor(this.month() / 3) * 3);
            }

            return this;
        },

        endOf: function (units) {
            units = normalizeUnits(units);
            if (units === undefined || units === 'millisecond') {
                return this;
            }
            return this.startOf(units).add(1, (units === 'isoWeek' ? 'week' : units)).subtract(1, 'ms');
        },

        isAfter: function (input, units) {
            var inputMs;
            units = normalizeUnits(typeof units !== 'undefined' ? units : 'millisecond');
            if (units === 'millisecond') {
                input = moment.isMoment(input) ? input : moment(input);
                return +this > +input;
            } else {
                inputMs = moment.isMoment(input) ? +input : +moment(input);
                return inputMs < +this.clone().startOf(units);
            }
        },

        isBefore: function (input, units) {
            var inputMs;
            units = normalizeUnits(typeof units !== 'undefined' ? units : 'millisecond');
            if (units === 'millisecond') {
                input = moment.isMoment(input) ? input : moment(input);
                return +this < +input;
            } else {
                inputMs = moment.isMoment(input) ? +input : +moment(input);
                return +this.clone().endOf(units) < inputMs;
            }
        },

        isBetween: function (from, to, units) {
            return this.isAfter(from, units) && this.isBefore(to, units);
        },

        isSame: function (input, units) {
            var inputMs;
            units = normalizeUnits(units || 'millisecond');
            if (units === 'millisecond') {
                input = moment.isMoment(input) ? input : moment(input);
                return +this === +input;
            } else {
                inputMs = +moment(input);
                return +(this.clone().startOf(units)) <= inputMs && inputMs <= +(this.clone().endOf(units));
            }
        },

        min: deprecate(
                 'moment().min is deprecated, use moment.min instead. https://github.com/moment/moment/issues/1548',
                 function (other) {
                     other = moment.apply(null, arguments);
                     return other < this ? this : other;
                 }
         ),

        max: deprecate(
                'moment().max is deprecated, use moment.max instead. https://github.com/moment/moment/issues/1548',
                function (other) {
                    other = moment.apply(null, arguments);
                    return other > this ? this : other;
                }
        ),

        zone : deprecate(
                'moment().zone is deprecated, use moment().utcOffset instead. ' +
                'https://github.com/moment/moment/issues/1779',
                function (input, keepLocalTime) {
                    if (input != null) {
                        if (typeof input !== 'string') {
                            input = -input;
                        }

                        this.utcOffset(input, keepLocalTime);

                        return this;
                    } else {
                        return -this.utcOffset();
                    }
                }
        ),

        // keepLocalTime = true means only change the timezone, without
        // affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
        // 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
        // +0200, so we adjust the time as needed, to be valid.
        //
        // Keeping the time actually adds/subtracts (one hour)
        // from the actual represented time. That is why we call updateOffset
        // a second time. In case it wants us to change the offset again
        // _changeInProgress == true case, then we have to adjust, because
        // there is no such time in the given timezone.
        utcOffset : function (input, keepLocalTime) {
            var offset = this._offset || 0,
                localAdjust;
            if (input != null) {
                if (typeof input === 'string') {
                    input = utcOffsetFromString(input);
                }
                if (Math.abs(input) < 16) {
                    input = input * 60;
                }
                if (!this._isUTC && keepLocalTime) {
                    localAdjust = this._dateUtcOffset();
                }
                this._offset = input;
                this._isUTC = true;
                if (localAdjust != null) {
                    this.add(localAdjust, 'm');
                }
                if (offset !== input) {
                    if (!keepLocalTime || this._changeInProgress) {
                        addOrSubtractDurationFromMoment(this,
                                moment.duration(input - offset, 'm'), 1, false);
                    } else if (!this._changeInProgress) {
                        this._changeInProgress = true;
                        moment.updateOffset(this, true);
                        this._changeInProgress = null;
                    }
                }

                return this;
            } else {
                return this._isUTC ? offset : this._dateUtcOffset();
            }
        },

        isLocal : function () {
            return !this._isUTC;
        },

        isUtcOffset : function () {
            return this._isUTC;
        },

        isUtc : function () {
            return this._isUTC && this._offset === 0;
        },

        zoneAbbr : function () {
            return this._isUTC ? 'UTC' : '';
        },

        zoneName : function () {
            return this._isUTC ? 'Coordinated Universal Time' : '';
        },

        parseZone : function () {
            if (this._tzm) {
                this.utcOffset(this._tzm);
            } else if (typeof this._i === 'string') {
                this.utcOffset(utcOffsetFromString(this._i));
            }
            return this;
        },

        hasAlignedHourOffset : function (input) {
            if (!input) {
                input = 0;
            }
            else {
                input = moment(input).utcOffset();
            }

            return (this.utcOffset() - input) % 60 === 0;
        },

        daysInMonth : function () {
            return daysInMonth(this.year(), this.month());
        },

        dayOfYear : function (input) {
            var dayOfYear = round((moment(this).startOf('day') - moment(this).startOf('year')) / 864e5) + 1;
            return input == null ? dayOfYear : this.add((input - dayOfYear), 'd');
        },

        quarter : function (input) {
            return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
        },

        weekYear : function (input) {
            var year = weekOfYear(this, this.localeData()._week.dow, this.localeData()._week.doy).year;
            return input == null ? year : this.add((input - year), 'y');
        },

        isoWeekYear : function (input) {
            var year = weekOfYear(this, 1, 4).year;
            return input == null ? year : this.add((input - year), 'y');
        },

        week : function (input) {
            var week = this.localeData().week(this);
            return input == null ? week : this.add((input - week) * 7, 'd');
        },

        isoWeek : function (input) {
            var week = weekOfYear(this, 1, 4).week;
            return input == null ? week : this.add((input - week) * 7, 'd');
        },

        weekday : function (input) {
            var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
            return input == null ? weekday : this.add(input - weekday, 'd');
        },

        isoWeekday : function (input) {
            // behaves the same as moment#day except
            // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
            // as a setter, sunday should belong to the previous week.
            return input == null ? this.day() || 7 : this.day(this.day() % 7 ? input : input - 7);
        },

        isoWeeksInYear : function () {
            return weeksInYear(this.year(), 1, 4);
        },

        weeksInYear : function () {
            var weekInfo = this.localeData()._week;
            return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
        },

        get : function (units) {
            units = normalizeUnits(units);
            return this[units]();
        },

        set : function (units, value) {
            var unit;
            if (typeof units === 'object') {
                for (unit in units) {
                    this.set(unit, units[unit]);
                }
            }
            else {
                units = normalizeUnits(units);
                if (typeof this[units] === 'function') {
                    this[units](value);
                }
            }
            return this;
        },

        // If passed a locale key, it will set the locale for this
        // instance.  Otherwise, it will return the locale configuration
        // variables for this instance.
        locale : function (key) {
            var newLocaleData;

            if (key === undefined) {
                return this._locale._abbr;
            } else {
                newLocaleData = moment.localeData(key);
                if (newLocaleData != null) {
                    this._locale = newLocaleData;
                }
                return this;
            }
        },

        lang : deprecate(
            'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
            function (key) {
                if (key === undefined) {
                    return this.localeData();
                } else {
                    return this.locale(key);
                }
            }
        ),

        localeData : function () {
            return this._locale;
        },

        _dateUtcOffset : function () {
            // On Firefox.24 Date#getTimezoneOffset returns a floating point.
            // https://github.com/moment/moment/pull/1871
            return -Math.round(this._d.getTimezoneOffset() / 15) * 15;
        }

    });

    function rawMonthSetter(mom, value) {
        var dayOfMonth;

        // TODO: Move this out of here!
        if (typeof value === 'string') {
            value = mom.localeData().monthsParse(value);
            // TODO: Another silent failure?
            if (typeof value !== 'number') {
                return mom;
            }
        }

        dayOfMonth = Math.min(mom.date(),
                daysInMonth(mom.year(), value));
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
        return mom;
    }

    function rawGetter(mom, unit) {
        return mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]();
    }

    function rawSetter(mom, unit, value) {
        if (unit === 'Month') {
            return rawMonthSetter(mom, value);
        } else {
            return mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
        }
    }

    function makeAccessor(unit, keepTime) {
        return function (value) {
            if (value != null) {
                rawSetter(this, unit, value);
                moment.updateOffset(this, keepTime);
                return this;
            } else {
                return rawGetter(this, unit);
            }
        };
    }

    moment.fn.millisecond = moment.fn.milliseconds = makeAccessor('Milliseconds', false);
    moment.fn.second = moment.fn.seconds = makeAccessor('Seconds', false);
    moment.fn.minute = moment.fn.minutes = makeAccessor('Minutes', false);
    // Setting the hour should keep the time, because the user explicitly
    // specified which hour he wants. So trying to maintain the same hour (in
    // a new timezone) makes sense. Adding/subtracting hours does not follow
    // this rule.
    moment.fn.hour = moment.fn.hours = makeAccessor('Hours', true);
    // moment.fn.month is defined separately
    moment.fn.date = makeAccessor('Date', true);
    moment.fn.dates = deprecate('dates accessor is deprecated. Use date instead.', makeAccessor('Date', true));
    moment.fn.year = makeAccessor('FullYear', true);
    moment.fn.years = deprecate('years accessor is deprecated. Use year instead.', makeAccessor('FullYear', true));

    // add plural methods
    moment.fn.days = moment.fn.day;
    moment.fn.months = moment.fn.month;
    moment.fn.weeks = moment.fn.week;
    moment.fn.isoWeeks = moment.fn.isoWeek;
    moment.fn.quarters = moment.fn.quarter;

    // add aliased format methods
    moment.fn.toJSON = moment.fn.toISOString;

    // alias isUtc for dev-friendliness
    moment.fn.isUTC = moment.fn.isUtc;

    /************************************
        Duration Prototype
    ************************************/


    function daysToYears (days) {
        // 400 years have 146097 days (taking into account leap year rules)
        return days * 400 / 146097;
    }

    function yearsToDays (years) {
        // years * 365 + absRound(years / 4) -
        //     absRound(years / 100) + absRound(years / 400);
        return years * 146097 / 400;
    }

    extend(moment.duration.fn = Duration.prototype, {

        _bubble : function () {
            var milliseconds = this._milliseconds,
                days = this._days,
                months = this._months,
                data = this._data,
                seconds, minutes, hours, years = 0;

            // The following code bubbles up values, see the tests for
            // examples of what that means.
            data.milliseconds = milliseconds % 1000;

            seconds = absRound(milliseconds / 1000);
            data.seconds = seconds % 60;

            minutes = absRound(seconds / 60);
            data.minutes = minutes % 60;

            hours = absRound(minutes / 60);
            data.hours = hours % 24;

            days += absRound(hours / 24);

            // Accurately convert days to years, assume start from year 0.
            years = absRound(daysToYears(days));
            days -= absRound(yearsToDays(years));

            // 30 days to a month
            // TODO (iskren): Use anchor date (like 1st Jan) to compute this.
            months += absRound(days / 30);
            days %= 30;

            // 12 months -> 1 year
            years += absRound(months / 12);
            months %= 12;

            data.days = days;
            data.months = months;
            data.years = years;
        },

        abs : function () {
            this._milliseconds = Math.abs(this._milliseconds);
            this._days = Math.abs(this._days);
            this._months = Math.abs(this._months);

            this._data.milliseconds = Math.abs(this._data.milliseconds);
            this._data.seconds = Math.abs(this._data.seconds);
            this._data.minutes = Math.abs(this._data.minutes);
            this._data.hours = Math.abs(this._data.hours);
            this._data.months = Math.abs(this._data.months);
            this._data.years = Math.abs(this._data.years);

            return this;
        },

        weeks : function () {
            return absRound(this.days() / 7);
        },

        valueOf : function () {
            return this._milliseconds +
              this._days * 864e5 +
              (this._months % 12) * 2592e6 +
              toInt(this._months / 12) * 31536e6;
        },

        humanize : function (withSuffix) {
            var output = relativeTime(this, !withSuffix, this.localeData());

            if (withSuffix) {
                output = this.localeData().pastFuture(+this, output);
            }

            return this.localeData().postformat(output);
        },

        add : function (input, val) {
            // supports only 2.0-style add(1, 's') or add(moment)
            var dur = moment.duration(input, val);

            this._milliseconds += dur._milliseconds;
            this._days += dur._days;
            this._months += dur._months;

            this._bubble();

            return this;
        },

        subtract : function (input, val) {
            var dur = moment.duration(input, val);

            this._milliseconds -= dur._milliseconds;
            this._days -= dur._days;
            this._months -= dur._months;

            this._bubble();

            return this;
        },

        get : function (units) {
            units = normalizeUnits(units);
            return this[units.toLowerCase() + 's']();
        },

        as : function (units) {
            var days, months;
            units = normalizeUnits(units);

            if (units === 'month' || units === 'year') {
                days = this._days + this._milliseconds / 864e5;
                months = this._months + daysToYears(days) * 12;
                return units === 'month' ? months : months / 12;
            } else {
                // handle milliseconds separately because of floating point math errors (issue #1867)
                days = this._days + Math.round(yearsToDays(this._months / 12));
                switch (units) {
                    case 'week': return days / 7 + this._milliseconds / 6048e5;
                    case 'day': return days + this._milliseconds / 864e5;
                    case 'hour': return days * 24 + this._milliseconds / 36e5;
                    case 'minute': return days * 24 * 60 + this._milliseconds / 6e4;
                    case 'second': return days * 24 * 60 * 60 + this._milliseconds / 1000;
                    // Math.floor prevents floating point math errors here
                    case 'millisecond': return Math.floor(days * 24 * 60 * 60 * 1000) + this._milliseconds;
                    default: throw new Error('Unknown unit ' + units);
                }
            }
        },

        lang : moment.fn.lang,
        locale : moment.fn.locale,

        toIsoString : deprecate(
            'toIsoString() is deprecated. Please use toISOString() instead ' +
            '(notice the capitals)',
            function () {
                return this.toISOString();
            }
        ),

        toISOString : function () {
            // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
            var years = Math.abs(this.years()),
                months = Math.abs(this.months()),
                days = Math.abs(this.days()),
                hours = Math.abs(this.hours()),
                minutes = Math.abs(this.minutes()),
                seconds = Math.abs(this.seconds() + this.milliseconds() / 1000);

            if (!this.asSeconds()) {
                // this is the same as C#'s (Noda) and python (isodate)...
                // but not other JS (goog.date)
                return 'P0D';
            }

            return (this.asSeconds() < 0 ? '-' : '') +
                'P' +
                (years ? years + 'Y' : '') +
                (months ? months + 'M' : '') +
                (days ? days + 'D' : '') +
                ((hours || minutes || seconds) ? 'T' : '') +
                (hours ? hours + 'H' : '') +
                (minutes ? minutes + 'M' : '') +
                (seconds ? seconds + 'S' : '');
        },

        localeData : function () {
            return this._locale;
        },

        toJSON : function () {
            return this.toISOString();
        }
    });

    moment.duration.fn.toString = moment.duration.fn.toISOString;

    function makeDurationGetter(name) {
        moment.duration.fn[name] = function () {
            return this._data[name];
        };
    }

    for (i in unitMillisecondFactors) {
        if (hasOwnProp(unitMillisecondFactors, i)) {
            makeDurationGetter(i.toLowerCase());
        }
    }

    moment.duration.fn.asMilliseconds = function () {
        return this.as('ms');
    };
    moment.duration.fn.asSeconds = function () {
        return this.as('s');
    };
    moment.duration.fn.asMinutes = function () {
        return this.as('m');
    };
    moment.duration.fn.asHours = function () {
        return this.as('h');
    };
    moment.duration.fn.asDays = function () {
        return this.as('d');
    };
    moment.duration.fn.asWeeks = function () {
        return this.as('weeks');
    };
    moment.duration.fn.asMonths = function () {
        return this.as('M');
    };
    moment.duration.fn.asYears = function () {
        return this.as('y');
    };

    /************************************
        Default Locale
    ************************************/


    // Set default locale, other locale will inherit from English.
    moment.locale('en', {
        ordinalParse: /\d{1,2}(th|st|nd|rd)/,
        ordinal : function (number) {
            var b = number % 10,
                output = (toInt(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });

    /* EMBED_LOCALES */

    /************************************
        Exposing Moment
    ************************************/

    function makeGlobal(shouldDeprecate) {
        /*global ender:false */
        if (typeof ender !== 'undefined') {
            return;
        }
        oldGlobalMoment = globalScope.moment;
        if (shouldDeprecate) {
            globalScope.moment = deprecate(
                    'Accessing Moment through the global scope is ' +
                    'deprecated, and will be removed in an upcoming ' +
                    'release.',
                    moment);
        } else {
            globalScope.moment = moment;
        }
    }

    // CommonJS module is defined
    if (hasModule) {
        module.exports = moment;
    } else if (typeof define === 'function' && define.amd) {
        define(function (require, exports, module) {
            if (module.config && module.config() && module.config().noGlobal === true) {
                // release the global variable
                globalScope.moment = oldGlobalMoment;
            }

            return moment;
        });
        makeGlobal(true);
    } else {
        makeGlobal();
    }
}).call(this);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],"/Users/SoPitted/Work/reactcomment/node_modules/superagent/lib/client.js":[function(require,module,exports){
/**
 * Module dependencies.
 */

var Emitter = require('emitter');
var reduce = require('reduce');

/**
 * Root reference for iframes.
 */

var root = 'undefined' == typeof window
  ? this
  : window;

/**
 * Noop.
 */

function noop(){};

/**
 * Check if `obj` is a host object,
 * we don't want to serialize these :)
 *
 * TODO: future proof, move to compoent land
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isHost(obj) {
  var str = {}.toString.call(obj);

  switch (str) {
    case '[object File]':
    case '[object Blob]':
    case '[object FormData]':
      return true;
    default:
      return false;
  }
}

/**
 * Determine XHR.
 */

function getXHR() {
  if (root.XMLHttpRequest
    && ('file:' != root.location.protocol || !root.ActiveXObject)) {
    return new XMLHttpRequest;
  } else {
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
  }
  return false;
}

/**
 * Removes leading and trailing whitespace, added to support IE.
 *
 * @param {String} s
 * @return {String}
 * @api private
 */

var trim = ''.trim
  ? function(s) { return s.trim(); }
  : function(s) { return s.replace(/(^\s*|\s*$)/g, ''); };

/**
 * Check if `obj` is an object.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isObject(obj) {
  return obj === Object(obj);
}

/**
 * Serialize the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api private
 */

function serialize(obj) {
  if (!isObject(obj)) return obj;
  var pairs = [];
  for (var key in obj) {
    if (null != obj[key]) {
      pairs.push(encodeURIComponent(key)
        + '=' + encodeURIComponent(obj[key]));
    }
  }
  return pairs.join('&');
}

/**
 * Expose serialization method.
 */

 request.serializeObject = serialize;

 /**
  * Parse the given x-www-form-urlencoded `str`.
  *
  * @param {String} str
  * @return {Object}
  * @api private
  */

function parseString(str) {
  var obj = {};
  var pairs = str.split('&');
  var parts;
  var pair;

  for (var i = 0, len = pairs.length; i < len; ++i) {
    pair = pairs[i];
    parts = pair.split('=');
    obj[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
  }

  return obj;
}

/**
 * Expose parser.
 */

request.parseString = parseString;

/**
 * Default MIME type map.
 *
 *     superagent.types.xml = 'application/xml';
 *
 */

request.types = {
  html: 'text/html',
  json: 'application/json',
  xml: 'application/xml',
  urlencoded: 'application/x-www-form-urlencoded',
  'form': 'application/x-www-form-urlencoded',
  'form-data': 'application/x-www-form-urlencoded'
};

/**
 * Default serialization map.
 *
 *     superagent.serialize['application/xml'] = function(obj){
 *       return 'generated xml here';
 *     };
 *
 */

 request.serialize = {
   'application/x-www-form-urlencoded': serialize,
   'application/json': JSON.stringify
 };

 /**
  * Default parsers.
  *
  *     superagent.parse['application/xml'] = function(str){
  *       return { object parsed from str };
  *     };
  *
  */

request.parse = {
  'application/x-www-form-urlencoded': parseString,
  'application/json': JSON.parse
};

/**
 * Parse the given header `str` into
 * an object containing the mapped fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parseHeader(str) {
  var lines = str.split(/\r?\n/);
  var fields = {};
  var index;
  var line;
  var field;
  var val;

  lines.pop(); // trailing CRLF

  for (var i = 0, len = lines.length; i < len; ++i) {
    line = lines[i];
    index = line.indexOf(':');
    field = line.slice(0, index).toLowerCase();
    val = trim(line.slice(index + 1));
    fields[field] = val;
  }

  return fields;
}

/**
 * Return the mime type for the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function type(str){
  return str.split(/ *; */).shift();
};

/**
 * Return header field parameters.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function params(str){
  return reduce(str.split(/ *; */), function(obj, str){
    var parts = str.split(/ *= */)
      , key = parts.shift()
      , val = parts.shift();

    if (key && val) obj[key] = val;
    return obj;
  }, {});
};

/**
 * Initialize a new `Response` with the given `xhr`.
 *
 *  - set flags (.ok, .error, etc)
 *  - parse header
 *
 * Examples:
 *
 *  Aliasing `superagent` as `request` is nice:
 *
 *      request = superagent;
 *
 *  We can use the promise-like API, or pass callbacks:
 *
 *      request.get('/').end(function(res){});
 *      request.get('/', function(res){});
 *
 *  Sending data can be chained:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' })
 *        .end(function(res){});
 *
 *  Or passed to `.send()`:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' }, function(res){});
 *
 *  Or passed to `.post()`:
 *
 *      request
 *        .post('/user', { name: 'tj' })
 *        .end(function(res){});
 *
 * Or further reduced to a single call for simple cases:
 *
 *      request
 *        .post('/user', { name: 'tj' }, function(res){});
 *
 * @param {XMLHTTPRequest} xhr
 * @param {Object} options
 * @api private
 */

function Response(req, options) {
  options = options || {};
  this.req = req;
  this.xhr = this.req.xhr;
  this.text = this.req.method !='HEAD' 
     ? this.xhr.responseText 
     : null;
  this.setStatusProperties(this.xhr.status);
  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
  // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
  // getResponseHeader still works. so we get content-type even if getting
  // other headers fails.
  this.header['content-type'] = this.xhr.getResponseHeader('content-type');
  this.setHeaderProperties(this.header);
  this.body = this.req.method != 'HEAD'
    ? this.parseBody(this.text)
    : null;
}

/**
 * Get case-insensitive `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

Response.prototype.get = function(field){
  return this.header[field.toLowerCase()];
};

/**
 * Set header related properties:
 *
 *   - `.type` the content type without params
 *
 * A response of "Content-Type: text/plain; charset=utf-8"
 * will provide you with a `.type` of "text/plain".
 *
 * @param {Object} header
 * @api private
 */

Response.prototype.setHeaderProperties = function(header){
  // content-type
  var ct = this.header['content-type'] || '';
  this.type = type(ct);

  // params
  var obj = params(ct);
  for (var key in obj) this[key] = obj[key];
};

/**
 * Parse the given body `str`.
 *
 * Used for auto-parsing of bodies. Parsers
 * are defined on the `superagent.parse` object.
 *
 * @param {String} str
 * @return {Mixed}
 * @api private
 */

Response.prototype.parseBody = function(str){
  var parse = request.parse[this.type];
  return parse && str && str.length
    ? parse(str)
    : null;
};

/**
 * Set flags such as `.ok` based on `status`.
 *
 * For example a 2xx response will give you a `.ok` of __true__
 * whereas 5xx will be __false__ and `.error` will be __true__. The
 * `.clientError` and `.serverError` are also available to be more
 * specific, and `.statusType` is the class of error ranging from 1..5
 * sometimes useful for mapping respond colors etc.
 *
 * "sugar" properties are also defined for common cases. Currently providing:
 *
 *   - .noContent
 *   - .badRequest
 *   - .unauthorized
 *   - .notAcceptable
 *   - .notFound
 *
 * @param {Number} status
 * @api private
 */

Response.prototype.setStatusProperties = function(status){
  var type = status / 100 | 0;

  // status / class
  this.status = status;
  this.statusType = type;

  // basics
  this.info = 1 == type;
  this.ok = 2 == type;
  this.clientError = 4 == type;
  this.serverError = 5 == type;
  this.error = (4 == type || 5 == type)
    ? this.toError()
    : false;

  // sugar
  this.accepted = 202 == status;
  this.noContent = 204 == status || 1223 == status;
  this.badRequest = 400 == status;
  this.unauthorized = 401 == status;
  this.notAcceptable = 406 == status;
  this.notFound = 404 == status;
  this.forbidden = 403 == status;
};

/**
 * Return an `Error` representative of this response.
 *
 * @return {Error}
 * @api public
 */

Response.prototype.toError = function(){
  var req = this.req;
  var method = req.method;
  var url = req.url;

  var msg = 'cannot ' + method + ' ' + url + ' (' + this.status + ')';
  var err = new Error(msg);
  err.status = this.status;
  err.method = method;
  err.url = url;

  return err;
};

/**
 * Expose `Response`.
 */

request.Response = Response;

/**
 * Initialize a new `Request` with the given `method` and `url`.
 *
 * @param {String} method
 * @param {String} url
 * @api public
 */

function Request(method, url) {
  var self = this;
  Emitter.call(this);
  this._query = this._query || [];
  this.method = method;
  this.url = url;
  this.header = {};
  this._header = {};
  this.on('end', function(){
    var err = null;
    var res = null;

    try {
      res = new Response(self); 
    } catch(e) {
      err = new Error('Parser is unable to parse the response');
      err.parse = true;
      err.original = e;
    }

    self.callback(err, res);
  });
}

/**
 * Mixin `Emitter`.
 */

Emitter(Request.prototype);

/**
 * Allow for extension
 */

Request.prototype.use = function(fn) {
  fn(this);
  return this;
}

/**
 * Set timeout to `ms`.
 *
 * @param {Number} ms
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.timeout = function(ms){
  this._timeout = ms;
  return this;
};

/**
 * Clear previous timeout.
 *
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.clearTimeout = function(){
  this._timeout = 0;
  clearTimeout(this._timer);
  return this;
};

/**
 * Abort the request, and clear potential timeout.
 *
 * @return {Request}
 * @api public
 */

Request.prototype.abort = function(){
  if (this.aborted) return;
  this.aborted = true;
  this.xhr.abort();
  this.clearTimeout();
  this.emit('abort');
  return this;
};

/**
 * Set header `field` to `val`, or multiple fields with one object.
 *
 * Examples:
 *
 *      req.get('/')
 *        .set('Accept', 'application/json')
 *        .set('X-API-Key', 'foobar')
 *        .end(callback);
 *
 *      req.get('/')
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
 *        .end(callback);
 *
 * @param {String|Object} field
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.set = function(field, val){
  if (isObject(field)) {
    for (var key in field) {
      this.set(key, field[key]);
    }
    return this;
  }
  this._header[field.toLowerCase()] = val;
  this.header[field] = val;
  return this;
};

/**
 * Remove header `field`.
 *
 * Example:
 *
 *      req.get('/')
 *        .unset('User-Agent')
 *        .end(callback);
 *
 * @param {String} field
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.unset = function(field){
  delete this._header[field.toLowerCase()];
  delete this.header[field];
  return this;
};

/**
 * Get case-insensitive header `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api private
 */

Request.prototype.getHeader = function(field){
  return this._header[field.toLowerCase()];
};

/**
 * Set Content-Type to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.xml = 'application/xml';
 *
 *      request.post('/')
 *        .type('xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('application/xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 * @param {String} type
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.type = function(type){
  this.set('Content-Type', request.types[type] || type);
  return this;
};

/**
 * Set Accept to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.json = 'application/json';
 *
 *      request.get('/agent')
 *        .accept('json')
 *        .end(callback);
 *
 *      request.get('/agent')
 *        .accept('application/json')
 *        .end(callback);
 *
 * @param {String} accept
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.accept = function(type){
  this.set('Accept', request.types[type] || type);
  return this;
};

/**
 * Set Authorization field value with `user` and `pass`.
 *
 * @param {String} user
 * @param {String} pass
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.auth = function(user, pass){
  var str = btoa(user + ':' + pass);
  this.set('Authorization', 'Basic ' + str);
  return this;
};

/**
* Add query-string `val`.
*
* Examples:
*
*   request.get('/shoes')
*     .query('size=10')
*     .query({ color: 'blue' })
*
* @param {Object|String} val
* @return {Request} for chaining
* @api public
*/

Request.prototype.query = function(val){
  if ('string' != typeof val) val = serialize(val);
  if (val) this._query.push(val);
  return this;
};

/**
 * Write the field `name` and `val` for "multipart/form-data"
 * request bodies.
 *
 * ``` js
 * request.post('/upload')
 *   .field('foo', 'bar')
 *   .end(callback);
 * ```
 *
 * @param {String} name
 * @param {String|Blob|File} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.field = function(name, val){
  if (!this._formData) this._formData = new FormData();
  this._formData.append(name, val);
  return this;
};

/**
 * Queue the given `file` as an attachment to the specified `field`,
 * with optional `filename`.
 *
 * ``` js
 * request.post('/upload')
 *   .attach(new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
 *   .end(callback);
 * ```
 *
 * @param {String} field
 * @param {Blob|File} file
 * @param {String} filename
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.attach = function(field, file, filename){
  if (!this._formData) this._formData = new FormData();
  this._formData.append(field, file, filename);
  return this;
};

/**
 * Send `data`, defaulting the `.type()` to "json" when
 * an object is given.
 *
 * Examples:
 *
 *       // querystring
 *       request.get('/search')
 *         .end(callback)
 *
 *       // multiple data "writes"
 *       request.get('/search')
 *         .send({ search: 'query' })
 *         .send({ range: '1..5' })
 *         .send({ order: 'desc' })
 *         .end(callback)
 *
 *       // manual json
 *       request.post('/user')
 *         .type('json')
 *         .send('{"name":"tj"})
 *         .end(callback)
 *
 *       // auto json
 *       request.post('/user')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // manual x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send('name=tj')
 *         .end(callback)
 *
 *       // auto x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // defaults to x-www-form-urlencoded
  *      request.post('/user')
  *        .send('name=tobi')
  *        .send('species=ferret')
  *        .end(callback)
 *
 * @param {String|Object} data
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.send = function(data){
  var obj = isObject(data);
  var type = this.getHeader('Content-Type');

  // merge
  if (obj && isObject(this._data)) {
    for (var key in data) {
      this._data[key] = data[key];
    }
  } else if ('string' == typeof data) {
    if (!type) this.type('form');
    type = this.getHeader('Content-Type');
    if ('application/x-www-form-urlencoded' == type) {
      this._data = this._data
        ? this._data + '&' + data
        : data;
    } else {
      this._data = (this._data || '') + data;
    }
  } else {
    this._data = data;
  }

  if (!obj) return this;
  if (!type) this.type('json');
  return this;
};

/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */

Request.prototype.callback = function(err, res){
  var fn = this._callback;
  this.clearTimeout();
  if (2 == fn.length) return fn(err, res);
  if (err) return this.emit('error', err);
  fn(res);
};

/**
 * Invoke callback with x-domain error.
 *
 * @api private
 */

Request.prototype.crossDomainError = function(){
  var err = new Error('Origin is not allowed by Access-Control-Allow-Origin');
  err.crossDomain = true;
  this.callback(err);
};

/**
 * Invoke callback with timeout error.
 *
 * @api private
 */

Request.prototype.timeoutError = function(){
  var timeout = this._timeout;
  var err = new Error('timeout of ' + timeout + 'ms exceeded');
  err.timeout = timeout;
  this.callback(err);
};

/**
 * Enable transmission of cookies with x-domain requests.
 *
 * Note that for this to work the origin must not be
 * using "Access-Control-Allow-Origin" with a wildcard,
 * and also must set "Access-Control-Allow-Credentials"
 * to "true".
 *
 * @api public
 */

Request.prototype.withCredentials = function(){
  this._withCredentials = true;
  return this;
};

/**
 * Initiate request, invoking callback `fn(res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.end = function(fn){
  var self = this;
  var xhr = this.xhr = getXHR();
  var query = this._query.join('&');
  var timeout = this._timeout;
  var data = this._formData || this._data;

  // store callback
  this._callback = fn || noop;

  // state change
  xhr.onreadystatechange = function(){
    if (4 != xhr.readyState) return;
    if (0 == xhr.status) {
      if (self.aborted) return self.timeoutError();
      return self.crossDomainError();
    }
    self.emit('end');
  };

  // progress
  if (xhr.upload) {
    xhr.upload.onprogress = function(e){
      e.percent = e.loaded / e.total * 100;
      self.emit('progress', e);
    };
  }

  // timeout
  if (timeout && !this._timer) {
    this._timer = setTimeout(function(){
      self.abort();
    }, timeout);
  }

  // querystring
  if (query) {
    query = request.serializeObject(query);
    this.url += ~this.url.indexOf('?')
      ? '&' + query
      : '?' + query;
  }

  // initiate request
  xhr.open(this.method, this.url, true);

  // CORS
  if (this._withCredentials) xhr.withCredentials = true;

  // body
  if ('GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !isHost(data)) {
    // serialize stuff
    var serialize = request.serialize[this.getHeader('Content-Type')];
    if (serialize) data = serialize(data);
  }

  // set header fields
  for (var field in this.header) {
    if (null == this.header[field]) continue;
    xhr.setRequestHeader(field, this.header[field]);
  }

  // send stuff
  this.emit('request', this);
  xhr.send(data);
  return this;
};

/**
 * Expose `Request`.
 */

request.Request = Request;

/**
 * Issue a request:
 *
 * Examples:
 *
 *    request('GET', '/users').end(callback)
 *    request('/users').end(callback)
 *    request('/users', callback)
 *
 * @param {String} method
 * @param {String|Function} url or callback
 * @return {Request}
 * @api public
 */

function request(method, url) {
  // callback
  if ('function' == typeof url) {
    return new Request('GET', method).end(url);
  }

  // url first
  if (1 == arguments.length) {
    return new Request('GET', method);
  }

  return new Request(method, url);
}

/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.get = function(url, data, fn){
  var req = request('GET', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * HEAD `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.head = function(url, data, fn){
  var req = request('HEAD', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * DELETE `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.del = function(url, fn){
  var req = request('DELETE', url);
  if (fn) req.end(fn);
  return req;
};

/**
 * PATCH `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.patch = function(url, data, fn){
  var req = request('PATCH', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * POST `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.post = function(url, data, fn){
  var req = request('POST', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * PUT `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.put = function(url, data, fn){
  var req = request('PUT', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * Expose `request`.
 */

module.exports = request;

},{"emitter":"/Users/SoPitted/Work/reactcomment/node_modules/superagent/node_modules/component-emitter/index.js","reduce":"/Users/SoPitted/Work/reactcomment/node_modules/superagent/node_modules/reduce-component/index.js"}],"/Users/SoPitted/Work/reactcomment/node_modules/superagent/node_modules/component-emitter/index.js":[function(require,module,exports){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],"/Users/SoPitted/Work/reactcomment/node_modules/superagent/node_modules/reduce-component/index.js":[function(require,module,exports){

/**
 * Reduce `arr` with `fn`.
 *
 * @param {Array} arr
 * @param {Function} fn
 * @param {Mixed} initial
 *
 * TODO: combatible error handling?
 */

module.exports = function(arr, fn, initial){  
  var idx = 0;
  var len = arr.length;
  var curr = arguments.length == 3
    ? initial
    : arr[idx++];

  while (idx < len) {
    curr = fn.call(null, curr, arr[idx], ++idx, arr);
  }
  
  return curr;
};
},{}],"/Users/SoPitted/Work/reactcomment/node_modules/validate.js/validate.js":[function(require,module,exports){
//     Validate.js 0.4.0
//     (c) 2013-2015 Nicklas Ansman, 2013 Wrapp
//     Validate.js may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://validatejs.org/

(function(exports, module, define, require) {
  "use strict";

  // The main function that calls the validators specified by the constraints.
  // The options are the following:
  //   - flatten (boolean) - If `true` will return a flat array instead of an object.
  //   - fullMessages (boolean) - If `true` (default) the attribute name is prepended to the error.
  //
  // Please note that the options are also passed to each validator.
  var validate = function(attributes, constraints, options) {
    options = v.extend({}, v.options, options);

    var results = v.runValidations(attributes, constraints, options)
      , attr
      , validator;

    for (attr in results) {
      for (validator in results[attr]) {
        if (v.isPromise(results[attr][validator])) {
          throw new Error("Use validate.async if you want support for promises");
        }
      }
    }
    return validate.processValidationResults(results, options);
  };

  var v = validate
    , root = this
    // Finds %{key} style patterns in the given string
    , FORMAT_REGEXP = /%\{([^\}]+)\}/g;

  // Copies over attributes from one or more sources to a single destination.
  // Very much similar to underscore's extend.
  // The first argument is the target object and the remaining arguments will be
  // used as targets.
  v.extend = function(obj) {
    [].slice.call(arguments, 1).forEach(function(source) {
      for (var attr in source) {
        obj[attr] = source[attr];
      }
    });
    return obj;
  };

  v.extend(validate, {
    // This "class" is just a wrapper around a dictionary and is here to allow
    // you to differentiate between library errors and validation errors
    // when using promises.
    ValidationErrors: function(errors) {
      v.extend(this, errors);
    },

    // Runs the validators specified by the constraints object.
    // Will return an array of the format:
    //     [{attribute: "<attribute name>", error: "<validation result>"}, ...]
    runValidations: function(attributes, constraints, options) {
      var results = []
        , attr
        , validatorName
        , value
        , validators
        , validator
        , validatorOptions
        , error;

      // Loops through each constraints, finds the correct validator and run it.
      for (attr in constraints) {
        value = v.getDeepObjectValue(attributes, attr);
        validators = v.result(constraints[attr], value, attributes, attr);

        for (validatorName in validators) {
          validator = v.validators[validatorName];

          if (!validator) {
            error = v.format("Unknown validator %{name}", {name: validatorName});
            throw new Error(error);
          }

          validatorOptions = validators[validatorName];
          // This allows the options to be a function. The function will be
          // called with the value, attribute name and the complete dict of
          // attributes. This is useful when you want to have different
          // validations depending on the attribute value.
          validatorOptions = v.result(validatorOptions, value, attributes, attr);
          if (!validatorOptions) {
            continue;
          }
          results.push({
            attribute: attr,
            error: validator.call(validator, value, validatorOptions, attr,
                                  attributes)
          });
        }
      }

      return results;
    },

    // Takes the output from runValidations and converts it to the correct
    // output format.
    processValidationResults: function(results, options) {
      var errors = {};

      // This indexes the errors per attribute
      results.forEach(function(result) {
        var error = result.error
          , attribute = result.attribute;

        if (v.isString(error)) {
          error = [error];
        }

        if (error) {
          errors[attribute] = (errors[attribute] || []).concat(error);
        }
      });

      // Semi ugly way to check if the errors are empty, try iterating over
      // them and short circuit when something is found.
      for (var _ in errors) {
        return v.fullMessages(errors, options);
      }
    },

    // Runs the validations with support for promises.
    // This function will return a promise that is settled when all the
    // validation promises have been completed.
    // It can be called even if no validations returned a promise.
    async: function(attributes, constraints, options) {
      options = v.extend({}, v.async.options, options);
      var results = v.runValidations(attributes, constraints, options);

      return v.Promise(function(resolve, reject) {
        v.waitForResults(results).then(function() {
          var errors = v.processValidationResults(results, options);
          if (errors) {
            if (!options.flatten) {
              errors = new v.ValidationErrors(errors);
            }
            reject(errors);
          } else {
            resolve(attributes);
          }
        }).then(undefined, v.error);
      });
    },

    // Returns a promise that is resolved when all promises in the results array
    // are settled. The promise returned from this function is always resolved,
    // never rejected.
    // This function modifies the input argument, it replaces the promises
    // with the value returned from the promise.
    waitForResults: function(results) {
      // Create a sequence of all the results starting with a resolved promise.
      var promise = results.reduce(function(memo, result) {
        // If this result isn't a promise skip it in the sequence.
        if (!v.isPromise(result.error)) {
          return memo;
        }

        return memo.then(function() {
          return result.error.then(
            function() {
              result.error = null;
            },
            function(error) {
              // If for some reason the validator promise was rejected but no
              // error was specified.
              if (!error) {
                v.warn("Validator promise was rejected but didn't return an error");
              }
              result.error = error;
            }
          ).then(undefined, v.error);
        }).then(undefined, v.error);
      }, v.Promise(function(r) { r(); })); // A resolved promise

      return promise.then(undefined, v.error);
    },

    // If the given argument is a call: function the and: function return the value
    // otherwise just return the value. Additional arguments will be passed as
    // arguments to the function.
    // Example:
    // ```
    // result('foo') // 'foo'
    // result(Math.max, 1, 2) // 2
    // ```
    result: function(value) {
      var args = [].slice.call(arguments, 1);
      if (typeof value === 'function') {
        value = value.apply(null, args);
      }
      return value;
    },

    // Checks if the value is a number. This function does not consider NaN a
    // number like many other `isNumber` functions do.
    isNumber: function(value) {
      return typeof value === 'number' && !isNaN(value);
    },

    // Returns false if the object is not a function
    isFunction: function(value) {
      return typeof value === 'function';
    },

    // A simple check to verify that the value is an integer. Uses `isNumber`
    // and a simple modulo check.
    isInteger: function(value) {
      return v.isNumber(value) && value % 1 === 0;
    },

    // Uses the `Object` function to check if the given argument is an object.
    isObject: function(obj) {
      return obj === Object(obj);
    },

    // Returns false if the object is `null` of `undefined`
    isDefined: function(obj) {
      return obj !== null && obj !== undefined;
    },

    // Checks if the given argument is a promise. Anything with a `then`
    // function is considered a promise.
    isPromise: function(p) {
      return !!p && typeof p.then === 'function';
    },

    // Formats the specified strings with the given values like so:
    // ```
    // format("Foo: %{foo}", {foo: "bar"}) // "Foo bar"
    // ```
    format: function(str, vals) {
      return str.replace(FORMAT_REGEXP, function(m0, m1) {
        return String(vals[m1]);
      });
    },

    // "Prettifies" the given string.
    // Prettifying means replacing [.\_-] with spaces as well as splitting
    // camel case words.
    prettify: function(str) {
      return str
        // Splits keys separated by periods
        .replace(/([^\s])\.([^\s])/g, '$1 $2')
        // Removes backslashes
        .replace(/\\+/g, '')
        // Replaces - and - with space
        .replace(/[_-]/g, ' ')
        // Splits camel cased words
        .replace(/([a-z])([A-Z])/g, function(m0, m1, m2) {
          return "" + m1 + " " + m2.toLowerCase();
        })
        .toLowerCase();
    },

    isString: function(value) {
      return typeof value === 'string';
    },

    isArray: function(value) {
      return {}.toString.call(value) === '[object Array]';
    },

    contains: function(obj, value) {
      if (!v.isDefined(obj)) {
        return false;
      }
      if (v.isArray(obj)) {
        return obj.indexOf(value) !== -1;
      }
      return value in obj;
    },

    getDeepObjectValue: function(obj, keypath) {
      if (!v.isObject(obj) || !v.isString(keypath)) {
        return undefined;
      }

      var key = ""
        , i
        , escape = false;

      for (i = 0; i < keypath.length; ++i) {
        switch (keypath[i]) {
          case '.':
            if (escape) {
              escape = false;
              key += '.';
            } else if (key in obj) {
              obj = obj[key];
              key = "";
            } else {
              return undefined;
            }
            break;

          case '\\':
            if (escape) {
              escape = false;
              key += '\\';
            } else {
              escape = true;
            }
            break;

          default:
            escape = false;
            key += keypath[i];
            break;
        }
      }

      if (v.isDefined(obj) && key in obj) {
        return obj[key];
      } else {
        return undefined;
      }
    },

    capitalize: function(str) {
      if (!v.isString(str)) {
        return str;
      }
      return str[0].toUpperCase() + str.slice(1);
    },

    fullMessages: function(errors, options) {
      options = options || {};

      var ret = options.flatten ? [] : {}
        , attr;

      if (!errors) {
        return ret;
      }

      function processErrors(attr, errors) {
        errors.forEach(function(error) {
          if (error[0] === '^') {
            error = error.slice(1);
          } else if (options.fullMessages !== false) {
            error = v.format("%{attr} %{message}", {
              attr: v.capitalize(v.prettify(attr)),
              message: error
            });
          }
          error = error.replace(/\\\^/g, "^");
          // If flatten is true a flat array is returned.
          if (options.flatten) {
            ret.push(error);
          }
          else {
            (ret[attr] || (ret[attr] = [])).push(error);
          }
        });
      }

      // Converts the errors of object of the format
      // {attr: [<error>, <error>, ...]} to contain the attribute name.
      for (attr in errors) {
        processErrors(attr, errors[attr]);
      }
      return ret;
    },

    // Returns a promise, should be called with the new operator.
    // The first argument will be called with two functions, the first for
    // resolving the promise and the second for rejecting it.
    // Supports (in order of precedence):
    //   * EcmaScript 6 Promises
    //   * RSVP
    //   * when
    //   * Q
    //
    // If no supported promises are detected an error is thrown.
    // A word of warning, only A+ style promises are supported. jQuery deferreds
    // are NOT supported.
    Promise: v.extend(function(callback) {
      var promise = v.Promise.nativePromise(callback) ||
                    v.Promise.RSVPPromise(callback) ||
                    v.Promise.whenPromise(callback) ||
                    v.Promise.QPromise(callback);

      if (!promise) {
        throw new Error("No promises could be detected");
      }

      return promise;
    }, {
      nativePromise: function(callback) {
        var Promise_, module;
        if (typeof Promise !== "undefined") {
          Promise_ = Promise;
        } else {
          module = v.tryRequire("es6-promise");
          if (module) {
            Promise_ = module.Promise;
          }
        }
        if (Promise_) {
          return new Promise_(callback);
        }
      },
      RSVPPromise: function(callback) {
        var Promise, module;
        if (typeof RSVP !== "undefined") {
          Promise = RSVP.Promise;
        } else {
          module = v.tryRequire("rsvp");
          if (module) {
            Promise = module.Promise;
          }
        }
        if (Promise) {
          return new Promise(callback);
        }
      },
      whenPromise: function(callback) {
        var promise, module;
        if (typeof when !== "undefined") {
          promise = when.promise;
        } else {
          module = v.tryRequire("when");
          if (module) {
            promise = module.promise;
          }
        }
        if (promise) {
          return promise(callback);
        }
      },
      QPromise: function(callback) {
        var promise, module;
        if (typeof Q !== "undefined") {
          promise = Q.promise;
        } else {
          module = v.tryRequire("q");
          if (module) {
            promise = module.promise;
          }
        }
        if (promise) {
          return promise(callback);
        }
      }
    }),

    tryRequire: function(moduleName) {
      if (!v.require) {
        return null;
      }
      try {
        return v.require(moduleName);
      } catch(e) {
        return null;
      }
    },

    require: require,

    exposeModule: function(validate, root, exports, module, define) {
      if (exports) {
        if (module && module.exports) {
          exports = module.exports = validate;
        }
        exports.validate = validate;
      }
      else {
        root.validate = validate;
        if (validate.isFunction(define) && define.amd) {
          define("validate", [], function () { return validate; });
        }
      }
    },

    warn: function(msg) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn(msg);
      }
    },

    error: function(msg) {
      if (typeof console !== "undefined" && console.error) {
        console.error(msg);
      }
    }
  });

  validate.validators = {
    // Presence validates that the value isn't empty
    presence: function(value, options) {
      options = v.extend({}, this.options, options);

      var message = options.message || this.message || "can't be blank"
        , attr;

      // Null and undefined aren't allowed
      if (!v.isDefined(value)) {
        return message;
      }

      // functions are ok
      if (v.isFunction(value)) {
        return;
      }

      if (typeof value === 'string') {
        // Tests if the string contains only whitespace (tab, newline, space etc)
        if ((/^\s*$/).test(value)) {
          return message;
        }
      }
      else if (v.isArray(value)) {
        // For arrays we use the length property
        if (value.length === 0) {
          return message;
        }
      }
      else if (v.isObject(value)) {
        // If we find at least one property we consider it non empty
        for (attr in value) {
          return;
        }
        return message;
      }
    },
    length: function(value, options, attribute) {
      // Null and undefined are fine
      if (!v.isDefined(value)) {
        return;
      }

      options = v.extend({}, this.options, options);

      var is = options.is
        , maximum = options.maximum
        , minimum = options.minimum
        , tokenizer = options.tokenizer || function(val) { return val; }
        , err
        , errors = [];

      value = tokenizer(value);
      var length = value.length;
      if(!v.isNumber(length)) {
        v.error(v.format("Attribute %{attr} has a non numeric value for `length`", {attr: attribute}));
        return options.message || this.notValid || "has an incorrect length";
      }

      // Is checks
      if (v.isNumber(is) && length !== is) {
        err = options.wrongLength ||
          this.wrongLength ||
          "is the wrong length (should be %{count} characters)";
        errors.push(v.format(err, {count: is}));
      }

      if (v.isNumber(minimum) && length < minimum) {
        err = options.tooShort ||
          this.tooShort ||
          "is too short (minimum is %{count} characters)";
        errors.push(v.format(err, {count: minimum}));
      }

      if (v.isNumber(maximum) && length > maximum) {
        err = options.tooLong ||
          this.tooLong ||
          "is too long (maximum is %{count} characters)";
        errors.push(v.format(err, {count: maximum}));
      }

      if (errors.length > 0) {
        return options.message || errors;
      }
    },
    numericality: function(value, options) {
      if (!v.isDefined(value)) {
        return;
      }

      options = v.extend({}, this.options, options);

      var errors = []
        , name
        , count
        , checks = {
            greaterThan:          function(v, c) { return v > c; },
            greaterThanOrEqualTo: function(v, c) { return v >= c; },
            equalTo:              function(v, c) { return v === c; },
            lessThan:             function(v, c) { return v < c; },
            lessThanOrEqualTo:    function(v, c) { return v <= c; }
          };

      // Coerce the value to a number unless we're being strict.
      if (options.noStrings !== true && v.isString(value)) {
        value = +value;
      }

      // If it's not a number we shouldn't continue since it will compare it.
      if (!v.isNumber(value)) {
        return options.message || this.notValid || "is not a number";
      }

      // Same logic as above, sort of. Don't bother with comparisons if this
      // doesn't pass.
      if (options.onlyInteger && !v.isInteger(value)) {
        return options.message || this.notInteger  || "must be an integer";
      }

      for (name in checks) {
        count = options[name];
        if (v.isNumber(count) && !checks[name](value, count)) {
          // This picks the default message if specified
          // For example the greaterThan check uses the message from
          // this.notGreaterThan so we capitalize the name and prepend "not"
          var msg = this["not" + v.capitalize(name)] ||
            "must be %{type} %{count}";

          errors.push(v.format(msg, {
            count: count,
            type: v.prettify(name)
          }));
        }
      }

      if (options.odd && value % 2 !== 1) {
        errors.push(this.notOdd || "must be odd");
      }
      if (options.even && value % 2 !== 0) {
        errors.push(this.notEven || "must be even");
      }

      if (errors.length) {
        return options.message || errors;
      }
    },
    datetime: v.extend(function(value, options) {
      if (!v.isDefined(value)) {
        return;
      }

      options = v.extend({}, this.options, options);

      var err
        , errors = []
        , earliest = options.earliest ? this.parse(options.earliest, options) : NaN
        , latest = options.latest ? this.parse(options.latest, options) : NaN;

      value = this.parse(value, options);

      if (isNaN(value) || options.dateOnly && value % 86400000 !== 0) {
        return options.message || this.notValid || "must be a valid date";
      }

      if (!isNaN(earliest) && value < earliest) {
        err = this.tooEarly || "must be no earlier than %{date}";
        err = v.format(err, {date: this.format(earliest, options)});
        errors.push(err);
      }

      if (!isNaN(latest) && value > latest) {
        err = this.tooLate || "must be no later than %{date}";
        err = v.format(err, {date: this.format(latest, options)});
        errors.push(err);
      }

      if (errors.length) {
        return options.message || errors;
      }
    }, {
      // This is the function that will be used to convert input to the number
      // of millis since the epoch.
      // It should return NaN if it's not a valid date.
      parse: function(value, options) {
        if (v.isFunction(root.XDate)) {
          return new root.XDate(value, true).getTime();
        }

        var moment = v.tryRequire("moment") || root.moment;
        if (v.isDefined(moment)) {
          return +moment.utc(value);
        }

        throw new Error("Neither XDate or moment.js was found");
      },
      // Formats the given timestamp. Uses ISO8601 to format them.
      // If options.dateOnly is true then only the year, month and day will be
      // output.
      format: function(date, options) {
        var format = options.dateFormat;

        if (v.isFunction(root.XDate)) {
          format = format || (options.dateOnly ? "yyyy-MM-dd" : "yyyy-MM-dd HH:mm:ss");
          return new XDate(date, true).toString(format);
        }

        var moment = v.tryRequire("moment") || root.moment;
        if (v.isDefined(moment)) {
          format = format || (options.dateOnly ? "YYYY-MM-DD" : "YYYY-MM-DD HH:mm:ss");
          return moment.utc(date).format(format);
        }

        throw new Error("Neither XDate or moment.js was found");
      }
    }),
    date: function(value, options) {
      options = v.extend({}, options, {dateOnly: true});
      return v.validators.datetime.call(v.validators.datetime, value, options);
    },
    format: function(value, options) {
      if (v.isString(options) || (options instanceof RegExp)) {
        options = {pattern: options};
      }

      options = v.extend({}, this.options, options);

      var message = options.message || this.message || "is invalid"
        , pattern = options.pattern
        , match;

      if (!v.isDefined(value)) {
        return;
      }
      if (!v.isString(value)) {
        return message;
      }

      if (v.isString(pattern)) {
        pattern = new RegExp(options.pattern, options.flags);
      }
      match = pattern.exec(value);
      if (!match || match[0].length != value.length) {
        return message;
      }
    },
    inclusion: function(value, options) {
      if (!v.isDefined(value)) {
        return;
      }
      if (v.isArray(options)) {
        options = {within: options};
      }
      options = v.extend({}, this.options, options);
      if (v.contains(options.within, value)) {
        return;
      }
      var message = options.message ||
        this.message ||
        "^%{value} is not included in the list";
      return v.format(message, {value: value});
    },
    exclusion: function(value, options) {
      if (!v.isDefined(value)) {
        return;
      }
      if (v.isArray(options)) {
        options = {within: options};
      }
      options = v.extend({}, this.options, options);
      if (!v.contains(options.within, value)) {
        return;
      }
      var message = options.message || this.message || "^%{value} is restricted";
      return v.format(message, {value: value});
    },
    email: v.extend(function(value, options) {
      options = v.extend({}, this.options, options);
      var message = options.message || this.message || "is not a valid email";
      if (!v.isDefined(value)) {
        return;
      }
      if (!v.isString(value)) {
        return message;
      }
      if ((/^\s*$/).test(value)) {
        return;
      }
      if (!this.PATTERN.exec(value)) {
        return message;
      }
    }, {
      PATTERN: /^[a-z0-9\u007F-\uffff!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9\u007F-\uffff!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i
    })
  };

  validate.exposeModule(validate, root, exports, module, define);
}).call(this,
        typeof exports !== 'undefined' ? exports : null,
        typeof module !== 'undefined' ? module : null,
        typeof define !== 'undefined' ? define : null,
        typeof require !== 'undefined' ? require : null);

},{}]},{},["./specs/App-spec.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcGVjcy9BcHAtc3BlYy5qcyIsImFwcC9hY3Rpb25zL2NvbW1lbnRhY3Rpb25zLmpzIiwiYXBwL2NvbXBvbmVudHMvY29tbWVudC5qcyIsImFwcC9jb21wb25lbnRzL2NvbW1lbnRjb21wb25lbnQuanMiLCJhcHAvY29tcG9uZW50cy9jb21tZW50Zm9ybS5qcyIsImFwcC9jb21wb25lbnRzL2NvbW1lbnRpbnRlcmFjdGlvbnMuanMiLCJhcHAvY29tcG9uZW50cy9yYXRlYm94LmpzIiwiYXBwL2NvbXBvbmVudHMvc29ydGNvbW1lbnRzLmpzIiwiYXBwL21haW4uanMiLCJhcHAvc3RvcmVzL2NvbW1lbnRzdG9yZS5qcyIsIm5vZGVfbW9kdWxlcy9jbGFzc25hbWVzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL21vbWVudC9tb21lbnQuanMiLCJub2RlX21vZHVsZXMvc3VwZXJhZ2VudC9saWIvY2xpZW50LmpzIiwibm9kZV9tb2R1bGVzL3N1cGVyYWdlbnQvbm9kZV9tb2R1bGVzL2NvbXBvbmVudC1lbWl0dGVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3N1cGVyYWdlbnQvbm9kZV9tb2R1bGVzL3JlZHVjZS1jb21wb25lbnQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvdmFsaWRhdGUuanMvdmFsaWRhdGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDbitGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBBcHAgPSByZXF1aXJlKCcuLy4uL2FwcC9tYWluLmpzJyk7XG52YXIgVGVzdFV0aWxzID0gcmVxdWlyZSgncmVhY3QtYWRkb25zJykuVGVzdFV0aWxzO1xuXG5kZXNjcmliZShcIkFwcFwiLCBmdW5jdGlvbigpIHtcblxuICBpdChcInNob3VsZCBiZSB3cmFwcGVkIHdpdGggYSBkaXZcIiwgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGFwcCA9IFRlc3RVdGlscy5yZW5kZXJJbnRvRG9jdW1lbnQoQXBwKCkpO1xuICAgIGV4cGVjdChhcHAuZ2V0RE9NTm9kZSgpLnRhZ05hbWUpLnRvRXF1YWwoJ0RJVicpO1xuICB9KTtcblxufSk7IiwidmFyIGZsdXggPSByZXF1aXJlKCdmbHV4LXJlYWN0Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZmx1eC5jcmVhdGVBY3Rpb25zKFtcbiAgJ2FkZENvbW1lbnQnLFxuICAnYWRkUmVwbHknLFxuICAnc2V0UmVwbHlJZCcsXG4gICdjYWxsQ29tbWVudExpc3QnLFxuICAncG9wdWxhdGVDb25maWcnLFxuICAnc29ydENvbW1lbnRMaXN0JyxcbiAgJ3ZvdGVDb21tZW50J1xuXSk7IiwiLy8gQGpzeCBSZWFjdC5ET01cblxuUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY3ggPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5wcmV0dHlBZ28gPSByZXF1aXJlKCdtb21lbnQnKTtcbkNvbW1lbnRGb3JtID0gcmVxdWlyZSgnLi9jb21tZW50Zm9ybS5qcycpO1xuY29tbWVudFN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL2NvbW1lbnRzdG9yZS5qcycpO1xuYWN0aW9uID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9jb21tZW50YWN0aW9ucy5qcycpO1xuQ29tbWVudEludGVyYWN0aW9ucyA9IHJlcXVpcmUoJy4vY29tbWVudGludGVyYWN0aW9ucy5qcycpO1xuXG52YXIgQ29tbWVudCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogXCJDb21tZW50XCIsXG5cdGhhbmRsZVJlcGx5U3VibWl0OiBmdW5jdGlvbiAoY29tbWVudCkge1xuXHRcdGFjdGlvbi5hZGRSZXBseShjb21tZW50LCB0aGlzLnByb3BzLmNvbW1lbnQuaWQpO1xuXHR9LFxuXHRyZXBsaWVzOiBmdW5jdGlvbiAoY29tbWVudCkge1xuXHRcdGlmIChjb21tZW50Lmhhc093blByb3BlcnR5KCdyZXBsaWVzJykgJiYgY29tbWVudC5yZXBsaWVzLmxlbmd0aCA+IDAgKSB7XG5cdFx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0XHRyZXR1cm4gKFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJ1bFwiLCB7Y2xhc3NOYW1lOiBcImNvbW1lbnQtbGlzdCB3aXRoLXJlcGxpZXMgbWVkaWEgbWVkaWEtbGlzdCBkZXB0aC0yXCJ9LCBcblx0XHRcdFx0XHRcdGNvbW1lbnQucmVwbGllcy5tYXAoZnVuY3Rpb24oY2hpbGQpIHtcblx0XHRcdFx0XHQgICAgICAgIHJldHVybiAoUmVhY3QuY3JlYXRlRWxlbWVudChDb21tZW50LCB7a2V5OiBjaGlsZC5pZCwgY29tbWVudDogY2hpbGR9KSk7XG5cdFx0XHRcdFx0ICAgXHR9KVx0XG5cdFx0XHRcdFx0KSk7XG5cdFx0fSBcblx0fSxcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgYmFkZ2UsIHJlcGx5Rm9ybSxcblx0XHRcdGZvcmNlSGVpZ2h0ID0ge2hlaWdodDogJzQwcHgnfSxcblx0XHRcdGNvbW1lbnQgPSB0aGlzLnByb3BzLmNvbW1lbnQsXG5cdFx0XHRkZXB0aExldmVsID0gKGNvbW1lbnQuaGFzT3duUHJvcGVydHkoJ3JlcGxpZXMnKSA/ICdkZXB0aC0xJyA6ICdkZXB0aC0yJyksXG5cdFx0XHRjb21tZW50VG9wQ2xhc3NlcyA9IGN4KFxuXHRcdFx0XHQnY29tbWVudC1lbnRyeScsICdtZWRpYScsICdjb21tZW50Jyxcblx0XHRcdFx0eydkZXB0aC0xJzogY29tbWVudC5oYXNPd25Qcm9wZXJ0eSgncmVwbGllcycpfSxcblx0XHRcdFx0eydkZXB0aC0yJzogIWNvbW1lbnQuaGFzT3duUHJvcGVydHkoJ3JlcGxpZXMnKX0sXG5cdFx0XHRcdHsnd2l0aC1yZXBsaWVzJzogKGNvbW1lbnQuaGFzT3duUHJvcGVydHkoJ3JlcGxpZXMnKSAmJiBjb21tZW50LnJlcGxpZXMubGVuZ3RoID4gMCl9XG5cdFx0XHQpO1xuXG5cdFx0dmFyIGN1cnJlbnRSZXBseUlEID0gY29tbWVudFN0b3JlLmdldFJlcGx5SWQoKTtcblx0XHRpZiAoY3VycmVudFJlcGx5SUQgPT0gY29tbWVudC5pZCkge1xuXHRcdFx0cmVwbHlGb3JtID0gKFJlYWN0LmNyZWF0ZUVsZW1lbnQoQ29tbWVudEZvcm0sIHtvbkNvbW1lbnRTdWJtaXQ6IHRoaXMuaGFuZGxlUmVwbHlTdWJtaXQsIHJlcGx5SWQ6IGNvbW1lbnQuaWR9KSk7XG5cdFx0fVxuXG5cdFx0aWYgKGNvbW1lbnQuYXV0aG9yLmlzX3ZlcmlmaWVkID4gMCkgeyBiYWRnZSA9IFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIsIHtjbGFzc05hbWU6IFwiYmFkZ2VcIn0sIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJpbWdcIiwge3NyYzogXCIvZHhidWcucG5nXCIsIGNsYXNzTmFtZTogXCJzbWFsbCBiYWRnZVwifSkpfVxuXHRcdHJldHVybiAoXG5cdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KFwibGlcIiwge2NsYXNzTmFtZTogY29tbWVudFRvcENsYXNzZXMsIGlkOiBcIiNjb21tZW50LVwiICsgY29tbWVudC5pZH0sIFxuXHRcdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KFwiaW1nXCIsIHtzcmM6IGNvbW1lbnQuYXV0aG9yLmF2YXRhciwgY2xhc3NOYW1lOiBcImF2YXRhciBwdWxsLWxlZnQgbWVkaWEtb2JqZWN0IHVzZXJwaWMgcHVsbC1sZWZ0IG1lZGlhLW9iamVjdCB1c2VycGljIGF2YXRhci02MFwiLCB3aWR0aDogXCI0MFwiLCBoZWlnaHQ6IFwiNDBcIiwgc3R5bGU6IGZvcmNlSGVpZ2h0fSksIFxuXHRcdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHtjbGFzc05hbWU6IFwiY29tbWVudC1ib2R5IG1lZGlhLWJvZHlcIn0sIFxuXHRcdFx0ICAgIFx0UmVhY3QuY3JlYXRlRWxlbWVudChcImg0XCIsIHtjbGFzc05hbWU6IFwidXNlcm5hbWUgbWVkaWEtaGVhZGluZ1wifSwgXG5cdFx0XHQgICAgICBcdFx0Y29tbWVudC5hdXRob3IubmFtZVxuXHRcdFx0ICAgIFx0KSwgXG5cdFx0XHQgICAgXHRiYWRnZSwgXG5cdFx0XHQgICAgXHRSZWFjdC5jcmVhdGVFbGVtZW50KFwidGltZVwiLCB7ZGF0ZVRpbWU6IGNvbW1lbnQuZGF0ZX0sIFxuXHRcdFx0ICAgIFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KFwiYVwiLCB7aHJlZjogXCIjY29tbWVudC1cIiArIGNvbW1lbnQuaWR9LCBcblx0XHRcdCAgICBcdFx0XHRcIm9uIFwiLCBwcmV0dHlBZ28oY29tbWVudC5kYXRlKS5mb3JtYXQoJ01NTU0gRCwgWVlZWScpXG5cdFx0XHQgICAgXHRcdClcblx0XHRcdCAgICBcdCksIFxuXHRcdFx0XHQgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcInBcIiwgbnVsbCwgY29tbWVudC5jb21tZW50Ym9keSksIFxuXHRcdFx0XHQgICAgUmVhY3QuY3JlYXRlRWxlbWVudChDb21tZW50SW50ZXJhY3Rpb25zLCB7a2V5OiB0aGlzLnByb3BzLmtleSwgY29tbWVudElkOiBjb21tZW50LmlkLCByZXBseUxpbms6IGNvbW1lbnQuaGFzT3duUHJvcGVydHkoJ3JlcGxpZXMnKX0pXG5cdFx0ICAgIFx0KSwgXG5cdFx0ICAgIFx0cmVwbHlGb3JtLCBcbiAgICAgICAgXHRcdHRoaXMucmVwbGllcyhjb21tZW50KVxuICAgICAgICBcdClcblx0XHQpO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb21tZW50OyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqKi9cblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKSxcblx0Y29tbWVudFN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL2NvbW1lbnRzdG9yZS5qcycpLFxuIFx0Q29tbWVudEZvcm0gPSByZXF1aXJlKCcuL2NvbW1lbnRmb3JtLmpzJyksXG4gXHRhY3Rpb24gPSByZXF1aXJlKCcuLi9hY3Rpb25zL2NvbW1lbnRhY3Rpb25zLmpzJylcbiBcdENvbW1lbnQgPSByZXF1aXJlKCcuL2NvbW1lbnQuanMnKSxcbiBcdFNvcnRDb21tZW50cyA9IHJlcXVpcmUoJy4vc29ydGNvbW1lbnRzLmpzJyksXG5cdHJlcXVlc3QgPSByZXF1aXJlKCdzdXBlcmFnZW50Jyk7XG5cbnZhciBDb21tZW50Q29tcG9uZW50ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiBcIkNvbW1lbnRDb21wb25lbnRcIixcblx0aGFuZGxlQ29tbWVudFN1Ym1pdDogZnVuY3Rpb24gKGNvbW1lbnQpIHtcblx0XHQvL3NpbXBseSB0YWtlIHRoZSBuZXcgY29tbWVudCBvYmplY3QgYW5kIHBvc3QgaXQgYmFjayB0byB0aGUgYWRkQ29tbWVudCBBY3Rpb24uXG5cdFx0YWN0aW9uLmFkZENvbW1lbnQoY29tbWVudCk7XG5cdH0sXG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRkYXRhOiBbXSxcblx0XHRcdHJlcGx5SWQ6IG51bGwsXG5cdFx0XHRjb25maWc6IGNvbW1lbnRTdG9yZS5nZXRDb25maWcoKVxuXHRcdH07XG5cdH0sXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKXtcblx0XHQvLyB1bmRlciBub3JtYWwgY2lyY3Vtc3RhbmNlcyB0aGlzIHNob3VsZCBiZSBjYWxsZWQgd2l0aCBhY3Rpb24uY2FsbENvbW1lbnRMaXN0KCksIFxuXHRcdC8vIGJ1dCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyBpdCBhcHBlYXJzIHRoYXQgdGhlIGV4cG9ydCBnZXRJbml0aWFsRGF0YSBpcyBzbGlnaHRseSBmYXN0ZXIuIFxuXHRcdGNvbW1lbnRTdG9yZS5nZXRJbml0aWFsRGF0YSgpO1xuXHR9LFxuXHRzZXRSZXBseUlkOiBmdW5jdGlvbiAoKSB7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRyZXBseUlkOiBjb21tZW50U3RvcmUuZ2V0UmVwbHlJZCgpXG5cdFx0fSk7XG5cdH0sXG5cdHVwZGF0ZUNvbW1lbnRMaXN0OiBmdW5jdGlvbiAoKSB7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRkYXRhOiBjb21tZW50U3RvcmUuZ2V0Q29tbWVudHNMaXN0KCksXG5cdFx0fSk7XG5cdH0sXG5cdHVwZGF0ZUNvbmZpZzogZnVuY3Rpb24gKCkge1xuXHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0Y29uZmlnOiBjb21tZW50U3RvcmUuZ2V0Q29uZmlnKClcblx0XHR9KTtcblx0fSxcblx0Y29tcG9uZW50V2lsbE1vdW50OiBmdW5jdGlvbiAoKSB7XG5cdFx0Ly9FdmVudHdhdGNoZXIyIGFjdGlvbnMgaW5zaWRlIHRoZSBzdG9yZSBmb3IgdXBkYXRlcywgb24gdXBkYXRlcyByZXJlbmRlci5cblx0XHRjb21tZW50U3RvcmUub24oJ2NvbW1lbnQubG9hZGVkJywgdGhpcy51cGRhdGVDb21tZW50TGlzdCk7XG5cdFx0Y29tbWVudFN0b3JlLm9uKCdjb21tZW50LmFkZGVkJywgdGhpcy51cGRhdGVDb21tZW50TGlzdCk7XG5cdFx0Y29tbWVudFN0b3JlLm9uKCdjb25maWcuYWRkZWRDb21tZW50JywgdGhpcy51cGRhdGVDb25maWcpO1xuXHRcdGNvbW1lbnRTdG9yZS5vbignY29tbWVudC5yZXBseXNldCcsIHRoaXMuc2V0UmVwbHlJZCwgdGhpcy51cGRhdGVDb21tZW50TGlzdCk7XG5cdH0sXG5cdGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbiAoKSB7XG5cdFx0Ly9FdmVudHdhdGNoZXIgMiByZW1vdmUgdGhlc2UgY29tcG9lbnRzIHdoZW4gdGhlIGVsZW1lbnRzIGFyZSB1bmJvdW5kLiBcblx0XHRjb21tZW50U3RvcmUub2ZmKCdjb21tZW50LmxvYWRlZCcsIHRoaXMudXBkYXRlQ29tbWVudExpc3QpO1xuXHRcdGNvbW1lbnRTdG9yZS5vZmYoJ2NvbW1lbnQuYWRkZWQnLCB0aGlzLnVwZGF0ZUNvbW1lbnRMaXN0KTtcblx0XHRjb21tZW50U3RvcmUub2ZmKCdjb25maWcuYWRkZWRDb21tZW50JywgdGhpcy51cGRhdGVDb25maWcpO1xuXHRcdGNvbW1lbnRTdG9yZS5vZmYoJ2NvbW1lbnQucmVwbHlzZXQnLCB0aGlzLnNldFJlcGx5SWQsIHRoaXMudXBkYXRlQ29tbWVudExpc3QpO1xuXHRcdC8vIGNvbW1lbnRTdG9yZS5yZW1vdmVDaGFuZ2VMaXN0ZW5lcih0aGlzLnVwZGF0ZUNvbW1lbnRMaXN0KVxuXHR9LFxuXHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgc3RkQ29tbWVudDtcblx0XHRpZiAoIXRoaXMuc3RhdGUucmVwbHlJZCkge1xuXHRcdFx0c3RkQ29tbWVudCA9IFJlYWN0LmNyZWF0ZUVsZW1lbnQoQ29tbWVudEZvcm0sIHtvbkNvbW1lbnRTdWJtaXQ6IHRoaXMuaGFuZGxlQ29tbWVudFN1Ym1pdCwgcmVwbHlJZDogdGhpcy5zdGF0ZS5yZXBseUlkfSk7XG5cdFx0fVxuXHRcdHJldHVybihcblx0XHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwge2lkOiBcImNvbW1lbnRzV2lkZ2V0XCIsIGNsYXNzTmFtZTogXCJjb21tZW50cy13aWRnZXRcIn0sIFxuXHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChcImg0XCIsIHtjbGFzc05hbWU6IFwiY29tbWVudC13aWRnZXQtdGl0bGUgaGVhZGluZ3Rvb2x0aXBcIn0sIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIsIHtjbGFzc05hbWU6IFwiY29tbWVudC1udW1cIn0sIHRoaXMuc3RhdGUuY29uZmlnLmNvbW1lbnRzTnVtYmVyKSwgXCIgQ29tbWVudHNcIiksIFxuXHRcdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KFwic2VjdGlvblwiLCB7aWQ6IFwicmVzcG9uZFwifSwgXG5cdFx0XHRcdFx0c3RkQ29tbWVudFxuXHRcdFx0XHQpLCBcblx0XHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChTb3J0Q29tbWVudHMsIG51bGwpLCBcblx0XHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChcInNlY3Rpb25cIiwge2lkOiBcImNvbW1lbnRzXCIsIGNsYXNzTmFtZTogXCJjb21tZW50LWZlZWRcIiwgaXRlbVByb3A6IFwiY29tbWVudFwifSwgXG5cdFx0XHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChcInVsXCIsIHtjbGFzc05hbWU6IFwibWVkaWEtbGlzdCBjb21tZW50LWxpc3RcIn0sIFxuXHRcdFx0XHRcdHRoaXMuc3RhdGUuZGF0YS5tYXAoZnVuY3Rpb24gKGNvbW1lbnQsIGluZGV4KSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gKFJlYWN0LmNyZWF0ZUVsZW1lbnQoQ29tbWVudCwge2tleTogaW5kZXgsIGNvbW1lbnQ6IGNvbW1lbnR9KSk7XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQpXG5cdFx0XHRcdClcblx0XHRcdClcblx0XHRcdFx0KTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29tbWVudENvbXBvbmVudDsiLCIvLyBAanN4IFJlYWN0LkRPTVxuXG5SZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5SYXRlQm94ID0gcmVxdWlyZSgnLi9yYXRlYm94LmpzJylcbmN4ID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuY29tbWVudFN0b3JlID0gcmVxdWlyZSAoJy4uL3N0b3Jlcy9jb21tZW50c3RvcmUuanMnKTtcbmFjdGlvbiA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvY29tbWVudGFjdGlvbnMuanMnKTtcblxudmFyIENvbW1lbnRGb3JtID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiBcIkNvbW1lbnRGb3JtXCIsXG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRjb25maWc6IGNvbW1lbnRTdG9yZS5nZXRDb25maWcoKSxcblx0XHRcdGVycm9yczoge31cblx0XHR9O1xuXHR9LFxuXHRoYW5kbGVTdWJtaXQ6IGZ1bmN0aW9uIChlKSB7XG5cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdHZhciBjb21tZW50ID0gdGhpcy5yZWZzLmNvbW1lbnQuZ2V0RE9NTm9kZSgpLnZhbHVlLnRyaW0oKTtcblx0XHR2YXIgYXV0aG9yID0gdGhpcy5yZWZzLmF1dGhvci5nZXRET01Ob2RlKCkudmFsdWUudHJpbSgpO1xuXHRcdHZhciBlbWFpbCA9IHRoaXMucmVmcy5lbWFpbC5nZXRET01Ob2RlKCkudmFsdWUudHJpbSgpO1xuXHRcdFxuXHRcdC8vcHJlRmxpZ2h0IHN0cmlwcGluZyBvZiBsaW5rIGFuY2hvciB0YWdzXG5cdFx0ZmluZEFUYWdzID0gLzxcXHMqYShcXHMrLio/Pnw+KS4qPzxcXHMqXFwvYVxccyo+L2lnO1xuXHRcdGNvbW1lbnQgPSBjb21tZW50LnJlcGxhY2UoZmluZEFUYWdzLCAnICcpO1xuXG5cdFx0Ly9zZXJpYWxpemUgb3VyIGRhdGEgYXMgYSBjb21tZW50IG9iamVjdFxuXHRcdG5ld0NvbW1lbnQgPSB7XG5cdFx0XHQnY29tbWVudGJvZHknOiBjb21tZW50LCBcblx0XHRcdCdhdXRob3InOiB7XG5cdFx0XHRcdFx0J25hbWUnOiBhdXRob3IsIFxuXHRcdFx0XHRcdCdlbWFpbCc6IGVtYWlsLCBcblx0XHRcdFx0XHQndXJsJzogJycsXG5cdFx0XHRcdFx0J2F2YXRhcic6ICdodHRwOi8vd3d3LmdyYXZhdGFyLmNvbS9hdmF0YXIvMjA1ZTQ2MGI0NzllMmU1YjQ4YWVjMDc3MTBjMDhkNTA/Zj15Jyxcblx0XHRcdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8vc3VibWl0IG91ciBtb2RlbCBhbmQgcmVzZXQgdGhlIGZvcm1cblx0XHR0aGlzLnByb3BzLm9uQ29tbWVudFN1Ym1pdChuZXdDb21tZW50KTtcblx0XHR0aGlzLnJlZnMuY29tbWVudC5nZXRET01Ob2RlKCkudmFsdWUgPSAnJztcblx0XHR0aGlzLnJlZnMuYXV0aG9yLmdldERPTU5vZGUoKS52YWx1ZSA9ICcnO1xuXHRcdHRoaXMucmVmcy5lbWFpbC5nZXRET01Ob2RlKCkudmFsdWUgPSAnJztcblx0XHRyZXR1cm47XG5cdH0sXG5cdGNhbmNlbFJlcGx5OiBmdW5jdGlvbiAoKSB7XG5cdFx0Ly90aGlzIGNsb3NlcyBvdXQgdGhlIGZvcm0gaWYgaXQgaXMgYXR0YWNoZWQgdG8gYSBjb21tZW50IGJ5IHJlbW92aW5nIHRoZSBSZXBseUlkXG5cdFx0YWN0aW9uLnNldFJlcGx5SWQobnVsbCk7XG5cdH0sXG5cdHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXHRcdHZhciB3aXRoT3JXaXRob3V0UmF0aW5nID0gY3goe1xuXHRcdFx0J2Zvcm0tZmllbGRzJzogdHJ1ZSxcblx0XHRcdCd3aXRocmF0ZWJveCc6IHRoaXMuc3RhdGUuY29uZmlnLnJhdGluZyxcblx0XHRcdCdub3JhdGVib3gnOiAhdGhpcy5zdGF0ZS5jb25maWcucmF0aW5nXG5cdFx0fSk7XG5cdFx0dmFyIHJhdGVDb21wb25lbnQsIGNsb3NlQWRkO1xuXHRcdGlmICh0aGlzLnN0YXRlLmNvbmZpZy5yYXRpbmcpIHtcblx0XHRcdHJhdGVDb21wb25lbnQgPSBSZWFjdC5jcmVhdGVFbGVtZW50KFJhdGVCb3gsIHtwb3N0SWQ6IHRoaXMuc3RhdGUuY29uZmlnfSk7XG5cdFx0fVxuXHRcdGlmIChjb21tZW50U3RvcmUuZ2V0UmVwbHlJZCgpKSB7XG5cdFx0XHRjbG9zZUFkZCA9IFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJhXCIsIHtcImFyaWEtbGFiZWxcIjogXCJDYW5jZWwgUmVwbHlcIiwgY2xhc3NOYW1lOiBcImNhbmNlbC1jb21tZW50LXJlcGx5XCIsIG9uQ2xpY2s6IHRoaXMuY2FuY2VsUmVwbHl9LCBSZWFjdC5jcmVhdGVFbGVtZW50KFwiaVwiLCB7Y2xhc3NOYW1lOiBcImZhIGZhLXRpbWVzLWNpcmNsZVwifSkpO1xuXHRcdH1cblx0XHRyZXR1cm4gKFxuXHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChcImZvcm1cIiwge2lkOiBcImNvbW1lbnRmb3JtXCIsIG5vVmFsaWRhdGU6IHRydWUsIGNsYXNzTmFtZTogXCJjb21tZW50LWZvcm1cIiwgb25TdWJtaXQ6IHRoaXMuaGFuZGxlU3VibWl0fSwgXG5cdFx0XHRcdHJhdGVDb21wb25lbnQsIFxuXHRcdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHtjbGFzc05hbWU6IHdpdGhPcldpdGhvdXRSYXRpbmd9LCBcblx0XHRcdFx0XHRjbG9zZUFkZCwgXG5cdFx0XHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChcInRleHRhcmVhXCIsIHtuYW1lOiBcImNvbW1lbnRcIiwgY2xhc3NOYW1lOiBcImZvcm0tY29udHJvbFwiLCByb3dzOiBcIjZcIiwgXCJhcmlhLXJlcXVpcmVkXCI6IFwidHJ1ZVwiLCByZXF1aXJlZDogdHJ1ZSwgcGxhY2Vob2xkZXI6IFwiSm9pbiB0aGUgZGlzY3Vzc2lvblwiLCByZWY6IFwiY29tbWVudFwifSksIFxuXHRcdFx0XHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJmb3JtLXJvd1wifSwgXG5cdFx0XHRcdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHtjbGFzc05hbWU6IFwiY29sLTFcIn0sIFxuXHRcdFx0XHRcdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHtjbGFzc05hbWU6IFwiZm9ybS1ncm91cFwifSwgXG5cdFx0XHRcdFx0XHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChcImlucHV0XCIsIHt0eXBlOiBcInRleHRcIiwgaWQ6IFwiYXV0aG9yXCIsIGNsYXNzTmFtZTogXCJmb3JtLWNvbnRyb2xcIiwgXCJhcmlhLXJlcXVpcmVkXCI6IFwidHJ1ZVwiLCByZXF1aXJlZDogdHJ1ZSwgbmFtZTogXCJhdXRob3JcIiwgcGxhY2Vob2xkZXI6IFwiTmFtZVwiLCByZWY6IFwiYXV0aG9yXCJ9KVxuXHRcdFx0XHRcdFx0XHQpXG5cdFx0XHRcdFx0XHQpLCBcblx0XHRcdFx0XHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJjb2wtMVwifSwgXG5cdFx0XHRcdFx0XHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJmb3JtLWdyb3VwXCJ9LCBcblx0XHRcdFx0XHRcdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KFwiaW5wdXRcIiwge3R5cGU6IFwiZW1haWxcIiwgaWQ6IFwiZW1haWxcIiwgY2xhc3NOYW1lOiBcImZvcm0tY29udHJvbFwiLCBcImFyaWEtcmVxdWlyZWRcIjogXCJ0cnVlXCIsIHJlcXVpcmVkOiB0cnVlLCBuYW1lOiBcImVtYWlsXCIsIHBsYWNlaG9sZGVyOiBcIkVtYWlsXCIsIHJlZjogXCJlbWFpbFwifSlcblx0XHRcdFx0XHRcdFx0KVxuXHRcdFx0XHRcdFx0KVxuXHRcdFx0XHRcdCksIFxuXHRcdFx0XHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJmb3JtLXJvd1wifSwgXG5cdFx0XHRcdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KFwiaW5wdXRcIiwge25hbWU6IFwic3VibWl0XCIsIHR5cGU6IFwic3VibWl0XCIsIHZhbHVlOiBcIlN1Ym1pdFwiLCBpZDogXCJzdWJtaXRcIiwgY2xhc3NOYW1lOiBcImNvbW1lbnQtc3VibWl0XCJ9KVxuXHRcdFx0XHRcdClcblx0XHRcdFx0KVxuXG5cdFx0XHQpXG5cdFx0KTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29tbWVudEZvcm07IiwiLy8gQGpzeCBSZWFjdC5ET01cblxuUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29tbWVudFN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL2NvbW1lbnRzdG9yZS5qcycpO1xuYWN0aW9uID0gcmVxdWlyZSgnLi4vYWN0aW9ucy9jb21tZW50YWN0aW9ucy5qcycpO1xuY3ggPSByZXF1aXJlKCdjbGFzc25hbWVzJyk7XG5cbkNvbW1lbnRJbnRlcmFjdGlvbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogXCJDb21tZW50SW50ZXJhY3Rpb25cIixcblx0aGFuZGxlQ2xpY2s6IGZ1bmN0aW9uICh2b3RlVHlwZSkge1xuXHRcdHZhciBDb21tZW50SWQgPSB0aGlzLnByb3BzLmNvbW1lbnRJZDtcblx0XHRzd2l0Y2ggKHZvdGVUeXBlKSB7XG5cdFx0XHRjYXNlICd1cHZvdGUnOlxuXHRcdFx0YWN0aW9uLnZvdGVDb21tZW50KENvbW1lbnRJZCwgJ3Vwdm90ZScpO1xuXHRcdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRcdHVwdm90ZTogdHJ1ZSxcblx0XHRcdFx0ZG93bnZvdGU6IGZhbHNlLFxuXHRcdFx0XHRmbGFnOiBmYWxzZVxuXHRcdFx0fSk7XG5cdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ2Rvd252b3RlJzpcblx0XHRcdGFjdGlvbi52b3RlQ29tbWVudChDb21tZW50SWQsICdkb3dudm90ZScpO1xuXHRcdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRcdHVwdm90ZTogZmFsc2UsXG5cdFx0XHRcdGRvd252b3RlOiB0cnVlLFxuXHRcdFx0XHRmbGFnOiBmYWxzZVxuXHRcdFx0fSlcblx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAnZmxhZyc6XG5cdFx0XHRhY3Rpb24udm90ZUNvbW1lbnQoQ29tbWVudElkLCAnZmxhZycpO1xuXHRcdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRcdHVwdm90ZTogZmFsc2UsXG5cdFx0XHRcdGRvd252b3RlOiBmYWxzZSxcblx0XHRcdFx0ZmxhZzogdHJ1ZVxuXHRcdFx0fSlcblx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAncmVwbHknOlxuXHRcdFx0YWN0aW9uLnNldFJlcGx5SWQoQ29tbWVudElkKTtcblx0XHRcdGJyZWFrO1xuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdGJyZWFrO1xuXHRcdH1cblx0fSxcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHsgXG5cdFx0XHR1cHZvdGU6IGZhbHNlLFxuXHRcdFx0ZG93bnZvdGU6IGZhbHNlLFxuXHRcdFx0ZmxhZzogZmFsc2Vcblx0XHR9O1xuXHR9LFxuXHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgcmVwbHlNYXJrdXA7XG5cdFx0aWYgKHRoaXMucHJvcHMucmVwbHlMaW5rKSB7XG5cdFx0XHRyZXBseU1hcmt1cCA9IFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJhXCIsIHtcImFyaWEtbGFiZWxcIjogXCJSZXBseVwiLCBjbGFzc05hbWU6IFwiY29tbWVudC1yZXBseS1saW5rXCIsIG9uQ2xpY2s6IHRoaXMuaGFuZGxlQ2xpY2suYmluZCh0aGlzLCAncmVwbHknKX0sIFwiIFJlcGx5IFwiLCBSZWFjdC5jcmVhdGVFbGVtZW50KFwiaVwiLCB7Y2xhc3NOYW1lOiBcImZhIGZhLWFuZ2xlLXJpZ2h0XCJ9KSk7XG5cdFx0fVxuXHRcdHJldHVybiAoXG5cdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHtjbGFzc05hbWU6IFwiY29tbWVudC1pbnRlcmFjdGlvblwifSwgXG5cdCAgICBcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCB7Y2xhc3NOYW1lOiBcImludGVyYWN0aW9uIHB1bGwtbGVmdFwifSwgXG5cdCAgICBcdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KFwiYVwiLCB7XCJhcmlhLWxhYmVsXCI6IFwiVm90ZSBVcFwiLCBjbGFzc05hbWU6IGN4KCd1cHZvdGUnLCB7J3ZvdGVkJzogdGhpcy5zdGF0ZS51cHZvdGV9KSwgb25DbGljazogdGhpcy5oYW5kbGVDbGljay5iaW5kKHRoaXMsICd1cHZvdGUnKX0sIFxuXHQgICAgXHRcdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KFwiaVwiLCB7Y2xhc3NOYW1lOiBcImZhIGZhLXRodW1icy11cFwifSlcblx0ICAgIFx0XHRcdCksIFxuXHQgICAgXHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChcImFcIiwge1wiYXJpYS1sYWJlbFwiOiBcIlZvdGUgRG93blwiLCBjbGFzc05hbWU6IGN4KCdkb3dudm90ZScsIHsndm90ZWQnOiB0aGlzLnN0YXRlLmRvd252b3RlfSksIG9uQ2xpY2s6IHRoaXMuaGFuZGxlQ2xpY2suYmluZCh0aGlzLCAnZG93bnZvdGUnKX0sIFxuXHQgICAgXHRcdFx0XHRSZWFjdC5jcmVhdGVFbGVtZW50KFwiaVwiLCB7Y2xhc3NOYW1lOiBcImZhIGZhLXRodW1icy1kb3duXCJ9KVxuXHQgICAgXHRcdFx0KVxuXHQgICAgXHRcdCksIFxuXHQgICAgXHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJpbnRlcmFjdGlvbiBwdWxsLXJpZ2h0XCJ9LCBcblx0ICAgIFx0XHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJhXCIsIHtcImFyaWEtbGFiZWxcIjogXCJGbGFnIENvbW1lbnRcIiwgY2xhc3NOYW1lOiBjeCgnZmxhZycsIHsndm90ZWQnOiB0aGlzLnN0YXRlLmZsYWd9KSwgb25DbGljazogdGhpcy5oYW5kbGVDbGljay5iaW5kKHRoaXMsICdmbGFnJyl9LCBcIkZsYWdcIiksIFxuXHQgICAgXHRcdFx0cmVwbHlNYXJrdXBcblx0ICAgIFx0XHQpXG5cdCAgICBcdClcblx0XHQpO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb21tZW50SW50ZXJhY3Rpb247IiwiLy8gQGpzeCBSZWFjdC5ET01cblxuUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuYWRkb25zID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuY29tbWVudFN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmVzL2NvbW1lbnRzdG9yZS5qcycpO1xuXG52YXIgUmF0ZUljb24gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6IFwiUmF0ZUljb25cIixcblx0cmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cdHZhciBjeCA9IGFkZG9ucztcblx0dmFyIGNsYXNzSW5zZXJ0ID0gY3goe1xuXHRcdCdzdGFyJzogdHJ1ZSxcblx0XHQnZmlsbGVkJzogdGhpcy5wcm9wcy50b2dnbGVkIFxuXHR9KTtcblx0cmV0dXJuIChSZWFjdC5jcmVhdGVFbGVtZW50KFwibGlcIiwge2NsYXNzTmFtZTogY2xhc3NJbnNlcnQsIG9uTW91c2VNb3ZlOiB0aGlzLnByb3BzLm9uTW91c2VFbnRlciwgb25DbGljazogdGhpcy5wcm9wcy5vbkNsaWNrUmF0aW5nfSwgUmVhY3QuY3JlYXRlRWxlbWVudChcInNwYW5cIiwgbnVsbCwgXCJYXCIpKSk7IFxuXHR9XG59KTtcblxudmFyIFJhdGVCb3ggPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6IFwiUmF0ZUJveFwiLFxuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0cG9zdF9pZDogdGhpcy5wcm9wcy5wb3N0SWQsXG5cdFx0XHRjdXJyZW50UmF0aW5nOiB0aGlzLnByb3BzLmN1cnJlbnRSYXRpbmcgfHwgMCxcblx0XHRcdGN1cnJlbnRSYXRpbmdfaG92ZXI6IDAsXG5cdFx0XHRob3ZlcmluZzogZmFsc2Vcblx0XHR9O1xuXHR9LFxuXHRvbk1vdXNlRW50ZXI6IGZ1bmN0aW9uIChjdXJyZW50UmF0aW5nLCBlLCBpZCkge1xuXHRcdHZhciByYXRpbmcgPSBjdXJyZW50UmF0aW5nO1xuXHRcdGlmICgoZS5uYXRpdmVFdmVudC5jbGllbnRYKSA8IChlLnRhcmdldC5vZmZzZXRMZWZ0ICsgKGUudGFyZ2V0Lm9mZnNldFdpZHRoIC8gMikpKSB7XG5cdFx0XHRyYXRpbmcgLT0gMC41O1xuXHRcdH1cblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdGN1cnJlbnRSYXRpbmdfaG92ZXI6IHJhdGluZyxcblx0XHRcdGhvdmVyaW5nOiB0cnVlXG5cdFx0fSk7XG5cdH0sXG5cdG9uTW91c2VMZWF2ZTogZnVuY3Rpb24gKGN1cnJlbnRSYXRpbmcsIGUsIGlkKSB7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRob3ZlcmluZzogZmFsc2UsXG5cdFx0XHRjdXJyZW50UmF0aW5nX2hvdmVyOiAwXG5cdFx0fSk7XG5cdH0sXG5cdG9uQ2xpY2tSYXRpbmc6IGZ1bmN0aW9uIChjdXJyZW50UmF0aW5nLCBlLCBpZCkge1xuXHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0Y3VycmVudFJhdGluZzogdGhpcy5zdGF0ZS5jdXJyZW50UmF0aW5nX2hvdmVyXG5cdFx0fSk7XG5cdFx0aWYgKHRoaXMucHJvcHMub25DaGFuZ2UpIHtcblx0XHRcdHRoaXMucHJvcHMub25DaGFuZ2UoY3VycmVudFJhdGluZyk7XG5cdFx0fVxuXHR9LFxuXHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgcmF0aW5ncyA9W107XG5cdFx0dmFyIHRvZ2dsZWQgPSBmYWxzZTtcblx0XHR2YXIgcmF0aW5nLCBoYWxmQ2xhc3NOYW1lLFxuXHRcdFx0ZiA9IGZ1bmN0aW9uICgpIHt9LFxuXHRcdFx0b25Nb3VzZUVudGVyID0gdGhpcy5wcm9wcy52aWV3T25seSA/IGYgOiB0aGlzLm9uTW91c2VFbnRlcixcblx0XHRcdG9uQ2xpY2tSYXRpbmcgPSB0aGlzLnByb3BzLnZpZXdPbmx5ID8gZiA6IHRoaXMub25DbGlja1JhdGluZztcblx0XHRjdXJob3ZlciA9IHRoaXMuc3RhdGUuaG92ZXJpbmc7XG5cdFx0dmFyIGNvbmZpZyA9IGNvbW1lbnRTdG9yZS5nZXRDb25maWcoKTtcblx0XHRmb3IgKHZhciBpID0gMTsgaSA8PSA1OyArK2kpIHtcblx0XHRcdHJhdGluZyA9IHRoaXMuc3RhdGVbJ2N1cnJlbnRSYXRpbmcnICsgKGN1cmhvdmVyID8gJ19ob3ZlcicgOiAnJyldO1xuXHRcdFx0dG9nZ2xlZCA9IChpIDw9IE1hdGgucm91bmQocmF0aW5nKSA/IHRydWUgOiBmYWxzZSk7XG5cdFx0XHRoYWxmQ2xhc3NOYW1lID0gbnVsbDtcblx0XHRcdGlmICggdGhpcy5wcm9wcy5oYWxmQ2xhc3NOYW1lICYmXG5cdFx0XHRcdCBNYXRoLnJvdW5kKHJhdGluZykgPT0gaSAmJlxuXHRcdFx0XHQgTWF0aC5mbG9vcihyYXRpbmcpICE9IHJhdGluZyApIHtcblx0XHRcdFx0aGFsZkNsYXNzTmFtZSA9IHRoaXMucHJvcHMuaGFsZkNsYXNzTmFtZTtcblx0XHRcdH1cblx0XHRcdHJhdGluZ3MucHVzaChcblx0XHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChSYXRlSWNvbiwge2tleTogaSwgdG9nZ2xlZENsYXNzTmFtZTogaGFsZkNsYXNzTmFtZSB8fCB0aGlzLnByb3BzLnRvZ2dsZWRDbGFzc05hbWUsIG9uTW91c2VFbnRlcjogb25Nb3VzZUVudGVyLmJpbmQodGhpcywgaSksIG9uQ2xpY2tSYXRpbmc6IG9uQ2xpY2tSYXRpbmcuYmluZCh0aGlzLCBpKSwgdG9nZ2xlZDogdG9nZ2xlZH0pXG5cdFx0XHQpO1xuXHRcdH1cblx0XHRyZXR1cm4gKFxuXHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCB7Y2xhc3NOYW1lOiBcInJhdGVib3hcIn0sIFxuICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJyYXRlaXRlbVwifSwgXG4gICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJwXCIsIG51bGwsIFwiUmF0ZSB0aGlzIEFsYnVtXCIpLCBcbiAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcInVsXCIsIHtjbGFzc05hbWU6IFwicmF0aW5nXCIsIG9uTW91c2VyTGVhdmU6IHRoaXMub25Nb3VzZXJMZWF2ZX0sIFxuICAgICAgICAgICAgICAgICAgICByYXRpbmdzXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICApLCBcbiAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiZmlndXJlXCIsIHtjbGFzc05hbWU6IFwiYWxidW0tYXJ0XCJ9LCBcbiAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImltZ1wiLCB7c3JjOiBjb25maWcuYWxidW1BcnQsIHdpZHRoOiBcIjEwMFwiLCBoZWlnaHQ6IFwiMTAwXCJ9KSwgXG4gICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJmaWdjYXB0aW9uXCIsIHtjbGFzc05hbWU6IFwidm90ZS1pbmZvXCJ9LCBcbiAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJwXCIsIG51bGwsIFwiIFwiLCBSZWFjdC5jcmVhdGVFbGVtZW50KFwic3BhblwiLCB7Y2xhc3NOYW1lOiBcImNvdW50XCJ9LCBjb25maWcuZml2ZVJhdGVOdW1iZXIpLCBcIiBoYXZlIHZvdGVkXCIpLCBcbiAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJwXCIsIG51bGwsIFwiIFwiLCBSZWFjdC5jcmVhdGVFbGVtZW50KFwic3BhblwiLCB7Y2xhc3NOYW1lOiBcImNvdW50XCJ9LCBjb25maWcudm90ZVJhdGVUb3RhbCksIFwiIHBlb3BsZSBnYXZlIGl0IDUvNSBcIilcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgIClcblx0XHQpO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBSYXRlQm94OyIsIi8vIEBqc3ggUmVhY3QuRE9NXG5cblJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbmN4ID0gcmVxdWlyZSgnY2xhc3NuYW1lcycpO1xuYWN0aW9ucyA9IHJlcXVpcmUoJy4uL2FjdGlvbnMvY29tbWVudGFjdGlvbnMuanMnKTtcblxudmFyIFNvcnRJbmRpY2F0b3IgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6IFwiU29ydEluZGljYXRvclwiLFxuXHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXMsXG5cdFx0XHRpdGVtU29ydCA9IHRoaXMucHJvcHMuc29ydEl0ZW0sXG5cdFx0XHRpY29uTmFtZSA9IGl0ZW1Tb3J0Lmljb247XG5cdFx0XHRpY29uU2V0ID0gY3goJ2ZhJywgaWNvbk5hbWUpO1xuXHRcdFx0c29ydFNlbGVjdCA9IGN4KHsnYWN0aXZlJzogaXRlbVNvcnQuYWN0aXZlfSwgJ3NvcnRvcHRpb24nKTtcdFx0XG5cdFx0cmV0dXJuIChSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHtjbGFzc05hbWU6IHNvcnRTZWxlY3QsIG9uQ2xpY2s6IHRoaXMucHJvcHMuaGFuZGxlU29ydENoYW5nZX0sIFxuXHRcdFx0XHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJzb3J0dGV4dFwifSwgXCIgXCIsIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJpXCIsIHtjbGFzc05hbWU6IGljb25TZXR9KSksIFxuXHRcdFx0XHRcdFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJzb3J0dGV4dFwifSwgaXRlbVNvcnQubGFiZWwpXG5cdFx0XHRcdCkpO1xuXHR9XG59KVxuXG52YXIgU29ydENvbW1lbnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiBcIlNvcnRDb21tZW50c1wiLFxuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4ge3NvcnRzOiBbXG5cdFx0XHR7J2FjdGl2ZSc6IHRydWUsICdsYWJlbCc6ICdMYXRlc3QnLCAnaWNvbic6ICdmYS1jbG9jay1vJywgJ3ZhbHVlJzogJ2xhdGVzdCd9LCBcblx0XHRcdHsnYWN0aXZlJzogZmFsc2UsICdsYWJlbCc6ICdCZXN0JywgJ2ljb24nOiAnZmEtdGh1bWJzLXVwJywgJ3ZhbHVlJzogJ3VwJ30sXG5cdFx0XHR7J2FjdGl2ZScgOiBmYWxzZSwgJ2xhYmVsJzogJ1dvcnN0JywgJ2ljb24nOiAnZmEtdGh1bWJzLWRvd24nLCAndmFsdWUnOiAnZG93bid9XG5cdFx0XX07XG5cdH0sXG5cdGhhbmRsZVNvcnRDaGFuZ2U6IGZ1bmN0aW9uIChuZXd2YWx1ZSkge1xuXHRcdG5ld1NvcnQgPSBbXTtcblx0XHQvL2xvb3AgdGhyb3VnaHQgYWxsIHRoZSBzb3J0IHN0YXRlcyBhbmQgc2VlIGlmIHRoaXMgc29ydEl0ZW0gbWF0Y2hlcyBvdXIgZGVzaXJlZCBzb3J0IHN0YXRlLiBcblx0XHRmb3IgKHZhciBpID0gMCwgc2xlbiA9IHRoaXMuc3RhdGUuc29ydHMubGVuZ3RoOyBpIDwgc2xlbjsgaSsrKSB7XG5cdFx0XHRjdXJyZW50U29ydCA9IHRoaXMuc3RhdGUuc29ydHNbaV07XG5cdFx0XHRpZiAobmV3dmFsdWUgPT0gY3VycmVudFNvcnQpIHtcblx0XHRcdFx0Ly9pZiB3ZSBnZXQgYSBtYXRjaCBzZXQgdGhpcyBzdGF0ZSB0byB0cnVlLCBmb3IgdGhlIGFwcGVhcmFuY2VzIG9mIHRoZSBhY3RpdmUgY2xhc3Ncblx0XHRcdFx0Y3VycmVudFNvcnQuYWN0aXZlID0gdHJ1ZTtcblx0XHRcdFx0Ly90aGVuIHNlbmQgdGhlIGFjdGlvbiBvdXQgdG8gc2V0IHRoaXMgdmFsdWUgb24gdGhlIGNvbW1lbnRTdG9yZVxuXHRcdFx0XHRhY3Rpb25zLnNvcnRDb21tZW50TGlzdChuZXd2YWx1ZS52YWx1ZSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvL2Vsc2Ugc2V0IGFsbCB0aGUgb3RoZXIgYWN0aXZlIGNsYXNzZXMgdG8gZmFsc2Vcblx0XHRcdFx0Y3VycmVudFNvcnQuYWN0aXZlID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRuZXdTb3J0LnB1c2goY3VycmVudFNvcnQpO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy5zZXRTdGF0ZSh7c29ydHM6IG5ld1NvcnR9KTtcblx0fSxcblx0cmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIHNvcnRBcnIgPSB0aGlzLnN0YXRlLnNvcnRzLFxuXHRcdFx0c2VsZiA9IHRoaXM7XG5cdFx0XHRzb3J0SW5kaWNzID0gc29ydEFyci5tYXAoZnVuY3Rpb24gKHNvcnRJdGVtLCBpKSB7XG5cdFx0XHRcdC8vaXRlcmF0ZSBvdmVyIG91ciBzaW1wbGUgU29ydEluZGljYXRvciBSZWFjdCBjbGFzc2VzIGFuZCBzZWVkIHRoZW0gd2l0aCB0aGUgaW5pdGlhbCBzdGF0ZSBkYXRhLiBcblx0XHRcdFx0cmV0dXJuIChSZWFjdC5jcmVhdGVFbGVtZW50KFNvcnRJbmRpY2F0b3IsIHtrZXk6IHNvcnRJdGVtLnZhbHVlLCBrZXlJZDogaSwgaGFuZGxlU29ydENoYW5nZTogc2VsZi5oYW5kbGVTb3J0Q2hhbmdlLmJpbmQoc2VsZiwgc29ydEl0ZW0pLCBzb3J0SXRlbTogc29ydEl0ZW19KSk7XG5cdFx0XHR9KTtcblx0XHRyZXR1cm4gKFxuXHRcdFx0UmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCB7Y2xhc3NOYW1lOiBcImNvbW1lbnQtc29ydCBjbGVhcmZpeFwiLCBcImRhdGEtdG9nZ2xlXCI6IFwic29ydHRleHRcIn0sIFxuXHRcdFx0XHRzb3J0SW5kaWNzXG5cdFx0XHQpXG5cdFx0KTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU29ydENvbW1lbnRzO1xuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xudmFyIENvbW1lbnRDb21wb25lbnQgPSByZXF1aXJlKCcuL2NvbXBvbmVudHMvY29tbWVudGNvbXBvbmVudC5qcycpO1xuUmVhY3QucmVuZGVyKFJlYWN0LmNyZWF0ZUVsZW1lbnQoQ29tbWVudENvbXBvbmVudCwge3VybDogXCJodHRwOi8vbG9jYWxob3N0OjgwMDAvY29tbWVudGRhdGEuanNvblwiLCBwb2xsSW50ZXJ2YWw6IDEwMDAwMDAwfSksIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb250ZW50JykpOyIsInZhciBmbHV4ID0gcmVxdWlyZSgnZmx1eC1yZWFjdCcpLFxuXHRyZXF1ZXN0ID0gcmVxdWlyZSgnc3VwZXJhZ2VudCcpLFxuXHR2YWxpZGF0ZSA9IHJlcXVpcmUoJ3ZhbGlkYXRlLmpzJyksXG5cdGFjdGlvbkNvbW1lbnQgPSByZXF1aXJlKCcuLi9hY3Rpb25zL2NvbW1lbnRhY3Rpb25zJyk7XG5cbnZhciBDb21tZW50U3RvcmUgPSBmbHV4LmNyZWF0ZVN0b3JlKHtcblx0ZGF0YTogW10sXG5cdHJlcGx5SWQ6IG51bGwsXG5cdGVycm9yczoge30sXHRcdFxuXHRzb3J0Qnk6ICdsYXRlc3QnLFxuXHRjb25maWc6IHtcblx0XHRyYXRpbmc6IHRydWUsXG5cdFx0Y29tbWVudHNOdW1iZXI6IDAsXG5cdFx0Zml2ZVJhdGVOdW1iZXI6IDMwLFxuXHRcdHZvdGVSYXRlVG90YWw6IDQ1LFxuXHRcdGFsYnVtQXJ0OiAnaHR0cDovL2hpcGhvcGR4LmxvY2FsL3MvaW1nL2FsYnVtX3RodW1ibmFpbC5wbmcnLFxuXHRcdGNvbW1lbnRzVXJsOiAnaHR0cDovL2xvY2FsaG9zdDo4MDAwL2NvbW1lbnRkYXRhLmpzb24nLFxuXHRcdHBhZ2VOdW1iZXI6IDAsXG5cdFx0cG9zdElkOiAxMTE4LFxuXHR9LFxuXHRhY3Rpb25zOiBbXG5cdFx0YWN0aW9uQ29tbWVudC5hZGRDb21tZW50LFxuXHRcdGFjdGlvbkNvbW1lbnQuYWRkUmVwbHksXG5cdFx0YWN0aW9uQ29tbWVudC5zZXRSZXBseUlkLFxuXHRcdGFjdGlvbkNvbW1lbnQucG9wdWxhdGVDb25maWcsXG5cdFx0YWN0aW9uQ29tbWVudC5jYWxsQ29tbWVudExpc3QsXG5cdFx0YWN0aW9uQ29tbWVudC5zb3J0Q29tbWVudExpc3QsXG5cdFx0YWN0aW9uQ29tbWVudC52b3RlQ29tbWVudFxuXHRdLFxuXHRjYWxsQ29tbWVudExpc3Q6IGZ1bmN0aW9uICgpIHtcblx0XHQvL3RoaXMgaXMgdGhlIG1haW5xdWVyeSB0byBlc3RhYmxpc2ggYW4gYWpheCByZXF1ZXN0IHRvIHBvcHVsYXRlIHRoZSBgdGhpcy5kYXRhYCBzdG9yZSB3aXRoaW4gdGhpcyBmbHV4IHN0b3JlLlxuXHRcdC8vc29ydEJ5IGlzIGFsc28gcGFzc2VkIHNvIHdlIGNhbiByZXVzZSB0aGlzIHdpdGggdGhlIHNvcnRJbmNhdG9yIGFjdGlvbnMuIFxuXHRcdHZhciBzZWxmID0gdGhpcywgXG5cdFx0XHRzb3J0T3JkZXIgPSB0aGlzLnNvcnRCeTtcblx0XHRyZXF1ZXN0LmdldCh0aGlzLmNvbmZpZy5jb21tZW50c1VybCkucXVlcnkoeydhY3Rpb24nOiAnZ2V0J30pLnF1ZXJ5KHsnc29ydCc6IHNvcnRPcmRlcn0pLnNldCgnQWNjZXB0JywgJ2FwcGxpY2F0aW9uL2pzb24nKS5lbmQoXG5cdFx0XHRmdW5jdGlvbiAocmVzKSB7XG5cdFx0XHR0aGlzLmRhdGEgPSByZXMuYm9keTtcblx0XHRcdHRoaXMuYXNzZXNzQ29tbWVudENvdW50KCk7XG5cdFx0XHR0aGlzLmVtaXQoJ2NvbW1lbnQubG9hZGVkJyk7XG5cdFx0fS5iaW5kKHRoaXMpKTtcblx0XHRcblx0XHQvLyB0aGlzLmRhdGEgPSBzZWxmLmRhdGE7XG5cdH0sXG5cdHNvcnRDb21tZW50TGlzdDogZnVuY3Rpb24gKG5ld1NvcnQpIHtcblx0XHR0aGlzLnNvcnRCeSA9IG5ld1NvcnQ7XG5cdFx0dGhpcy5lbWl0KCdzb3J0LmNoYW5nZWQnKVxuXHRcdHRoaXMuY2FsbENvbW1lbnRMaXN0KCk7XG5cdH0sXG5cdHZvdGVDb21tZW50OiBmdW5jdGlvbiAoaWQsIGFjdGlvbikge1xuXHRcdHJlcXVlc3QucG9zdCh0aGlzLmNvbmZpZy5jb21tZW50c1VybCkudHlwZSgnYXBwbGljYXRpb24vanNvbicpLnNlbmQoeydhY3Rpb24nOiBhY3Rpb259KS5zZW5kKHsnaWQnOiBpZH0pLmVuZChcblx0XHRcdGZ1bmN0aW9uIChyZXMpIHtcblx0XHRcdFx0Y29uc29sZS5sb2cocmVzLmJvZHkpO1xuXHRcdH0pO1xuXHR9LFxuXHRzZXRSZXBseUlkOiBmdW5jdGlvbiAoaWQpIHtcblx0XHR0aGlzLnJlcGx5SWQgPSBpZDtcblx0XHR0aGlzLmVtaXQoJ2NvbW1lbnQucmVwbHlzZXQnKTtcblx0fSxcblx0YWRkQ29tbWVudDogZnVuY3Rpb24gKGNvbW1lbnRPYmopIHtcdFxuXHRcdGNvbnNvbGUubG9nKHRoaXMuZGF0YSwgJ2JlZm9yZScpO1xuXHRcdC8vIHRoaXMuZXJyb3JzID0gdGhpcy52YWxpZGF0ZUNvbW1lbnQoY29tbWVudE9iaik7XG5cdFx0dGhpcy5lbWl0KCdlcnJvcnMudXBkYXRlZCcpO1xuXHRcdGNvbW1lbnRPYmouaWQgPSAyMDtcblx0XHRjb21tZW50T2JqLnJlcGxpZXMgPSBbXTtcblx0XHQvLyBpZiAodGhpcy5lcnJvcnMuY29kZSA9PSAwKSB7XG5cdFx0dGhpcy5kYXRhLnB1c2goY29tbWVudE9iaik7XG5cdFxuXHRcdGNvbnNvbGUubG9nKHRoaXMuZGF0YSwgJ2FmdGVyJyk7XG5cdFx0dGhpcy5lbWl0KCdjb21tZW50LmFkZGVkJyk7XHRcblx0XHR0aGlzLmFzc2Vzc0NvbW1lbnRDb3VudCgpO1xuXHRcdC8vIH0gXG5cdH0sXG5cdGFkZFJlcGx5OiBmdW5jdGlvbiAoY29tbWVudE9iaiwgcmVwbHlJZCkge1xuXHRcdHZhciBjb21tZW50cyA9IHRoaXMuZGF0YSxcblx0XHRcdGNob3NlblJlcGx5ID0gdGhpcy5vYmplY3RGaW5kQnlLZXkoY29tbWVudHMsICdpZCcsIHJlcGx5SWQpO1xuXHRcdFxuXHRcdHRoaXMuZXJyb3JzID0gdGhpcy52YWxpZGF0ZUNvbW1lbnQoY29tbWVudE9iaik7XG5cdFx0dGhpcy5lbWl0KCdlcnJvcnMudXBkYXRlZCcpO1xuXHRcdGNvbW1lbnRPYmouaWQgPSAxOTtcblx0XHRjaG9zZW5SZXBseS5yZXBsaWVzLnB1c2goY29tbWVudE9iaik7XG5cdFx0dGhpcy5yZXBseUlkID0gbnVsbDtcblxuXHRcdHRoaXMuZW1pdCgnY29tbWVudC5hZGRlZCcpO1xuXHRcdHRoaXMuYXNzZXNzQ29tbWVudENvdW50KCk7XG5cdFx0dGhpcy5lbWl0KCdjb21tZW50LnJlcGx5c2V0Jyk7XG5cdH0sXG5cdHZhbGlkYXRlQ29tbWVudDogZnVuY3Rpb24gKGNvbW1lbnRPYmopIHtcblx0XHR0aGlzLmVycm9ycyA9IHt9O1xuXHRcdC8vcnVuIHRocm91Z2h0IGEgdmFsaWRhdG9yIHRvIGNoZWNrIHRoZSBpbnB1dCBvdXQuXG5cdFx0dmFyIGNvbnN0cmFpbnRzID0ge1xuXHRcdFx0J2F1dGhvcicgOiB7cHJlc2VuY2U6IHRydWUsIGxlbmd0aDoge21pbmltdW06IDIsIG1heGltdW06IDIwfSB9LFxuXHRcdFx0J2VtYWlsJzoge3ByZXNlbmNlOiB0cnVlLCBlbWFpbDogdHJ1ZX0sXG5cdFx0XHQnY29tbWVudCcgOiB7cHJlc2VuY2U6IHRydWV9LFxuXHRcdH07XG5cdFx0dmFyIHZhbGlkYXRlU3VibWlzc2lvbiA9IHZhbGlkYXRlKHtcblx0XHRcdCdjb21tZW50JzogY29tbWVudE9iai5jb21tZW50Ym9keSxcblx0XHRcdCdlbWFpbCc6IGNvbW1lbnRPYmouYXV0aG9yLmVtYWlsLCBcblx0XHRcdCdhdXRob3InOiBjb21tZW50T2JqLmF1dGhvci5uYW1lfSxcblx0XHRjb25zdHJhaW50cyk7XG5cblx0XHQvL1RPRE8gTWFrZSBlcnJvciBzdGF0ZXMgXG5cdFx0aWYgKHZhbGlkYXRlU3VibWlzc2lvbikge1xuXHRcdFx0Y29uc29sZS5sb2codmFsaWRhdGVTdWJtaXNzaW9uKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdH0sXG5cdHBvcHVsYXRlQ29uZmlnOiBmdW5jdGlvbiAoKSB7XG5cdFx0Ly9UT0RPOiBtb3ZlIHRoZSBjb25maWdzIG9mIHRoZSBqc29uIG91dCB0byB0aGlzIGxpc3QuIG9yIHdlIGNhbiB0ZWNobmljYWxseSBncmFiIGl0IGZyb20gdGhlIGRvY3VtZW50IGFzIGFuIGVtYmVkIGpzb24gb2JqZWN0LiBcblx0fSxcblx0b2JqZWN0RmluZEJ5S2V5OiBmdW5jdGlvbiAoYXJyYXksIGtleSwgdmFsdWUpIHtcblx0ICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICBpZiAoYXJyYXlbaV1ba2V5XSA9PT0gdmFsdWUpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIGFycmF5W2ldO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblx0ICAgIHJldHVybiBudWxsO1xuXHR9LFxuXHRhc3Nlc3NDb21tZW50Q291bnQ6IGZ1bmN0aW9uICgpIHtcblx0XHR0b0NvdW50ID0gdGhpcy5kYXRhO1xuXHRcdGJhc2VDb3VudCA9IHRvQ291bnQubGVuZ3RoO1xuXHRcdGZvciAodmFyIGl0ID0gMCwgbGVuID0gdGhpcy5kYXRhLmxlbmd0aDsgaXQgPCBsZW47IGl0KysgKSB7XG5cdFx0XHRiYXNlQ291bnQgKz0gdG9Db3VudFtpdF0ucmVwbGllcy5sZW5ndGg7XG5cdFx0fVxuXHRcdHRoaXMuY29uZmlnLmNvbW1lbnRzTnVtYmVyID0gYmFzZUNvdW50O1xuXHRcdHRoaXMuZW1pdCgnY29uZmlnLmFkZGVkQ29tbWVudCcpO1xuXHR9LFxuXHRleHBvcnRzOiB7XG5cdFx0Z2V0SW5pdGlhbERhdGE6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiB0aGlzLmNhbGxDb21tZW50TGlzdCgpO1xuXHRcdH0sXG5cdFx0Z2V0Q29tbWVudHNMaXN0OiBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiB0aGlzLmRhdGE7XG5cdFx0fSxcblx0XHRnZXRSZXBseUlkOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5yZXBseUlkO1xuXHRcdH0sXG5cdFx0Z2V0Q29uZmlnOiBmdW5jdGlvbiAoKSB7XG5cdFx0IFx0cmV0dXJuIHRoaXMuY29uZmlnOyBcblx0XHR9LFxuXHRcdGdldEVycm9yczogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5lcnJvcnM7XG5cdFx0fVxuXHR9IFxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29tbWVudFN0b3JlOyIsImZ1bmN0aW9uIGNsYXNzTmFtZXMoKSB7XG5cdHZhciBhcmdzID0gYXJndW1lbnRzO1xuXHR2YXIgY2xhc3NlcyA9IFtdO1xuXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuXHRcdHZhciBhcmcgPSBhcmdzW2ldO1xuXHRcdGlmICghYXJnKSB7XG5cdFx0XHRjb250aW51ZTtcblx0XHR9XG5cblx0XHRpZiAoJ3N0cmluZycgPT09IHR5cGVvZiBhcmcgfHwgJ251bWJlcicgPT09IHR5cGVvZiBhcmcpIHtcblx0XHRcdGNsYXNzZXMucHVzaChhcmcpO1xuXHRcdH0gZWxzZSBpZiAoJ29iamVjdCcgPT09IHR5cGVvZiBhcmcpIHtcblx0XHRcdGZvciAodmFyIGtleSBpbiBhcmcpIHtcblx0XHRcdFx0aWYgKCFhcmcuaGFzT3duUHJvcGVydHkoa2V5KSB8fCAhYXJnW2tleV0pIHtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRjbGFzc2VzLnB1c2goa2V5KTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblx0cmV0dXJuIGNsYXNzZXMuam9pbignICcpO1xufVxuXG4vLyBzYWZlbHkgZXhwb3J0IGNsYXNzTmFtZXMgaW4gY2FzZSB0aGUgc2NyaXB0IGlzIGluY2x1ZGVkIGRpcmVjdGx5IG9uIGEgcGFnZVxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG5cdG1vZHVsZS5leHBvcnRzID0gY2xhc3NOYW1lcztcbn1cbiIsIi8vISBtb21lbnQuanNcbi8vISB2ZXJzaW9uIDogMi45LjBcbi8vISBhdXRob3JzIDogVGltIFdvb2QsIElza3JlbiBDaGVybmV2LCBNb21lbnQuanMgY29udHJpYnV0b3JzXG4vLyEgbGljZW5zZSA6IE1JVFxuLy8hIG1vbWVudGpzLmNvbVxuXG4oZnVuY3Rpb24gKHVuZGVmaW5lZCkge1xuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgQ29uc3RhbnRzXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgdmFyIG1vbWVudCxcbiAgICAgICAgVkVSU0lPTiA9ICcyLjkuMCcsXG4gICAgICAgIC8vIHRoZSBnbG9iYWwtc2NvcGUgdGhpcyBpcyBOT1QgdGhlIGdsb2JhbCBvYmplY3QgaW4gTm9kZS5qc1xuICAgICAgICBnbG9iYWxTY29wZSA9ICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyAmJiAodHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcgfHwgd2luZG93ID09PSBnbG9iYWwud2luZG93KSkgPyBnbG9iYWwgOiB0aGlzLFxuICAgICAgICBvbGRHbG9iYWxNb21lbnQsXG4gICAgICAgIHJvdW5kID0gTWF0aC5yb3VuZCxcbiAgICAgICAgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LFxuICAgICAgICBpLFxuXG4gICAgICAgIFlFQVIgPSAwLFxuICAgICAgICBNT05USCA9IDEsXG4gICAgICAgIERBVEUgPSAyLFxuICAgICAgICBIT1VSID0gMyxcbiAgICAgICAgTUlOVVRFID0gNCxcbiAgICAgICAgU0VDT05EID0gNSxcbiAgICAgICAgTUlMTElTRUNPTkQgPSA2LFxuXG4gICAgICAgIC8vIGludGVybmFsIHN0b3JhZ2UgZm9yIGxvY2FsZSBjb25maWcgZmlsZXNcbiAgICAgICAgbG9jYWxlcyA9IHt9LFxuXG4gICAgICAgIC8vIGV4dHJhIG1vbWVudCBpbnRlcm5hbCBwcm9wZXJ0aWVzIChwbHVnaW5zIHJlZ2lzdGVyIHByb3BzIGhlcmUpXG4gICAgICAgIG1vbWVudFByb3BlcnRpZXMgPSBbXSxcblxuICAgICAgICAvLyBjaGVjayBmb3Igbm9kZUpTXG4gICAgICAgIGhhc01vZHVsZSA9ICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUgJiYgbW9kdWxlLmV4cG9ydHMpLFxuXG4gICAgICAgIC8vIEFTUC5ORVQganNvbiBkYXRlIGZvcm1hdCByZWdleFxuICAgICAgICBhc3BOZXRKc29uUmVnZXggPSAvXlxcLz9EYXRlXFwoKFxcLT9cXGQrKS9pLFxuICAgICAgICBhc3BOZXRUaW1lU3Bhbkpzb25SZWdleCA9IC8oXFwtKT8oPzooXFxkKilcXC4pPyhcXGQrKVxcOihcXGQrKSg/OlxcOihcXGQrKVxcLj8oXFxkezN9KT8pPy8sXG5cbiAgICAgICAgLy8gZnJvbSBodHRwOi8vZG9jcy5jbG9zdXJlLWxpYnJhcnkuZ29vZ2xlY29kZS5jb20vZ2l0L2Nsb3N1cmVfZ29vZ19kYXRlX2RhdGUuanMuc291cmNlLmh0bWxcbiAgICAgICAgLy8gc29tZXdoYXQgbW9yZSBpbiBsaW5lIHdpdGggNC40LjMuMiAyMDA0IHNwZWMsIGJ1dCBhbGxvd3MgZGVjaW1hbCBhbnl3aGVyZVxuICAgICAgICBpc29EdXJhdGlvblJlZ2V4ID0gL14oLSk/UCg/Oig/OihbMC05LC5dKilZKT8oPzooWzAtOSwuXSopTSk/KD86KFswLTksLl0qKUQpPyg/OlQoPzooWzAtOSwuXSopSCk/KD86KFswLTksLl0qKU0pPyg/OihbMC05LC5dKilTKT8pP3woWzAtOSwuXSopVykkLyxcblxuICAgICAgICAvLyBmb3JtYXQgdG9rZW5zXG4gICAgICAgIGZvcm1hdHRpbmdUb2tlbnMgPSAvKFxcW1teXFxbXSpcXF0pfChcXFxcKT8oTW98TU0/TT9NP3xEb3xERERvfEREP0Q/RD98ZGRkP2Q/fGRvP3x3W298d10/fFdbb3xXXT98UXxZWVlZWVl8WVlZWVl8WVlZWXxZWXxnZyhnZ2c/KT98R0coR0dHPyk/fGV8RXxhfEF8aGg/fEhIP3xtbT98c3M/fFN7MSw0fXx4fFh8eno/fFpaP3wuKS9nLFxuICAgICAgICBsb2NhbEZvcm1hdHRpbmdUb2tlbnMgPSAvKFxcW1teXFxbXSpcXF0pfChcXFxcKT8oTFRTfExUfExMP0w/TD98bHsxLDR9KS9nLFxuXG4gICAgICAgIC8vIHBhcnNpbmcgdG9rZW4gcmVnZXhlc1xuICAgICAgICBwYXJzZVRva2VuT25lT3JUd29EaWdpdHMgPSAvXFxkXFxkPy8sIC8vIDAgLSA5OVxuICAgICAgICBwYXJzZVRva2VuT25lVG9UaHJlZURpZ2l0cyA9IC9cXGR7MSwzfS8sIC8vIDAgLSA5OTlcbiAgICAgICAgcGFyc2VUb2tlbk9uZVRvRm91ckRpZ2l0cyA9IC9cXGR7MSw0fS8sIC8vIDAgLSA5OTk5XG4gICAgICAgIHBhcnNlVG9rZW5PbmVUb1NpeERpZ2l0cyA9IC9bK1xcLV0/XFxkezEsNn0vLCAvLyAtOTk5LDk5OSAtIDk5OSw5OTlcbiAgICAgICAgcGFyc2VUb2tlbkRpZ2l0cyA9IC9cXGQrLywgLy8gbm9uemVybyBudW1iZXIgb2YgZGlnaXRzXG4gICAgICAgIHBhcnNlVG9rZW5Xb3JkID0gL1swLTldKlsnYS16XFx1MDBBMC1cXHUwNUZGXFx1MDcwMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSt8W1xcdTA2MDAtXFx1MDZGRlxcL10rKFxccyo/W1xcdTA2MDAtXFx1MDZGRl0rKXsxLDJ9L2ksIC8vIGFueSB3b3JkIChvciB0d28pIGNoYXJhY3RlcnMgb3IgbnVtYmVycyBpbmNsdWRpbmcgdHdvL3RocmVlIHdvcmQgbW9udGggaW4gYXJhYmljLlxuICAgICAgICBwYXJzZVRva2VuVGltZXpvbmUgPSAvWnxbXFwrXFwtXVxcZFxcZDo/XFxkXFxkL2dpLCAvLyArMDA6MDAgLTAwOjAwICswMDAwIC0wMDAwIG9yIFpcbiAgICAgICAgcGFyc2VUb2tlblQgPSAvVC9pLCAvLyBUIChJU08gc2VwYXJhdG9yKVxuICAgICAgICBwYXJzZVRva2VuT2Zmc2V0TXMgPSAvW1xcK1xcLV0/XFxkKy8sIC8vIDEyMzQ1Njc4OTAxMjNcbiAgICAgICAgcGFyc2VUb2tlblRpbWVzdGFtcE1zID0gL1tcXCtcXC1dP1xcZCsoXFwuXFxkezEsM30pPy8sIC8vIDEyMzQ1Njc4OSAxMjM0NTY3ODkuMTIzXG5cbiAgICAgICAgLy9zdHJpY3QgcGFyc2luZyByZWdleGVzXG4gICAgICAgIHBhcnNlVG9rZW5PbmVEaWdpdCA9IC9cXGQvLCAvLyAwIC0gOVxuICAgICAgICBwYXJzZVRva2VuVHdvRGlnaXRzID0gL1xcZFxcZC8sIC8vIDAwIC0gOTlcbiAgICAgICAgcGFyc2VUb2tlblRocmVlRGlnaXRzID0gL1xcZHszfS8sIC8vIDAwMCAtIDk5OVxuICAgICAgICBwYXJzZVRva2VuRm91ckRpZ2l0cyA9IC9cXGR7NH0vLCAvLyAwMDAwIC0gOTk5OVxuICAgICAgICBwYXJzZVRva2VuU2l4RGlnaXRzID0gL1srLV0/XFxkezZ9LywgLy8gLTk5OSw5OTkgLSA5OTksOTk5XG4gICAgICAgIHBhcnNlVG9rZW5TaWduZWROdW1iZXIgPSAvWystXT9cXGQrLywgLy8gLWluZiAtIGluZlxuXG4gICAgICAgIC8vIGlzbyA4NjAxIHJlZ2V4XG4gICAgICAgIC8vIDAwMDAtMDAtMDAgMDAwMC1XMDAgb3IgMDAwMC1XMDAtMCArIFQgKyAwMCBvciAwMDowMCBvciAwMDowMDowMCBvciAwMDowMDowMC4wMDAgKyArMDA6MDAgb3IgKzAwMDAgb3IgKzAwKVxuICAgICAgICBpc29SZWdleCA9IC9eXFxzKig/OlsrLV1cXGR7Nn18XFxkezR9KS0oPzooXFxkXFxkLVxcZFxcZCl8KFdcXGRcXGQkKXwoV1xcZFxcZC1cXGQpfChcXGRcXGRcXGQpKSgoVHwgKShcXGRcXGQoOlxcZFxcZCg6XFxkXFxkKFxcLlxcZCspPyk/KT8pPyhbXFwrXFwtXVxcZFxcZCg/Ojo/XFxkXFxkKT98XFxzKlopPyk/JC8sXG5cbiAgICAgICAgaXNvRm9ybWF0ID0gJ1lZWVktTU0tRERUSEg6bW06c3NaJyxcblxuICAgICAgICBpc29EYXRlcyA9IFtcbiAgICAgICAgICAgIFsnWVlZWVlZLU1NLUREJywgL1srLV1cXGR7Nn0tXFxkezJ9LVxcZHsyfS9dLFxuICAgICAgICAgICAgWydZWVlZLU1NLUREJywgL1xcZHs0fS1cXGR7Mn0tXFxkezJ9L10sXG4gICAgICAgICAgICBbJ0dHR0ctW1ddV1ctRScsIC9cXGR7NH0tV1xcZHsyfS1cXGQvXSxcbiAgICAgICAgICAgIFsnR0dHRy1bV11XVycsIC9cXGR7NH0tV1xcZHsyfS9dLFxuICAgICAgICAgICAgWydZWVlZLURERCcsIC9cXGR7NH0tXFxkezN9L11cbiAgICAgICAgXSxcblxuICAgICAgICAvLyBpc28gdGltZSBmb3JtYXRzIGFuZCByZWdleGVzXG4gICAgICAgIGlzb1RpbWVzID0gW1xuICAgICAgICAgICAgWydISDptbTpzcy5TU1NTJywgLyhUfCApXFxkXFxkOlxcZFxcZDpcXGRcXGRcXC5cXGQrL10sXG4gICAgICAgICAgICBbJ0hIOm1tOnNzJywgLyhUfCApXFxkXFxkOlxcZFxcZDpcXGRcXGQvXSxcbiAgICAgICAgICAgIFsnSEg6bW0nLCAvKFR8IClcXGRcXGQ6XFxkXFxkL10sXG4gICAgICAgICAgICBbJ0hIJywgLyhUfCApXFxkXFxkL11cbiAgICAgICAgXSxcblxuICAgICAgICAvLyB0aW1lem9uZSBjaHVua2VyICcrMTA6MDAnID4gWycxMCcsICcwMCddIG9yICctMTUzMCcgPiBbJy0nLCAnMTUnLCAnMzAnXVxuICAgICAgICBwYXJzZVRpbWV6b25lQ2h1bmtlciA9IC8oW1xcK1xcLV18XFxkXFxkKS9naSxcblxuICAgICAgICAvLyBnZXR0ZXIgYW5kIHNldHRlciBuYW1lc1xuICAgICAgICBwcm94eUdldHRlcnNBbmRTZXR0ZXJzID0gJ0RhdGV8SG91cnN8TWludXRlc3xTZWNvbmRzfE1pbGxpc2Vjb25kcycuc3BsaXQoJ3wnKSxcbiAgICAgICAgdW5pdE1pbGxpc2Vjb25kRmFjdG9ycyA9IHtcbiAgICAgICAgICAgICdNaWxsaXNlY29uZHMnIDogMSxcbiAgICAgICAgICAgICdTZWNvbmRzJyA6IDFlMyxcbiAgICAgICAgICAgICdNaW51dGVzJyA6IDZlNCxcbiAgICAgICAgICAgICdIb3VycycgOiAzNmU1LFxuICAgICAgICAgICAgJ0RheXMnIDogODY0ZTUsXG4gICAgICAgICAgICAnTW9udGhzJyA6IDI1OTJlNixcbiAgICAgICAgICAgICdZZWFycycgOiAzMTUzNmU2XG4gICAgICAgIH0sXG5cbiAgICAgICAgdW5pdEFsaWFzZXMgPSB7XG4gICAgICAgICAgICBtcyA6ICdtaWxsaXNlY29uZCcsXG4gICAgICAgICAgICBzIDogJ3NlY29uZCcsXG4gICAgICAgICAgICBtIDogJ21pbnV0ZScsXG4gICAgICAgICAgICBoIDogJ2hvdXInLFxuICAgICAgICAgICAgZCA6ICdkYXknLFxuICAgICAgICAgICAgRCA6ICdkYXRlJyxcbiAgICAgICAgICAgIHcgOiAnd2VlaycsXG4gICAgICAgICAgICBXIDogJ2lzb1dlZWsnLFxuICAgICAgICAgICAgTSA6ICdtb250aCcsXG4gICAgICAgICAgICBRIDogJ3F1YXJ0ZXInLFxuICAgICAgICAgICAgeSA6ICd5ZWFyJyxcbiAgICAgICAgICAgIERERCA6ICdkYXlPZlllYXInLFxuICAgICAgICAgICAgZSA6ICd3ZWVrZGF5JyxcbiAgICAgICAgICAgIEUgOiAnaXNvV2Vla2RheScsXG4gICAgICAgICAgICBnZzogJ3dlZWtZZWFyJyxcbiAgICAgICAgICAgIEdHOiAnaXNvV2Vla1llYXInXG4gICAgICAgIH0sXG5cbiAgICAgICAgY2FtZWxGdW5jdGlvbnMgPSB7XG4gICAgICAgICAgICBkYXlvZnllYXIgOiAnZGF5T2ZZZWFyJyxcbiAgICAgICAgICAgIGlzb3dlZWtkYXkgOiAnaXNvV2Vla2RheScsXG4gICAgICAgICAgICBpc293ZWVrIDogJ2lzb1dlZWsnLFxuICAgICAgICAgICAgd2Vla3llYXIgOiAnd2Vla1llYXInLFxuICAgICAgICAgICAgaXNvd2Vla3llYXIgOiAnaXNvV2Vla1llYXInXG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gZm9ybWF0IGZ1bmN0aW9uIHN0cmluZ3NcbiAgICAgICAgZm9ybWF0RnVuY3Rpb25zID0ge30sXG5cbiAgICAgICAgLy8gZGVmYXVsdCByZWxhdGl2ZSB0aW1lIHRocmVzaG9sZHNcbiAgICAgICAgcmVsYXRpdmVUaW1lVGhyZXNob2xkcyA9IHtcbiAgICAgICAgICAgIHM6IDQ1LCAgLy8gc2Vjb25kcyB0byBtaW51dGVcbiAgICAgICAgICAgIG06IDQ1LCAgLy8gbWludXRlcyB0byBob3VyXG4gICAgICAgICAgICBoOiAyMiwgIC8vIGhvdXJzIHRvIGRheVxuICAgICAgICAgICAgZDogMjYsICAvLyBkYXlzIHRvIG1vbnRoXG4gICAgICAgICAgICBNOiAxMSAgIC8vIG1vbnRocyB0byB5ZWFyXG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gdG9rZW5zIHRvIG9yZGluYWxpemUgYW5kIHBhZFxuICAgICAgICBvcmRpbmFsaXplVG9rZW5zID0gJ0RERCB3IFcgTSBEIGQnLnNwbGl0KCcgJyksXG4gICAgICAgIHBhZGRlZFRva2VucyA9ICdNIEQgSCBoIG0gcyB3IFcnLnNwbGl0KCcgJyksXG5cbiAgICAgICAgZm9ybWF0VG9rZW5GdW5jdGlvbnMgPSB7XG4gICAgICAgICAgICBNICAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm1vbnRoKCkgKyAxO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIE1NTSAgOiBmdW5jdGlvbiAoZm9ybWF0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLm1vbnRoc1Nob3J0KHRoaXMsIGZvcm1hdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgTU1NTSA6IGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkubW9udGhzKHRoaXMsIGZvcm1hdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgRCAgICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5kYXRlKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgREREICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5kYXlPZlllYXIoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkICAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmRheSgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRkICAgOiBmdW5jdGlvbiAoZm9ybWF0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLndlZWtkYXlzTWluKHRoaXMsIGZvcm1hdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGRkICA6IGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkud2Vla2RheXNTaG9ydCh0aGlzLCBmb3JtYXQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRkZGQgOiBmdW5jdGlvbiAoZm9ybWF0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLndlZWtkYXlzKHRoaXMsIGZvcm1hdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdyAgICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy53ZWVrKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgVyAgICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pc29XZWVrKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgWVkgICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGVmdFplcm9GaWxsKHRoaXMueWVhcigpICUgMTAwLCAyKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBZWVlZIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodGhpcy55ZWFyKCksIDQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFlZWVlZIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodGhpcy55ZWFyKCksIDUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFlZWVlZWSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgeSA9IHRoaXMueWVhcigpLCBzaWduID0geSA+PSAwID8gJysnIDogJy0nO1xuICAgICAgICAgICAgICAgIHJldHVybiBzaWduICsgbGVmdFplcm9GaWxsKE1hdGguYWJzKHkpLCA2KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZyAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodGhpcy53ZWVrWWVhcigpICUgMTAwLCAyKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZ2dnIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodGhpcy53ZWVrWWVhcigpLCA0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZ2dnZyA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGVmdFplcm9GaWxsKHRoaXMud2Vla1llYXIoKSwgNSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgR0cgICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGVmdFplcm9GaWxsKHRoaXMuaXNvV2Vla1llYXIoKSAlIDEwMCwgMik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgR0dHRyA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGVmdFplcm9GaWxsKHRoaXMuaXNvV2Vla1llYXIoKSwgNCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgR0dHR0cgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlZnRaZXJvRmlsbCh0aGlzLmlzb1dlZWtZZWFyKCksIDUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGUgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMud2Vla2RheSgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIEUgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaXNvV2Vla2RheSgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGEgICAgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLm1lcmlkaWVtKHRoaXMuaG91cnMoKSwgdGhpcy5taW51dGVzKCksIHRydWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIEEgICAgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLm1lcmlkaWVtKHRoaXMuaG91cnMoKSwgdGhpcy5taW51dGVzKCksIGZhbHNlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBIICAgIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmhvdXJzKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaCAgICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5ob3VycygpICUgMTIgfHwgMTI7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbSAgICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5taW51dGVzKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcyAgICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zZWNvbmRzKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgUyAgICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdG9JbnQodGhpcy5taWxsaXNlY29uZHMoKSAvIDEwMCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgU1MgICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGVmdFplcm9GaWxsKHRvSW50KHRoaXMubWlsbGlzZWNvbmRzKCkgLyAxMCksIDIpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFNTUyAgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlZnRaZXJvRmlsbCh0aGlzLm1pbGxpc2Vjb25kcygpLCAzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBTU1NTIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwodGhpcy5taWxsaXNlY29uZHMoKSwgMyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgWiAgICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgYSA9IHRoaXMudXRjT2Zmc2V0KCksXG4gICAgICAgICAgICAgICAgICAgIGIgPSAnKyc7XG4gICAgICAgICAgICAgICAgaWYgKGEgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGEgPSAtYTtcbiAgICAgICAgICAgICAgICAgICAgYiA9ICctJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGIgKyBsZWZ0WmVyb0ZpbGwodG9JbnQoYSAvIDYwKSwgMikgKyAnOicgKyBsZWZ0WmVyb0ZpbGwodG9JbnQoYSkgJSA2MCwgMik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgWlogICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgYSA9IHRoaXMudXRjT2Zmc2V0KCksXG4gICAgICAgICAgICAgICAgICAgIGIgPSAnKyc7XG4gICAgICAgICAgICAgICAgaWYgKGEgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGEgPSAtYTtcbiAgICAgICAgICAgICAgICAgICAgYiA9ICctJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGIgKyBsZWZ0WmVyb0ZpbGwodG9JbnQoYSAvIDYwKSwgMikgKyBsZWZ0WmVyb0ZpbGwodG9JbnQoYSkgJSA2MCwgMik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgeiA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy56b25lQWJicigpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHp6IDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnpvbmVOYW1lKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgeCAgICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZU9mKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgWCAgICA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy51bml4KCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgUSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5xdWFydGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGVwcmVjYXRpb25zID0ge30sXG5cbiAgICAgICAgbGlzdHMgPSBbJ21vbnRocycsICdtb250aHNTaG9ydCcsICd3ZWVrZGF5cycsICd3ZWVrZGF5c1Nob3J0JywgJ3dlZWtkYXlzTWluJ10sXG5cbiAgICAgICAgdXBkYXRlSW5Qcm9ncmVzcyA9IGZhbHNlO1xuXG4gICAgLy8gUGljayB0aGUgZmlyc3QgZGVmaW5lZCBvZiB0d28gb3IgdGhyZWUgYXJndW1lbnRzLiBkZmwgY29tZXMgZnJvbVxuICAgIC8vIGRlZmF1bHQuXG4gICAgZnVuY3Rpb24gZGZsKGEsIGIsIGMpIHtcbiAgICAgICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjYXNlIDI6IHJldHVybiBhICE9IG51bGwgPyBhIDogYjtcbiAgICAgICAgICAgIGNhc2UgMzogcmV0dXJuIGEgIT0gbnVsbCA/IGEgOiBiICE9IG51bGwgPyBiIDogYztcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcignSW1wbGVtZW50IG1lJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoYXNPd25Qcm9wKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIGhhc093blByb3BlcnR5LmNhbGwoYSwgYik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGVmYXVsdFBhcnNpbmdGbGFncygpIHtcbiAgICAgICAgLy8gV2UgbmVlZCB0byBkZWVwIGNsb25lIHRoaXMgb2JqZWN0LCBhbmQgZXM1IHN0YW5kYXJkIGlzIG5vdCB2ZXJ5XG4gICAgICAgIC8vIGhlbHBmdWwuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBlbXB0eSA6IGZhbHNlLFxuICAgICAgICAgICAgdW51c2VkVG9rZW5zIDogW10sXG4gICAgICAgICAgICB1bnVzZWRJbnB1dCA6IFtdLFxuICAgICAgICAgICAgb3ZlcmZsb3cgOiAtMixcbiAgICAgICAgICAgIGNoYXJzTGVmdE92ZXIgOiAwLFxuICAgICAgICAgICAgbnVsbElucHV0IDogZmFsc2UsXG4gICAgICAgICAgICBpbnZhbGlkTW9udGggOiBudWxsLFxuICAgICAgICAgICAgaW52YWxpZEZvcm1hdCA6IGZhbHNlLFxuICAgICAgICAgICAgdXNlckludmFsaWRhdGVkIDogZmFsc2UsXG4gICAgICAgICAgICBpc286IGZhbHNlXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHJpbnRNc2cobXNnKSB7XG4gICAgICAgIGlmIChtb21lbnQuc3VwcHJlc3NEZXByZWNhdGlvbldhcm5pbmdzID09PSBmYWxzZSAmJlxuICAgICAgICAgICAgICAgIHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJyAmJiBjb25zb2xlLndhcm4pIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignRGVwcmVjYXRpb24gd2FybmluZzogJyArIG1zZyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkZXByZWNhdGUobXNnLCBmbikge1xuICAgICAgICB2YXIgZmlyc3RUaW1lID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGV4dGVuZChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoZmlyc3RUaW1lKSB7XG4gICAgICAgICAgICAgICAgcHJpbnRNc2cobXNnKTtcbiAgICAgICAgICAgICAgICBmaXJzdFRpbWUgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9LCBmbik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGVwcmVjYXRlU2ltcGxlKG5hbWUsIG1zZykge1xuICAgICAgICBpZiAoIWRlcHJlY2F0aW9uc1tuYW1lXSkge1xuICAgICAgICAgICAgcHJpbnRNc2cobXNnKTtcbiAgICAgICAgICAgIGRlcHJlY2F0aW9uc1tuYW1lXSA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYWRUb2tlbihmdW5jLCBjb3VudCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgICAgIHJldHVybiBsZWZ0WmVyb0ZpbGwoZnVuYy5jYWxsKHRoaXMsIGEpLCBjb3VudCk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGZ1bmN0aW9uIG9yZGluYWxpemVUb2tlbihmdW5jLCBwZXJpb2QpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChhKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkub3JkaW5hbChmdW5jLmNhbGwodGhpcywgYSksIHBlcmlvZCk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbW9udGhEaWZmKGEsIGIpIHtcbiAgICAgICAgLy8gZGlmZmVyZW5jZSBpbiBtb250aHNcbiAgICAgICAgdmFyIHdob2xlTW9udGhEaWZmID0gKChiLnllYXIoKSAtIGEueWVhcigpKSAqIDEyKSArIChiLm1vbnRoKCkgLSBhLm1vbnRoKCkpLFxuICAgICAgICAgICAgLy8gYiBpcyBpbiAoYW5jaG9yIC0gMSBtb250aCwgYW5jaG9yICsgMSBtb250aClcbiAgICAgICAgICAgIGFuY2hvciA9IGEuY2xvbmUoKS5hZGQod2hvbGVNb250aERpZmYsICdtb250aHMnKSxcbiAgICAgICAgICAgIGFuY2hvcjIsIGFkanVzdDtcblxuICAgICAgICBpZiAoYiAtIGFuY2hvciA8IDApIHtcbiAgICAgICAgICAgIGFuY2hvcjIgPSBhLmNsb25lKCkuYWRkKHdob2xlTW9udGhEaWZmIC0gMSwgJ21vbnRocycpO1xuICAgICAgICAgICAgLy8gbGluZWFyIGFjcm9zcyB0aGUgbW9udGhcbiAgICAgICAgICAgIGFkanVzdCA9IChiIC0gYW5jaG9yKSAvIChhbmNob3IgLSBhbmNob3IyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFuY2hvcjIgPSBhLmNsb25lKCkuYWRkKHdob2xlTW9udGhEaWZmICsgMSwgJ21vbnRocycpO1xuICAgICAgICAgICAgLy8gbGluZWFyIGFjcm9zcyB0aGUgbW9udGhcbiAgICAgICAgICAgIGFkanVzdCA9IChiIC0gYW5jaG9yKSAvIChhbmNob3IyIC0gYW5jaG9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAtKHdob2xlTW9udGhEaWZmICsgYWRqdXN0KTtcbiAgICB9XG5cbiAgICB3aGlsZSAob3JkaW5hbGl6ZVRva2Vucy5sZW5ndGgpIHtcbiAgICAgICAgaSA9IG9yZGluYWxpemVUb2tlbnMucG9wKCk7XG4gICAgICAgIGZvcm1hdFRva2VuRnVuY3Rpb25zW2kgKyAnbyddID0gb3JkaW5hbGl6ZVRva2VuKGZvcm1hdFRva2VuRnVuY3Rpb25zW2ldLCBpKTtcbiAgICB9XG4gICAgd2hpbGUgKHBhZGRlZFRva2Vucy5sZW5ndGgpIHtcbiAgICAgICAgaSA9IHBhZGRlZFRva2Vucy5wb3AoKTtcbiAgICAgICAgZm9ybWF0VG9rZW5GdW5jdGlvbnNbaSArIGldID0gcGFkVG9rZW4oZm9ybWF0VG9rZW5GdW5jdGlvbnNbaV0sIDIpO1xuICAgIH1cbiAgICBmb3JtYXRUb2tlbkZ1bmN0aW9ucy5EREREID0gcGFkVG9rZW4oZm9ybWF0VG9rZW5GdW5jdGlvbnMuRERELCAzKTtcblxuXG4gICAgZnVuY3Rpb24gbWVyaWRpZW1GaXhXcmFwKGxvY2FsZSwgaG91ciwgbWVyaWRpZW0pIHtcbiAgICAgICAgdmFyIGlzUG07XG5cbiAgICAgICAgaWYgKG1lcmlkaWVtID09IG51bGwpIHtcbiAgICAgICAgICAgIC8vIG5vdGhpbmcgdG8gZG9cbiAgICAgICAgICAgIHJldHVybiBob3VyO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsb2NhbGUubWVyaWRpZW1Ib3VyICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBsb2NhbGUubWVyaWRpZW1Ib3VyKGhvdXIsIG1lcmlkaWVtKTtcbiAgICAgICAgfSBlbHNlIGlmIChsb2NhbGUuaXNQTSAhPSBudWxsKSB7XG4gICAgICAgICAgICAvLyBGYWxsYmFja1xuICAgICAgICAgICAgaXNQbSA9IGxvY2FsZS5pc1BNKG1lcmlkaWVtKTtcbiAgICAgICAgICAgIGlmIChpc1BtICYmIGhvdXIgPCAxMikge1xuICAgICAgICAgICAgICAgIGhvdXIgKz0gMTI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWlzUG0gJiYgaG91ciA9PT0gMTIpIHtcbiAgICAgICAgICAgICAgICBob3VyID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBob3VyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gdGhpZSBpcyBub3Qgc3VwcG9zZWQgdG8gaGFwcGVuXG4gICAgICAgICAgICByZXR1cm4gaG91cjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgQ29uc3RydWN0b3JzXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgZnVuY3Rpb24gTG9jYWxlKCkge1xuICAgIH1cblxuICAgIC8vIE1vbWVudCBwcm90b3R5cGUgb2JqZWN0XG4gICAgZnVuY3Rpb24gTW9tZW50KGNvbmZpZywgc2tpcE92ZXJmbG93KSB7XG4gICAgICAgIGlmIChza2lwT3ZlcmZsb3cgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICBjaGVja092ZXJmbG93KGNvbmZpZyk7XG4gICAgICAgIH1cbiAgICAgICAgY29weUNvbmZpZyh0aGlzLCBjb25maWcpO1xuICAgICAgICB0aGlzLl9kID0gbmV3IERhdGUoK2NvbmZpZy5fZCk7XG4gICAgICAgIC8vIFByZXZlbnQgaW5maW5pdGUgbG9vcCBpbiBjYXNlIHVwZGF0ZU9mZnNldCBjcmVhdGVzIG5ldyBtb21lbnRcbiAgICAgICAgLy8gb2JqZWN0cy5cbiAgICAgICAgaWYgKHVwZGF0ZUluUHJvZ3Jlc3MgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICB1cGRhdGVJblByb2dyZXNzID0gdHJ1ZTtcbiAgICAgICAgICAgIG1vbWVudC51cGRhdGVPZmZzZXQodGhpcyk7XG4gICAgICAgICAgICB1cGRhdGVJblByb2dyZXNzID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBEdXJhdGlvbiBDb25zdHJ1Y3RvclxuICAgIGZ1bmN0aW9uIER1cmF0aW9uKGR1cmF0aW9uKSB7XG4gICAgICAgIHZhciBub3JtYWxpemVkSW5wdXQgPSBub3JtYWxpemVPYmplY3RVbml0cyhkdXJhdGlvbiksXG4gICAgICAgICAgICB5ZWFycyA9IG5vcm1hbGl6ZWRJbnB1dC55ZWFyIHx8IDAsXG4gICAgICAgICAgICBxdWFydGVycyA9IG5vcm1hbGl6ZWRJbnB1dC5xdWFydGVyIHx8IDAsXG4gICAgICAgICAgICBtb250aHMgPSBub3JtYWxpemVkSW5wdXQubW9udGggfHwgMCxcbiAgICAgICAgICAgIHdlZWtzID0gbm9ybWFsaXplZElucHV0LndlZWsgfHwgMCxcbiAgICAgICAgICAgIGRheXMgPSBub3JtYWxpemVkSW5wdXQuZGF5IHx8IDAsXG4gICAgICAgICAgICBob3VycyA9IG5vcm1hbGl6ZWRJbnB1dC5ob3VyIHx8IDAsXG4gICAgICAgICAgICBtaW51dGVzID0gbm9ybWFsaXplZElucHV0Lm1pbnV0ZSB8fCAwLFxuICAgICAgICAgICAgc2Vjb25kcyA9IG5vcm1hbGl6ZWRJbnB1dC5zZWNvbmQgfHwgMCxcbiAgICAgICAgICAgIG1pbGxpc2Vjb25kcyA9IG5vcm1hbGl6ZWRJbnB1dC5taWxsaXNlY29uZCB8fCAwO1xuXG4gICAgICAgIC8vIHJlcHJlc2VudGF0aW9uIGZvciBkYXRlQWRkUmVtb3ZlXG4gICAgICAgIHRoaXMuX21pbGxpc2Vjb25kcyA9ICttaWxsaXNlY29uZHMgK1xuICAgICAgICAgICAgc2Vjb25kcyAqIDFlMyArIC8vIDEwMDBcbiAgICAgICAgICAgIG1pbnV0ZXMgKiA2ZTQgKyAvLyAxMDAwICogNjBcbiAgICAgICAgICAgIGhvdXJzICogMzZlNTsgLy8gMTAwMCAqIDYwICogNjBcbiAgICAgICAgLy8gQmVjYXVzZSBvZiBkYXRlQWRkUmVtb3ZlIHRyZWF0cyAyNCBob3VycyBhcyBkaWZmZXJlbnQgZnJvbSBhXG4gICAgICAgIC8vIGRheSB3aGVuIHdvcmtpbmcgYXJvdW5kIERTVCwgd2UgbmVlZCB0byBzdG9yZSB0aGVtIHNlcGFyYXRlbHlcbiAgICAgICAgdGhpcy5fZGF5cyA9ICtkYXlzICtcbiAgICAgICAgICAgIHdlZWtzICogNztcbiAgICAgICAgLy8gSXQgaXMgaW1wb3NzaWJsZSB0cmFuc2xhdGUgbW9udGhzIGludG8gZGF5cyB3aXRob3V0IGtub3dpbmdcbiAgICAgICAgLy8gd2hpY2ggbW9udGhzIHlvdSBhcmUgYXJlIHRhbGtpbmcgYWJvdXQsIHNvIHdlIGhhdmUgdG8gc3RvcmVcbiAgICAgICAgLy8gaXQgc2VwYXJhdGVseS5cbiAgICAgICAgdGhpcy5fbW9udGhzID0gK21vbnRocyArXG4gICAgICAgICAgICBxdWFydGVycyAqIDMgK1xuICAgICAgICAgICAgeWVhcnMgKiAxMjtcblxuICAgICAgICB0aGlzLl9kYXRhID0ge307XG5cbiAgICAgICAgdGhpcy5fbG9jYWxlID0gbW9tZW50LmxvY2FsZURhdGEoKTtcblxuICAgICAgICB0aGlzLl9idWJibGUoKTtcbiAgICB9XG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIEhlbHBlcnNcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblxuICAgIGZ1bmN0aW9uIGV4dGVuZChhLCBiKSB7XG4gICAgICAgIGZvciAodmFyIGkgaW4gYikge1xuICAgICAgICAgICAgaWYgKGhhc093blByb3AoYiwgaSkpIHtcbiAgICAgICAgICAgICAgICBhW2ldID0gYltpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChoYXNPd25Qcm9wKGIsICd0b1N0cmluZycpKSB7XG4gICAgICAgICAgICBhLnRvU3RyaW5nID0gYi50b1N0cmluZztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChoYXNPd25Qcm9wKGIsICd2YWx1ZU9mJykpIHtcbiAgICAgICAgICAgIGEudmFsdWVPZiA9IGIudmFsdWVPZjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvcHlDb25maWcodG8sIGZyb20pIHtcbiAgICAgICAgdmFyIGksIHByb3AsIHZhbDtcblxuICAgICAgICBpZiAodHlwZW9mIGZyb20uX2lzQU1vbWVudE9iamVjdCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRvLl9pc0FNb21lbnRPYmplY3QgPSBmcm9tLl9pc0FNb21lbnRPYmplY3Q7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBmcm9tLl9pICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdG8uX2kgPSBmcm9tLl9pO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgZnJvbS5fZiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRvLl9mID0gZnJvbS5fZjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGZyb20uX2wgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0by5fbCA9IGZyb20uX2w7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBmcm9tLl9zdHJpY3QgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0by5fc3RyaWN0ID0gZnJvbS5fc3RyaWN0O1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgZnJvbS5fdHptICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdG8uX3R6bSA9IGZyb20uX3R6bTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGZyb20uX2lzVVRDICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdG8uX2lzVVRDID0gZnJvbS5faXNVVEM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBmcm9tLl9vZmZzZXQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0by5fb2Zmc2V0ID0gZnJvbS5fb2Zmc2V0O1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgZnJvbS5fcGYgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0by5fcGYgPSBmcm9tLl9wZjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGZyb20uX2xvY2FsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRvLl9sb2NhbGUgPSBmcm9tLl9sb2NhbGU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobW9tZW50UHJvcGVydGllcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBmb3IgKGkgaW4gbW9tZW50UHJvcGVydGllcykge1xuICAgICAgICAgICAgICAgIHByb3AgPSBtb21lbnRQcm9wZXJ0aWVzW2ldO1xuICAgICAgICAgICAgICAgIHZhbCA9IGZyb21bcHJvcF07XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvW3Byb3BdID0gdmFsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0bztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhYnNSb3VuZChudW1iZXIpIHtcbiAgICAgICAgaWYgKG51bWJlciA8IDApIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmNlaWwobnVtYmVyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmZsb29yKG51bWJlcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBsZWZ0IHplcm8gZmlsbCBhIG51bWJlclxuICAgIC8vIHNlZSBodHRwOi8vanNwZXJmLmNvbS9sZWZ0LXplcm8tZmlsbGluZyBmb3IgcGVyZm9ybWFuY2UgY29tcGFyaXNvblxuICAgIGZ1bmN0aW9uIGxlZnRaZXJvRmlsbChudW1iZXIsIHRhcmdldExlbmd0aCwgZm9yY2VTaWduKSB7XG4gICAgICAgIHZhciBvdXRwdXQgPSAnJyArIE1hdGguYWJzKG51bWJlciksXG4gICAgICAgICAgICBzaWduID0gbnVtYmVyID49IDA7XG5cbiAgICAgICAgd2hpbGUgKG91dHB1dC5sZW5ndGggPCB0YXJnZXRMZW5ndGgpIHtcbiAgICAgICAgICAgIG91dHB1dCA9ICcwJyArIG91dHB1dDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKHNpZ24gPyAoZm9yY2VTaWduID8gJysnIDogJycpIDogJy0nKSArIG91dHB1dDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwb3NpdGl2ZU1vbWVudHNEaWZmZXJlbmNlKGJhc2UsIG90aGVyKSB7XG4gICAgICAgIHZhciByZXMgPSB7bWlsbGlzZWNvbmRzOiAwLCBtb250aHM6IDB9O1xuXG4gICAgICAgIHJlcy5tb250aHMgPSBvdGhlci5tb250aCgpIC0gYmFzZS5tb250aCgpICtcbiAgICAgICAgICAgIChvdGhlci55ZWFyKCkgLSBiYXNlLnllYXIoKSkgKiAxMjtcbiAgICAgICAgaWYgKGJhc2UuY2xvbmUoKS5hZGQocmVzLm1vbnRocywgJ00nKS5pc0FmdGVyKG90aGVyKSkge1xuICAgICAgICAgICAgLS1yZXMubW9udGhzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzLm1pbGxpc2Vjb25kcyA9ICtvdGhlciAtICsoYmFzZS5jbG9uZSgpLmFkZChyZXMubW9udGhzLCAnTScpKTtcblxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1vbWVudHNEaWZmZXJlbmNlKGJhc2UsIG90aGVyKSB7XG4gICAgICAgIHZhciByZXM7XG4gICAgICAgIG90aGVyID0gbWFrZUFzKG90aGVyLCBiYXNlKTtcbiAgICAgICAgaWYgKGJhc2UuaXNCZWZvcmUob3RoZXIpKSB7XG4gICAgICAgICAgICByZXMgPSBwb3NpdGl2ZU1vbWVudHNEaWZmZXJlbmNlKGJhc2UsIG90aGVyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlcyA9IHBvc2l0aXZlTW9tZW50c0RpZmZlcmVuY2Uob3RoZXIsIGJhc2UpO1xuICAgICAgICAgICAgcmVzLm1pbGxpc2Vjb25kcyA9IC1yZXMubWlsbGlzZWNvbmRzO1xuICAgICAgICAgICAgcmVzLm1vbnRocyA9IC1yZXMubW9udGhzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG5cbiAgICAvLyBUT0RPOiByZW1vdmUgJ25hbWUnIGFyZyBhZnRlciBkZXByZWNhdGlvbiBpcyByZW1vdmVkXG4gICAgZnVuY3Rpb24gY3JlYXRlQWRkZXIoZGlyZWN0aW9uLCBuYW1lKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAodmFsLCBwZXJpb2QpIHtcbiAgICAgICAgICAgIHZhciBkdXIsIHRtcDtcbiAgICAgICAgICAgIC8vaW52ZXJ0IHRoZSBhcmd1bWVudHMsIGJ1dCBjb21wbGFpbiBhYm91dCBpdFxuICAgICAgICAgICAgaWYgKHBlcmlvZCAhPT0gbnVsbCAmJiAhaXNOYU4oK3BlcmlvZCkpIHtcbiAgICAgICAgICAgICAgICBkZXByZWNhdGVTaW1wbGUobmFtZSwgJ21vbWVudCgpLicgKyBuYW1lICArICcocGVyaW9kLCBudW1iZXIpIGlzIGRlcHJlY2F0ZWQuIFBsZWFzZSB1c2UgbW9tZW50KCkuJyArIG5hbWUgKyAnKG51bWJlciwgcGVyaW9kKS4nKTtcbiAgICAgICAgICAgICAgICB0bXAgPSB2YWw7IHZhbCA9IHBlcmlvZDsgcGVyaW9kID0gdG1wO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YWwgPSB0eXBlb2YgdmFsID09PSAnc3RyaW5nJyA/ICt2YWwgOiB2YWw7XG4gICAgICAgICAgICBkdXIgPSBtb21lbnQuZHVyYXRpb24odmFsLCBwZXJpb2QpO1xuICAgICAgICAgICAgYWRkT3JTdWJ0cmFjdER1cmF0aW9uRnJvbU1vbWVudCh0aGlzLCBkdXIsIGRpcmVjdGlvbik7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhZGRPclN1YnRyYWN0RHVyYXRpb25Gcm9tTW9tZW50KG1vbSwgZHVyYXRpb24sIGlzQWRkaW5nLCB1cGRhdGVPZmZzZXQpIHtcbiAgICAgICAgdmFyIG1pbGxpc2Vjb25kcyA9IGR1cmF0aW9uLl9taWxsaXNlY29uZHMsXG4gICAgICAgICAgICBkYXlzID0gZHVyYXRpb24uX2RheXMsXG4gICAgICAgICAgICBtb250aHMgPSBkdXJhdGlvbi5fbW9udGhzO1xuICAgICAgICB1cGRhdGVPZmZzZXQgPSB1cGRhdGVPZmZzZXQgPT0gbnVsbCA/IHRydWUgOiB1cGRhdGVPZmZzZXQ7XG5cbiAgICAgICAgaWYgKG1pbGxpc2Vjb25kcykge1xuICAgICAgICAgICAgbW9tLl9kLnNldFRpbWUoK21vbS5fZCArIG1pbGxpc2Vjb25kcyAqIGlzQWRkaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGF5cykge1xuICAgICAgICAgICAgcmF3U2V0dGVyKG1vbSwgJ0RhdGUnLCByYXdHZXR0ZXIobW9tLCAnRGF0ZScpICsgZGF5cyAqIGlzQWRkaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobW9udGhzKSB7XG4gICAgICAgICAgICByYXdNb250aFNldHRlcihtb20sIHJhd0dldHRlcihtb20sICdNb250aCcpICsgbW9udGhzICogaXNBZGRpbmcpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh1cGRhdGVPZmZzZXQpIHtcbiAgICAgICAgICAgIG1vbWVudC51cGRhdGVPZmZzZXQobW9tLCBkYXlzIHx8IG1vbnRocyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBjaGVjayBpZiBpcyBhbiBhcnJheVxuICAgIGZ1bmN0aW9uIGlzQXJyYXkoaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChpbnB1dCkgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNEYXRlKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoaW5wdXQpID09PSAnW29iamVjdCBEYXRlXScgfHxcbiAgICAgICAgICAgIGlucHV0IGluc3RhbmNlb2YgRGF0ZTtcbiAgICB9XG5cbiAgICAvLyBjb21wYXJlIHR3byBhcnJheXMsIHJldHVybiB0aGUgbnVtYmVyIG9mIGRpZmZlcmVuY2VzXG4gICAgZnVuY3Rpb24gY29tcGFyZUFycmF5cyhhcnJheTEsIGFycmF5MiwgZG9udENvbnZlcnQpIHtcbiAgICAgICAgdmFyIGxlbiA9IE1hdGgubWluKGFycmF5MS5sZW5ndGgsIGFycmF5Mi5sZW5ndGgpLFxuICAgICAgICAgICAgbGVuZ3RoRGlmZiA9IE1hdGguYWJzKGFycmF5MS5sZW5ndGggLSBhcnJheTIubGVuZ3RoKSxcbiAgICAgICAgICAgIGRpZmZzID0gMCxcbiAgICAgICAgICAgIGk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgaWYgKChkb250Q29udmVydCAmJiBhcnJheTFbaV0gIT09IGFycmF5MltpXSkgfHxcbiAgICAgICAgICAgICAgICAoIWRvbnRDb252ZXJ0ICYmIHRvSW50KGFycmF5MVtpXSkgIT09IHRvSW50KGFycmF5MltpXSkpKSB7XG4gICAgICAgICAgICAgICAgZGlmZnMrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGlmZnMgKyBsZW5ndGhEaWZmO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZVVuaXRzKHVuaXRzKSB7XG4gICAgICAgIGlmICh1bml0cykge1xuICAgICAgICAgICAgdmFyIGxvd2VyZWQgPSB1bml0cy50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoLyguKXMkLywgJyQxJyk7XG4gICAgICAgICAgICB1bml0cyA9IHVuaXRBbGlhc2VzW3VuaXRzXSB8fCBjYW1lbEZ1bmN0aW9uc1tsb3dlcmVkXSB8fCBsb3dlcmVkO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bml0cztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBub3JtYWxpemVPYmplY3RVbml0cyhpbnB1dE9iamVjdCkge1xuICAgICAgICB2YXIgbm9ybWFsaXplZElucHV0ID0ge30sXG4gICAgICAgICAgICBub3JtYWxpemVkUHJvcCxcbiAgICAgICAgICAgIHByb3A7XG5cbiAgICAgICAgZm9yIChwcm9wIGluIGlucHV0T2JqZWN0KSB7XG4gICAgICAgICAgICBpZiAoaGFzT3duUHJvcChpbnB1dE9iamVjdCwgcHJvcCkpIHtcbiAgICAgICAgICAgICAgICBub3JtYWxpemVkUHJvcCA9IG5vcm1hbGl6ZVVuaXRzKHByb3ApO1xuICAgICAgICAgICAgICAgIGlmIChub3JtYWxpemVkUHJvcCkge1xuICAgICAgICAgICAgICAgICAgICBub3JtYWxpemVkSW5wdXRbbm9ybWFsaXplZFByb3BdID0gaW5wdXRPYmplY3RbcHJvcF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5vcm1hbGl6ZWRJbnB1dDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYWtlTGlzdChmaWVsZCkge1xuICAgICAgICB2YXIgY291bnQsIHNldHRlcjtcblxuICAgICAgICBpZiAoZmllbGQuaW5kZXhPZignd2VlaycpID09PSAwKSB7XG4gICAgICAgICAgICBjb3VudCA9IDc7XG4gICAgICAgICAgICBzZXR0ZXIgPSAnZGF5JztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChmaWVsZC5pbmRleE9mKCdtb250aCcpID09PSAwKSB7XG4gICAgICAgICAgICBjb3VudCA9IDEyO1xuICAgICAgICAgICAgc2V0dGVyID0gJ21vbnRoJztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIG1vbWVudFtmaWVsZF0gPSBmdW5jdGlvbiAoZm9ybWF0LCBpbmRleCkge1xuICAgICAgICAgICAgdmFyIGksIGdldHRlcixcbiAgICAgICAgICAgICAgICBtZXRob2QgPSBtb21lbnQuX2xvY2FsZVtmaWVsZF0sXG4gICAgICAgICAgICAgICAgcmVzdWx0cyA9IFtdO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIGZvcm1hdCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICBpbmRleCA9IGZvcm1hdDtcbiAgICAgICAgICAgICAgICBmb3JtYXQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGdldHRlciA9IGZ1bmN0aW9uIChpKSB7XG4gICAgICAgICAgICAgICAgdmFyIG0gPSBtb21lbnQoKS51dGMoKS5zZXQoc2V0dGVyLCBpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWV0aG9kLmNhbGwobW9tZW50Ll9sb2NhbGUsIG0sIGZvcm1hdCB8fCAnJyk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAoaW5kZXggIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBnZXR0ZXIoaW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGdldHRlcihpKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRvSW50KGFyZ3VtZW50Rm9yQ29lcmNpb24pIHtcbiAgICAgICAgdmFyIGNvZXJjZWROdW1iZXIgPSArYXJndW1lbnRGb3JDb2VyY2lvbixcbiAgICAgICAgICAgIHZhbHVlID0gMDtcblxuICAgICAgICBpZiAoY29lcmNlZE51bWJlciAhPT0gMCAmJiBpc0Zpbml0ZShjb2VyY2VkTnVtYmVyKSkge1xuICAgICAgICAgICAgaWYgKGNvZXJjZWROdW1iZXIgPj0gMCkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gTWF0aC5mbG9vcihjb2VyY2VkTnVtYmVyKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBNYXRoLmNlaWwoY29lcmNlZE51bWJlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGF5c0luTW9udGgoeWVhciwgbW9udGgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlKERhdGUuVVRDKHllYXIsIG1vbnRoICsgMSwgMCkpLmdldFVUQ0RhdGUoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB3ZWVrc0luWWVhcih5ZWFyLCBkb3csIGRveSkge1xuICAgICAgICByZXR1cm4gd2Vla09mWWVhcihtb21lbnQoW3llYXIsIDExLCAzMSArIGRvdyAtIGRveV0pLCBkb3csIGRveSkud2VlaztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkYXlzSW5ZZWFyKHllYXIpIHtcbiAgICAgICAgcmV0dXJuIGlzTGVhcFllYXIoeWVhcikgPyAzNjYgOiAzNjU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNMZWFwWWVhcih5ZWFyKSB7XG4gICAgICAgIHJldHVybiAoeWVhciAlIDQgPT09IDAgJiYgeWVhciAlIDEwMCAhPT0gMCkgfHwgeWVhciAlIDQwMCA9PT0gMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjaGVja092ZXJmbG93KG0pIHtcbiAgICAgICAgdmFyIG92ZXJmbG93O1xuICAgICAgICBpZiAobS5fYSAmJiBtLl9wZi5vdmVyZmxvdyA9PT0gLTIpIHtcbiAgICAgICAgICAgIG92ZXJmbG93ID1cbiAgICAgICAgICAgICAgICBtLl9hW01PTlRIXSA8IDAgfHwgbS5fYVtNT05USF0gPiAxMSA/IE1PTlRIIDpcbiAgICAgICAgICAgICAgICBtLl9hW0RBVEVdIDwgMSB8fCBtLl9hW0RBVEVdID4gZGF5c0luTW9udGgobS5fYVtZRUFSXSwgbS5fYVtNT05USF0pID8gREFURSA6XG4gICAgICAgICAgICAgICAgbS5fYVtIT1VSXSA8IDAgfHwgbS5fYVtIT1VSXSA+IDI0IHx8XG4gICAgICAgICAgICAgICAgICAgIChtLl9hW0hPVVJdID09PSAyNCAmJiAobS5fYVtNSU5VVEVdICE9PSAwIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbS5fYVtTRUNPTkRdICE9PSAwIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbS5fYVtNSUxMSVNFQ09ORF0gIT09IDApKSA/IEhPVVIgOlxuICAgICAgICAgICAgICAgIG0uX2FbTUlOVVRFXSA8IDAgfHwgbS5fYVtNSU5VVEVdID4gNTkgPyBNSU5VVEUgOlxuICAgICAgICAgICAgICAgIG0uX2FbU0VDT05EXSA8IDAgfHwgbS5fYVtTRUNPTkRdID4gNTkgPyBTRUNPTkQgOlxuICAgICAgICAgICAgICAgIG0uX2FbTUlMTElTRUNPTkRdIDwgMCB8fCBtLl9hW01JTExJU0VDT05EXSA+IDk5OSA/IE1JTExJU0VDT05EIDpcbiAgICAgICAgICAgICAgICAtMTtcblxuICAgICAgICAgICAgaWYgKG0uX3BmLl9vdmVyZmxvd0RheU9mWWVhciAmJiAob3ZlcmZsb3cgPCBZRUFSIHx8IG92ZXJmbG93ID4gREFURSkpIHtcbiAgICAgICAgICAgICAgICBvdmVyZmxvdyA9IERBVEU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG0uX3BmLm92ZXJmbG93ID0gb3ZlcmZsb3c7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc1ZhbGlkKG0pIHtcbiAgICAgICAgaWYgKG0uX2lzVmFsaWQgPT0gbnVsbCkge1xuICAgICAgICAgICAgbS5faXNWYWxpZCA9ICFpc05hTihtLl9kLmdldFRpbWUoKSkgJiZcbiAgICAgICAgICAgICAgICBtLl9wZi5vdmVyZmxvdyA8IDAgJiZcbiAgICAgICAgICAgICAgICAhbS5fcGYuZW1wdHkgJiZcbiAgICAgICAgICAgICAgICAhbS5fcGYuaW52YWxpZE1vbnRoICYmXG4gICAgICAgICAgICAgICAgIW0uX3BmLm51bGxJbnB1dCAmJlxuICAgICAgICAgICAgICAgICFtLl9wZi5pbnZhbGlkRm9ybWF0ICYmXG4gICAgICAgICAgICAgICAgIW0uX3BmLnVzZXJJbnZhbGlkYXRlZDtcblxuICAgICAgICAgICAgaWYgKG0uX3N0cmljdCkge1xuICAgICAgICAgICAgICAgIG0uX2lzVmFsaWQgPSBtLl9pc1ZhbGlkICYmXG4gICAgICAgICAgICAgICAgICAgIG0uX3BmLmNoYXJzTGVmdE92ZXIgPT09IDAgJiZcbiAgICAgICAgICAgICAgICAgICAgbS5fcGYudW51c2VkVG9rZW5zLmxlbmd0aCA9PT0gMCAmJlxuICAgICAgICAgICAgICAgICAgICBtLl9wZi5iaWdIb3VyID09PSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG0uX2lzVmFsaWQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbm9ybWFsaXplTG9jYWxlKGtleSkge1xuICAgICAgICByZXR1cm4ga2V5ID8ga2V5LnRvTG93ZXJDYXNlKCkucmVwbGFjZSgnXycsICctJykgOiBrZXk7XG4gICAgfVxuXG4gICAgLy8gcGljayB0aGUgbG9jYWxlIGZyb20gdGhlIGFycmF5XG4gICAgLy8gdHJ5IFsnZW4tYXUnLCAnZW4tZ2InXSBhcyAnZW4tYXUnLCAnZW4tZ2InLCAnZW4nLCBhcyBpbiBtb3ZlIHRocm91Z2ggdGhlIGxpc3QgdHJ5aW5nIGVhY2hcbiAgICAvLyBzdWJzdHJpbmcgZnJvbSBtb3N0IHNwZWNpZmljIHRvIGxlYXN0LCBidXQgbW92ZSB0byB0aGUgbmV4dCBhcnJheSBpdGVtIGlmIGl0J3MgYSBtb3JlIHNwZWNpZmljIHZhcmlhbnQgdGhhbiB0aGUgY3VycmVudCByb290XG4gICAgZnVuY3Rpb24gY2hvb3NlTG9jYWxlKG5hbWVzKSB7XG4gICAgICAgIHZhciBpID0gMCwgaiwgbmV4dCwgbG9jYWxlLCBzcGxpdDtcblxuICAgICAgICB3aGlsZSAoaSA8IG5hbWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgc3BsaXQgPSBub3JtYWxpemVMb2NhbGUobmFtZXNbaV0pLnNwbGl0KCctJyk7XG4gICAgICAgICAgICBqID0gc3BsaXQubGVuZ3RoO1xuICAgICAgICAgICAgbmV4dCA9IG5vcm1hbGl6ZUxvY2FsZShuYW1lc1tpICsgMV0pO1xuICAgICAgICAgICAgbmV4dCA9IG5leHQgPyBuZXh0LnNwbGl0KCctJykgOiBudWxsO1xuICAgICAgICAgICAgd2hpbGUgKGogPiAwKSB7XG4gICAgICAgICAgICAgICAgbG9jYWxlID0gbG9hZExvY2FsZShzcGxpdC5zbGljZSgwLCBqKS5qb2luKCctJykpO1xuICAgICAgICAgICAgICAgIGlmIChsb2NhbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxvY2FsZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG5leHQgJiYgbmV4dC5sZW5ndGggPj0gaiAmJiBjb21wYXJlQXJyYXlzKHNwbGl0LCBuZXh0LCB0cnVlKSA+PSBqIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICAvL3RoZSBuZXh0IGFycmF5IGl0ZW0gaXMgYmV0dGVyIHRoYW4gYSBzaGFsbG93ZXIgc3Vic3RyaW5nIG9mIHRoaXMgb25lXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBqLS07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbG9hZExvY2FsZShuYW1lKSB7XG4gICAgICAgIHZhciBvbGRMb2NhbGUgPSBudWxsO1xuICAgICAgICBpZiAoIWxvY2FsZXNbbmFtZV0gJiYgaGFzTW9kdWxlKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIG9sZExvY2FsZSA9IG1vbWVudC5sb2NhbGUoKTtcbiAgICAgICAgICAgICAgICByZXF1aXJlKCcuL2xvY2FsZS8nICsgbmFtZSk7XG4gICAgICAgICAgICAgICAgLy8gYmVjYXVzZSBkZWZpbmVMb2NhbGUgY3VycmVudGx5IGFsc28gc2V0cyB0aGUgZ2xvYmFsIGxvY2FsZSwgd2Ugd2FudCB0byB1bmRvIHRoYXQgZm9yIGxhenkgbG9hZGVkIGxvY2FsZXNcbiAgICAgICAgICAgICAgICBtb21lbnQubG9jYWxlKG9sZExvY2FsZSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7IH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbG9jYWxlc1tuYW1lXTtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gYSBtb21lbnQgZnJvbSBpbnB1dCwgdGhhdCBpcyBsb2NhbC91dGMvdXRjT2Zmc2V0IGVxdWl2YWxlbnQgdG9cbiAgICAvLyBtb2RlbC5cbiAgICBmdW5jdGlvbiBtYWtlQXMoaW5wdXQsIG1vZGVsKSB7XG4gICAgICAgIHZhciByZXMsIGRpZmY7XG4gICAgICAgIGlmIChtb2RlbC5faXNVVEMpIHtcbiAgICAgICAgICAgIHJlcyA9IG1vZGVsLmNsb25lKCk7XG4gICAgICAgICAgICBkaWZmID0gKG1vbWVudC5pc01vbWVudChpbnB1dCkgfHwgaXNEYXRlKGlucHV0KSA/XG4gICAgICAgICAgICAgICAgICAgICtpbnB1dCA6ICttb21lbnQoaW5wdXQpKSAtICgrcmVzKTtcbiAgICAgICAgICAgIC8vIFVzZSBsb3ctbGV2ZWwgYXBpLCBiZWNhdXNlIHRoaXMgZm4gaXMgbG93LWxldmVsIGFwaS5cbiAgICAgICAgICAgIHJlcy5fZC5zZXRUaW1lKCtyZXMuX2QgKyBkaWZmKTtcbiAgICAgICAgICAgIG1vbWVudC51cGRhdGVPZmZzZXQocmVzLCBmYWxzZSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG1vbWVudChpbnB1dCkubG9jYWwoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgTG9jYWxlXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cbiAgICBleHRlbmQoTG9jYWxlLnByb3RvdHlwZSwge1xuXG4gICAgICAgIHNldCA6IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICAgICAgICAgIHZhciBwcm9wLCBpO1xuICAgICAgICAgICAgZm9yIChpIGluIGNvbmZpZykge1xuICAgICAgICAgICAgICAgIHByb3AgPSBjb25maWdbaV07XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBwcm9wID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXNbaV0gPSBwcm9wO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXNbJ18nICsgaV0gPSBwcm9wO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIExlbmllbnQgb3JkaW5hbCBwYXJzaW5nIGFjY2VwdHMganVzdCBhIG51bWJlciBpbiBhZGRpdGlvbiB0b1xuICAgICAgICAgICAgLy8gbnVtYmVyICsgKHBvc3NpYmx5KSBzdHVmZiBjb21pbmcgZnJvbSBfb3JkaW5hbFBhcnNlTGVuaWVudC5cbiAgICAgICAgICAgIHRoaXMuX29yZGluYWxQYXJzZUxlbmllbnQgPSBuZXcgUmVnRXhwKHRoaXMuX29yZGluYWxQYXJzZS5zb3VyY2UgKyAnfCcgKyAvXFxkezEsMn0vLnNvdXJjZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX21vbnRocyA6ICdKYW51YXJ5X0ZlYnJ1YXJ5X01hcmNoX0FwcmlsX01heV9KdW5lX0p1bHlfQXVndXN0X1NlcHRlbWJlcl9PY3RvYmVyX05vdmVtYmVyX0RlY2VtYmVyJy5zcGxpdCgnXycpLFxuICAgICAgICBtb250aHMgOiBmdW5jdGlvbiAobSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21vbnRoc1ttLm1vbnRoKCldO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9tb250aHNTaG9ydCA6ICdKYW5fRmViX01hcl9BcHJfTWF5X0p1bl9KdWxfQXVnX1NlcF9PY3RfTm92X0RlYycuc3BsaXQoJ18nKSxcbiAgICAgICAgbW9udGhzU2hvcnQgOiBmdW5jdGlvbiAobSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21vbnRoc1Nob3J0W20ubW9udGgoKV07XG4gICAgICAgIH0sXG5cbiAgICAgICAgbW9udGhzUGFyc2UgOiBmdW5jdGlvbiAobW9udGhOYW1lLCBmb3JtYXQsIHN0cmljdCkge1xuICAgICAgICAgICAgdmFyIGksIG1vbSwgcmVnZXg7XG5cbiAgICAgICAgICAgIGlmICghdGhpcy5fbW9udGhzUGFyc2UpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9tb250aHNQYXJzZSA9IFtdO1xuICAgICAgICAgICAgICAgIHRoaXMuX2xvbmdNb250aHNQYXJzZSA9IFtdO1xuICAgICAgICAgICAgICAgIHRoaXMuX3Nob3J0TW9udGhzUGFyc2UgPSBbXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IDEyOyBpKyspIHtcbiAgICAgICAgICAgICAgICAvLyBtYWtlIHRoZSByZWdleCBpZiB3ZSBkb24ndCBoYXZlIGl0IGFscmVhZHlcbiAgICAgICAgICAgICAgICBtb20gPSBtb21lbnQudXRjKFsyMDAwLCBpXSk7XG4gICAgICAgICAgICAgICAgaWYgKHN0cmljdCAmJiAhdGhpcy5fbG9uZ01vbnRoc1BhcnNlW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2xvbmdNb250aHNQYXJzZVtpXSA9IG5ldyBSZWdFeHAoJ14nICsgdGhpcy5tb250aHMobW9tLCAnJykucmVwbGFjZSgnLicsICcnKSArICckJywgJ2knKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2hvcnRNb250aHNQYXJzZVtpXSA9IG5ldyBSZWdFeHAoJ14nICsgdGhpcy5tb250aHNTaG9ydChtb20sICcnKS5yZXBsYWNlKCcuJywgJycpICsgJyQnLCAnaScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIXN0cmljdCAmJiAhdGhpcy5fbW9udGhzUGFyc2VbaV0pIHtcbiAgICAgICAgICAgICAgICAgICAgcmVnZXggPSAnXicgKyB0aGlzLm1vbnRocyhtb20sICcnKSArICd8XicgKyB0aGlzLm1vbnRoc1Nob3J0KG1vbSwgJycpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9tb250aHNQYXJzZVtpXSA9IG5ldyBSZWdFeHAocmVnZXgucmVwbGFjZSgnLicsICcnKSwgJ2knKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gdGVzdCB0aGUgcmVnZXhcbiAgICAgICAgICAgICAgICBpZiAoc3RyaWN0ICYmIGZvcm1hdCA9PT0gJ01NTU0nICYmIHRoaXMuX2xvbmdNb250aHNQYXJzZVtpXS50ZXN0KG1vbnRoTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzdHJpY3QgJiYgZm9ybWF0ID09PSAnTU1NJyAmJiB0aGlzLl9zaG9ydE1vbnRoc1BhcnNlW2ldLnRlc3QobW9udGhOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFzdHJpY3QgJiYgdGhpcy5fbW9udGhzUGFyc2VbaV0udGVzdChtb250aE5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBfd2Vla2RheXMgOiAnU3VuZGF5X01vbmRheV9UdWVzZGF5X1dlZG5lc2RheV9UaHVyc2RheV9GcmlkYXlfU2F0dXJkYXknLnNwbGl0KCdfJyksXG4gICAgICAgIHdlZWtkYXlzIDogZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl93ZWVrZGF5c1ttLmRheSgpXTtcbiAgICAgICAgfSxcblxuICAgICAgICBfd2Vla2RheXNTaG9ydCA6ICdTdW5fTW9uX1R1ZV9XZWRfVGh1X0ZyaV9TYXQnLnNwbGl0KCdfJyksXG4gICAgICAgIHdlZWtkYXlzU2hvcnQgOiBmdW5jdGlvbiAobSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzU2hvcnRbbS5kYXkoKV07XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3dlZWtkYXlzTWluIDogJ1N1X01vX1R1X1dlX1RoX0ZyX1NhJy5zcGxpdCgnXycpLFxuICAgICAgICB3ZWVrZGF5c01pbiA6IGZ1bmN0aW9uIChtKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fd2Vla2RheXNNaW5bbS5kYXkoKV07XG4gICAgICAgIH0sXG5cbiAgICAgICAgd2Vla2RheXNQYXJzZSA6IGZ1bmN0aW9uICh3ZWVrZGF5TmFtZSkge1xuICAgICAgICAgICAgdmFyIGksIG1vbSwgcmVnZXg7XG5cbiAgICAgICAgICAgIGlmICghdGhpcy5fd2Vla2RheXNQYXJzZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3dlZWtkYXlzUGFyc2UgPSBbXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IDc7IGkrKykge1xuICAgICAgICAgICAgICAgIC8vIG1ha2UgdGhlIHJlZ2V4IGlmIHdlIGRvbid0IGhhdmUgaXQgYWxyZWFkeVxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fd2Vla2RheXNQYXJzZVtpXSkge1xuICAgICAgICAgICAgICAgICAgICBtb20gPSBtb21lbnQoWzIwMDAsIDFdKS5kYXkoaSk7XG4gICAgICAgICAgICAgICAgICAgIHJlZ2V4ID0gJ14nICsgdGhpcy53ZWVrZGF5cyhtb20sICcnKSArICd8XicgKyB0aGlzLndlZWtkYXlzU2hvcnQobW9tLCAnJykgKyAnfF4nICsgdGhpcy53ZWVrZGF5c01pbihtb20sICcnKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fd2Vla2RheXNQYXJzZVtpXSA9IG5ldyBSZWdFeHAocmVnZXgucmVwbGFjZSgnLicsICcnKSwgJ2knKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gdGVzdCB0aGUgcmVnZXhcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fd2Vla2RheXNQYXJzZVtpXS50ZXN0KHdlZWtkYXlOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2xvbmdEYXRlRm9ybWF0IDoge1xuICAgICAgICAgICAgTFRTIDogJ2g6bW06c3MgQScsXG4gICAgICAgICAgICBMVCA6ICdoOm1tIEEnLFxuICAgICAgICAgICAgTCA6ICdNTS9ERC9ZWVlZJyxcbiAgICAgICAgICAgIExMIDogJ01NTU0gRCwgWVlZWScsXG4gICAgICAgICAgICBMTEwgOiAnTU1NTSBELCBZWVlZIExUJyxcbiAgICAgICAgICAgIExMTEwgOiAnZGRkZCwgTU1NTSBELCBZWVlZIExUJ1xuICAgICAgICB9LFxuICAgICAgICBsb25nRGF0ZUZvcm1hdCA6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHZhciBvdXRwdXQgPSB0aGlzLl9sb25nRGF0ZUZvcm1hdFtrZXldO1xuICAgICAgICAgICAgaWYgKCFvdXRwdXQgJiYgdGhpcy5fbG9uZ0RhdGVGb3JtYXRba2V5LnRvVXBwZXJDYXNlKCldKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gdGhpcy5fbG9uZ0RhdGVGb3JtYXRba2V5LnRvVXBwZXJDYXNlKCldLnJlcGxhY2UoL01NTU18TU18RER8ZGRkZC9nLCBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWwuc2xpY2UoMSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbG9uZ0RhdGVGb3JtYXRba2V5XSA9IG91dHB1dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNQTSA6IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgLy8gSUU4IFF1aXJrcyBNb2RlICYgSUU3IFN0YW5kYXJkcyBNb2RlIGRvIG5vdCBhbGxvdyBhY2Nlc3Npbmcgc3RyaW5ncyBsaWtlIGFycmF5c1xuICAgICAgICAgICAgLy8gVXNpbmcgY2hhckF0IHNob3VsZCBiZSBtb3JlIGNvbXBhdGlibGUuXG4gICAgICAgICAgICByZXR1cm4gKChpbnB1dCArICcnKS50b0xvd2VyQ2FzZSgpLmNoYXJBdCgwKSA9PT0gJ3AnKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfbWVyaWRpZW1QYXJzZSA6IC9bYXBdXFwuP20/XFwuPy9pLFxuICAgICAgICBtZXJpZGllbSA6IGZ1bmN0aW9uIChob3VycywgbWludXRlcywgaXNMb3dlcikge1xuICAgICAgICAgICAgaWYgKGhvdXJzID4gMTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaXNMb3dlciA/ICdwbScgOiAnUE0nO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaXNMb3dlciA/ICdhbScgOiAnQU0nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG5cbiAgICAgICAgX2NhbGVuZGFyIDoge1xuICAgICAgICAgICAgc2FtZURheSA6ICdbVG9kYXkgYXRdIExUJyxcbiAgICAgICAgICAgIG5leHREYXkgOiAnW1RvbW9ycm93IGF0XSBMVCcsXG4gICAgICAgICAgICBuZXh0V2VlayA6ICdkZGRkIFthdF0gTFQnLFxuICAgICAgICAgICAgbGFzdERheSA6ICdbWWVzdGVyZGF5IGF0XSBMVCcsXG4gICAgICAgICAgICBsYXN0V2VlayA6ICdbTGFzdF0gZGRkZCBbYXRdIExUJyxcbiAgICAgICAgICAgIHNhbWVFbHNlIDogJ0wnXG4gICAgICAgIH0sXG4gICAgICAgIGNhbGVuZGFyIDogZnVuY3Rpb24gKGtleSwgbW9tLCBub3cpIHtcbiAgICAgICAgICAgIHZhciBvdXRwdXQgPSB0aGlzLl9jYWxlbmRhcltrZXldO1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiBvdXRwdXQgPT09ICdmdW5jdGlvbicgPyBvdXRwdXQuYXBwbHkobW9tLCBbbm93XSkgOiBvdXRwdXQ7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3JlbGF0aXZlVGltZSA6IHtcbiAgICAgICAgICAgIGZ1dHVyZSA6ICdpbiAlcycsXG4gICAgICAgICAgICBwYXN0IDogJyVzIGFnbycsXG4gICAgICAgICAgICBzIDogJ2EgZmV3IHNlY29uZHMnLFxuICAgICAgICAgICAgbSA6ICdhIG1pbnV0ZScsXG4gICAgICAgICAgICBtbSA6ICclZCBtaW51dGVzJyxcbiAgICAgICAgICAgIGggOiAnYW4gaG91cicsXG4gICAgICAgICAgICBoaCA6ICclZCBob3VycycsXG4gICAgICAgICAgICBkIDogJ2EgZGF5JyxcbiAgICAgICAgICAgIGRkIDogJyVkIGRheXMnLFxuICAgICAgICAgICAgTSA6ICdhIG1vbnRoJyxcbiAgICAgICAgICAgIE1NIDogJyVkIG1vbnRocycsXG4gICAgICAgICAgICB5IDogJ2EgeWVhcicsXG4gICAgICAgICAgICB5eSA6ICclZCB5ZWFycydcbiAgICAgICAgfSxcblxuICAgICAgICByZWxhdGl2ZVRpbWUgOiBmdW5jdGlvbiAobnVtYmVyLCB3aXRob3V0U3VmZml4LCBzdHJpbmcsIGlzRnV0dXJlKSB7XG4gICAgICAgICAgICB2YXIgb3V0cHV0ID0gdGhpcy5fcmVsYXRpdmVUaW1lW3N0cmluZ107XG4gICAgICAgICAgICByZXR1cm4gKHR5cGVvZiBvdXRwdXQgPT09ICdmdW5jdGlvbicpID9cbiAgICAgICAgICAgICAgICBvdXRwdXQobnVtYmVyLCB3aXRob3V0U3VmZml4LCBzdHJpbmcsIGlzRnV0dXJlKSA6XG4gICAgICAgICAgICAgICAgb3V0cHV0LnJlcGxhY2UoLyVkL2ksIG51bWJlcik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGFzdEZ1dHVyZSA6IGZ1bmN0aW9uIChkaWZmLCBvdXRwdXQpIHtcbiAgICAgICAgICAgIHZhciBmb3JtYXQgPSB0aGlzLl9yZWxhdGl2ZVRpbWVbZGlmZiA+IDAgPyAnZnV0dXJlJyA6ICdwYXN0J107XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIGZvcm1hdCA9PT0gJ2Z1bmN0aW9uJyA/IGZvcm1hdChvdXRwdXQpIDogZm9ybWF0LnJlcGxhY2UoLyVzL2ksIG91dHB1dCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb3JkaW5hbCA6IGZ1bmN0aW9uIChudW1iZXIpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9vcmRpbmFsLnJlcGxhY2UoJyVkJywgbnVtYmVyKTtcbiAgICAgICAgfSxcbiAgICAgICAgX29yZGluYWwgOiAnJWQnLFxuICAgICAgICBfb3JkaW5hbFBhcnNlIDogL1xcZHsxLDJ9LyxcblxuICAgICAgICBwcmVwYXJzZSA6IGZ1bmN0aW9uIChzdHJpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiBzdHJpbmc7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcG9zdGZvcm1hdCA6IGZ1bmN0aW9uIChzdHJpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiBzdHJpbmc7XG4gICAgICAgIH0sXG5cbiAgICAgICAgd2VlayA6IGZ1bmN0aW9uIChtb20pIHtcbiAgICAgICAgICAgIHJldHVybiB3ZWVrT2ZZZWFyKG1vbSwgdGhpcy5fd2Vlay5kb3csIHRoaXMuX3dlZWsuZG95KS53ZWVrO1xuICAgICAgICB9LFxuXG4gICAgICAgIF93ZWVrIDoge1xuICAgICAgICAgICAgZG93IDogMCwgLy8gU3VuZGF5IGlzIHRoZSBmaXJzdCBkYXkgb2YgdGhlIHdlZWsuXG4gICAgICAgICAgICBkb3kgOiA2ICAvLyBUaGUgd2VlayB0aGF0IGNvbnRhaW5zIEphbiAxc3QgaXMgdGhlIGZpcnN0IHdlZWsgb2YgdGhlIHllYXIuXG4gICAgICAgIH0sXG5cbiAgICAgICAgZmlyc3REYXlPZldlZWsgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fd2Vlay5kb3c7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZmlyc3REYXlPZlllYXIgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fd2Vlay5kb3k7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2ludmFsaWREYXRlOiAnSW52YWxpZCBkYXRlJyxcbiAgICAgICAgaW52YWxpZERhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pbnZhbGlkRGF0ZTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBGb3JtYXR0aW5nXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cbiAgICBmdW5jdGlvbiByZW1vdmVGb3JtYXR0aW5nVG9rZW5zKGlucHV0KSB7XG4gICAgICAgIGlmIChpbnB1dC5tYXRjaCgvXFxbW1xcc1xcU10vKSkge1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0LnJlcGxhY2UoL15cXFt8XFxdJC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGlucHV0LnJlcGxhY2UoL1xcXFwvZywgJycpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VGb3JtYXRGdW5jdGlvbihmb3JtYXQpIHtcbiAgICAgICAgdmFyIGFycmF5ID0gZm9ybWF0Lm1hdGNoKGZvcm1hdHRpbmdUb2tlbnMpLCBpLCBsZW5ndGg7XG5cbiAgICAgICAgZm9yIChpID0gMCwgbGVuZ3RoID0gYXJyYXkubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChmb3JtYXRUb2tlbkZ1bmN0aW9uc1thcnJheVtpXV0pIHtcbiAgICAgICAgICAgICAgICBhcnJheVtpXSA9IGZvcm1hdFRva2VuRnVuY3Rpb25zW2FycmF5W2ldXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYXJyYXlbaV0gPSByZW1vdmVGb3JtYXR0aW5nVG9rZW5zKGFycmF5W2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAobW9tKSB7XG4gICAgICAgICAgICB2YXIgb3V0cHV0ID0gJyc7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQgKz0gYXJyYXlbaV0gaW5zdGFuY2VvZiBGdW5jdGlvbiA/IGFycmF5W2ldLmNhbGwobW9tLCBmb3JtYXQpIDogYXJyYXlbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIGZvcm1hdCBkYXRlIHVzaW5nIG5hdGl2ZSBkYXRlIG9iamVjdFxuICAgIGZ1bmN0aW9uIGZvcm1hdE1vbWVudChtLCBmb3JtYXQpIHtcbiAgICAgICAgaWYgKCFtLmlzVmFsaWQoKSkge1xuICAgICAgICAgICAgcmV0dXJuIG0ubG9jYWxlRGF0YSgpLmludmFsaWREYXRlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3JtYXQgPSBleHBhbmRGb3JtYXQoZm9ybWF0LCBtLmxvY2FsZURhdGEoKSk7XG5cbiAgICAgICAgaWYgKCFmb3JtYXRGdW5jdGlvbnNbZm9ybWF0XSkge1xuICAgICAgICAgICAgZm9ybWF0RnVuY3Rpb25zW2Zvcm1hdF0gPSBtYWtlRm9ybWF0RnVuY3Rpb24oZm9ybWF0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmb3JtYXRGdW5jdGlvbnNbZm9ybWF0XShtKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBleHBhbmRGb3JtYXQoZm9ybWF0LCBsb2NhbGUpIHtcbiAgICAgICAgdmFyIGkgPSA1O1xuXG4gICAgICAgIGZ1bmN0aW9uIHJlcGxhY2VMb25nRGF0ZUZvcm1hdFRva2VucyhpbnB1dCkge1xuICAgICAgICAgICAgcmV0dXJuIGxvY2FsZS5sb25nRGF0ZUZvcm1hdChpbnB1dCkgfHwgaW5wdXQ7XG4gICAgICAgIH1cblxuICAgICAgICBsb2NhbEZvcm1hdHRpbmdUb2tlbnMubGFzdEluZGV4ID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPj0gMCAmJiBsb2NhbEZvcm1hdHRpbmdUb2tlbnMudGVzdChmb3JtYXQpKSB7XG4gICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZShsb2NhbEZvcm1hdHRpbmdUb2tlbnMsIHJlcGxhY2VMb25nRGF0ZUZvcm1hdFRva2Vucyk7XG4gICAgICAgICAgICBsb2NhbEZvcm1hdHRpbmdUb2tlbnMubGFzdEluZGV4ID0gMDtcbiAgICAgICAgICAgIGkgLT0gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmb3JtYXQ7XG4gICAgfVxuXG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIFBhcnNpbmdcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblxuICAgIC8vIGdldCB0aGUgcmVnZXggdG8gZmluZCB0aGUgbmV4dCB0b2tlblxuICAgIGZ1bmN0aW9uIGdldFBhcnNlUmVnZXhGb3JUb2tlbih0b2tlbiwgY29uZmlnKSB7XG4gICAgICAgIHZhciBhLCBzdHJpY3QgPSBjb25maWcuX3N0cmljdDtcbiAgICAgICAgc3dpdGNoICh0b2tlbikge1xuICAgICAgICBjYXNlICdRJzpcbiAgICAgICAgICAgIHJldHVybiBwYXJzZVRva2VuT25lRGlnaXQ7XG4gICAgICAgIGNhc2UgJ0REREQnOlxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlVG9rZW5UaHJlZURpZ2l0cztcbiAgICAgICAgY2FzZSAnWVlZWSc6XG4gICAgICAgIGNhc2UgJ0dHR0cnOlxuICAgICAgICBjYXNlICdnZ2dnJzpcbiAgICAgICAgICAgIHJldHVybiBzdHJpY3QgPyBwYXJzZVRva2VuRm91ckRpZ2l0cyA6IHBhcnNlVG9rZW5PbmVUb0ZvdXJEaWdpdHM7XG4gICAgICAgIGNhc2UgJ1knOlxuICAgICAgICBjYXNlICdHJzpcbiAgICAgICAgY2FzZSAnZyc6XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VUb2tlblNpZ25lZE51bWJlcjtcbiAgICAgICAgY2FzZSAnWVlZWVlZJzpcbiAgICAgICAgY2FzZSAnWVlZWVknOlxuICAgICAgICBjYXNlICdHR0dHRyc6XG4gICAgICAgIGNhc2UgJ2dnZ2dnJzpcbiAgICAgICAgICAgIHJldHVybiBzdHJpY3QgPyBwYXJzZVRva2VuU2l4RGlnaXRzIDogcGFyc2VUb2tlbk9uZVRvU2l4RGlnaXRzO1xuICAgICAgICBjYXNlICdTJzpcbiAgICAgICAgICAgIGlmIChzdHJpY3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VUb2tlbk9uZURpZ2l0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICBjYXNlICdTUyc6XG4gICAgICAgICAgICBpZiAoc3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlVG9rZW5Ud29EaWdpdHM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICAgIGNhc2UgJ1NTUyc6XG4gICAgICAgICAgICBpZiAoc3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlVG9rZW5UaHJlZURpZ2l0cztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgY2FzZSAnREREJzpcbiAgICAgICAgICAgIHJldHVybiBwYXJzZVRva2VuT25lVG9UaHJlZURpZ2l0cztcbiAgICAgICAgY2FzZSAnTU1NJzpcbiAgICAgICAgY2FzZSAnTU1NTSc6XG4gICAgICAgIGNhc2UgJ2RkJzpcbiAgICAgICAgY2FzZSAnZGRkJzpcbiAgICAgICAgY2FzZSAnZGRkZCc6XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VUb2tlbldvcmQ7XG4gICAgICAgIGNhc2UgJ2EnOlxuICAgICAgICBjYXNlICdBJzpcbiAgICAgICAgICAgIHJldHVybiBjb25maWcuX2xvY2FsZS5fbWVyaWRpZW1QYXJzZTtcbiAgICAgICAgY2FzZSAneCc6XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VUb2tlbk9mZnNldE1zO1xuICAgICAgICBjYXNlICdYJzpcbiAgICAgICAgICAgIHJldHVybiBwYXJzZVRva2VuVGltZXN0YW1wTXM7XG4gICAgICAgIGNhc2UgJ1onOlxuICAgICAgICBjYXNlICdaWic6XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VUb2tlblRpbWV6b25lO1xuICAgICAgICBjYXNlICdUJzpcbiAgICAgICAgICAgIHJldHVybiBwYXJzZVRva2VuVDtcbiAgICAgICAgY2FzZSAnU1NTUyc6XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VUb2tlbkRpZ2l0cztcbiAgICAgICAgY2FzZSAnTU0nOlxuICAgICAgICBjYXNlICdERCc6XG4gICAgICAgIGNhc2UgJ1lZJzpcbiAgICAgICAgY2FzZSAnR0cnOlxuICAgICAgICBjYXNlICdnZyc6XG4gICAgICAgIGNhc2UgJ0hIJzpcbiAgICAgICAgY2FzZSAnaGgnOlxuICAgICAgICBjYXNlICdtbSc6XG4gICAgICAgIGNhc2UgJ3NzJzpcbiAgICAgICAgY2FzZSAnd3cnOlxuICAgICAgICBjYXNlICdXVyc6XG4gICAgICAgICAgICByZXR1cm4gc3RyaWN0ID8gcGFyc2VUb2tlblR3b0RpZ2l0cyA6IHBhcnNlVG9rZW5PbmVPclR3b0RpZ2l0cztcbiAgICAgICAgY2FzZSAnTSc6XG4gICAgICAgIGNhc2UgJ0QnOlxuICAgICAgICBjYXNlICdkJzpcbiAgICAgICAgY2FzZSAnSCc6XG4gICAgICAgIGNhc2UgJ2gnOlxuICAgICAgICBjYXNlICdtJzpcbiAgICAgICAgY2FzZSAncyc6XG4gICAgICAgIGNhc2UgJ3cnOlxuICAgICAgICBjYXNlICdXJzpcbiAgICAgICAgY2FzZSAnZSc6XG4gICAgICAgIGNhc2UgJ0UnOlxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlVG9rZW5PbmVPclR3b0RpZ2l0cztcbiAgICAgICAgY2FzZSAnRG8nOlxuICAgICAgICAgICAgcmV0dXJuIHN0cmljdCA/IGNvbmZpZy5fbG9jYWxlLl9vcmRpbmFsUGFyc2UgOiBjb25maWcuX2xvY2FsZS5fb3JkaW5hbFBhcnNlTGVuaWVudDtcbiAgICAgICAgZGVmYXVsdCA6XG4gICAgICAgICAgICBhID0gbmV3IFJlZ0V4cChyZWdleHBFc2NhcGUodW5lc2NhcGVGb3JtYXQodG9rZW4ucmVwbGFjZSgnXFxcXCcsICcnKSksICdpJykpO1xuICAgICAgICAgICAgcmV0dXJuIGE7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1dGNPZmZzZXRGcm9tU3RyaW5nKHN0cmluZykge1xuICAgICAgICBzdHJpbmcgPSBzdHJpbmcgfHwgJyc7XG4gICAgICAgIHZhciBwb3NzaWJsZVR6TWF0Y2hlcyA9IChzdHJpbmcubWF0Y2gocGFyc2VUb2tlblRpbWV6b25lKSB8fCBbXSksXG4gICAgICAgICAgICB0ekNodW5rID0gcG9zc2libGVUek1hdGNoZXNbcG9zc2libGVUek1hdGNoZXMubGVuZ3RoIC0gMV0gfHwgW10sXG4gICAgICAgICAgICBwYXJ0cyA9ICh0ekNodW5rICsgJycpLm1hdGNoKHBhcnNlVGltZXpvbmVDaHVua2VyKSB8fCBbJy0nLCAwLCAwXSxcbiAgICAgICAgICAgIG1pbnV0ZXMgPSArKHBhcnRzWzFdICogNjApICsgdG9JbnQocGFydHNbMl0pO1xuXG4gICAgICAgIHJldHVybiBwYXJ0c1swXSA9PT0gJysnID8gbWludXRlcyA6IC1taW51dGVzO1xuICAgIH1cblxuICAgIC8vIGZ1bmN0aW9uIHRvIGNvbnZlcnQgc3RyaW5nIGlucHV0IHRvIGRhdGVcbiAgICBmdW5jdGlvbiBhZGRUaW1lVG9BcnJheUZyb21Ub2tlbih0b2tlbiwgaW5wdXQsIGNvbmZpZykge1xuICAgICAgICB2YXIgYSwgZGF0ZVBhcnRBcnJheSA9IGNvbmZpZy5fYTtcblxuICAgICAgICBzd2l0Y2ggKHRva2VuKSB7XG4gICAgICAgIC8vIFFVQVJURVJcbiAgICAgICAgY2FzZSAnUSc6XG4gICAgICAgICAgICBpZiAoaW5wdXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRhdGVQYXJ0QXJyYXlbTU9OVEhdID0gKHRvSW50KGlucHV0KSAtIDEpICogMztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBNT05USFxuICAgICAgICBjYXNlICdNJyA6IC8vIGZhbGwgdGhyb3VnaCB0byBNTVxuICAgICAgICBjYXNlICdNTScgOlxuICAgICAgICAgICAgaWYgKGlucHV0ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkYXRlUGFydEFycmF5W01PTlRIXSA9IHRvSW50KGlucHV0KSAtIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnTU1NJyA6IC8vIGZhbGwgdGhyb3VnaCB0byBNTU1NXG4gICAgICAgIGNhc2UgJ01NTU0nIDpcbiAgICAgICAgICAgIGEgPSBjb25maWcuX2xvY2FsZS5tb250aHNQYXJzZShpbnB1dCwgdG9rZW4sIGNvbmZpZy5fc3RyaWN0KTtcbiAgICAgICAgICAgIC8vIGlmIHdlIGRpZG4ndCBmaW5kIGEgbW9udGggbmFtZSwgbWFyayB0aGUgZGF0ZSBhcyBpbnZhbGlkLlxuICAgICAgICAgICAgaWYgKGEgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRhdGVQYXJ0QXJyYXlbTU9OVEhdID0gYTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLl9wZi5pbnZhbGlkTW9udGggPSBpbnB1dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBEQVkgT0YgTU9OVEhcbiAgICAgICAgY2FzZSAnRCcgOiAvLyBmYWxsIHRocm91Z2ggdG8gRERcbiAgICAgICAgY2FzZSAnREQnIDpcbiAgICAgICAgICAgIGlmIChpbnB1dCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGF0ZVBhcnRBcnJheVtEQVRFXSA9IHRvSW50KGlucHV0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdEbycgOlxuICAgICAgICAgICAgaWYgKGlucHV0ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkYXRlUGFydEFycmF5W0RBVEVdID0gdG9JbnQocGFyc2VJbnQoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXQubWF0Y2goL1xcZHsxLDJ9LylbMF0sIDEwKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gREFZIE9GIFlFQVJcbiAgICAgICAgY2FzZSAnREREJyA6IC8vIGZhbGwgdGhyb3VnaCB0byBEREREXG4gICAgICAgIGNhc2UgJ0REREQnIDpcbiAgICAgICAgICAgIGlmIChpbnB1dCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLl9kYXlPZlllYXIgPSB0b0ludChpbnB1dCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBZRUFSXG4gICAgICAgIGNhc2UgJ1lZJyA6XG4gICAgICAgICAgICBkYXRlUGFydEFycmF5W1lFQVJdID0gbW9tZW50LnBhcnNlVHdvRGlnaXRZZWFyKGlucHV0KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdZWVlZJyA6XG4gICAgICAgIGNhc2UgJ1lZWVlZJyA6XG4gICAgICAgIGNhc2UgJ1lZWVlZWScgOlxuICAgICAgICAgICAgZGF0ZVBhcnRBcnJheVtZRUFSXSA9IHRvSW50KGlucHV0KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBBTSAvIFBNXG4gICAgICAgIGNhc2UgJ2EnIDogLy8gZmFsbCB0aHJvdWdoIHRvIEFcbiAgICAgICAgY2FzZSAnQScgOlxuICAgICAgICAgICAgY29uZmlnLl9tZXJpZGllbSA9IGlucHV0O1xuICAgICAgICAgICAgLy8gY29uZmlnLl9pc1BtID0gY29uZmlnLl9sb2NhbGUuaXNQTShpbnB1dCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gSE9VUlxuICAgICAgICBjYXNlICdoJyA6IC8vIGZhbGwgdGhyb3VnaCB0byBoaFxuICAgICAgICBjYXNlICdoaCcgOlxuICAgICAgICAgICAgY29uZmlnLl9wZi5iaWdIb3VyID0gdHJ1ZTtcbiAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgY2FzZSAnSCcgOiAvLyBmYWxsIHRocm91Z2ggdG8gSEhcbiAgICAgICAgY2FzZSAnSEgnIDpcbiAgICAgICAgICAgIGRhdGVQYXJ0QXJyYXlbSE9VUl0gPSB0b0ludChpbnB1dCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gTUlOVVRFXG4gICAgICAgIGNhc2UgJ20nIDogLy8gZmFsbCB0aHJvdWdoIHRvIG1tXG4gICAgICAgIGNhc2UgJ21tJyA6XG4gICAgICAgICAgICBkYXRlUGFydEFycmF5W01JTlVURV0gPSB0b0ludChpbnB1dCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gU0VDT05EXG4gICAgICAgIGNhc2UgJ3MnIDogLy8gZmFsbCB0aHJvdWdoIHRvIHNzXG4gICAgICAgIGNhc2UgJ3NzJyA6XG4gICAgICAgICAgICBkYXRlUGFydEFycmF5W1NFQ09ORF0gPSB0b0ludChpbnB1dCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gTUlMTElTRUNPTkRcbiAgICAgICAgY2FzZSAnUycgOlxuICAgICAgICBjYXNlICdTUycgOlxuICAgICAgICBjYXNlICdTU1MnIDpcbiAgICAgICAgY2FzZSAnU1NTUycgOlxuICAgICAgICAgICAgZGF0ZVBhcnRBcnJheVtNSUxMSVNFQ09ORF0gPSB0b0ludCgoJzAuJyArIGlucHV0KSAqIDEwMDApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIC8vIFVOSVggT0ZGU0VUIChNSUxMSVNFQ09ORFMpXG4gICAgICAgIGNhc2UgJ3gnOlxuICAgICAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUodG9JbnQoaW5wdXQpKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBVTklYIFRJTUVTVEFNUCBXSVRIIE1TXG4gICAgICAgIGNhc2UgJ1gnOlxuICAgICAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUocGFyc2VGbG9hdChpbnB1dCkgKiAxMDAwKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBUSU1FWk9ORVxuICAgICAgICBjYXNlICdaJyA6IC8vIGZhbGwgdGhyb3VnaCB0byBaWlxuICAgICAgICBjYXNlICdaWicgOlxuICAgICAgICAgICAgY29uZmlnLl91c2VVVEMgPSB0cnVlO1xuICAgICAgICAgICAgY29uZmlnLl90em0gPSB1dGNPZmZzZXRGcm9tU3RyaW5nKGlucHV0KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBXRUVLREFZIC0gaHVtYW5cbiAgICAgICAgY2FzZSAnZGQnOlxuICAgICAgICBjYXNlICdkZGQnOlxuICAgICAgICBjYXNlICdkZGRkJzpcbiAgICAgICAgICAgIGEgPSBjb25maWcuX2xvY2FsZS53ZWVrZGF5c1BhcnNlKGlucHV0KTtcbiAgICAgICAgICAgIC8vIGlmIHdlIGRpZG4ndCBnZXQgYSB3ZWVrZGF5IG5hbWUsIG1hcmsgdGhlIGRhdGUgYXMgaW52YWxpZFxuICAgICAgICAgICAgaWYgKGEgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNvbmZpZy5fdyA9IGNvbmZpZy5fdyB8fCB7fTtcbiAgICAgICAgICAgICAgICBjb25maWcuX3dbJ2QnXSA9IGE7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbmZpZy5fcGYuaW52YWxpZFdlZWtkYXkgPSBpbnB1dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBXRUVLLCBXRUVLIERBWSAtIG51bWVyaWNcbiAgICAgICAgY2FzZSAndyc6XG4gICAgICAgIGNhc2UgJ3d3JzpcbiAgICAgICAgY2FzZSAnVyc6XG4gICAgICAgIGNhc2UgJ1dXJzpcbiAgICAgICAgY2FzZSAnZCc6XG4gICAgICAgIGNhc2UgJ2UnOlxuICAgICAgICBjYXNlICdFJzpcbiAgICAgICAgICAgIHRva2VuID0gdG9rZW4uc3Vic3RyKDAsIDEpO1xuICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICBjYXNlICdnZ2dnJzpcbiAgICAgICAgY2FzZSAnR0dHRyc6XG4gICAgICAgIGNhc2UgJ0dHR0dHJzpcbiAgICAgICAgICAgIHRva2VuID0gdG9rZW4uc3Vic3RyKDAsIDIpO1xuICAgICAgICAgICAgaWYgKGlucHV0KSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLl93ID0gY29uZmlnLl93IHx8IHt9O1xuICAgICAgICAgICAgICAgIGNvbmZpZy5fd1t0b2tlbl0gPSB0b0ludChpbnB1dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnZ2cnOlxuICAgICAgICBjYXNlICdHRyc6XG4gICAgICAgICAgICBjb25maWcuX3cgPSBjb25maWcuX3cgfHwge307XG4gICAgICAgICAgICBjb25maWcuX3dbdG9rZW5dID0gbW9tZW50LnBhcnNlVHdvRGlnaXRZZWFyKGlucHV0KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRheU9mWWVhckZyb21XZWVrSW5mbyhjb25maWcpIHtcbiAgICAgICAgdmFyIHcsIHdlZWtZZWFyLCB3ZWVrLCB3ZWVrZGF5LCBkb3csIGRveSwgdGVtcDtcblxuICAgICAgICB3ID0gY29uZmlnLl93O1xuICAgICAgICBpZiAody5HRyAhPSBudWxsIHx8IHcuVyAhPSBudWxsIHx8IHcuRSAhPSBudWxsKSB7XG4gICAgICAgICAgICBkb3cgPSAxO1xuICAgICAgICAgICAgZG95ID0gNDtcblxuICAgICAgICAgICAgLy8gVE9ETzogV2UgbmVlZCB0byB0YWtlIHRoZSBjdXJyZW50IGlzb1dlZWtZZWFyLCBidXQgdGhhdCBkZXBlbmRzIG9uXG4gICAgICAgICAgICAvLyBob3cgd2UgaW50ZXJwcmV0IG5vdyAobG9jYWwsIHV0YywgZml4ZWQgb2Zmc2V0KS4gU28gY3JlYXRlXG4gICAgICAgICAgICAvLyBhIG5vdyB2ZXJzaW9uIG9mIGN1cnJlbnQgY29uZmlnICh0YWtlIGxvY2FsL3V0Yy9vZmZzZXQgZmxhZ3MsIGFuZFxuICAgICAgICAgICAgLy8gY3JlYXRlIG5vdykuXG4gICAgICAgICAgICB3ZWVrWWVhciA9IGRmbCh3LkdHLCBjb25maWcuX2FbWUVBUl0sIHdlZWtPZlllYXIobW9tZW50KCksIDEsIDQpLnllYXIpO1xuICAgICAgICAgICAgd2VlayA9IGRmbCh3LlcsIDEpO1xuICAgICAgICAgICAgd2Vla2RheSA9IGRmbCh3LkUsIDEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZG93ID0gY29uZmlnLl9sb2NhbGUuX3dlZWsuZG93O1xuICAgICAgICAgICAgZG95ID0gY29uZmlnLl9sb2NhbGUuX3dlZWsuZG95O1xuXG4gICAgICAgICAgICB3ZWVrWWVhciA9IGRmbCh3LmdnLCBjb25maWcuX2FbWUVBUl0sIHdlZWtPZlllYXIobW9tZW50KCksIGRvdywgZG95KS55ZWFyKTtcbiAgICAgICAgICAgIHdlZWsgPSBkZmwody53LCAxKTtcblxuICAgICAgICAgICAgaWYgKHcuZCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgLy8gd2Vla2RheSAtLSBsb3cgZGF5IG51bWJlcnMgYXJlIGNvbnNpZGVyZWQgbmV4dCB3ZWVrXG4gICAgICAgICAgICAgICAgd2Vla2RheSA9IHcuZDtcbiAgICAgICAgICAgICAgICBpZiAod2Vla2RheSA8IGRvdykge1xuICAgICAgICAgICAgICAgICAgICArK3dlZWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmICh3LmUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIC8vIGxvY2FsIHdlZWtkYXkgLS0gY291bnRpbmcgc3RhcnRzIGZyb20gYmVnaW5pbmcgb2Ygd2Vla1xuICAgICAgICAgICAgICAgIHdlZWtkYXkgPSB3LmUgKyBkb3c7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGRlZmF1bHQgdG8gYmVnaW5pbmcgb2Ygd2Vla1xuICAgICAgICAgICAgICAgIHdlZWtkYXkgPSBkb3c7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGVtcCA9IGRheU9mWWVhckZyb21XZWVrcyh3ZWVrWWVhciwgd2Vlaywgd2Vla2RheSwgZG95LCBkb3cpO1xuXG4gICAgICAgIGNvbmZpZy5fYVtZRUFSXSA9IHRlbXAueWVhcjtcbiAgICAgICAgY29uZmlnLl9kYXlPZlllYXIgPSB0ZW1wLmRheU9mWWVhcjtcbiAgICB9XG5cbiAgICAvLyBjb252ZXJ0IGFuIGFycmF5IHRvIGEgZGF0ZS5cbiAgICAvLyB0aGUgYXJyYXkgc2hvdWxkIG1pcnJvciB0aGUgcGFyYW1ldGVycyBiZWxvd1xuICAgIC8vIG5vdGU6IGFsbCB2YWx1ZXMgcGFzdCB0aGUgeWVhciBhcmUgb3B0aW9uYWwgYW5kIHdpbGwgZGVmYXVsdCB0byB0aGUgbG93ZXN0IHBvc3NpYmxlIHZhbHVlLlxuICAgIC8vIFt5ZWFyLCBtb250aCwgZGF5ICwgaG91ciwgbWludXRlLCBzZWNvbmQsIG1pbGxpc2Vjb25kXVxuICAgIGZ1bmN0aW9uIGRhdGVGcm9tQ29uZmlnKGNvbmZpZykge1xuICAgICAgICB2YXIgaSwgZGF0ZSwgaW5wdXQgPSBbXSwgY3VycmVudERhdGUsIHllYXJUb1VzZTtcblxuICAgICAgICBpZiAoY29uZmlnLl9kKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjdXJyZW50RGF0ZSA9IGN1cnJlbnREYXRlQXJyYXkoY29uZmlnKTtcblxuICAgICAgICAvL2NvbXB1dGUgZGF5IG9mIHRoZSB5ZWFyIGZyb20gd2Vla3MgYW5kIHdlZWtkYXlzXG4gICAgICAgIGlmIChjb25maWcuX3cgJiYgY29uZmlnLl9hW0RBVEVdID09IG51bGwgJiYgY29uZmlnLl9hW01PTlRIXSA9PSBudWxsKSB7XG4gICAgICAgICAgICBkYXlPZlllYXJGcm9tV2Vla0luZm8oY29uZmlnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vaWYgdGhlIGRheSBvZiB0aGUgeWVhciBpcyBzZXQsIGZpZ3VyZSBvdXQgd2hhdCBpdCBpc1xuICAgICAgICBpZiAoY29uZmlnLl9kYXlPZlllYXIpIHtcbiAgICAgICAgICAgIHllYXJUb1VzZSA9IGRmbChjb25maWcuX2FbWUVBUl0sIGN1cnJlbnREYXRlW1lFQVJdKTtcblxuICAgICAgICAgICAgaWYgKGNvbmZpZy5fZGF5T2ZZZWFyID4gZGF5c0luWWVhcih5ZWFyVG9Vc2UpKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLl9wZi5fb3ZlcmZsb3dEYXlPZlllYXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkYXRlID0gbWFrZVVUQ0RhdGUoeWVhclRvVXNlLCAwLCBjb25maWcuX2RheU9mWWVhcik7XG4gICAgICAgICAgICBjb25maWcuX2FbTU9OVEhdID0gZGF0ZS5nZXRVVENNb250aCgpO1xuICAgICAgICAgICAgY29uZmlnLl9hW0RBVEVdID0gZGF0ZS5nZXRVVENEYXRlKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBEZWZhdWx0IHRvIGN1cnJlbnQgZGF0ZS5cbiAgICAgICAgLy8gKiBpZiBubyB5ZWFyLCBtb250aCwgZGF5IG9mIG1vbnRoIGFyZSBnaXZlbiwgZGVmYXVsdCB0byB0b2RheVxuICAgICAgICAvLyAqIGlmIGRheSBvZiBtb250aCBpcyBnaXZlbiwgZGVmYXVsdCBtb250aCBhbmQgeWVhclxuICAgICAgICAvLyAqIGlmIG1vbnRoIGlzIGdpdmVuLCBkZWZhdWx0IG9ubHkgeWVhclxuICAgICAgICAvLyAqIGlmIHllYXIgaXMgZ2l2ZW4sIGRvbid0IGRlZmF1bHQgYW55dGhpbmdcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IDMgJiYgY29uZmlnLl9hW2ldID09IG51bGw7ICsraSkge1xuICAgICAgICAgICAgY29uZmlnLl9hW2ldID0gaW5wdXRbaV0gPSBjdXJyZW50RGF0ZVtpXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFplcm8gb3V0IHdoYXRldmVyIHdhcyBub3QgZGVmYXVsdGVkLCBpbmNsdWRpbmcgdGltZVxuICAgICAgICBmb3IgKDsgaSA8IDc7IGkrKykge1xuICAgICAgICAgICAgY29uZmlnLl9hW2ldID0gaW5wdXRbaV0gPSAoY29uZmlnLl9hW2ldID09IG51bGwpID8gKGkgPT09IDIgPyAxIDogMCkgOiBjb25maWcuX2FbaV07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDaGVjayBmb3IgMjQ6MDA6MDAuMDAwXG4gICAgICAgIGlmIChjb25maWcuX2FbSE9VUl0gPT09IDI0ICYmXG4gICAgICAgICAgICAgICAgY29uZmlnLl9hW01JTlVURV0gPT09IDAgJiZcbiAgICAgICAgICAgICAgICBjb25maWcuX2FbU0VDT05EXSA9PT0gMCAmJlxuICAgICAgICAgICAgICAgIGNvbmZpZy5fYVtNSUxMSVNFQ09ORF0gPT09IDApIHtcbiAgICAgICAgICAgIGNvbmZpZy5fbmV4dERheSA9IHRydWU7XG4gICAgICAgICAgICBjb25maWcuX2FbSE9VUl0gPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uZmlnLl9kID0gKGNvbmZpZy5fdXNlVVRDID8gbWFrZVVUQ0RhdGUgOiBtYWtlRGF0ZSkuYXBwbHkobnVsbCwgaW5wdXQpO1xuICAgICAgICAvLyBBcHBseSB0aW1lem9uZSBvZmZzZXQgZnJvbSBpbnB1dC4gVGhlIGFjdHVhbCB1dGNPZmZzZXQgY2FuIGJlIGNoYW5nZWRcbiAgICAgICAgLy8gd2l0aCBwYXJzZVpvbmUuXG4gICAgICAgIGlmIChjb25maWcuX3R6bSAhPSBudWxsKSB7XG4gICAgICAgICAgICBjb25maWcuX2Quc2V0VVRDTWludXRlcyhjb25maWcuX2QuZ2V0VVRDTWludXRlcygpIC0gY29uZmlnLl90em0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbmZpZy5fbmV4dERheSkge1xuICAgICAgICAgICAgY29uZmlnLl9hW0hPVVJdID0gMjQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkYXRlRnJvbU9iamVjdChjb25maWcpIHtcbiAgICAgICAgdmFyIG5vcm1hbGl6ZWRJbnB1dDtcblxuICAgICAgICBpZiAoY29uZmlnLl9kKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBub3JtYWxpemVkSW5wdXQgPSBub3JtYWxpemVPYmplY3RVbml0cyhjb25maWcuX2kpO1xuICAgICAgICBjb25maWcuX2EgPSBbXG4gICAgICAgICAgICBub3JtYWxpemVkSW5wdXQueWVhcixcbiAgICAgICAgICAgIG5vcm1hbGl6ZWRJbnB1dC5tb250aCxcbiAgICAgICAgICAgIG5vcm1hbGl6ZWRJbnB1dC5kYXkgfHwgbm9ybWFsaXplZElucHV0LmRhdGUsXG4gICAgICAgICAgICBub3JtYWxpemVkSW5wdXQuaG91cixcbiAgICAgICAgICAgIG5vcm1hbGl6ZWRJbnB1dC5taW51dGUsXG4gICAgICAgICAgICBub3JtYWxpemVkSW5wdXQuc2Vjb25kLFxuICAgICAgICAgICAgbm9ybWFsaXplZElucHV0Lm1pbGxpc2Vjb25kXG4gICAgICAgIF07XG5cbiAgICAgICAgZGF0ZUZyb21Db25maWcoY29uZmlnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjdXJyZW50RGF0ZUFycmF5KGNvbmZpZykge1xuICAgICAgICB2YXIgbm93ID0gbmV3IERhdGUoKTtcbiAgICAgICAgaWYgKGNvbmZpZy5fdXNlVVRDKSB7XG4gICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgIG5vdy5nZXRVVENGdWxsWWVhcigpLFxuICAgICAgICAgICAgICAgIG5vdy5nZXRVVENNb250aCgpLFxuICAgICAgICAgICAgICAgIG5vdy5nZXRVVENEYXRlKClcbiAgICAgICAgICAgIF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gW25vdy5nZXRGdWxsWWVhcigpLCBub3cuZ2V0TW9udGgoKSwgbm93LmdldERhdGUoKV07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBkYXRlIGZyb20gc3RyaW5nIGFuZCBmb3JtYXQgc3RyaW5nXG4gICAgZnVuY3Rpb24gbWFrZURhdGVGcm9tU3RyaW5nQW5kRm9ybWF0KGNvbmZpZykge1xuICAgICAgICBpZiAoY29uZmlnLl9mID09PSBtb21lbnQuSVNPXzg2MDEpIHtcbiAgICAgICAgICAgIHBhcnNlSVNPKGNvbmZpZyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25maWcuX2EgPSBbXTtcbiAgICAgICAgY29uZmlnLl9wZi5lbXB0eSA9IHRydWU7XG5cbiAgICAgICAgLy8gVGhpcyBhcnJheSBpcyB1c2VkIHRvIG1ha2UgYSBEYXRlLCBlaXRoZXIgd2l0aCBgbmV3IERhdGVgIG9yIGBEYXRlLlVUQ2BcbiAgICAgICAgdmFyIHN0cmluZyA9ICcnICsgY29uZmlnLl9pLFxuICAgICAgICAgICAgaSwgcGFyc2VkSW5wdXQsIHRva2VucywgdG9rZW4sIHNraXBwZWQsXG4gICAgICAgICAgICBzdHJpbmdMZW5ndGggPSBzdHJpbmcubGVuZ3RoLFxuICAgICAgICAgICAgdG90YWxQYXJzZWRJbnB1dExlbmd0aCA9IDA7XG5cbiAgICAgICAgdG9rZW5zID0gZXhwYW5kRm9ybWF0KGNvbmZpZy5fZiwgY29uZmlnLl9sb2NhbGUpLm1hdGNoKGZvcm1hdHRpbmdUb2tlbnMpIHx8IFtdO1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRva2VuID0gdG9rZW5zW2ldO1xuICAgICAgICAgICAgcGFyc2VkSW5wdXQgPSAoc3RyaW5nLm1hdGNoKGdldFBhcnNlUmVnZXhGb3JUb2tlbih0b2tlbiwgY29uZmlnKSkgfHwgW10pWzBdO1xuICAgICAgICAgICAgaWYgKHBhcnNlZElucHV0KSB7XG4gICAgICAgICAgICAgICAgc2tpcHBlZCA9IHN0cmluZy5zdWJzdHIoMCwgc3RyaW5nLmluZGV4T2YocGFyc2VkSW5wdXQpKTtcbiAgICAgICAgICAgICAgICBpZiAoc2tpcHBlZC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5fcGYudW51c2VkSW5wdXQucHVzaChza2lwcGVkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc3RyaW5nID0gc3RyaW5nLnNsaWNlKHN0cmluZy5pbmRleE9mKHBhcnNlZElucHV0KSArIHBhcnNlZElucHV0Lmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgdG90YWxQYXJzZWRJbnB1dExlbmd0aCArPSBwYXJzZWRJbnB1dC5sZW5ndGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBkb24ndCBwYXJzZSBpZiBpdCdzIG5vdCBhIGtub3duIHRva2VuXG4gICAgICAgICAgICBpZiAoZm9ybWF0VG9rZW5GdW5jdGlvbnNbdG9rZW5dKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBhcnNlZElucHV0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5fcGYuZW1wdHkgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5fcGYudW51c2VkVG9rZW5zLnB1c2godG9rZW4pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhZGRUaW1lVG9BcnJheUZyb21Ub2tlbih0b2tlbiwgcGFyc2VkSW5wdXQsIGNvbmZpZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChjb25maWcuX3N0cmljdCAmJiAhcGFyc2VkSW5wdXQpIHtcbiAgICAgICAgICAgICAgICBjb25maWcuX3BmLnVudXNlZFRva2Vucy5wdXNoKHRva2VuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGFkZCByZW1haW5pbmcgdW5wYXJzZWQgaW5wdXQgbGVuZ3RoIHRvIHRoZSBzdHJpbmdcbiAgICAgICAgY29uZmlnLl9wZi5jaGFyc0xlZnRPdmVyID0gc3RyaW5nTGVuZ3RoIC0gdG90YWxQYXJzZWRJbnB1dExlbmd0aDtcbiAgICAgICAgaWYgKHN0cmluZy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25maWcuX3BmLnVudXNlZElucHV0LnB1c2goc3RyaW5nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNsZWFyIF8xMmggZmxhZyBpZiBob3VyIGlzIDw9IDEyXG4gICAgICAgIGlmIChjb25maWcuX3BmLmJpZ0hvdXIgPT09IHRydWUgJiYgY29uZmlnLl9hW0hPVVJdIDw9IDEyKSB7XG4gICAgICAgICAgICBjb25maWcuX3BmLmJpZ0hvdXIgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaGFuZGxlIG1lcmlkaWVtXG4gICAgICAgIGNvbmZpZy5fYVtIT1VSXSA9IG1lcmlkaWVtRml4V3JhcChjb25maWcuX2xvY2FsZSwgY29uZmlnLl9hW0hPVVJdLFxuICAgICAgICAgICAgICAgIGNvbmZpZy5fbWVyaWRpZW0pO1xuICAgICAgICBkYXRlRnJvbUNvbmZpZyhjb25maWcpO1xuICAgICAgICBjaGVja092ZXJmbG93KGNvbmZpZyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdW5lc2NhcGVGb3JtYXQocykge1xuICAgICAgICByZXR1cm4gcy5yZXBsYWNlKC9cXFxcKFxcWyl8XFxcXChcXF0pfFxcWyhbXlxcXVxcW10qKVxcXXxcXFxcKC4pL2csIGZ1bmN0aW9uIChtYXRjaGVkLCBwMSwgcDIsIHAzLCBwNCkge1xuICAgICAgICAgICAgcmV0dXJuIHAxIHx8IHAyIHx8IHAzIHx8IHA0O1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBDb2RlIGZyb20gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zNTYxNDkzL2lzLXRoZXJlLWEtcmVnZXhwLWVzY2FwZS1mdW5jdGlvbi1pbi1qYXZhc2NyaXB0XG4gICAgZnVuY3Rpb24gcmVnZXhwRXNjYXBlKHMpIHtcbiAgICAgICAgcmV0dXJuIHMucmVwbGFjZSgvWy1cXC9cXFxcXiQqKz8uKCl8W1xcXXt9XS9nLCAnXFxcXCQmJyk7XG4gICAgfVxuXG4gICAgLy8gZGF0ZSBmcm9tIHN0cmluZyBhbmQgYXJyYXkgb2YgZm9ybWF0IHN0cmluZ3NcbiAgICBmdW5jdGlvbiBtYWtlRGF0ZUZyb21TdHJpbmdBbmRBcnJheShjb25maWcpIHtcbiAgICAgICAgdmFyIHRlbXBDb25maWcsXG4gICAgICAgICAgICBiZXN0TW9tZW50LFxuXG4gICAgICAgICAgICBzY29yZVRvQmVhdCxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBjdXJyZW50U2NvcmU7XG5cbiAgICAgICAgaWYgKGNvbmZpZy5fZi5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGNvbmZpZy5fcGYuaW52YWxpZEZvcm1hdCA9IHRydWU7XG4gICAgICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZShOYU4pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGNvbmZpZy5fZi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY3VycmVudFNjb3JlID0gMDtcbiAgICAgICAgICAgIHRlbXBDb25maWcgPSBjb3B5Q29uZmlnKHt9LCBjb25maWcpO1xuICAgICAgICAgICAgaWYgKGNvbmZpZy5fdXNlVVRDICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0ZW1wQ29uZmlnLl91c2VVVEMgPSBjb25maWcuX3VzZVVUQztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRlbXBDb25maWcuX3BmID0gZGVmYXVsdFBhcnNpbmdGbGFncygpO1xuICAgICAgICAgICAgdGVtcENvbmZpZy5fZiA9IGNvbmZpZy5fZltpXTtcbiAgICAgICAgICAgIG1ha2VEYXRlRnJvbVN0cmluZ0FuZEZvcm1hdCh0ZW1wQ29uZmlnKTtcblxuICAgICAgICAgICAgaWYgKCFpc1ZhbGlkKHRlbXBDb25maWcpKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGlmIHRoZXJlIGlzIGFueSBpbnB1dCB0aGF0IHdhcyBub3QgcGFyc2VkIGFkZCBhIHBlbmFsdHkgZm9yIHRoYXQgZm9ybWF0XG4gICAgICAgICAgICBjdXJyZW50U2NvcmUgKz0gdGVtcENvbmZpZy5fcGYuY2hhcnNMZWZ0T3ZlcjtcblxuICAgICAgICAgICAgLy9vciB0b2tlbnNcbiAgICAgICAgICAgIGN1cnJlbnRTY29yZSArPSB0ZW1wQ29uZmlnLl9wZi51bnVzZWRUb2tlbnMubGVuZ3RoICogMTA7XG5cbiAgICAgICAgICAgIHRlbXBDb25maWcuX3BmLnNjb3JlID0gY3VycmVudFNjb3JlO1xuXG4gICAgICAgICAgICBpZiAoc2NvcmVUb0JlYXQgPT0gbnVsbCB8fCBjdXJyZW50U2NvcmUgPCBzY29yZVRvQmVhdCkge1xuICAgICAgICAgICAgICAgIHNjb3JlVG9CZWF0ID0gY3VycmVudFNjb3JlO1xuICAgICAgICAgICAgICAgIGJlc3RNb21lbnQgPSB0ZW1wQ29uZmlnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZXh0ZW5kKGNvbmZpZywgYmVzdE1vbWVudCB8fCB0ZW1wQ29uZmlnKTtcbiAgICB9XG5cbiAgICAvLyBkYXRlIGZyb20gaXNvIGZvcm1hdFxuICAgIGZ1bmN0aW9uIHBhcnNlSVNPKGNvbmZpZykge1xuICAgICAgICB2YXIgaSwgbCxcbiAgICAgICAgICAgIHN0cmluZyA9IGNvbmZpZy5faSxcbiAgICAgICAgICAgIG1hdGNoID0gaXNvUmVnZXguZXhlYyhzdHJpbmcpO1xuXG4gICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgY29uZmlnLl9wZi5pc28gPSB0cnVlO1xuICAgICAgICAgICAgZm9yIChpID0gMCwgbCA9IGlzb0RhdGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChpc29EYXRlc1tpXVsxXS5leGVjKHN0cmluZykpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gbWF0Y2hbNV0gc2hvdWxkIGJlICdUJyBvciB1bmRlZmluZWRcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnLl9mID0gaXNvRGF0ZXNbaV1bMF0gKyAobWF0Y2hbNl0gfHwgJyAnKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChpID0gMCwgbCA9IGlzb1RpbWVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChpc29UaW1lc1tpXVsxXS5leGVjKHN0cmluZykpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnLl9mICs9IGlzb1RpbWVzW2ldWzBdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc3RyaW5nLm1hdGNoKHBhcnNlVG9rZW5UaW1lem9uZSkpIHtcbiAgICAgICAgICAgICAgICBjb25maWcuX2YgKz0gJ1onO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbWFrZURhdGVGcm9tU3RyaW5nQW5kRm9ybWF0KGNvbmZpZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25maWcuX2lzVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGRhdGUgZnJvbSBpc28gZm9ybWF0IG9yIGZhbGxiYWNrXG4gICAgZnVuY3Rpb24gbWFrZURhdGVGcm9tU3RyaW5nKGNvbmZpZykge1xuICAgICAgICBwYXJzZUlTTyhjb25maWcpO1xuICAgICAgICBpZiAoY29uZmlnLl9pc1ZhbGlkID09PSBmYWxzZSkge1xuICAgICAgICAgICAgZGVsZXRlIGNvbmZpZy5faXNWYWxpZDtcbiAgICAgICAgICAgIG1vbWVudC5jcmVhdGVGcm9tSW5wdXRGYWxsYmFjayhjb25maWcpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWFwKGFyciwgZm4pIHtcbiAgICAgICAgdmFyIHJlcyA9IFtdLCBpO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICByZXMucHVzaChmbihhcnJbaV0sIGkpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VEYXRlRnJvbUlucHV0KGNvbmZpZykge1xuICAgICAgICB2YXIgaW5wdXQgPSBjb25maWcuX2ksIG1hdGNoZWQ7XG4gICAgICAgIGlmIChpbnB1dCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZSgpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzRGF0ZShpbnB1dCkpIHtcbiAgICAgICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKCtpbnB1dCk7XG4gICAgICAgIH0gZWxzZSBpZiAoKG1hdGNoZWQgPSBhc3BOZXRKc29uUmVnZXguZXhlYyhpbnB1dCkpICE9PSBudWxsKSB7XG4gICAgICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZSgrbWF0Y2hlZFsxXSk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgbWFrZURhdGVGcm9tU3RyaW5nKGNvbmZpZyk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNBcnJheShpbnB1dCkpIHtcbiAgICAgICAgICAgIGNvbmZpZy5fYSA9IG1hcChpbnB1dC5zbGljZSgwKSwgZnVuY3Rpb24gKG9iaikge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUludChvYmosIDEwKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZGF0ZUZyb21Db25maWcoY29uZmlnKTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YoaW5wdXQpID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgZGF0ZUZyb21PYmplY3QoY29uZmlnKTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YoaW5wdXQpID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgLy8gZnJvbSBtaWxsaXNlY29uZHNcbiAgICAgICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKGlucHV0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1vbWVudC5jcmVhdGVGcm9tSW5wdXRGYWxsYmFjayhjb25maWcpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWFrZURhdGUoeSwgbSwgZCwgaCwgTSwgcywgbXMpIHtcbiAgICAgICAgLy9jYW4ndCBqdXN0IGFwcGx5KCkgdG8gY3JlYXRlIGEgZGF0ZTpcbiAgICAgICAgLy9odHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzE4MTM0OC9pbnN0YW50aWF0aW5nLWEtamF2YXNjcmlwdC1vYmplY3QtYnktY2FsbGluZy1wcm90b3R5cGUtY29uc3RydWN0b3ItYXBwbHlcbiAgICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSh5LCBtLCBkLCBoLCBNLCBzLCBtcyk7XG5cbiAgICAgICAgLy90aGUgZGF0ZSBjb25zdHJ1Y3RvciBkb2Vzbid0IGFjY2VwdCB5ZWFycyA8IDE5NzBcbiAgICAgICAgaWYgKHkgPCAxOTcwKSB7XG4gICAgICAgICAgICBkYXRlLnNldEZ1bGxZZWFyKHkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkYXRlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VVVENEYXRlKHkpIHtcbiAgICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZShEYXRlLlVUQy5hcHBseShudWxsLCBhcmd1bWVudHMpKTtcbiAgICAgICAgaWYgKHkgPCAxOTcwKSB7XG4gICAgICAgICAgICBkYXRlLnNldFVUQ0Z1bGxZZWFyKHkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkYXRlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlV2Vla2RheShpbnB1dCwgbG9jYWxlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBpZiAoIWlzTmFOKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGlucHV0ID0gcGFyc2VJbnQoaW5wdXQsIDEwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlucHV0ID0gbG9jYWxlLndlZWtkYXlzUGFyc2UoaW5wdXQpO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaW5wdXQgIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgfVxuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBSZWxhdGl2ZSBUaW1lXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cbiAgICAvLyBoZWxwZXIgZnVuY3Rpb24gZm9yIG1vbWVudC5mbi5mcm9tLCBtb21lbnQuZm4uZnJvbU5vdywgYW5kIG1vbWVudC5kdXJhdGlvbi5mbi5odW1hbml6ZVxuICAgIGZ1bmN0aW9uIHN1YnN0aXR1dGVUaW1lQWdvKHN0cmluZywgbnVtYmVyLCB3aXRob3V0U3VmZml4LCBpc0Z1dHVyZSwgbG9jYWxlKSB7XG4gICAgICAgIHJldHVybiBsb2NhbGUucmVsYXRpdmVUaW1lKG51bWJlciB8fCAxLCAhIXdpdGhvdXRTdWZmaXgsIHN0cmluZywgaXNGdXR1cmUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlbGF0aXZlVGltZShwb3NOZWdEdXJhdGlvbiwgd2l0aG91dFN1ZmZpeCwgbG9jYWxlKSB7XG4gICAgICAgIHZhciBkdXJhdGlvbiA9IG1vbWVudC5kdXJhdGlvbihwb3NOZWdEdXJhdGlvbikuYWJzKCksXG4gICAgICAgICAgICBzZWNvbmRzID0gcm91bmQoZHVyYXRpb24uYXMoJ3MnKSksXG4gICAgICAgICAgICBtaW51dGVzID0gcm91bmQoZHVyYXRpb24uYXMoJ20nKSksXG4gICAgICAgICAgICBob3VycyA9IHJvdW5kKGR1cmF0aW9uLmFzKCdoJykpLFxuICAgICAgICAgICAgZGF5cyA9IHJvdW5kKGR1cmF0aW9uLmFzKCdkJykpLFxuICAgICAgICAgICAgbW9udGhzID0gcm91bmQoZHVyYXRpb24uYXMoJ00nKSksXG4gICAgICAgICAgICB5ZWFycyA9IHJvdW5kKGR1cmF0aW9uLmFzKCd5JykpLFxuXG4gICAgICAgICAgICBhcmdzID0gc2Vjb25kcyA8IHJlbGF0aXZlVGltZVRocmVzaG9sZHMucyAmJiBbJ3MnLCBzZWNvbmRzXSB8fFxuICAgICAgICAgICAgICAgIG1pbnV0ZXMgPT09IDEgJiYgWydtJ10gfHxcbiAgICAgICAgICAgICAgICBtaW51dGVzIDwgcmVsYXRpdmVUaW1lVGhyZXNob2xkcy5tICYmIFsnbW0nLCBtaW51dGVzXSB8fFxuICAgICAgICAgICAgICAgIGhvdXJzID09PSAxICYmIFsnaCddIHx8XG4gICAgICAgICAgICAgICAgaG91cnMgPCByZWxhdGl2ZVRpbWVUaHJlc2hvbGRzLmggJiYgWydoaCcsIGhvdXJzXSB8fFxuICAgICAgICAgICAgICAgIGRheXMgPT09IDEgJiYgWydkJ10gfHxcbiAgICAgICAgICAgICAgICBkYXlzIDwgcmVsYXRpdmVUaW1lVGhyZXNob2xkcy5kICYmIFsnZGQnLCBkYXlzXSB8fFxuICAgICAgICAgICAgICAgIG1vbnRocyA9PT0gMSAmJiBbJ00nXSB8fFxuICAgICAgICAgICAgICAgIG1vbnRocyA8IHJlbGF0aXZlVGltZVRocmVzaG9sZHMuTSAmJiBbJ01NJywgbW9udGhzXSB8fFxuICAgICAgICAgICAgICAgIHllYXJzID09PSAxICYmIFsneSddIHx8IFsneXknLCB5ZWFyc107XG5cbiAgICAgICAgYXJnc1syXSA9IHdpdGhvdXRTdWZmaXg7XG4gICAgICAgIGFyZ3NbM10gPSArcG9zTmVnRHVyYXRpb24gPiAwO1xuICAgICAgICBhcmdzWzRdID0gbG9jYWxlO1xuICAgICAgICByZXR1cm4gc3Vic3RpdHV0ZVRpbWVBZ28uYXBwbHkoe30sIGFyZ3MpO1xuICAgIH1cblxuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBXZWVrIG9mIFllYXJcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblxuICAgIC8vIGZpcnN0RGF5T2ZXZWVrICAgICAgIDAgPSBzdW4sIDYgPSBzYXRcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICB0aGUgZGF5IG9mIHRoZSB3ZWVrIHRoYXQgc3RhcnRzIHRoZSB3ZWVrXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgKHVzdWFsbHkgc3VuZGF5IG9yIG1vbmRheSlcbiAgICAvLyBmaXJzdERheU9mV2Vla09mWWVhciAwID0gc3VuLCA2ID0gc2F0XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgdGhlIGZpcnN0IHdlZWsgaXMgdGhlIHdlZWsgdGhhdCBjb250YWlucyB0aGUgZmlyc3RcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICBvZiB0aGlzIGRheSBvZiB0aGUgd2Vla1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgIChlZy4gSVNPIHdlZWtzIHVzZSB0aHVyc2RheSAoNCkpXG4gICAgZnVuY3Rpb24gd2Vla09mWWVhcihtb20sIGZpcnN0RGF5T2ZXZWVrLCBmaXJzdERheU9mV2Vla09mWWVhcikge1xuICAgICAgICB2YXIgZW5kID0gZmlyc3REYXlPZldlZWtPZlllYXIgLSBmaXJzdERheU9mV2VlayxcbiAgICAgICAgICAgIGRheXNUb0RheU9mV2VlayA9IGZpcnN0RGF5T2ZXZWVrT2ZZZWFyIC0gbW9tLmRheSgpLFxuICAgICAgICAgICAgYWRqdXN0ZWRNb21lbnQ7XG5cblxuICAgICAgICBpZiAoZGF5c1RvRGF5T2ZXZWVrID4gZW5kKSB7XG4gICAgICAgICAgICBkYXlzVG9EYXlPZldlZWsgLT0gNztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXlzVG9EYXlPZldlZWsgPCBlbmQgLSA3KSB7XG4gICAgICAgICAgICBkYXlzVG9EYXlPZldlZWsgKz0gNztcbiAgICAgICAgfVxuXG4gICAgICAgIGFkanVzdGVkTW9tZW50ID0gbW9tZW50KG1vbSkuYWRkKGRheXNUb0RheU9mV2VlaywgJ2QnKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHdlZWs6IE1hdGguY2VpbChhZGp1c3RlZE1vbWVudC5kYXlPZlllYXIoKSAvIDcpLFxuICAgICAgICAgICAgeWVhcjogYWRqdXN0ZWRNb21lbnQueWVhcigpXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy9odHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0lTT193ZWVrX2RhdGUjQ2FsY3VsYXRpbmdfYV9kYXRlX2dpdmVuX3RoZV95ZWFyLjJDX3dlZWtfbnVtYmVyX2FuZF93ZWVrZGF5XG4gICAgZnVuY3Rpb24gZGF5T2ZZZWFyRnJvbVdlZWtzKHllYXIsIHdlZWssIHdlZWtkYXksIGZpcnN0RGF5T2ZXZWVrT2ZZZWFyLCBmaXJzdERheU9mV2Vlaykge1xuICAgICAgICB2YXIgZCA9IG1ha2VVVENEYXRlKHllYXIsIDAsIDEpLmdldFVUQ0RheSgpLCBkYXlzVG9BZGQsIGRheU9mWWVhcjtcblxuICAgICAgICBkID0gZCA9PT0gMCA/IDcgOiBkO1xuICAgICAgICB3ZWVrZGF5ID0gd2Vla2RheSAhPSBudWxsID8gd2Vla2RheSA6IGZpcnN0RGF5T2ZXZWVrO1xuICAgICAgICBkYXlzVG9BZGQgPSBmaXJzdERheU9mV2VlayAtIGQgKyAoZCA+IGZpcnN0RGF5T2ZXZWVrT2ZZZWFyID8gNyA6IDApIC0gKGQgPCBmaXJzdERheU9mV2VlayA/IDcgOiAwKTtcbiAgICAgICAgZGF5T2ZZZWFyID0gNyAqICh3ZWVrIC0gMSkgKyAod2Vla2RheSAtIGZpcnN0RGF5T2ZXZWVrKSArIGRheXNUb0FkZCArIDE7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHllYXI6IGRheU9mWWVhciA+IDAgPyB5ZWFyIDogeWVhciAtIDEsXG4gICAgICAgICAgICBkYXlPZlllYXI6IGRheU9mWWVhciA+IDAgPyAgZGF5T2ZZZWFyIDogZGF5c0luWWVhcih5ZWFyIC0gMSkgKyBkYXlPZlllYXJcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIFRvcCBMZXZlbCBGdW5jdGlvbnNcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICBmdW5jdGlvbiBtYWtlTW9tZW50KGNvbmZpZykge1xuICAgICAgICB2YXIgaW5wdXQgPSBjb25maWcuX2ksXG4gICAgICAgICAgICBmb3JtYXQgPSBjb25maWcuX2YsXG4gICAgICAgICAgICByZXM7XG5cbiAgICAgICAgY29uZmlnLl9sb2NhbGUgPSBjb25maWcuX2xvY2FsZSB8fCBtb21lbnQubG9jYWxlRGF0YShjb25maWcuX2wpO1xuXG4gICAgICAgIGlmIChpbnB1dCA9PT0gbnVsbCB8fCAoZm9ybWF0ID09PSB1bmRlZmluZWQgJiYgaW5wdXQgPT09ICcnKSkge1xuICAgICAgICAgICAgcmV0dXJuIG1vbWVudC5pbnZhbGlkKHtudWxsSW5wdXQ6IHRydWV9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBjb25maWcuX2kgPSBpbnB1dCA9IGNvbmZpZy5fbG9jYWxlLnByZXBhcnNlKGlucHV0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtb21lbnQuaXNNb21lbnQoaW5wdXQpKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IE1vbWVudChpbnB1dCwgdHJ1ZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoZm9ybWF0KSB7XG4gICAgICAgICAgICBpZiAoaXNBcnJheShmb3JtYXQpKSB7XG4gICAgICAgICAgICAgICAgbWFrZURhdGVGcm9tU3RyaW5nQW5kQXJyYXkoY29uZmlnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbWFrZURhdGVGcm9tU3RyaW5nQW5kRm9ybWF0KGNvbmZpZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtYWtlRGF0ZUZyb21JbnB1dChjb25maWcpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzID0gbmV3IE1vbWVudChjb25maWcpO1xuICAgICAgICBpZiAocmVzLl9uZXh0RGF5KSB7XG4gICAgICAgICAgICAvLyBBZGRpbmcgaXMgc21hcnQgZW5vdWdoIGFyb3VuZCBEU1RcbiAgICAgICAgICAgIHJlcy5hZGQoMSwgJ2QnKTtcbiAgICAgICAgICAgIHJlcy5fbmV4dERheSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuXG4gICAgbW9tZW50ID0gZnVuY3Rpb24gKGlucHV0LCBmb3JtYXQsIGxvY2FsZSwgc3RyaWN0KSB7XG4gICAgICAgIHZhciBjO1xuXG4gICAgICAgIGlmICh0eXBlb2YobG9jYWxlKSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICBzdHJpY3QgPSBsb2NhbGU7XG4gICAgICAgICAgICBsb2NhbGUgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgLy8gb2JqZWN0IGNvbnN0cnVjdGlvbiBtdXN0IGJlIGRvbmUgdGhpcyB3YXkuXG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tb21lbnQvbW9tZW50L2lzc3Vlcy8xNDIzXG4gICAgICAgIGMgPSB7fTtcbiAgICAgICAgYy5faXNBTW9tZW50T2JqZWN0ID0gdHJ1ZTtcbiAgICAgICAgYy5faSA9IGlucHV0O1xuICAgICAgICBjLl9mID0gZm9ybWF0O1xuICAgICAgICBjLl9sID0gbG9jYWxlO1xuICAgICAgICBjLl9zdHJpY3QgPSBzdHJpY3Q7XG4gICAgICAgIGMuX2lzVVRDID0gZmFsc2U7XG4gICAgICAgIGMuX3BmID0gZGVmYXVsdFBhcnNpbmdGbGFncygpO1xuXG4gICAgICAgIHJldHVybiBtYWtlTW9tZW50KGMpO1xuICAgIH07XG5cbiAgICBtb21lbnQuc3VwcHJlc3NEZXByZWNhdGlvbldhcm5pbmdzID0gZmFsc2U7XG5cbiAgICBtb21lbnQuY3JlYXRlRnJvbUlucHV0RmFsbGJhY2sgPSBkZXByZWNhdGUoXG4gICAgICAgICdtb21lbnQgY29uc3RydWN0aW9uIGZhbGxzIGJhY2sgdG8ganMgRGF0ZS4gVGhpcyBpcyAnICtcbiAgICAgICAgJ2Rpc2NvdXJhZ2VkIGFuZCB3aWxsIGJlIHJlbW92ZWQgaW4gdXBjb21pbmcgbWFqb3IgJyArXG4gICAgICAgICdyZWxlYXNlLiBQbGVhc2UgcmVmZXIgdG8gJyArXG4gICAgICAgICdodHRwczovL2dpdGh1Yi5jb20vbW9tZW50L21vbWVudC9pc3N1ZXMvMTQwNyBmb3IgbW9yZSBpbmZvLicsXG4gICAgICAgIGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICAgICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKGNvbmZpZy5faSArIChjb25maWcuX3VzZVVUQyA/ICcgVVRDJyA6ICcnKSk7XG4gICAgICAgIH1cbiAgICApO1xuXG4gICAgLy8gUGljayBhIG1vbWVudCBtIGZyb20gbW9tZW50cyBzbyB0aGF0IG1bZm5dKG90aGVyKSBpcyB0cnVlIGZvciBhbGxcbiAgICAvLyBvdGhlci4gVGhpcyByZWxpZXMgb24gdGhlIGZ1bmN0aW9uIGZuIHRvIGJlIHRyYW5zaXRpdmUuXG4gICAgLy9cbiAgICAvLyBtb21lbnRzIHNob3VsZCBlaXRoZXIgYmUgYW4gYXJyYXkgb2YgbW9tZW50IG9iamVjdHMgb3IgYW4gYXJyYXksIHdob3NlXG4gICAgLy8gZmlyc3QgZWxlbWVudCBpcyBhbiBhcnJheSBvZiBtb21lbnQgb2JqZWN0cy5cbiAgICBmdW5jdGlvbiBwaWNrQnkoZm4sIG1vbWVudHMpIHtcbiAgICAgICAgdmFyIHJlcywgaTtcbiAgICAgICAgaWYgKG1vbWVudHMubGVuZ3RoID09PSAxICYmIGlzQXJyYXkobW9tZW50c1swXSkpIHtcbiAgICAgICAgICAgIG1vbWVudHMgPSBtb21lbnRzWzBdO1xuICAgICAgICB9XG4gICAgICAgIGlmICghbW9tZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBtb21lbnQoKTtcbiAgICAgICAgfVxuICAgICAgICByZXMgPSBtb21lbnRzWzBdO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDwgbW9tZW50cy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgaWYgKG1vbWVudHNbaV1bZm5dKHJlcykpIHtcbiAgICAgICAgICAgICAgICByZXMgPSBtb21lbnRzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuXG4gICAgbW9tZW50Lm1pbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG5cbiAgICAgICAgcmV0dXJuIHBpY2tCeSgnaXNCZWZvcmUnLCBhcmdzKTtcbiAgICB9O1xuXG4gICAgbW9tZW50Lm1heCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG5cbiAgICAgICAgcmV0dXJuIHBpY2tCeSgnaXNBZnRlcicsIGFyZ3MpO1xuICAgIH07XG5cbiAgICAvLyBjcmVhdGluZyB3aXRoIHV0Y1xuICAgIG1vbWVudC51dGMgPSBmdW5jdGlvbiAoaW5wdXQsIGZvcm1hdCwgbG9jYWxlLCBzdHJpY3QpIHtcbiAgICAgICAgdmFyIGM7XG5cbiAgICAgICAgaWYgKHR5cGVvZihsb2NhbGUpID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgIHN0cmljdCA9IGxvY2FsZTtcbiAgICAgICAgICAgIGxvY2FsZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICAvLyBvYmplY3QgY29uc3RydWN0aW9uIG11c3QgYmUgZG9uZSB0aGlzIHdheS5cbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21vbWVudC9tb21lbnQvaXNzdWVzLzE0MjNcbiAgICAgICAgYyA9IHt9O1xuICAgICAgICBjLl9pc0FNb21lbnRPYmplY3QgPSB0cnVlO1xuICAgICAgICBjLl91c2VVVEMgPSB0cnVlO1xuICAgICAgICBjLl9pc1VUQyA9IHRydWU7XG4gICAgICAgIGMuX2wgPSBsb2NhbGU7XG4gICAgICAgIGMuX2kgPSBpbnB1dDtcbiAgICAgICAgYy5fZiA9IGZvcm1hdDtcbiAgICAgICAgYy5fc3RyaWN0ID0gc3RyaWN0O1xuICAgICAgICBjLl9wZiA9IGRlZmF1bHRQYXJzaW5nRmxhZ3MoKTtcblxuICAgICAgICByZXR1cm4gbWFrZU1vbWVudChjKS51dGMoKTtcbiAgICB9O1xuXG4gICAgLy8gY3JlYXRpbmcgd2l0aCB1bml4IHRpbWVzdGFtcCAoaW4gc2Vjb25kcylcbiAgICBtb21lbnQudW5peCA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICByZXR1cm4gbW9tZW50KGlucHV0ICogMTAwMCk7XG4gICAgfTtcblxuICAgIC8vIGR1cmF0aW9uXG4gICAgbW9tZW50LmR1cmF0aW9uID0gZnVuY3Rpb24gKGlucHV0LCBrZXkpIHtcbiAgICAgICAgdmFyIGR1cmF0aW9uID0gaW5wdXQsXG4gICAgICAgICAgICAvLyBtYXRjaGluZyBhZ2FpbnN0IHJlZ2V4cCBpcyBleHBlbnNpdmUsIGRvIGl0IG9uIGRlbWFuZFxuICAgICAgICAgICAgbWF0Y2ggPSBudWxsLFxuICAgICAgICAgICAgc2lnbixcbiAgICAgICAgICAgIHJldCxcbiAgICAgICAgICAgIHBhcnNlSXNvLFxuICAgICAgICAgICAgZGlmZlJlcztcblxuICAgICAgICBpZiAobW9tZW50LmlzRHVyYXRpb24oaW5wdXQpKSB7XG4gICAgICAgICAgICBkdXJhdGlvbiA9IHtcbiAgICAgICAgICAgICAgICBtczogaW5wdXQuX21pbGxpc2Vjb25kcyxcbiAgICAgICAgICAgICAgICBkOiBpbnB1dC5fZGF5cyxcbiAgICAgICAgICAgICAgICBNOiBpbnB1dC5fbW9udGhzXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIGR1cmF0aW9uID0ge307XG4gICAgICAgICAgICBpZiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgZHVyYXRpb25ba2V5XSA9IGlucHV0O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkdXJhdGlvbi5taWxsaXNlY29uZHMgPSBpbnB1dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICghIShtYXRjaCA9IGFzcE5ldFRpbWVTcGFuSnNvblJlZ2V4LmV4ZWMoaW5wdXQpKSkge1xuICAgICAgICAgICAgc2lnbiA9IChtYXRjaFsxXSA9PT0gJy0nKSA/IC0xIDogMTtcbiAgICAgICAgICAgIGR1cmF0aW9uID0ge1xuICAgICAgICAgICAgICAgIHk6IDAsXG4gICAgICAgICAgICAgICAgZDogdG9JbnQobWF0Y2hbREFURV0pICogc2lnbixcbiAgICAgICAgICAgICAgICBoOiB0b0ludChtYXRjaFtIT1VSXSkgKiBzaWduLFxuICAgICAgICAgICAgICAgIG06IHRvSW50KG1hdGNoW01JTlVURV0pICogc2lnbixcbiAgICAgICAgICAgICAgICBzOiB0b0ludChtYXRjaFtTRUNPTkRdKSAqIHNpZ24sXG4gICAgICAgICAgICAgICAgbXM6IHRvSW50KG1hdGNoW01JTExJU0VDT05EXSkgKiBzaWduXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2UgaWYgKCEhKG1hdGNoID0gaXNvRHVyYXRpb25SZWdleC5leGVjKGlucHV0KSkpIHtcbiAgICAgICAgICAgIHNpZ24gPSAobWF0Y2hbMV0gPT09ICctJykgPyAtMSA6IDE7XG4gICAgICAgICAgICBwYXJzZUlzbyA9IGZ1bmN0aW9uIChpbnApIHtcbiAgICAgICAgICAgICAgICAvLyBXZSdkIG5vcm1hbGx5IHVzZSB+fmlucCBmb3IgdGhpcywgYnV0IHVuZm9ydHVuYXRlbHkgaXQgYWxzb1xuICAgICAgICAgICAgICAgIC8vIGNvbnZlcnRzIGZsb2F0cyB0byBpbnRzLlxuICAgICAgICAgICAgICAgIC8vIGlucCBtYXkgYmUgdW5kZWZpbmVkLCBzbyBjYXJlZnVsIGNhbGxpbmcgcmVwbGFjZSBvbiBpdC5cbiAgICAgICAgICAgICAgICB2YXIgcmVzID0gaW5wICYmIHBhcnNlRmxvYXQoaW5wLnJlcGxhY2UoJywnLCAnLicpKTtcbiAgICAgICAgICAgICAgICAvLyBhcHBseSBzaWduIHdoaWxlIHdlJ3JlIGF0IGl0XG4gICAgICAgICAgICAgICAgcmV0dXJuIChpc05hTihyZXMpID8gMCA6IHJlcykgKiBzaWduO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGR1cmF0aW9uID0ge1xuICAgICAgICAgICAgICAgIHk6IHBhcnNlSXNvKG1hdGNoWzJdKSxcbiAgICAgICAgICAgICAgICBNOiBwYXJzZUlzbyhtYXRjaFszXSksXG4gICAgICAgICAgICAgICAgZDogcGFyc2VJc28obWF0Y2hbNF0pLFxuICAgICAgICAgICAgICAgIGg6IHBhcnNlSXNvKG1hdGNoWzVdKSxcbiAgICAgICAgICAgICAgICBtOiBwYXJzZUlzbyhtYXRjaFs2XSksXG4gICAgICAgICAgICAgICAgczogcGFyc2VJc28obWF0Y2hbN10pLFxuICAgICAgICAgICAgICAgIHc6IHBhcnNlSXNvKG1hdGNoWzhdKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIGlmIChkdXJhdGlvbiA9PSBudWxsKSB7Ly8gY2hlY2tzIGZvciBudWxsIG9yIHVuZGVmaW5lZFxuICAgICAgICAgICAgZHVyYXRpb24gPSB7fTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZHVyYXRpb24gPT09ICdvYmplY3QnICYmXG4gICAgICAgICAgICAgICAgKCdmcm9tJyBpbiBkdXJhdGlvbiB8fCAndG8nIGluIGR1cmF0aW9uKSkge1xuICAgICAgICAgICAgZGlmZlJlcyA9IG1vbWVudHNEaWZmZXJlbmNlKG1vbWVudChkdXJhdGlvbi5mcm9tKSwgbW9tZW50KGR1cmF0aW9uLnRvKSk7XG5cbiAgICAgICAgICAgIGR1cmF0aW9uID0ge307XG4gICAgICAgICAgICBkdXJhdGlvbi5tcyA9IGRpZmZSZXMubWlsbGlzZWNvbmRzO1xuICAgICAgICAgICAgZHVyYXRpb24uTSA9IGRpZmZSZXMubW9udGhzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0ID0gbmV3IER1cmF0aW9uKGR1cmF0aW9uKTtcblxuICAgICAgICBpZiAobW9tZW50LmlzRHVyYXRpb24oaW5wdXQpICYmIGhhc093blByb3AoaW5wdXQsICdfbG9jYWxlJykpIHtcbiAgICAgICAgICAgIHJldC5fbG9jYWxlID0gaW5wdXQuX2xvY2FsZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfTtcblxuICAgIC8vIHZlcnNpb24gbnVtYmVyXG4gICAgbW9tZW50LnZlcnNpb24gPSBWRVJTSU9OO1xuXG4gICAgLy8gZGVmYXVsdCBmb3JtYXRcbiAgICBtb21lbnQuZGVmYXVsdEZvcm1hdCA9IGlzb0Zvcm1hdDtcblxuICAgIC8vIGNvbnN0YW50IHRoYXQgcmVmZXJzIHRvIHRoZSBJU08gc3RhbmRhcmRcbiAgICBtb21lbnQuSVNPXzg2MDEgPSBmdW5jdGlvbiAoKSB7fTtcblxuICAgIC8vIFBsdWdpbnMgdGhhdCBhZGQgcHJvcGVydGllcyBzaG91bGQgYWxzbyBhZGQgdGhlIGtleSBoZXJlIChudWxsIHZhbHVlKSxcbiAgICAvLyBzbyB3ZSBjYW4gcHJvcGVybHkgY2xvbmUgb3Vyc2VsdmVzLlxuICAgIG1vbWVudC5tb21lbnRQcm9wZXJ0aWVzID0gbW9tZW50UHJvcGVydGllcztcblxuICAgIC8vIFRoaXMgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgd2hlbmV2ZXIgYSBtb21lbnQgaXMgbXV0YXRlZC5cbiAgICAvLyBJdCBpcyBpbnRlbmRlZCB0byBrZWVwIHRoZSBvZmZzZXQgaW4gc3luYyB3aXRoIHRoZSB0aW1lem9uZS5cbiAgICBtb21lbnQudXBkYXRlT2Zmc2V0ID0gZnVuY3Rpb24gKCkge307XG5cbiAgICAvLyBUaGlzIGZ1bmN0aW9uIGFsbG93cyB5b3UgdG8gc2V0IGEgdGhyZXNob2xkIGZvciByZWxhdGl2ZSB0aW1lIHN0cmluZ3NcbiAgICBtb21lbnQucmVsYXRpdmVUaW1lVGhyZXNob2xkID0gZnVuY3Rpb24gKHRocmVzaG9sZCwgbGltaXQpIHtcbiAgICAgICAgaWYgKHJlbGF0aXZlVGltZVRocmVzaG9sZHNbdGhyZXNob2xkXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxpbWl0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiByZWxhdGl2ZVRpbWVUaHJlc2hvbGRzW3RocmVzaG9sZF07XG4gICAgICAgIH1cbiAgICAgICAgcmVsYXRpdmVUaW1lVGhyZXNob2xkc1t0aHJlc2hvbGRdID0gbGltaXQ7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbiAgICBtb21lbnQubGFuZyA9IGRlcHJlY2F0ZShcbiAgICAgICAgJ21vbWVudC5sYW5nIGlzIGRlcHJlY2F0ZWQuIFVzZSBtb21lbnQubG9jYWxlIGluc3RlYWQuJyxcbiAgICAgICAgZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBtb21lbnQubG9jYWxlKGtleSwgdmFsdWUpO1xuICAgICAgICB9XG4gICAgKTtcblxuICAgIC8vIFRoaXMgZnVuY3Rpb24gd2lsbCBsb2FkIGxvY2FsZSBhbmQgdGhlbiBzZXQgdGhlIGdsb2JhbCBsb2NhbGUuICBJZlxuICAgIC8vIG5vIGFyZ3VtZW50cyBhcmUgcGFzc2VkIGluLCBpdCB3aWxsIHNpbXBseSByZXR1cm4gdGhlIGN1cnJlbnQgZ2xvYmFsXG4gICAgLy8gbG9jYWxlIGtleS5cbiAgICBtb21lbnQubG9jYWxlID0gZnVuY3Rpb24gKGtleSwgdmFsdWVzKSB7XG4gICAgICAgIHZhciBkYXRhO1xuICAgICAgICBpZiAoa2V5KSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mKHZhbHVlcykgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgZGF0YSA9IG1vbWVudC5kZWZpbmVMb2NhbGUoa2V5LCB2YWx1ZXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZGF0YSA9IG1vbWVudC5sb2NhbGVEYXRhKGtleSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgbW9tZW50LmR1cmF0aW9uLl9sb2NhbGUgPSBtb21lbnQuX2xvY2FsZSA9IGRhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbW9tZW50Ll9sb2NhbGUuX2FiYnI7XG4gICAgfTtcblxuICAgIG1vbWVudC5kZWZpbmVMb2NhbGUgPSBmdW5jdGlvbiAobmFtZSwgdmFsdWVzKSB7XG4gICAgICAgIGlmICh2YWx1ZXMgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHZhbHVlcy5hYmJyID0gbmFtZTtcbiAgICAgICAgICAgIGlmICghbG9jYWxlc1tuYW1lXSkge1xuICAgICAgICAgICAgICAgIGxvY2FsZXNbbmFtZV0gPSBuZXcgTG9jYWxlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsb2NhbGVzW25hbWVdLnNldCh2YWx1ZXMpO1xuXG4gICAgICAgICAgICAvLyBiYWNrd2FyZHMgY29tcGF0IGZvciBub3c6IGFsc28gc2V0IHRoZSBsb2NhbGVcbiAgICAgICAgICAgIG1vbWVudC5sb2NhbGUobmFtZSk7XG5cbiAgICAgICAgICAgIHJldHVybiBsb2NhbGVzW25hbWVdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gdXNlZnVsIGZvciB0ZXN0aW5nXG4gICAgICAgICAgICBkZWxldGUgbG9jYWxlc1tuYW1lXTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIG1vbWVudC5sYW5nRGF0YSA9IGRlcHJlY2F0ZShcbiAgICAgICAgJ21vbWVudC5sYW5nRGF0YSBpcyBkZXByZWNhdGVkLiBVc2UgbW9tZW50LmxvY2FsZURhdGEgaW5zdGVhZC4nLFxuICAgICAgICBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gbW9tZW50LmxvY2FsZURhdGEoa2V5KTtcbiAgICAgICAgfVxuICAgICk7XG5cbiAgICAvLyByZXR1cm5zIGxvY2FsZSBkYXRhXG4gICAgbW9tZW50LmxvY2FsZURhdGEgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIHZhciBsb2NhbGU7XG5cbiAgICAgICAgaWYgKGtleSAmJiBrZXkuX2xvY2FsZSAmJiBrZXkuX2xvY2FsZS5fYWJicikge1xuICAgICAgICAgICAga2V5ID0ga2V5Ll9sb2NhbGUuX2FiYnI7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWtleSkge1xuICAgICAgICAgICAgcmV0dXJuIG1vbWVudC5fbG9jYWxlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFpc0FycmF5KGtleSkpIHtcbiAgICAgICAgICAgIC8vc2hvcnQtY2lyY3VpdCBldmVyeXRoaW5nIGVsc2VcbiAgICAgICAgICAgIGxvY2FsZSA9IGxvYWRMb2NhbGUoa2V5KTtcbiAgICAgICAgICAgIGlmIChsb2NhbGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbG9jYWxlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAga2V5ID0gW2tleV07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY2hvb3NlTG9jYWxlKGtleSk7XG4gICAgfTtcblxuICAgIC8vIGNvbXBhcmUgbW9tZW50IG9iamVjdFxuICAgIG1vbWVudC5pc01vbWVudCA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIE1vbWVudCB8fFxuICAgICAgICAgICAgKG9iaiAhPSBudWxsICYmIGhhc093blByb3Aob2JqLCAnX2lzQU1vbWVudE9iamVjdCcpKTtcbiAgICB9O1xuXG4gICAgLy8gZm9yIHR5cGVjaGVja2luZyBEdXJhdGlvbiBvYmplY3RzXG4gICAgbW9tZW50LmlzRHVyYXRpb24gPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIHJldHVybiBvYmogaW5zdGFuY2VvZiBEdXJhdGlvbjtcbiAgICB9O1xuXG4gICAgZm9yIChpID0gbGlzdHMubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgbWFrZUxpc3QobGlzdHNbaV0pO1xuICAgIH1cblxuICAgIG1vbWVudC5ub3JtYWxpemVVbml0cyA9IGZ1bmN0aW9uICh1bml0cykge1xuICAgICAgICByZXR1cm4gbm9ybWFsaXplVW5pdHModW5pdHMpO1xuICAgIH07XG5cbiAgICBtb21lbnQuaW52YWxpZCA9IGZ1bmN0aW9uIChmbGFncykge1xuICAgICAgICB2YXIgbSA9IG1vbWVudC51dGMoTmFOKTtcbiAgICAgICAgaWYgKGZsYWdzICE9IG51bGwpIHtcbiAgICAgICAgICAgIGV4dGVuZChtLl9wZiwgZmxhZ3MpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbS5fcGYudXNlckludmFsaWRhdGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBtO1xuICAgIH07XG5cbiAgICBtb21lbnQucGFyc2Vab25lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbW9tZW50LmFwcGx5KG51bGwsIGFyZ3VtZW50cykucGFyc2Vab25lKCk7XG4gICAgfTtcblxuICAgIG1vbWVudC5wYXJzZVR3b0RpZ2l0WWVhciA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICByZXR1cm4gdG9JbnQoaW5wdXQpICsgKHRvSW50KGlucHV0KSA+IDY4ID8gMTkwMCA6IDIwMDApO1xuICAgIH07XG5cbiAgICBtb21lbnQuaXNEYXRlID0gaXNEYXRlO1xuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBNb21lbnQgUHJvdG90eXBlXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cbiAgICBleHRlbmQobW9tZW50LmZuID0gTW9tZW50LnByb3RvdHlwZSwge1xuXG4gICAgICAgIGNsb25lIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG1vbWVudCh0aGlzKTtcbiAgICAgICAgfSxcblxuICAgICAgICB2YWx1ZU9mIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICt0aGlzLl9kIC0gKCh0aGlzLl9vZmZzZXQgfHwgMCkgKiA2MDAwMCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdW5peCA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmZsb29yKCt0aGlzIC8gMTAwMCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdG9TdHJpbmcgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jbG9uZSgpLmxvY2FsZSgnZW4nKS5mb3JtYXQoJ2RkZCBNTU0gREQgWVlZWSBISDptbTpzcyBbR01UXVpaJyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdG9EYXRlIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX29mZnNldCA/IG5ldyBEYXRlKCt0aGlzKSA6IHRoaXMuX2Q7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdG9JU09TdHJpbmcgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgbSA9IG1vbWVudCh0aGlzKS51dGMoKTtcbiAgICAgICAgICAgIGlmICgwIDwgbS55ZWFyKCkgJiYgbS55ZWFyKCkgPD0gOTk5OSkge1xuICAgICAgICAgICAgICAgIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgRGF0ZS5wcm90b3R5cGUudG9JU09TdHJpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gbmF0aXZlIGltcGxlbWVudGF0aW9uIGlzIH41MHggZmFzdGVyLCB1c2UgaXQgd2hlbiB3ZSBjYW5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudG9EYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZm9ybWF0TW9tZW50KG0sICdZWVlZLU1NLUREW1RdSEg6bW06c3MuU1NTW1pdJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZm9ybWF0TW9tZW50KG0sICdZWVlZWVktTU0tRERbVF1ISDptbTpzcy5TU1NbWl0nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICB0b0FycmF5IDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIG0gPSB0aGlzO1xuICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICBtLnllYXIoKSxcbiAgICAgICAgICAgICAgICBtLm1vbnRoKCksXG4gICAgICAgICAgICAgICAgbS5kYXRlKCksXG4gICAgICAgICAgICAgICAgbS5ob3VycygpLFxuICAgICAgICAgICAgICAgIG0ubWludXRlcygpLFxuICAgICAgICAgICAgICAgIG0uc2Vjb25kcygpLFxuICAgICAgICAgICAgICAgIG0ubWlsbGlzZWNvbmRzKClcbiAgICAgICAgICAgIF07XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNWYWxpZCA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBpc1ZhbGlkKHRoaXMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGlzRFNUU2hpZnRlZCA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9hKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaXNWYWxpZCgpICYmIGNvbXBhcmVBcnJheXModGhpcy5fYSwgKHRoaXMuX2lzVVRDID8gbW9tZW50LnV0Yyh0aGlzLl9hKSA6IG1vbWVudCh0aGlzLl9hKSkudG9BcnJheSgpKSA+IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSxcblxuICAgICAgICBwYXJzaW5nRmxhZ3MgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZXh0ZW5kKHt9LCB0aGlzLl9wZik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaW52YWxpZEF0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcGYub3ZlcmZsb3c7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdXRjIDogZnVuY3Rpb24gKGtlZXBMb2NhbFRpbWUpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnV0Y09mZnNldCgwLCBrZWVwTG9jYWxUaW1lKTtcbiAgICAgICAgfSxcblxuICAgICAgICBsb2NhbCA6IGZ1bmN0aW9uIChrZWVwTG9jYWxUaW1lKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5faXNVVEMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnV0Y09mZnNldCgwLCBrZWVwTG9jYWxUaW1lKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9pc1VUQyA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgaWYgKGtlZXBMb2NhbFRpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdWJ0cmFjdCh0aGlzLl9kYXRlVXRjT2Zmc2V0KCksICdtJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZm9ybWF0IDogZnVuY3Rpb24gKGlucHV0U3RyaW5nKSB7XG4gICAgICAgICAgICB2YXIgb3V0cHV0ID0gZm9ybWF0TW9tZW50KHRoaXMsIGlucHV0U3RyaW5nIHx8IG1vbWVudC5kZWZhdWx0Rm9ybWF0KTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxvY2FsZURhdGEoKS5wb3N0Zm9ybWF0KG91dHB1dCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYWRkIDogY3JlYXRlQWRkZXIoMSwgJ2FkZCcpLFxuXG4gICAgICAgIHN1YnRyYWN0IDogY3JlYXRlQWRkZXIoLTEsICdzdWJ0cmFjdCcpLFxuXG4gICAgICAgIGRpZmYgOiBmdW5jdGlvbiAoaW5wdXQsIHVuaXRzLCBhc0Zsb2F0KSB7XG4gICAgICAgICAgICB2YXIgdGhhdCA9IG1ha2VBcyhpbnB1dCwgdGhpcyksXG4gICAgICAgICAgICAgICAgem9uZURpZmYgPSAodGhhdC51dGNPZmZzZXQoKSAtIHRoaXMudXRjT2Zmc2V0KCkpICogNmU0LFxuICAgICAgICAgICAgICAgIGFuY2hvciwgZGlmZiwgb3V0cHV0LCBkYXlzQWRqdXN0O1xuXG4gICAgICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcblxuICAgICAgICAgICAgaWYgKHVuaXRzID09PSAneWVhcicgfHwgdW5pdHMgPT09ICdtb250aCcgfHwgdW5pdHMgPT09ICdxdWFydGVyJykge1xuICAgICAgICAgICAgICAgIG91dHB1dCA9IG1vbnRoRGlmZih0aGlzLCB0aGF0KTtcbiAgICAgICAgICAgICAgICBpZiAodW5pdHMgPT09ICdxdWFydGVyJykge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQgLyAzO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodW5pdHMgPT09ICd5ZWFyJykge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQgLyAxMjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpZmYgPSB0aGlzIC0gdGhhdDtcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSB1bml0cyA9PT0gJ3NlY29uZCcgPyBkaWZmIC8gMWUzIDogLy8gMTAwMFxuICAgICAgICAgICAgICAgICAgICB1bml0cyA9PT0gJ21pbnV0ZScgPyBkaWZmIC8gNmU0IDogLy8gMTAwMCAqIDYwXG4gICAgICAgICAgICAgICAgICAgIHVuaXRzID09PSAnaG91cicgPyBkaWZmIC8gMzZlNSA6IC8vIDEwMDAgKiA2MCAqIDYwXG4gICAgICAgICAgICAgICAgICAgIHVuaXRzID09PSAnZGF5JyA/IChkaWZmIC0gem9uZURpZmYpIC8gODY0ZTUgOiAvLyAxMDAwICogNjAgKiA2MCAqIDI0LCBuZWdhdGUgZHN0XG4gICAgICAgICAgICAgICAgICAgIHVuaXRzID09PSAnd2VlaycgPyAoZGlmZiAtIHpvbmVEaWZmKSAvIDYwNDhlNSA6IC8vIDEwMDAgKiA2MCAqIDYwICogMjQgKiA3LCBuZWdhdGUgZHN0XG4gICAgICAgICAgICAgICAgICAgIGRpZmY7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYXNGbG9hdCA/IG91dHB1dCA6IGFic1JvdW5kKG91dHB1dCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZnJvbSA6IGZ1bmN0aW9uICh0aW1lLCB3aXRob3V0U3VmZml4KSB7XG4gICAgICAgICAgICByZXR1cm4gbW9tZW50LmR1cmF0aW9uKHt0bzogdGhpcywgZnJvbTogdGltZX0pLmxvY2FsZSh0aGlzLmxvY2FsZSgpKS5odW1hbml6ZSghd2l0aG91dFN1ZmZpeCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZnJvbU5vdyA6IGZ1bmN0aW9uICh3aXRob3V0U3VmZml4KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5mcm9tKG1vbWVudCgpLCB3aXRob3V0U3VmZml4KTtcbiAgICAgICAgfSxcblxuICAgICAgICBjYWxlbmRhciA6IGZ1bmN0aW9uICh0aW1lKSB7XG4gICAgICAgICAgICAvLyBXZSB3YW50IHRvIGNvbXBhcmUgdGhlIHN0YXJ0IG9mIHRvZGF5LCB2cyB0aGlzLlxuICAgICAgICAgICAgLy8gR2V0dGluZyBzdGFydC1vZi10b2RheSBkZXBlbmRzIG9uIHdoZXRoZXIgd2UncmUgbG9jYXQvdXRjL29mZnNldFxuICAgICAgICAgICAgLy8gb3Igbm90LlxuICAgICAgICAgICAgdmFyIG5vdyA9IHRpbWUgfHwgbW9tZW50KCksXG4gICAgICAgICAgICAgICAgc29kID0gbWFrZUFzKG5vdywgdGhpcykuc3RhcnRPZignZGF5JyksXG4gICAgICAgICAgICAgICAgZGlmZiA9IHRoaXMuZGlmZihzb2QsICdkYXlzJywgdHJ1ZSksXG4gICAgICAgICAgICAgICAgZm9ybWF0ID0gZGlmZiA8IC02ID8gJ3NhbWVFbHNlJyA6XG4gICAgICAgICAgICAgICAgICAgIGRpZmYgPCAtMSA/ICdsYXN0V2VlaycgOlxuICAgICAgICAgICAgICAgICAgICBkaWZmIDwgMCA/ICdsYXN0RGF5JyA6XG4gICAgICAgICAgICAgICAgICAgIGRpZmYgPCAxID8gJ3NhbWVEYXknIDpcbiAgICAgICAgICAgICAgICAgICAgZGlmZiA8IDIgPyAnbmV4dERheScgOlxuICAgICAgICAgICAgICAgICAgICBkaWZmIDwgNyA/ICduZXh0V2VlaycgOiAnc2FtZUVsc2UnO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZm9ybWF0KHRoaXMubG9jYWxlRGF0YSgpLmNhbGVuZGFyKGZvcm1hdCwgdGhpcywgbW9tZW50KG5vdykpKTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc0xlYXBZZWFyIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGlzTGVhcFllYXIodGhpcy55ZWFyKCkpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGlzRFNUIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICh0aGlzLnV0Y09mZnNldCgpID4gdGhpcy5jbG9uZSgpLm1vbnRoKDApLnV0Y09mZnNldCgpIHx8XG4gICAgICAgICAgICAgICAgdGhpcy51dGNPZmZzZXQoKSA+IHRoaXMuY2xvbmUoKS5tb250aCg1KS51dGNPZmZzZXQoKSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGF5IDogZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICB2YXIgZGF5ID0gdGhpcy5faXNVVEMgPyB0aGlzLl9kLmdldFVUQ0RheSgpIDogdGhpcy5fZC5nZXREYXkoKTtcbiAgICAgICAgICAgIGlmIChpbnB1dCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaW5wdXQgPSBwYXJzZVdlZWtkYXkoaW5wdXQsIHRoaXMubG9jYWxlRGF0YSgpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hZGQoaW5wdXQgLSBkYXksICdkJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYXk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgbW9udGggOiBtYWtlQWNjZXNzb3IoJ01vbnRoJywgdHJ1ZSksXG5cbiAgICAgICAgc3RhcnRPZiA6IGZ1bmN0aW9uICh1bml0cykge1xuICAgICAgICAgICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyk7XG4gICAgICAgICAgICAvLyB0aGUgZm9sbG93aW5nIHN3aXRjaCBpbnRlbnRpb25hbGx5IG9taXRzIGJyZWFrIGtleXdvcmRzXG4gICAgICAgICAgICAvLyB0byB1dGlsaXplIGZhbGxpbmcgdGhyb3VnaCB0aGUgY2FzZXMuXG4gICAgICAgICAgICBzd2l0Y2ggKHVuaXRzKSB7XG4gICAgICAgICAgICBjYXNlICd5ZWFyJzpcbiAgICAgICAgICAgICAgICB0aGlzLm1vbnRoKDApO1xuICAgICAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgICAgIGNhc2UgJ3F1YXJ0ZXInOlxuICAgICAgICAgICAgY2FzZSAnbW9udGgnOlxuICAgICAgICAgICAgICAgIHRoaXMuZGF0ZSgxKTtcbiAgICAgICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICAgICAgICBjYXNlICd3ZWVrJzpcbiAgICAgICAgICAgIGNhc2UgJ2lzb1dlZWsnOlxuICAgICAgICAgICAgY2FzZSAnZGF5JzpcbiAgICAgICAgICAgICAgICB0aGlzLmhvdXJzKDApO1xuICAgICAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgICAgIGNhc2UgJ2hvdXInOlxuICAgICAgICAgICAgICAgIHRoaXMubWludXRlcygwKTtcbiAgICAgICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICAgICAgICBjYXNlICdtaW51dGUnOlxuICAgICAgICAgICAgICAgIHRoaXMuc2Vjb25kcygwKTtcbiAgICAgICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICAgICAgICBjYXNlICdzZWNvbmQnOlxuICAgICAgICAgICAgICAgIHRoaXMubWlsbGlzZWNvbmRzKDApO1xuICAgICAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gd2Vla3MgYXJlIGEgc3BlY2lhbCBjYXNlXG4gICAgICAgICAgICBpZiAodW5pdHMgPT09ICd3ZWVrJykge1xuICAgICAgICAgICAgICAgIHRoaXMud2Vla2RheSgwKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodW5pdHMgPT09ICdpc29XZWVrJykge1xuICAgICAgICAgICAgICAgIHRoaXMuaXNvV2Vla2RheSgxKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gcXVhcnRlcnMgYXJlIGFsc28gc3BlY2lhbFxuICAgICAgICAgICAgaWYgKHVuaXRzID09PSAncXVhcnRlcicpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1vbnRoKE1hdGguZmxvb3IodGhpcy5tb250aCgpIC8gMykgKiAzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZW5kT2Y6IGZ1bmN0aW9uICh1bml0cykge1xuICAgICAgICAgICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyk7XG4gICAgICAgICAgICBpZiAodW5pdHMgPT09IHVuZGVmaW5lZCB8fCB1bml0cyA9PT0gJ21pbGxpc2Vjb25kJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RhcnRPZih1bml0cykuYWRkKDEsICh1bml0cyA9PT0gJ2lzb1dlZWsnID8gJ3dlZWsnIDogdW5pdHMpKS5zdWJ0cmFjdCgxLCAnbXMnKTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc0FmdGVyOiBmdW5jdGlvbiAoaW5wdXQsIHVuaXRzKSB7XG4gICAgICAgICAgICB2YXIgaW5wdXRNcztcbiAgICAgICAgICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModHlwZW9mIHVuaXRzICE9PSAndW5kZWZpbmVkJyA/IHVuaXRzIDogJ21pbGxpc2Vjb25kJyk7XG4gICAgICAgICAgICBpZiAodW5pdHMgPT09ICdtaWxsaXNlY29uZCcpIHtcbiAgICAgICAgICAgICAgICBpbnB1dCA9IG1vbWVudC5pc01vbWVudChpbnB1dCkgPyBpbnB1dCA6IG1vbWVudChpbnB1dCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICt0aGlzID4gK2lucHV0O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpbnB1dE1zID0gbW9tZW50LmlzTW9tZW50KGlucHV0KSA/ICtpbnB1dCA6ICttb21lbnQoaW5wdXQpO1xuICAgICAgICAgICAgICAgIHJldHVybiBpbnB1dE1zIDwgK3RoaXMuY2xvbmUoKS5zdGFydE9mKHVuaXRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBpc0JlZm9yZTogZnVuY3Rpb24gKGlucHV0LCB1bml0cykge1xuICAgICAgICAgICAgdmFyIGlucHV0TXM7XG4gICAgICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHR5cGVvZiB1bml0cyAhPT0gJ3VuZGVmaW5lZCcgPyB1bml0cyA6ICdtaWxsaXNlY29uZCcpO1xuICAgICAgICAgICAgaWYgKHVuaXRzID09PSAnbWlsbGlzZWNvbmQnKSB7XG4gICAgICAgICAgICAgICAgaW5wdXQgPSBtb21lbnQuaXNNb21lbnQoaW5wdXQpID8gaW5wdXQgOiBtb21lbnQoaW5wdXQpO1xuICAgICAgICAgICAgICAgIHJldHVybiArdGhpcyA8ICtpbnB1dDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaW5wdXRNcyA9IG1vbWVudC5pc01vbWVudChpbnB1dCkgPyAraW5wdXQgOiArbW9tZW50KGlucHV0KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gK3RoaXMuY2xvbmUoKS5lbmRPZih1bml0cykgPCBpbnB1dE1zO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGlzQmV0d2VlbjogZnVuY3Rpb24gKGZyb20sIHRvLCB1bml0cykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaXNBZnRlcihmcm9tLCB1bml0cykgJiYgdGhpcy5pc0JlZm9yZSh0bywgdW5pdHMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGlzU2FtZTogZnVuY3Rpb24gKGlucHV0LCB1bml0cykge1xuICAgICAgICAgICAgdmFyIGlucHV0TXM7XG4gICAgICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzIHx8ICdtaWxsaXNlY29uZCcpO1xuICAgICAgICAgICAgaWYgKHVuaXRzID09PSAnbWlsbGlzZWNvbmQnKSB7XG4gICAgICAgICAgICAgICAgaW5wdXQgPSBtb21lbnQuaXNNb21lbnQoaW5wdXQpID8gaW5wdXQgOiBtb21lbnQoaW5wdXQpO1xuICAgICAgICAgICAgICAgIHJldHVybiArdGhpcyA9PT0gK2lucHV0O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpbnB1dE1zID0gK21vbWVudChpbnB1dCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICsodGhpcy5jbG9uZSgpLnN0YXJ0T2YodW5pdHMpKSA8PSBpbnB1dE1zICYmIGlucHV0TXMgPD0gKyh0aGlzLmNsb25lKCkuZW5kT2YodW5pdHMpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBtaW46IGRlcHJlY2F0ZShcbiAgICAgICAgICAgICAgICAgJ21vbWVudCgpLm1pbiBpcyBkZXByZWNhdGVkLCB1c2UgbW9tZW50Lm1pbiBpbnN0ZWFkLiBodHRwczovL2dpdGh1Yi5jb20vbW9tZW50L21vbWVudC9pc3N1ZXMvMTU0OCcsXG4gICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChvdGhlcikge1xuICAgICAgICAgICAgICAgICAgICAgb3RoZXIgPSBtb21lbnQuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgIHJldHVybiBvdGhlciA8IHRoaXMgPyB0aGlzIDogb3RoZXI7XG4gICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICksXG5cbiAgICAgICAgbWF4OiBkZXByZWNhdGUoXG4gICAgICAgICAgICAgICAgJ21vbWVudCgpLm1heCBpcyBkZXByZWNhdGVkLCB1c2UgbW9tZW50Lm1heCBpbnN0ZWFkLiBodHRwczovL2dpdGh1Yi5jb20vbW9tZW50L21vbWVudC9pc3N1ZXMvMTU0OCcsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKG90aGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIG90aGVyID0gbW9tZW50LmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvdGhlciA+IHRoaXMgPyB0aGlzIDogb3RoZXI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICApLFxuXG4gICAgICAgIHpvbmUgOiBkZXByZWNhdGUoXG4gICAgICAgICAgICAgICAgJ21vbWVudCgpLnpvbmUgaXMgZGVwcmVjYXRlZCwgdXNlIG1vbWVudCgpLnV0Y09mZnNldCBpbnN0ZWFkLiAnICtcbiAgICAgICAgICAgICAgICAnaHR0cHM6Ly9naXRodWIuY29tL21vbWVudC9tb21lbnQvaXNzdWVzLzE3NzknLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChpbnB1dCwga2VlcExvY2FsVGltZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnB1dCA9IC1pbnB1dDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51dGNPZmZzZXQoaW5wdXQsIGtlZXBMb2NhbFRpbWUpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAtdGhpcy51dGNPZmZzZXQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgKSxcblxuICAgICAgICAvLyBrZWVwTG9jYWxUaW1lID0gdHJ1ZSBtZWFucyBvbmx5IGNoYW5nZSB0aGUgdGltZXpvbmUsIHdpdGhvdXRcbiAgICAgICAgLy8gYWZmZWN0aW5nIHRoZSBsb2NhbCBob3VyLiBTbyA1OjMxOjI2ICswMzAwIC0tW3V0Y09mZnNldCgyLCB0cnVlKV0tLT5cbiAgICAgICAgLy8gNTozMToyNiArMDIwMCBJdCBpcyBwb3NzaWJsZSB0aGF0IDU6MzE6MjYgZG9lc24ndCBleGlzdCB3aXRoIG9mZnNldFxuICAgICAgICAvLyArMDIwMCwgc28gd2UgYWRqdXN0IHRoZSB0aW1lIGFzIG5lZWRlZCwgdG8gYmUgdmFsaWQuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEtlZXBpbmcgdGhlIHRpbWUgYWN0dWFsbHkgYWRkcy9zdWJ0cmFjdHMgKG9uZSBob3VyKVxuICAgICAgICAvLyBmcm9tIHRoZSBhY3R1YWwgcmVwcmVzZW50ZWQgdGltZS4gVGhhdCBpcyB3aHkgd2UgY2FsbCB1cGRhdGVPZmZzZXRcbiAgICAgICAgLy8gYSBzZWNvbmQgdGltZS4gSW4gY2FzZSBpdCB3YW50cyB1cyB0byBjaGFuZ2UgdGhlIG9mZnNldCBhZ2FpblxuICAgICAgICAvLyBfY2hhbmdlSW5Qcm9ncmVzcyA9PSB0cnVlIGNhc2UsIHRoZW4gd2UgaGF2ZSB0byBhZGp1c3QsIGJlY2F1c2VcbiAgICAgICAgLy8gdGhlcmUgaXMgbm8gc3VjaCB0aW1lIGluIHRoZSBnaXZlbiB0aW1lem9uZS5cbiAgICAgICAgdXRjT2Zmc2V0IDogZnVuY3Rpb24gKGlucHV0LCBrZWVwTG9jYWxUaW1lKSB7XG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gdGhpcy5fb2Zmc2V0IHx8IDAsXG4gICAgICAgICAgICAgICAgbG9jYWxBZGp1c3Q7XG4gICAgICAgICAgICBpZiAoaW5wdXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlucHV0ID0gdXRjT2Zmc2V0RnJvbVN0cmluZyhpbnB1dCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhpbnB1dCkgPCAxNikge1xuICAgICAgICAgICAgICAgICAgICBpbnB1dCA9IGlucHV0ICogNjA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5faXNVVEMgJiYga2VlcExvY2FsVGltZSkge1xuICAgICAgICAgICAgICAgICAgICBsb2NhbEFkanVzdCA9IHRoaXMuX2RhdGVVdGNPZmZzZXQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5fb2Zmc2V0ID0gaW5wdXQ7XG4gICAgICAgICAgICAgICAgdGhpcy5faXNVVEMgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGlmIChsb2NhbEFkanVzdCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkKGxvY2FsQWRqdXN0LCAnbScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAob2Zmc2V0ICE9PSBpbnB1dCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWtlZXBMb2NhbFRpbWUgfHwgdGhpcy5fY2hhbmdlSW5Qcm9ncmVzcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWRkT3JTdWJ0cmFjdER1cmF0aW9uRnJvbU1vbWVudCh0aGlzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb21lbnQuZHVyYXRpb24oaW5wdXQgLSBvZmZzZXQsICdtJyksIDEsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICghdGhpcy5fY2hhbmdlSW5Qcm9ncmVzcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2hhbmdlSW5Qcm9ncmVzcyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBtb21lbnQudXBkYXRlT2Zmc2V0KHRoaXMsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2hhbmdlSW5Qcm9ncmVzcyA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lzVVRDID8gb2Zmc2V0IDogdGhpcy5fZGF0ZVV0Y09mZnNldCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGlzTG9jYWwgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gIXRoaXMuX2lzVVRDO1xuICAgICAgICB9LFxuXG4gICAgICAgIGlzVXRjT2Zmc2V0IDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lzVVRDO1xuICAgICAgICB9LFxuXG4gICAgICAgIGlzVXRjIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lzVVRDICYmIHRoaXMuX29mZnNldCA9PT0gMDtcbiAgICAgICAgfSxcblxuICAgICAgICB6b25lQWJiciA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pc1VUQyA/ICdVVEMnIDogJyc7XG4gICAgICAgIH0sXG5cbiAgICAgICAgem9uZU5hbWUgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faXNVVEMgPyAnQ29vcmRpbmF0ZWQgVW5pdmVyc2FsIFRpbWUnIDogJyc7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGFyc2Vab25lIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3R6bSkge1xuICAgICAgICAgICAgICAgIHRoaXMudXRjT2Zmc2V0KHRoaXMuX3R6bSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB0aGlzLl9pID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHRoaXMudXRjT2Zmc2V0KHV0Y09mZnNldEZyb21TdHJpbmcodGhpcy5faSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaGFzQWxpZ25lZEhvdXJPZmZzZXQgOiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgICAgIGlmICghaW5wdXQpIHtcbiAgICAgICAgICAgICAgICBpbnB1dCA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpbnB1dCA9IG1vbWVudChpbnB1dCkudXRjT2Zmc2V0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAodGhpcy51dGNPZmZzZXQoKSAtIGlucHV0KSAlIDYwID09PSAwO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRheXNJbk1vbnRoIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGRheXNJbk1vbnRoKHRoaXMueWVhcigpLCB0aGlzLm1vbnRoKCkpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRheU9mWWVhciA6IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgdmFyIGRheU9mWWVhciA9IHJvdW5kKChtb21lbnQodGhpcykuc3RhcnRPZignZGF5JykgLSBtb21lbnQodGhpcykuc3RhcnRPZigneWVhcicpKSAvIDg2NGU1KSArIDE7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IGRheU9mWWVhciA6IHRoaXMuYWRkKChpbnB1dCAtIGRheU9mWWVhciksICdkJyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcXVhcnRlciA6IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyBNYXRoLmNlaWwoKHRoaXMubW9udGgoKSArIDEpIC8gMykgOiB0aGlzLm1vbnRoKChpbnB1dCAtIDEpICogMyArIHRoaXMubW9udGgoKSAlIDMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHdlZWtZZWFyIDogZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICB2YXIgeWVhciA9IHdlZWtPZlllYXIodGhpcywgdGhpcy5sb2NhbGVEYXRhKCkuX3dlZWsuZG93LCB0aGlzLmxvY2FsZURhdGEoKS5fd2Vlay5kb3kpLnllYXI7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IHllYXIgOiB0aGlzLmFkZCgoaW5wdXQgLSB5ZWFyKSwgJ3knKTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc29XZWVrWWVhciA6IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgdmFyIHllYXIgPSB3ZWVrT2ZZZWFyKHRoaXMsIDEsIDQpLnllYXI7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IHllYXIgOiB0aGlzLmFkZCgoaW5wdXQgLSB5ZWFyKSwgJ3knKTtcbiAgICAgICAgfSxcblxuICAgICAgICB3ZWVrIDogZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICB2YXIgd2VlayA9IHRoaXMubG9jYWxlRGF0YSgpLndlZWsodGhpcyk7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IHdlZWsgOiB0aGlzLmFkZCgoaW5wdXQgLSB3ZWVrKSAqIDcsICdkJyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNvV2VlayA6IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgdmFyIHdlZWsgPSB3ZWVrT2ZZZWFyKHRoaXMsIDEsIDQpLndlZWs7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IHdlZWsgOiB0aGlzLmFkZCgoaW5wdXQgLSB3ZWVrKSAqIDcsICdkJyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgd2Vla2RheSA6IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgdmFyIHdlZWtkYXkgPSAodGhpcy5kYXkoKSArIDcgLSB0aGlzLmxvY2FsZURhdGEoKS5fd2Vlay5kb3cpICUgNztcbiAgICAgICAgICAgIHJldHVybiBpbnB1dCA9PSBudWxsID8gd2Vla2RheSA6IHRoaXMuYWRkKGlucHV0IC0gd2Vla2RheSwgJ2QnKTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc29XZWVrZGF5IDogZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICAvLyBiZWhhdmVzIHRoZSBzYW1lIGFzIG1vbWVudCNkYXkgZXhjZXB0XG4gICAgICAgICAgICAvLyBhcyBhIGdldHRlciwgcmV0dXJucyA3IGluc3RlYWQgb2YgMCAoMS03IHJhbmdlIGluc3RlYWQgb2YgMC02KVxuICAgICAgICAgICAgLy8gYXMgYSBzZXR0ZXIsIHN1bmRheSBzaG91bGQgYmVsb25nIHRvIHRoZSBwcmV2aW91cyB3ZWVrLlxuICAgICAgICAgICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyB0aGlzLmRheSgpIHx8IDcgOiB0aGlzLmRheSh0aGlzLmRheSgpICUgNyA/IGlucHV0IDogaW5wdXQgLSA3KTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc29XZWVrc0luWWVhciA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB3ZWVrc0luWWVhcih0aGlzLnllYXIoKSwgMSwgNCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgd2Vla3NJblllYXIgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgd2Vla0luZm8gPSB0aGlzLmxvY2FsZURhdGEoKS5fd2VlaztcbiAgICAgICAgICAgIHJldHVybiB3ZWVrc0luWWVhcih0aGlzLnllYXIoKSwgd2Vla0luZm8uZG93LCB3ZWVrSW5mby5kb3kpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldCA6IGZ1bmN0aW9uICh1bml0cykge1xuICAgICAgICAgICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyk7XG4gICAgICAgICAgICByZXR1cm4gdGhpc1t1bml0c10oKTtcbiAgICAgICAgfSxcblxuICAgICAgICBzZXQgOiBmdW5jdGlvbiAodW5pdHMsIHZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgdW5pdDtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdW5pdHMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgZm9yICh1bml0IGluIHVuaXRzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0KHVuaXQsIHVuaXRzW3VuaXRdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHRoaXNbdW5pdHNdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXNbdW5pdHNdKHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBJZiBwYXNzZWQgYSBsb2NhbGUga2V5LCBpdCB3aWxsIHNldCB0aGUgbG9jYWxlIGZvciB0aGlzXG4gICAgICAgIC8vIGluc3RhbmNlLiAgT3RoZXJ3aXNlLCBpdCB3aWxsIHJldHVybiB0aGUgbG9jYWxlIGNvbmZpZ3VyYXRpb25cbiAgICAgICAgLy8gdmFyaWFibGVzIGZvciB0aGlzIGluc3RhbmNlLlxuICAgICAgICBsb2NhbGUgOiBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICB2YXIgbmV3TG9jYWxlRGF0YTtcblxuICAgICAgICAgICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2xvY2FsZS5fYWJicjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbmV3TG9jYWxlRGF0YSA9IG1vbWVudC5sb2NhbGVEYXRhKGtleSk7XG4gICAgICAgICAgICAgICAgaWYgKG5ld0xvY2FsZURhdGEgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9sb2NhbGUgPSBuZXdMb2NhbGVEYXRhO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBsYW5nIDogZGVwcmVjYXRlKFxuICAgICAgICAgICAgJ21vbWVudCgpLmxhbmcoKSBpcyBkZXByZWNhdGVkLiBJbnN0ZWFkLCB1c2UgbW9tZW50KCkubG9jYWxlRGF0YSgpIHRvIGdldCB0aGUgbGFuZ3VhZ2UgY29uZmlndXJhdGlvbi4gVXNlIG1vbWVudCgpLmxvY2FsZSgpIHRvIGNoYW5nZSBsYW5ndWFnZXMuJyxcbiAgICAgICAgICAgIGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmxvY2FsZShrZXkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgKSxcblxuICAgICAgICBsb2NhbGVEYXRhIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2xvY2FsZTtcbiAgICAgICAgfSxcblxuICAgICAgICBfZGF0ZVV0Y09mZnNldCA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIE9uIEZpcmVmb3guMjQgRGF0ZSNnZXRUaW1lem9uZU9mZnNldCByZXR1cm5zIGEgZmxvYXRpbmcgcG9pbnQuXG4gICAgICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vbW9tZW50L21vbWVudC9wdWxsLzE4NzFcbiAgICAgICAgICAgIHJldHVybiAtTWF0aC5yb3VuZCh0aGlzLl9kLmdldFRpbWV6b25lT2Zmc2V0KCkgLyAxNSkgKiAxNTtcbiAgICAgICAgfVxuXG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiByYXdNb250aFNldHRlcihtb20sIHZhbHVlKSB7XG4gICAgICAgIHZhciBkYXlPZk1vbnRoO1xuXG4gICAgICAgIC8vIFRPRE86IE1vdmUgdGhpcyBvdXQgb2YgaGVyZSFcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHZhbHVlID0gbW9tLmxvY2FsZURhdGEoKS5tb250aHNQYXJzZSh2YWx1ZSk7XG4gICAgICAgICAgICAvLyBUT0RPOiBBbm90aGVyIHNpbGVudCBmYWlsdXJlP1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbW9tO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZGF5T2ZNb250aCA9IE1hdGgubWluKG1vbS5kYXRlKCksXG4gICAgICAgICAgICAgICAgZGF5c0luTW9udGgobW9tLnllYXIoKSwgdmFsdWUpKTtcbiAgICAgICAgbW9tLl9kWydzZXQnICsgKG1vbS5faXNVVEMgPyAnVVRDJyA6ICcnKSArICdNb250aCddKHZhbHVlLCBkYXlPZk1vbnRoKTtcbiAgICAgICAgcmV0dXJuIG1vbTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByYXdHZXR0ZXIobW9tLCB1bml0KSB7XG4gICAgICAgIHJldHVybiBtb20uX2RbJ2dldCcgKyAobW9tLl9pc1VUQyA/ICdVVEMnIDogJycpICsgdW5pdF0oKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByYXdTZXR0ZXIobW9tLCB1bml0LCB2YWx1ZSkge1xuICAgICAgICBpZiAodW5pdCA9PT0gJ01vbnRoJykge1xuICAgICAgICAgICAgcmV0dXJuIHJhd01vbnRoU2V0dGVyKG1vbSwgdmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG1vbS5fZFsnc2V0JyArIChtb20uX2lzVVRDID8gJ1VUQycgOiAnJykgKyB1bml0XSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYWtlQWNjZXNzb3IodW5pdCwga2VlcFRpbWUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICByYXdTZXR0ZXIodGhpcywgdW5pdCwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIG1vbWVudC51cGRhdGVPZmZzZXQodGhpcywga2VlcFRpbWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmF3R2V0dGVyKHRoaXMsIHVuaXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIG1vbWVudC5mbi5taWxsaXNlY29uZCA9IG1vbWVudC5mbi5taWxsaXNlY29uZHMgPSBtYWtlQWNjZXNzb3IoJ01pbGxpc2Vjb25kcycsIGZhbHNlKTtcbiAgICBtb21lbnQuZm4uc2Vjb25kID0gbW9tZW50LmZuLnNlY29uZHMgPSBtYWtlQWNjZXNzb3IoJ1NlY29uZHMnLCBmYWxzZSk7XG4gICAgbW9tZW50LmZuLm1pbnV0ZSA9IG1vbWVudC5mbi5taW51dGVzID0gbWFrZUFjY2Vzc29yKCdNaW51dGVzJywgZmFsc2UpO1xuICAgIC8vIFNldHRpbmcgdGhlIGhvdXIgc2hvdWxkIGtlZXAgdGhlIHRpbWUsIGJlY2F1c2UgdGhlIHVzZXIgZXhwbGljaXRseVxuICAgIC8vIHNwZWNpZmllZCB3aGljaCBob3VyIGhlIHdhbnRzLiBTbyB0cnlpbmcgdG8gbWFpbnRhaW4gdGhlIHNhbWUgaG91ciAoaW5cbiAgICAvLyBhIG5ldyB0aW1lem9uZSkgbWFrZXMgc2Vuc2UuIEFkZGluZy9zdWJ0cmFjdGluZyBob3VycyBkb2VzIG5vdCBmb2xsb3dcbiAgICAvLyB0aGlzIHJ1bGUuXG4gICAgbW9tZW50LmZuLmhvdXIgPSBtb21lbnQuZm4uaG91cnMgPSBtYWtlQWNjZXNzb3IoJ0hvdXJzJywgdHJ1ZSk7XG4gICAgLy8gbW9tZW50LmZuLm1vbnRoIGlzIGRlZmluZWQgc2VwYXJhdGVseVxuICAgIG1vbWVudC5mbi5kYXRlID0gbWFrZUFjY2Vzc29yKCdEYXRlJywgdHJ1ZSk7XG4gICAgbW9tZW50LmZuLmRhdGVzID0gZGVwcmVjYXRlKCdkYXRlcyBhY2Nlc3NvciBpcyBkZXByZWNhdGVkLiBVc2UgZGF0ZSBpbnN0ZWFkLicsIG1ha2VBY2Nlc3NvcignRGF0ZScsIHRydWUpKTtcbiAgICBtb21lbnQuZm4ueWVhciA9IG1ha2VBY2Nlc3NvcignRnVsbFllYXInLCB0cnVlKTtcbiAgICBtb21lbnQuZm4ueWVhcnMgPSBkZXByZWNhdGUoJ3llYXJzIGFjY2Vzc29yIGlzIGRlcHJlY2F0ZWQuIFVzZSB5ZWFyIGluc3RlYWQuJywgbWFrZUFjY2Vzc29yKCdGdWxsWWVhcicsIHRydWUpKTtcblxuICAgIC8vIGFkZCBwbHVyYWwgbWV0aG9kc1xuICAgIG1vbWVudC5mbi5kYXlzID0gbW9tZW50LmZuLmRheTtcbiAgICBtb21lbnQuZm4ubW9udGhzID0gbW9tZW50LmZuLm1vbnRoO1xuICAgIG1vbWVudC5mbi53ZWVrcyA9IG1vbWVudC5mbi53ZWVrO1xuICAgIG1vbWVudC5mbi5pc29XZWVrcyA9IG1vbWVudC5mbi5pc29XZWVrO1xuICAgIG1vbWVudC5mbi5xdWFydGVycyA9IG1vbWVudC5mbi5xdWFydGVyO1xuXG4gICAgLy8gYWRkIGFsaWFzZWQgZm9ybWF0IG1ldGhvZHNcbiAgICBtb21lbnQuZm4udG9KU09OID0gbW9tZW50LmZuLnRvSVNPU3RyaW5nO1xuXG4gICAgLy8gYWxpYXMgaXNVdGMgZm9yIGRldi1mcmllbmRsaW5lc3NcbiAgICBtb21lbnQuZm4uaXNVVEMgPSBtb21lbnQuZm4uaXNVdGM7XG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIER1cmF0aW9uIFByb3RvdHlwZVxuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXG4gICAgZnVuY3Rpb24gZGF5c1RvWWVhcnMgKGRheXMpIHtcbiAgICAgICAgLy8gNDAwIHllYXJzIGhhdmUgMTQ2MDk3IGRheXMgKHRha2luZyBpbnRvIGFjY291bnQgbGVhcCB5ZWFyIHJ1bGVzKVxuICAgICAgICByZXR1cm4gZGF5cyAqIDQwMCAvIDE0NjA5NztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB5ZWFyc1RvRGF5cyAoeWVhcnMpIHtcbiAgICAgICAgLy8geWVhcnMgKiAzNjUgKyBhYnNSb3VuZCh5ZWFycyAvIDQpIC1cbiAgICAgICAgLy8gICAgIGFic1JvdW5kKHllYXJzIC8gMTAwKSArIGFic1JvdW5kKHllYXJzIC8gNDAwKTtcbiAgICAgICAgcmV0dXJuIHllYXJzICogMTQ2MDk3IC8gNDAwO1xuICAgIH1cblxuICAgIGV4dGVuZChtb21lbnQuZHVyYXRpb24uZm4gPSBEdXJhdGlvbi5wcm90b3R5cGUsIHtcblxuICAgICAgICBfYnViYmxlIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIG1pbGxpc2Vjb25kcyA9IHRoaXMuX21pbGxpc2Vjb25kcyxcbiAgICAgICAgICAgICAgICBkYXlzID0gdGhpcy5fZGF5cyxcbiAgICAgICAgICAgICAgICBtb250aHMgPSB0aGlzLl9tb250aHMsXG4gICAgICAgICAgICAgICAgZGF0YSA9IHRoaXMuX2RhdGEsXG4gICAgICAgICAgICAgICAgc2Vjb25kcywgbWludXRlcywgaG91cnMsIHllYXJzID0gMDtcblxuICAgICAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBjb2RlIGJ1YmJsZXMgdXAgdmFsdWVzLCBzZWUgdGhlIHRlc3RzIGZvclxuICAgICAgICAgICAgLy8gZXhhbXBsZXMgb2Ygd2hhdCB0aGF0IG1lYW5zLlxuICAgICAgICAgICAgZGF0YS5taWxsaXNlY29uZHMgPSBtaWxsaXNlY29uZHMgJSAxMDAwO1xuXG4gICAgICAgICAgICBzZWNvbmRzID0gYWJzUm91bmQobWlsbGlzZWNvbmRzIC8gMTAwMCk7XG4gICAgICAgICAgICBkYXRhLnNlY29uZHMgPSBzZWNvbmRzICUgNjA7XG5cbiAgICAgICAgICAgIG1pbnV0ZXMgPSBhYnNSb3VuZChzZWNvbmRzIC8gNjApO1xuICAgICAgICAgICAgZGF0YS5taW51dGVzID0gbWludXRlcyAlIDYwO1xuXG4gICAgICAgICAgICBob3VycyA9IGFic1JvdW5kKG1pbnV0ZXMgLyA2MCk7XG4gICAgICAgICAgICBkYXRhLmhvdXJzID0gaG91cnMgJSAyNDtcblxuICAgICAgICAgICAgZGF5cyArPSBhYnNSb3VuZChob3VycyAvIDI0KTtcblxuICAgICAgICAgICAgLy8gQWNjdXJhdGVseSBjb252ZXJ0IGRheXMgdG8geWVhcnMsIGFzc3VtZSBzdGFydCBmcm9tIHllYXIgMC5cbiAgICAgICAgICAgIHllYXJzID0gYWJzUm91bmQoZGF5c1RvWWVhcnMoZGF5cykpO1xuICAgICAgICAgICAgZGF5cyAtPSBhYnNSb3VuZCh5ZWFyc1RvRGF5cyh5ZWFycykpO1xuXG4gICAgICAgICAgICAvLyAzMCBkYXlzIHRvIGEgbW9udGhcbiAgICAgICAgICAgIC8vIFRPRE8gKGlza3Jlbik6IFVzZSBhbmNob3IgZGF0ZSAobGlrZSAxc3QgSmFuKSB0byBjb21wdXRlIHRoaXMuXG4gICAgICAgICAgICBtb250aHMgKz0gYWJzUm91bmQoZGF5cyAvIDMwKTtcbiAgICAgICAgICAgIGRheXMgJT0gMzA7XG5cbiAgICAgICAgICAgIC8vIDEyIG1vbnRocyAtPiAxIHllYXJcbiAgICAgICAgICAgIHllYXJzICs9IGFic1JvdW5kKG1vbnRocyAvIDEyKTtcbiAgICAgICAgICAgIG1vbnRocyAlPSAxMjtcblxuICAgICAgICAgICAgZGF0YS5kYXlzID0gZGF5cztcbiAgICAgICAgICAgIGRhdGEubW9udGhzID0gbW9udGhzO1xuICAgICAgICAgICAgZGF0YS55ZWFycyA9IHllYXJzO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFicyA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuX21pbGxpc2Vjb25kcyA9IE1hdGguYWJzKHRoaXMuX21pbGxpc2Vjb25kcyk7XG4gICAgICAgICAgICB0aGlzLl9kYXlzID0gTWF0aC5hYnModGhpcy5fZGF5cyk7XG4gICAgICAgICAgICB0aGlzLl9tb250aHMgPSBNYXRoLmFicyh0aGlzLl9tb250aHMpO1xuXG4gICAgICAgICAgICB0aGlzLl9kYXRhLm1pbGxpc2Vjb25kcyA9IE1hdGguYWJzKHRoaXMuX2RhdGEubWlsbGlzZWNvbmRzKTtcbiAgICAgICAgICAgIHRoaXMuX2RhdGEuc2Vjb25kcyA9IE1hdGguYWJzKHRoaXMuX2RhdGEuc2Vjb25kcyk7XG4gICAgICAgICAgICB0aGlzLl9kYXRhLm1pbnV0ZXMgPSBNYXRoLmFicyh0aGlzLl9kYXRhLm1pbnV0ZXMpO1xuICAgICAgICAgICAgdGhpcy5fZGF0YS5ob3VycyA9IE1hdGguYWJzKHRoaXMuX2RhdGEuaG91cnMpO1xuICAgICAgICAgICAgdGhpcy5fZGF0YS5tb250aHMgPSBNYXRoLmFicyh0aGlzLl9kYXRhLm1vbnRocyk7XG4gICAgICAgICAgICB0aGlzLl9kYXRhLnllYXJzID0gTWF0aC5hYnModGhpcy5fZGF0YS55ZWFycyk7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIHdlZWtzIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGFic1JvdW5kKHRoaXMuZGF5cygpIC8gNyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdmFsdWVPZiA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9taWxsaXNlY29uZHMgK1xuICAgICAgICAgICAgICB0aGlzLl9kYXlzICogODY0ZTUgK1xuICAgICAgICAgICAgICAodGhpcy5fbW9udGhzICUgMTIpICogMjU5MmU2ICtcbiAgICAgICAgICAgICAgdG9JbnQodGhpcy5fbW9udGhzIC8gMTIpICogMzE1MzZlNjtcbiAgICAgICAgfSxcblxuICAgICAgICBodW1hbml6ZSA6IGZ1bmN0aW9uICh3aXRoU3VmZml4KSB7XG4gICAgICAgICAgICB2YXIgb3V0cHV0ID0gcmVsYXRpdmVUaW1lKHRoaXMsICF3aXRoU3VmZml4LCB0aGlzLmxvY2FsZURhdGEoKSk7XG5cbiAgICAgICAgICAgIGlmICh3aXRoU3VmZml4KSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gdGhpcy5sb2NhbGVEYXRhKCkucGFzdEZ1dHVyZSgrdGhpcywgb3V0cHV0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLnBvc3Rmb3JtYXQob3V0cHV0KTtcbiAgICAgICAgfSxcblxuICAgICAgICBhZGQgOiBmdW5jdGlvbiAoaW5wdXQsIHZhbCkge1xuICAgICAgICAgICAgLy8gc3VwcG9ydHMgb25seSAyLjAtc3R5bGUgYWRkKDEsICdzJykgb3IgYWRkKG1vbWVudClcbiAgICAgICAgICAgIHZhciBkdXIgPSBtb21lbnQuZHVyYXRpb24oaW5wdXQsIHZhbCk7XG5cbiAgICAgICAgICAgIHRoaXMuX21pbGxpc2Vjb25kcyArPSBkdXIuX21pbGxpc2Vjb25kcztcbiAgICAgICAgICAgIHRoaXMuX2RheXMgKz0gZHVyLl9kYXlzO1xuICAgICAgICAgICAgdGhpcy5fbW9udGhzICs9IGR1ci5fbW9udGhzO1xuXG4gICAgICAgICAgICB0aGlzLl9idWJibGUoKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3VidHJhY3QgOiBmdW5jdGlvbiAoaW5wdXQsIHZhbCkge1xuICAgICAgICAgICAgdmFyIGR1ciA9IG1vbWVudC5kdXJhdGlvbihpbnB1dCwgdmFsKTtcblxuICAgICAgICAgICAgdGhpcy5fbWlsbGlzZWNvbmRzIC09IGR1ci5fbWlsbGlzZWNvbmRzO1xuICAgICAgICAgICAgdGhpcy5fZGF5cyAtPSBkdXIuX2RheXM7XG4gICAgICAgICAgICB0aGlzLl9tb250aHMgLT0gZHVyLl9tb250aHM7XG5cbiAgICAgICAgICAgIHRoaXMuX2J1YmJsZSgpO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBnZXQgOiBmdW5jdGlvbiAodW5pdHMpIHtcbiAgICAgICAgICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXNbdW5pdHMudG9Mb3dlckNhc2UoKSArICdzJ10oKTtcbiAgICAgICAgfSxcblxuICAgICAgICBhcyA6IGZ1bmN0aW9uICh1bml0cykge1xuICAgICAgICAgICAgdmFyIGRheXMsIG1vbnRocztcbiAgICAgICAgICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMpO1xuXG4gICAgICAgICAgICBpZiAodW5pdHMgPT09ICdtb250aCcgfHwgdW5pdHMgPT09ICd5ZWFyJykge1xuICAgICAgICAgICAgICAgIGRheXMgPSB0aGlzLl9kYXlzICsgdGhpcy5fbWlsbGlzZWNvbmRzIC8gODY0ZTU7XG4gICAgICAgICAgICAgICAgbW9udGhzID0gdGhpcy5fbW9udGhzICsgZGF5c1RvWWVhcnMoZGF5cykgKiAxMjtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5pdHMgPT09ICdtb250aCcgPyBtb250aHMgOiBtb250aHMgLyAxMjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gaGFuZGxlIG1pbGxpc2Vjb25kcyBzZXBhcmF0ZWx5IGJlY2F1c2Ugb2YgZmxvYXRpbmcgcG9pbnQgbWF0aCBlcnJvcnMgKGlzc3VlICMxODY3KVxuICAgICAgICAgICAgICAgIGRheXMgPSB0aGlzLl9kYXlzICsgTWF0aC5yb3VuZCh5ZWFyc1RvRGF5cyh0aGlzLl9tb250aHMgLyAxMikpO1xuICAgICAgICAgICAgICAgIHN3aXRjaCAodW5pdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnd2Vlayc6IHJldHVybiBkYXlzIC8gNyArIHRoaXMuX21pbGxpc2Vjb25kcyAvIDYwNDhlNTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZGF5JzogcmV0dXJuIGRheXMgKyB0aGlzLl9taWxsaXNlY29uZHMgLyA4NjRlNTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnaG91cic6IHJldHVybiBkYXlzICogMjQgKyB0aGlzLl9taWxsaXNlY29uZHMgLyAzNmU1O1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdtaW51dGUnOiByZXR1cm4gZGF5cyAqIDI0ICogNjAgKyB0aGlzLl9taWxsaXNlY29uZHMgLyA2ZTQ7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3NlY29uZCc6IHJldHVybiBkYXlzICogMjQgKiA2MCAqIDYwICsgdGhpcy5fbWlsbGlzZWNvbmRzIC8gMTAwMDtcbiAgICAgICAgICAgICAgICAgICAgLy8gTWF0aC5mbG9vciBwcmV2ZW50cyBmbG9hdGluZyBwb2ludCBtYXRoIGVycm9ycyBoZXJlXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ21pbGxpc2Vjb25kJzogcmV0dXJuIE1hdGguZmxvb3IoZGF5cyAqIDI0ICogNjAgKiA2MCAqIDEwMDApICsgdGhpcy5fbWlsbGlzZWNvbmRzO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gdW5pdCAnICsgdW5pdHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBsYW5nIDogbW9tZW50LmZuLmxhbmcsXG4gICAgICAgIGxvY2FsZSA6IG1vbWVudC5mbi5sb2NhbGUsXG5cbiAgICAgICAgdG9Jc29TdHJpbmcgOiBkZXByZWNhdGUoXG4gICAgICAgICAgICAndG9Jc29TdHJpbmcoKSBpcyBkZXByZWNhdGVkLiBQbGVhc2UgdXNlIHRvSVNPU3RyaW5nKCkgaW5zdGVhZCAnICtcbiAgICAgICAgICAgICcobm90aWNlIHRoZSBjYXBpdGFscyknLFxuICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnRvSVNPU3RyaW5nKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICksXG5cbiAgICAgICAgdG9JU09TdHJpbmcgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBpbnNwaXJlZCBieSBodHRwczovL2dpdGh1Yi5jb20vZG9yZGlsbGUvbW9tZW50LWlzb2R1cmF0aW9uL2Jsb2IvbWFzdGVyL21vbWVudC5pc29kdXJhdGlvbi5qc1xuICAgICAgICAgICAgdmFyIHllYXJzID0gTWF0aC5hYnModGhpcy55ZWFycygpKSxcbiAgICAgICAgICAgICAgICBtb250aHMgPSBNYXRoLmFicyh0aGlzLm1vbnRocygpKSxcbiAgICAgICAgICAgICAgICBkYXlzID0gTWF0aC5hYnModGhpcy5kYXlzKCkpLFxuICAgICAgICAgICAgICAgIGhvdXJzID0gTWF0aC5hYnModGhpcy5ob3VycygpKSxcbiAgICAgICAgICAgICAgICBtaW51dGVzID0gTWF0aC5hYnModGhpcy5taW51dGVzKCkpLFxuICAgICAgICAgICAgICAgIHNlY29uZHMgPSBNYXRoLmFicyh0aGlzLnNlY29uZHMoKSArIHRoaXMubWlsbGlzZWNvbmRzKCkgLyAxMDAwKTtcblxuICAgICAgICAgICAgaWYgKCF0aGlzLmFzU2Vjb25kcygpKSB7XG4gICAgICAgICAgICAgICAgLy8gdGhpcyBpcyB0aGUgc2FtZSBhcyBDIydzIChOb2RhKSBhbmQgcHl0aG9uIChpc29kYXRlKS4uLlxuICAgICAgICAgICAgICAgIC8vIGJ1dCBub3Qgb3RoZXIgSlMgKGdvb2cuZGF0ZSlcbiAgICAgICAgICAgICAgICByZXR1cm4gJ1AwRCc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAodGhpcy5hc1NlY29uZHMoKSA8IDAgPyAnLScgOiAnJykgK1xuICAgICAgICAgICAgICAgICdQJyArXG4gICAgICAgICAgICAgICAgKHllYXJzID8geWVhcnMgKyAnWScgOiAnJykgK1xuICAgICAgICAgICAgICAgIChtb250aHMgPyBtb250aHMgKyAnTScgOiAnJykgK1xuICAgICAgICAgICAgICAgIChkYXlzID8gZGF5cyArICdEJyA6ICcnKSArXG4gICAgICAgICAgICAgICAgKChob3VycyB8fCBtaW51dGVzIHx8IHNlY29uZHMpID8gJ1QnIDogJycpICtcbiAgICAgICAgICAgICAgICAoaG91cnMgPyBob3VycyArICdIJyA6ICcnKSArXG4gICAgICAgICAgICAgICAgKG1pbnV0ZXMgPyBtaW51dGVzICsgJ00nIDogJycpICtcbiAgICAgICAgICAgICAgICAoc2Vjb25kcyA/IHNlY29uZHMgKyAnUycgOiAnJyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgbG9jYWxlRGF0YSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9sb2NhbGU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdG9KU09OIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudG9JU09TdHJpbmcoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgbW9tZW50LmR1cmF0aW9uLmZuLnRvU3RyaW5nID0gbW9tZW50LmR1cmF0aW9uLmZuLnRvSVNPU3RyaW5nO1xuXG4gICAgZnVuY3Rpb24gbWFrZUR1cmF0aW9uR2V0dGVyKG5hbWUpIHtcbiAgICAgICAgbW9tZW50LmR1cmF0aW9uLmZuW25hbWVdID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGFbbmFtZV07XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZm9yIChpIGluIHVuaXRNaWxsaXNlY29uZEZhY3RvcnMpIHtcbiAgICAgICAgaWYgKGhhc093blByb3AodW5pdE1pbGxpc2Vjb25kRmFjdG9ycywgaSkpIHtcbiAgICAgICAgICAgIG1ha2VEdXJhdGlvbkdldHRlcihpLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbW9tZW50LmR1cmF0aW9uLmZuLmFzTWlsbGlzZWNvbmRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcygnbXMnKTtcbiAgICB9O1xuICAgIG1vbWVudC5kdXJhdGlvbi5mbi5hc1NlY29uZHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFzKCdzJyk7XG4gICAgfTtcbiAgICBtb21lbnQuZHVyYXRpb24uZm4uYXNNaW51dGVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcygnbScpO1xuICAgIH07XG4gICAgbW9tZW50LmR1cmF0aW9uLmZuLmFzSG91cnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFzKCdoJyk7XG4gICAgfTtcbiAgICBtb21lbnQuZHVyYXRpb24uZm4uYXNEYXlzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcygnZCcpO1xuICAgIH07XG4gICAgbW9tZW50LmR1cmF0aW9uLmZuLmFzV2Vla3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFzKCd3ZWVrcycpO1xuICAgIH07XG4gICAgbW9tZW50LmR1cmF0aW9uLmZuLmFzTW9udGhzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcygnTScpO1xuICAgIH07XG4gICAgbW9tZW50LmR1cmF0aW9uLmZuLmFzWWVhcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFzKCd5Jyk7XG4gICAgfTtcblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgRGVmYXVsdCBMb2NhbGVcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblxuICAgIC8vIFNldCBkZWZhdWx0IGxvY2FsZSwgb3RoZXIgbG9jYWxlIHdpbGwgaW5oZXJpdCBmcm9tIEVuZ2xpc2guXG4gICAgbW9tZW50LmxvY2FsZSgnZW4nLCB7XG4gICAgICAgIG9yZGluYWxQYXJzZTogL1xcZHsxLDJ9KHRofHN0fG5kfHJkKS8sXG4gICAgICAgIG9yZGluYWwgOiBmdW5jdGlvbiAobnVtYmVyKSB7XG4gICAgICAgICAgICB2YXIgYiA9IG51bWJlciAlIDEwLFxuICAgICAgICAgICAgICAgIG91dHB1dCA9ICh0b0ludChudW1iZXIgJSAxMDAgLyAxMCkgPT09IDEpID8gJ3RoJyA6XG4gICAgICAgICAgICAgICAgKGIgPT09IDEpID8gJ3N0JyA6XG4gICAgICAgICAgICAgICAgKGIgPT09IDIpID8gJ25kJyA6XG4gICAgICAgICAgICAgICAgKGIgPT09IDMpID8gJ3JkJyA6ICd0aCc7XG4gICAgICAgICAgICByZXR1cm4gbnVtYmVyICsgb3V0cHV0O1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvKiBFTUJFRF9MT0NBTEVTICovXG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIEV4cG9zaW5nIE1vbWVudFxuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgIGZ1bmN0aW9uIG1ha2VHbG9iYWwoc2hvdWxkRGVwcmVjYXRlKSB7XG4gICAgICAgIC8qZ2xvYmFsIGVuZGVyOmZhbHNlICovXG4gICAgICAgIGlmICh0eXBlb2YgZW5kZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgb2xkR2xvYmFsTW9tZW50ID0gZ2xvYmFsU2NvcGUubW9tZW50O1xuICAgICAgICBpZiAoc2hvdWxkRGVwcmVjYXRlKSB7XG4gICAgICAgICAgICBnbG9iYWxTY29wZS5tb21lbnQgPSBkZXByZWNhdGUoXG4gICAgICAgICAgICAgICAgICAgICdBY2Nlc3NpbmcgTW9tZW50IHRocm91Z2ggdGhlIGdsb2JhbCBzY29wZSBpcyAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2RlcHJlY2F0ZWQsIGFuZCB3aWxsIGJlIHJlbW92ZWQgaW4gYW4gdXBjb21pbmcgJyArXG4gICAgICAgICAgICAgICAgICAgICdyZWxlYXNlLicsXG4gICAgICAgICAgICAgICAgICAgIG1vbWVudCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBnbG9iYWxTY29wZS5tb21lbnQgPSBtb21lbnQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDb21tb25KUyBtb2R1bGUgaXMgZGVmaW5lZFxuICAgIGlmIChoYXNNb2R1bGUpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBtb21lbnQ7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKGZ1bmN0aW9uIChyZXF1aXJlLCBleHBvcnRzLCBtb2R1bGUpIHtcbiAgICAgICAgICAgIGlmIChtb2R1bGUuY29uZmlnICYmIG1vZHVsZS5jb25maWcoKSAmJiBtb2R1bGUuY29uZmlnKCkubm9HbG9iYWwgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAvLyByZWxlYXNlIHRoZSBnbG9iYWwgdmFyaWFibGVcbiAgICAgICAgICAgICAgICBnbG9iYWxTY29wZS5tb21lbnQgPSBvbGRHbG9iYWxNb21lbnQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBtb21lbnQ7XG4gICAgICAgIH0pO1xuICAgICAgICBtYWtlR2xvYmFsKHRydWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIG1ha2VHbG9iYWwoKTtcbiAgICB9XG59KS5jYWxsKHRoaXMpO1xuIiwiLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciBFbWl0dGVyID0gcmVxdWlyZSgnZW1pdHRlcicpO1xudmFyIHJlZHVjZSA9IHJlcXVpcmUoJ3JlZHVjZScpO1xuXG4vKipcbiAqIFJvb3QgcmVmZXJlbmNlIGZvciBpZnJhbWVzLlxuICovXG5cbnZhciByb290ID0gJ3VuZGVmaW5lZCcgPT0gdHlwZW9mIHdpbmRvd1xuICA/IHRoaXNcbiAgOiB3aW5kb3c7XG5cbi8qKlxuICogTm9vcC5cbiAqL1xuXG5mdW5jdGlvbiBub29wKCl7fTtcblxuLyoqXG4gKiBDaGVjayBpZiBgb2JqYCBpcyBhIGhvc3Qgb2JqZWN0LFxuICogd2UgZG9uJ3Qgd2FudCB0byBzZXJpYWxpemUgdGhlc2UgOilcbiAqXG4gKiBUT0RPOiBmdXR1cmUgcHJvb2YsIG1vdmUgdG8gY29tcG9lbnQgbGFuZFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBpc0hvc3Qob2JqKSB7XG4gIHZhciBzdHIgPSB7fS50b1N0cmluZy5jYWxsKG9iaik7XG5cbiAgc3dpdGNoIChzdHIpIHtcbiAgICBjYXNlICdbb2JqZWN0IEZpbGVdJzpcbiAgICBjYXNlICdbb2JqZWN0IEJsb2JdJzpcbiAgICBjYXNlICdbb2JqZWN0IEZvcm1EYXRhXSc6XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lIFhIUi5cbiAqL1xuXG5mdW5jdGlvbiBnZXRYSFIoKSB7XG4gIGlmIChyb290LlhNTEh0dHBSZXF1ZXN0XG4gICAgJiYgKCdmaWxlOicgIT0gcm9vdC5sb2NhdGlvbi5wcm90b2NvbCB8fCAhcm9vdC5BY3RpdmVYT2JqZWN0KSkge1xuICAgIHJldHVybiBuZXcgWE1MSHR0cFJlcXVlc3Q7XG4gIH0gZWxzZSB7XG4gICAgdHJ5IHsgcmV0dXJuIG5ldyBBY3RpdmVYT2JqZWN0KCdNaWNyb3NvZnQuWE1MSFRUUCcpOyB9IGNhdGNoKGUpIHt9XG4gICAgdHJ5IHsgcmV0dXJuIG5ldyBBY3RpdmVYT2JqZWN0KCdNc3htbDIuWE1MSFRUUC42LjAnKTsgfSBjYXRjaChlKSB7fVxuICAgIHRyeSB7IHJldHVybiBuZXcgQWN0aXZlWE9iamVjdCgnTXN4bWwyLlhNTEhUVFAuMy4wJyk7IH0gY2F0Y2goZSkge31cbiAgICB0cnkgeyByZXR1cm4gbmV3IEFjdGl2ZVhPYmplY3QoJ01zeG1sMi5YTUxIVFRQJyk7IH0gY2F0Y2goZSkge31cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogUmVtb3ZlcyBsZWFkaW5nIGFuZCB0cmFpbGluZyB3aGl0ZXNwYWNlLCBhZGRlZCB0byBzdXBwb3J0IElFLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG52YXIgdHJpbSA9ICcnLnRyaW1cbiAgPyBmdW5jdGlvbihzKSB7IHJldHVybiBzLnRyaW0oKTsgfVxuICA6IGZ1bmN0aW9uKHMpIHsgcmV0dXJuIHMucmVwbGFjZSgvKF5cXHMqfFxccyokKS9nLCAnJyk7IH07XG5cbi8qKlxuICogQ2hlY2sgaWYgYG9iamAgaXMgYW4gb2JqZWN0LlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBpc09iamVjdChvYmopIHtcbiAgcmV0dXJuIG9iaiA9PT0gT2JqZWN0KG9iaik7XG59XG5cbi8qKlxuICogU2VyaWFsaXplIHRoZSBnaXZlbiBgb2JqYC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzZXJpYWxpemUob2JqKSB7XG4gIGlmICghaXNPYmplY3Qob2JqKSkgcmV0dXJuIG9iajtcbiAgdmFyIHBhaXJzID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICBpZiAobnVsbCAhPSBvYmpba2V5XSkge1xuICAgICAgcGFpcnMucHVzaChlbmNvZGVVUklDb21wb25lbnQoa2V5KVxuICAgICAgICArICc9JyArIGVuY29kZVVSSUNvbXBvbmVudChvYmpba2V5XSkpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcGFpcnMuam9pbignJicpO1xufVxuXG4vKipcbiAqIEV4cG9zZSBzZXJpYWxpemF0aW9uIG1ldGhvZC5cbiAqL1xuXG4gcmVxdWVzdC5zZXJpYWxpemVPYmplY3QgPSBzZXJpYWxpemU7XG5cbiAvKipcbiAgKiBQYXJzZSB0aGUgZ2l2ZW4geC13d3ctZm9ybS11cmxlbmNvZGVkIGBzdHJgLlxuICAqXG4gICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICAqIEByZXR1cm4ge09iamVjdH1cbiAgKiBAYXBpIHByaXZhdGVcbiAgKi9cblxuZnVuY3Rpb24gcGFyc2VTdHJpbmcoc3RyKSB7XG4gIHZhciBvYmogPSB7fTtcbiAgdmFyIHBhaXJzID0gc3RyLnNwbGl0KCcmJyk7XG4gIHZhciBwYXJ0cztcbiAgdmFyIHBhaXI7XG5cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHBhaXJzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgcGFpciA9IHBhaXJzW2ldO1xuICAgIHBhcnRzID0gcGFpci5zcGxpdCgnPScpO1xuICAgIG9ialtkZWNvZGVVUklDb21wb25lbnQocGFydHNbMF0pXSA9IGRlY29kZVVSSUNvbXBvbmVudChwYXJ0c1sxXSk7XG4gIH1cblxuICByZXR1cm4gb2JqO1xufVxuXG4vKipcbiAqIEV4cG9zZSBwYXJzZXIuXG4gKi9cblxucmVxdWVzdC5wYXJzZVN0cmluZyA9IHBhcnNlU3RyaW5nO1xuXG4vKipcbiAqIERlZmF1bHQgTUlNRSB0eXBlIG1hcC5cbiAqXG4gKiAgICAgc3VwZXJhZ2VudC50eXBlcy54bWwgPSAnYXBwbGljYXRpb24veG1sJztcbiAqXG4gKi9cblxucmVxdWVzdC50eXBlcyA9IHtcbiAgaHRtbDogJ3RleHQvaHRtbCcsXG4gIGpzb246ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgeG1sOiAnYXBwbGljYXRpb24veG1sJyxcbiAgdXJsZW5jb2RlZDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcsXG4gICdmb3JtJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcsXG4gICdmb3JtLWRhdGEnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ1xufTtcblxuLyoqXG4gKiBEZWZhdWx0IHNlcmlhbGl6YXRpb24gbWFwLlxuICpcbiAqICAgICBzdXBlcmFnZW50LnNlcmlhbGl6ZVsnYXBwbGljYXRpb24veG1sJ10gPSBmdW5jdGlvbihvYmope1xuICogICAgICAgcmV0dXJuICdnZW5lcmF0ZWQgeG1sIGhlcmUnO1xuICogICAgIH07XG4gKlxuICovXG5cbiByZXF1ZXN0LnNlcmlhbGl6ZSA9IHtcbiAgICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnOiBzZXJpYWxpemUsXG4gICAnYXBwbGljYXRpb24vanNvbic6IEpTT04uc3RyaW5naWZ5XG4gfTtcblxuIC8qKlxuICAqIERlZmF1bHQgcGFyc2Vycy5cbiAgKlxuICAqICAgICBzdXBlcmFnZW50LnBhcnNlWydhcHBsaWNhdGlvbi94bWwnXSA9IGZ1bmN0aW9uKHN0cil7XG4gICogICAgICAgcmV0dXJuIHsgb2JqZWN0IHBhcnNlZCBmcm9tIHN0ciB9O1xuICAqICAgICB9O1xuICAqXG4gICovXG5cbnJlcXVlc3QucGFyc2UgPSB7XG4gICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnOiBwYXJzZVN0cmluZyxcbiAgJ2FwcGxpY2F0aW9uL2pzb24nOiBKU09OLnBhcnNlXG59O1xuXG4vKipcbiAqIFBhcnNlIHRoZSBnaXZlbiBoZWFkZXIgYHN0cmAgaW50b1xuICogYW4gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIG1hcHBlZCBmaWVsZHMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7T2JqZWN0fVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gcGFyc2VIZWFkZXIoc3RyKSB7XG4gIHZhciBsaW5lcyA9IHN0ci5zcGxpdCgvXFxyP1xcbi8pO1xuICB2YXIgZmllbGRzID0ge307XG4gIHZhciBpbmRleDtcbiAgdmFyIGxpbmU7XG4gIHZhciBmaWVsZDtcbiAgdmFyIHZhbDtcblxuICBsaW5lcy5wb3AoKTsgLy8gdHJhaWxpbmcgQ1JMRlxuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBsaW5lcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIGxpbmUgPSBsaW5lc1tpXTtcbiAgICBpbmRleCA9IGxpbmUuaW5kZXhPZignOicpO1xuICAgIGZpZWxkID0gbGluZS5zbGljZSgwLCBpbmRleCkudG9Mb3dlckNhc2UoKTtcbiAgICB2YWwgPSB0cmltKGxpbmUuc2xpY2UoaW5kZXggKyAxKSk7XG4gICAgZmllbGRzW2ZpZWxkXSA9IHZhbDtcbiAgfVxuXG4gIHJldHVybiBmaWVsZHM7XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSBtaW1lIHR5cGUgZm9yIHRoZSBnaXZlbiBgc3RyYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiB0eXBlKHN0cil7XG4gIHJldHVybiBzdHIuc3BsaXQoLyAqOyAqLykuc2hpZnQoKTtcbn07XG5cbi8qKlxuICogUmV0dXJuIGhlYWRlciBmaWVsZCBwYXJhbWV0ZXJzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHBhcmFtcyhzdHIpe1xuICByZXR1cm4gcmVkdWNlKHN0ci5zcGxpdCgvICo7ICovKSwgZnVuY3Rpb24ob2JqLCBzdHIpe1xuICAgIHZhciBwYXJ0cyA9IHN0ci5zcGxpdCgvICo9ICovKVxuICAgICAgLCBrZXkgPSBwYXJ0cy5zaGlmdCgpXG4gICAgICAsIHZhbCA9IHBhcnRzLnNoaWZ0KCk7XG5cbiAgICBpZiAoa2V5ICYmIHZhbCkgb2JqW2tleV0gPSB2YWw7XG4gICAgcmV0dXJuIG9iajtcbiAgfSwge30pO1xufTtcblxuLyoqXG4gKiBJbml0aWFsaXplIGEgbmV3IGBSZXNwb25zZWAgd2l0aCB0aGUgZ2l2ZW4gYHhocmAuXG4gKlxuICogIC0gc2V0IGZsYWdzICgub2ssIC5lcnJvciwgZXRjKVxuICogIC0gcGFyc2UgaGVhZGVyXG4gKlxuICogRXhhbXBsZXM6XG4gKlxuICogIEFsaWFzaW5nIGBzdXBlcmFnZW50YCBhcyBgcmVxdWVzdGAgaXMgbmljZTpcbiAqXG4gKiAgICAgIHJlcXVlc3QgPSBzdXBlcmFnZW50O1xuICpcbiAqICBXZSBjYW4gdXNlIHRoZSBwcm9taXNlLWxpa2UgQVBJLCBvciBwYXNzIGNhbGxiYWNrczpcbiAqXG4gKiAgICAgIHJlcXVlc3QuZ2V0KCcvJykuZW5kKGZ1bmN0aW9uKHJlcyl7fSk7XG4gKiAgICAgIHJlcXVlc3QuZ2V0KCcvJywgZnVuY3Rpb24ocmVzKXt9KTtcbiAqXG4gKiAgU2VuZGluZyBkYXRhIGNhbiBiZSBjaGFpbmVkOlxuICpcbiAqICAgICAgcmVxdWVzdFxuICogICAgICAgIC5wb3N0KCcvdXNlcicpXG4gKiAgICAgICAgLnNlbmQoeyBuYW1lOiAndGonIH0pXG4gKiAgICAgICAgLmVuZChmdW5jdGlvbihyZXMpe30pO1xuICpcbiAqICBPciBwYXNzZWQgdG8gYC5zZW5kKClgOlxuICpcbiAqICAgICAgcmVxdWVzdFxuICogICAgICAgIC5wb3N0KCcvdXNlcicpXG4gKiAgICAgICAgLnNlbmQoeyBuYW1lOiAndGonIH0sIGZ1bmN0aW9uKHJlcyl7fSk7XG4gKlxuICogIE9yIHBhc3NlZCB0byBgLnBvc3QoKWA6XG4gKlxuICogICAgICByZXF1ZXN0XG4gKiAgICAgICAgLnBvc3QoJy91c2VyJywgeyBuYW1lOiAndGonIH0pXG4gKiAgICAgICAgLmVuZChmdW5jdGlvbihyZXMpe30pO1xuICpcbiAqIE9yIGZ1cnRoZXIgcmVkdWNlZCB0byBhIHNpbmdsZSBjYWxsIGZvciBzaW1wbGUgY2FzZXM6XG4gKlxuICogICAgICByZXF1ZXN0XG4gKiAgICAgICAgLnBvc3QoJy91c2VyJywgeyBuYW1lOiAndGonIH0sIGZ1bmN0aW9uKHJlcyl7fSk7XG4gKlxuICogQHBhcmFtIHtYTUxIVFRQUmVxdWVzdH0geGhyXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gUmVzcG9uc2UocmVxLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB0aGlzLnJlcSA9IHJlcTtcbiAgdGhpcy54aHIgPSB0aGlzLnJlcS54aHI7XG4gIHRoaXMudGV4dCA9IHRoaXMucmVxLm1ldGhvZCAhPSdIRUFEJyBcbiAgICAgPyB0aGlzLnhoci5yZXNwb25zZVRleHQgXG4gICAgIDogbnVsbDtcbiAgdGhpcy5zZXRTdGF0dXNQcm9wZXJ0aWVzKHRoaXMueGhyLnN0YXR1cyk7XG4gIHRoaXMuaGVhZGVyID0gdGhpcy5oZWFkZXJzID0gcGFyc2VIZWFkZXIodGhpcy54aHIuZ2V0QWxsUmVzcG9uc2VIZWFkZXJzKCkpO1xuICAvLyBnZXRBbGxSZXNwb25zZUhlYWRlcnMgc29tZXRpbWVzIGZhbHNlbHkgcmV0dXJucyBcIlwiIGZvciBDT1JTIHJlcXVlc3RzLCBidXRcbiAgLy8gZ2V0UmVzcG9uc2VIZWFkZXIgc3RpbGwgd29ya3MuIHNvIHdlIGdldCBjb250ZW50LXR5cGUgZXZlbiBpZiBnZXR0aW5nXG4gIC8vIG90aGVyIGhlYWRlcnMgZmFpbHMuXG4gIHRoaXMuaGVhZGVyWydjb250ZW50LXR5cGUnXSA9IHRoaXMueGhyLmdldFJlc3BvbnNlSGVhZGVyKCdjb250ZW50LXR5cGUnKTtcbiAgdGhpcy5zZXRIZWFkZXJQcm9wZXJ0aWVzKHRoaXMuaGVhZGVyKTtcbiAgdGhpcy5ib2R5ID0gdGhpcy5yZXEubWV0aG9kICE9ICdIRUFEJ1xuICAgID8gdGhpcy5wYXJzZUJvZHkodGhpcy50ZXh0KVxuICAgIDogbnVsbDtcbn1cblxuLyoqXG4gKiBHZXQgY2FzZS1pbnNlbnNpdGl2ZSBgZmllbGRgIHZhbHVlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBmaWVsZFxuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5SZXNwb25zZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24oZmllbGQpe1xuICByZXR1cm4gdGhpcy5oZWFkZXJbZmllbGQudG9Mb3dlckNhc2UoKV07XG59O1xuXG4vKipcbiAqIFNldCBoZWFkZXIgcmVsYXRlZCBwcm9wZXJ0aWVzOlxuICpcbiAqICAgLSBgLnR5cGVgIHRoZSBjb250ZW50IHR5cGUgd2l0aG91dCBwYXJhbXNcbiAqXG4gKiBBIHJlc3BvbnNlIG9mIFwiQ29udGVudC1UeXBlOiB0ZXh0L3BsYWluOyBjaGFyc2V0PXV0Zi04XCJcbiAqIHdpbGwgcHJvdmlkZSB5b3Ugd2l0aCBhIGAudHlwZWAgb2YgXCJ0ZXh0L3BsYWluXCIuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGhlYWRlclxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuUmVzcG9uc2UucHJvdG90eXBlLnNldEhlYWRlclByb3BlcnRpZXMgPSBmdW5jdGlvbihoZWFkZXIpe1xuICAvLyBjb250ZW50LXR5cGVcbiAgdmFyIGN0ID0gdGhpcy5oZWFkZXJbJ2NvbnRlbnQtdHlwZSddIHx8ICcnO1xuICB0aGlzLnR5cGUgPSB0eXBlKGN0KTtcblxuICAvLyBwYXJhbXNcbiAgdmFyIG9iaiA9IHBhcmFtcyhjdCk7XG4gIGZvciAodmFyIGtleSBpbiBvYmopIHRoaXNba2V5XSA9IG9ialtrZXldO1xufTtcblxuLyoqXG4gKiBQYXJzZSB0aGUgZ2l2ZW4gYm9keSBgc3RyYC5cbiAqXG4gKiBVc2VkIGZvciBhdXRvLXBhcnNpbmcgb2YgYm9kaWVzLiBQYXJzZXJzXG4gKiBhcmUgZGVmaW5lZCBvbiB0aGUgYHN1cGVyYWdlbnQucGFyc2VgIG9iamVjdC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtNaXhlZH1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cblJlc3BvbnNlLnByb3RvdHlwZS5wYXJzZUJvZHkgPSBmdW5jdGlvbihzdHIpe1xuICB2YXIgcGFyc2UgPSByZXF1ZXN0LnBhcnNlW3RoaXMudHlwZV07XG4gIHJldHVybiBwYXJzZSAmJiBzdHIgJiYgc3RyLmxlbmd0aFxuICAgID8gcGFyc2Uoc3RyKVxuICAgIDogbnVsbDtcbn07XG5cbi8qKlxuICogU2V0IGZsYWdzIHN1Y2ggYXMgYC5va2AgYmFzZWQgb24gYHN0YXR1c2AuXG4gKlxuICogRm9yIGV4YW1wbGUgYSAyeHggcmVzcG9uc2Ugd2lsbCBnaXZlIHlvdSBhIGAub2tgIG9mIF9fdHJ1ZV9fXG4gKiB3aGVyZWFzIDV4eCB3aWxsIGJlIF9fZmFsc2VfXyBhbmQgYC5lcnJvcmAgd2lsbCBiZSBfX3RydWVfXy4gVGhlXG4gKiBgLmNsaWVudEVycm9yYCBhbmQgYC5zZXJ2ZXJFcnJvcmAgYXJlIGFsc28gYXZhaWxhYmxlIHRvIGJlIG1vcmVcbiAqIHNwZWNpZmljLCBhbmQgYC5zdGF0dXNUeXBlYCBpcyB0aGUgY2xhc3Mgb2YgZXJyb3IgcmFuZ2luZyBmcm9tIDEuLjVcbiAqIHNvbWV0aW1lcyB1c2VmdWwgZm9yIG1hcHBpbmcgcmVzcG9uZCBjb2xvcnMgZXRjLlxuICpcbiAqIFwic3VnYXJcIiBwcm9wZXJ0aWVzIGFyZSBhbHNvIGRlZmluZWQgZm9yIGNvbW1vbiBjYXNlcy4gQ3VycmVudGx5IHByb3ZpZGluZzpcbiAqXG4gKiAgIC0gLm5vQ29udGVudFxuICogICAtIC5iYWRSZXF1ZXN0XG4gKiAgIC0gLnVuYXV0aG9yaXplZFxuICogICAtIC5ub3RBY2NlcHRhYmxlXG4gKiAgIC0gLm5vdEZvdW5kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHN0YXR1c1xuICogQGFwaSBwcml2YXRlXG4gKi9cblxuUmVzcG9uc2UucHJvdG90eXBlLnNldFN0YXR1c1Byb3BlcnRpZXMgPSBmdW5jdGlvbihzdGF0dXMpe1xuICB2YXIgdHlwZSA9IHN0YXR1cyAvIDEwMCB8IDA7XG5cbiAgLy8gc3RhdHVzIC8gY2xhc3NcbiAgdGhpcy5zdGF0dXMgPSBzdGF0dXM7XG4gIHRoaXMuc3RhdHVzVHlwZSA9IHR5cGU7XG5cbiAgLy8gYmFzaWNzXG4gIHRoaXMuaW5mbyA9IDEgPT0gdHlwZTtcbiAgdGhpcy5vayA9IDIgPT0gdHlwZTtcbiAgdGhpcy5jbGllbnRFcnJvciA9IDQgPT0gdHlwZTtcbiAgdGhpcy5zZXJ2ZXJFcnJvciA9IDUgPT0gdHlwZTtcbiAgdGhpcy5lcnJvciA9ICg0ID09IHR5cGUgfHwgNSA9PSB0eXBlKVxuICAgID8gdGhpcy50b0Vycm9yKClcbiAgICA6IGZhbHNlO1xuXG4gIC8vIHN1Z2FyXG4gIHRoaXMuYWNjZXB0ZWQgPSAyMDIgPT0gc3RhdHVzO1xuICB0aGlzLm5vQ29udGVudCA9IDIwNCA9PSBzdGF0dXMgfHwgMTIyMyA9PSBzdGF0dXM7XG4gIHRoaXMuYmFkUmVxdWVzdCA9IDQwMCA9PSBzdGF0dXM7XG4gIHRoaXMudW5hdXRob3JpemVkID0gNDAxID09IHN0YXR1cztcbiAgdGhpcy5ub3RBY2NlcHRhYmxlID0gNDA2ID09IHN0YXR1cztcbiAgdGhpcy5ub3RGb3VuZCA9IDQwNCA9PSBzdGF0dXM7XG4gIHRoaXMuZm9yYmlkZGVuID0gNDAzID09IHN0YXR1cztcbn07XG5cbi8qKlxuICogUmV0dXJuIGFuIGBFcnJvcmAgcmVwcmVzZW50YXRpdmUgb2YgdGhpcyByZXNwb25zZS5cbiAqXG4gKiBAcmV0dXJuIHtFcnJvcn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVzcG9uc2UucHJvdG90eXBlLnRvRXJyb3IgPSBmdW5jdGlvbigpe1xuICB2YXIgcmVxID0gdGhpcy5yZXE7XG4gIHZhciBtZXRob2QgPSByZXEubWV0aG9kO1xuICB2YXIgdXJsID0gcmVxLnVybDtcblxuICB2YXIgbXNnID0gJ2Nhbm5vdCAnICsgbWV0aG9kICsgJyAnICsgdXJsICsgJyAoJyArIHRoaXMuc3RhdHVzICsgJyknO1xuICB2YXIgZXJyID0gbmV3IEVycm9yKG1zZyk7XG4gIGVyci5zdGF0dXMgPSB0aGlzLnN0YXR1cztcbiAgZXJyLm1ldGhvZCA9IG1ldGhvZDtcbiAgZXJyLnVybCA9IHVybDtcblxuICByZXR1cm4gZXJyO1xufTtcblxuLyoqXG4gKiBFeHBvc2UgYFJlc3BvbnNlYC5cbiAqL1xuXG5yZXF1ZXN0LlJlc3BvbnNlID0gUmVzcG9uc2U7XG5cbi8qKlxuICogSW5pdGlhbGl6ZSBhIG5ldyBgUmVxdWVzdGAgd2l0aCB0aGUgZ2l2ZW4gYG1ldGhvZGAgYW5kIGB1cmxgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBtZXRob2RcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmxcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gUmVxdWVzdChtZXRob2QsIHVybCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIEVtaXR0ZXIuY2FsbCh0aGlzKTtcbiAgdGhpcy5fcXVlcnkgPSB0aGlzLl9xdWVyeSB8fCBbXTtcbiAgdGhpcy5tZXRob2QgPSBtZXRob2Q7XG4gIHRoaXMudXJsID0gdXJsO1xuICB0aGlzLmhlYWRlciA9IHt9O1xuICB0aGlzLl9oZWFkZXIgPSB7fTtcbiAgdGhpcy5vbignZW5kJywgZnVuY3Rpb24oKXtcbiAgICB2YXIgZXJyID0gbnVsbDtcbiAgICB2YXIgcmVzID0gbnVsbDtcblxuICAgIHRyeSB7XG4gICAgICByZXMgPSBuZXcgUmVzcG9uc2Uoc2VsZik7IFxuICAgIH0gY2F0Y2goZSkge1xuICAgICAgZXJyID0gbmV3IEVycm9yKCdQYXJzZXIgaXMgdW5hYmxlIHRvIHBhcnNlIHRoZSByZXNwb25zZScpO1xuICAgICAgZXJyLnBhcnNlID0gdHJ1ZTtcbiAgICAgIGVyci5vcmlnaW5hbCA9IGU7XG4gICAgfVxuXG4gICAgc2VsZi5jYWxsYmFjayhlcnIsIHJlcyk7XG4gIH0pO1xufVxuXG4vKipcbiAqIE1peGluIGBFbWl0dGVyYC5cbiAqL1xuXG5FbWl0dGVyKFJlcXVlc3QucHJvdG90eXBlKTtcblxuLyoqXG4gKiBBbGxvdyBmb3IgZXh0ZW5zaW9uXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUudXNlID0gZnVuY3Rpb24oZm4pIHtcbiAgZm4odGhpcyk7XG4gIHJldHVybiB0aGlzO1xufVxuXG4vKipcbiAqIFNldCB0aW1lb3V0IHRvIGBtc2AuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG1zXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUudGltZW91dCA9IGZ1bmN0aW9uKG1zKXtcbiAgdGhpcy5fdGltZW91dCA9IG1zO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQ2xlYXIgcHJldmlvdXMgdGltZW91dC5cbiAqXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUuY2xlYXJUaW1lb3V0ID0gZnVuY3Rpb24oKXtcbiAgdGhpcy5fdGltZW91dCA9IDA7XG4gIGNsZWFyVGltZW91dCh0aGlzLl90aW1lcik7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBYm9ydCB0aGUgcmVxdWVzdCwgYW5kIGNsZWFyIHBvdGVudGlhbCB0aW1lb3V0LlxuICpcbiAqIEByZXR1cm4ge1JlcXVlc3R9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblJlcXVlc3QucHJvdG90eXBlLmFib3J0ID0gZnVuY3Rpb24oKXtcbiAgaWYgKHRoaXMuYWJvcnRlZCkgcmV0dXJuO1xuICB0aGlzLmFib3J0ZWQgPSB0cnVlO1xuICB0aGlzLnhoci5hYm9ydCgpO1xuICB0aGlzLmNsZWFyVGltZW91dCgpO1xuICB0aGlzLmVtaXQoJ2Fib3J0Jyk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTZXQgaGVhZGVyIGBmaWVsZGAgdG8gYHZhbGAsIG9yIG11bHRpcGxlIGZpZWxkcyB3aXRoIG9uZSBvYmplY3QuXG4gKlxuICogRXhhbXBsZXM6XG4gKlxuICogICAgICByZXEuZ2V0KCcvJylcbiAqICAgICAgICAuc2V0KCdBY2NlcHQnLCAnYXBwbGljYXRpb24vanNvbicpXG4gKiAgICAgICAgLnNldCgnWC1BUEktS2V5JywgJ2Zvb2JhcicpXG4gKiAgICAgICAgLmVuZChjYWxsYmFjayk7XG4gKlxuICogICAgICByZXEuZ2V0KCcvJylcbiAqICAgICAgICAuc2V0KHsgQWNjZXB0OiAnYXBwbGljYXRpb24vanNvbicsICdYLUFQSS1LZXknOiAnZm9vYmFyJyB9KVxuICogICAgICAgIC5lbmQoY2FsbGJhY2spO1xuICpcbiAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdH0gZmllbGRcbiAqIEBwYXJhbSB7U3RyaW5nfSB2YWxcbiAqIEByZXR1cm4ge1JlcXVlc3R9IGZvciBjaGFpbmluZ1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihmaWVsZCwgdmFsKXtcbiAgaWYgKGlzT2JqZWN0KGZpZWxkKSkge1xuICAgIGZvciAodmFyIGtleSBpbiBmaWVsZCkge1xuICAgICAgdGhpcy5zZXQoa2V5LCBmaWVsZFtrZXldKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgdGhpcy5faGVhZGVyW2ZpZWxkLnRvTG93ZXJDYXNlKCldID0gdmFsO1xuICB0aGlzLmhlYWRlcltmaWVsZF0gPSB2YWw7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgaGVhZGVyIGBmaWVsZGAuXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiAgICAgIHJlcS5nZXQoJy8nKVxuICogICAgICAgIC51bnNldCgnVXNlci1BZ2VudCcpXG4gKiAgICAgICAgLmVuZChjYWxsYmFjayk7XG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGZpZWxkXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUudW5zZXQgPSBmdW5jdGlvbihmaWVsZCl7XG4gIGRlbGV0ZSB0aGlzLl9oZWFkZXJbZmllbGQudG9Mb3dlckNhc2UoKV07XG4gIGRlbGV0ZSB0aGlzLmhlYWRlcltmaWVsZF07XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBHZXQgY2FzZS1pbnNlbnNpdGl2ZSBoZWFkZXIgYGZpZWxkYCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZmllbGRcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cblJlcXVlc3QucHJvdG90eXBlLmdldEhlYWRlciA9IGZ1bmN0aW9uKGZpZWxkKXtcbiAgcmV0dXJuIHRoaXMuX2hlYWRlcltmaWVsZC50b0xvd2VyQ2FzZSgpXTtcbn07XG5cbi8qKlxuICogU2V0IENvbnRlbnQtVHlwZSB0byBgdHlwZWAsIG1hcHBpbmcgdmFsdWVzIGZyb20gYHJlcXVlc3QudHlwZXNgLlxuICpcbiAqIEV4YW1wbGVzOlxuICpcbiAqICAgICAgc3VwZXJhZ2VudC50eXBlcy54bWwgPSAnYXBwbGljYXRpb24veG1sJztcbiAqXG4gKiAgICAgIHJlcXVlc3QucG9zdCgnLycpXG4gKiAgICAgICAgLnR5cGUoJ3htbCcpXG4gKiAgICAgICAgLnNlbmQoeG1sc3RyaW5nKVxuICogICAgICAgIC5lbmQoY2FsbGJhY2spO1xuICpcbiAqICAgICAgcmVxdWVzdC5wb3N0KCcvJylcbiAqICAgICAgICAudHlwZSgnYXBwbGljYXRpb24veG1sJylcbiAqICAgICAgICAuc2VuZCh4bWxzdHJpbmcpXG4gKiAgICAgICAgLmVuZChjYWxsYmFjayk7XG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHR5cGVcbiAqIEByZXR1cm4ge1JlcXVlc3R9IGZvciBjaGFpbmluZ1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS50eXBlID0gZnVuY3Rpb24odHlwZSl7XG4gIHRoaXMuc2V0KCdDb250ZW50LVR5cGUnLCByZXF1ZXN0LnR5cGVzW3R5cGVdIHx8IHR5cGUpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2V0IEFjY2VwdCB0byBgdHlwZWAsIG1hcHBpbmcgdmFsdWVzIGZyb20gYHJlcXVlc3QudHlwZXNgLlxuICpcbiAqIEV4YW1wbGVzOlxuICpcbiAqICAgICAgc3VwZXJhZ2VudC50eXBlcy5qc29uID0gJ2FwcGxpY2F0aW9uL2pzb24nO1xuICpcbiAqICAgICAgcmVxdWVzdC5nZXQoJy9hZ2VudCcpXG4gKiAgICAgICAgLmFjY2VwdCgnanNvbicpXG4gKiAgICAgICAgLmVuZChjYWxsYmFjayk7XG4gKlxuICogICAgICByZXF1ZXN0LmdldCgnL2FnZW50JylcbiAqICAgICAgICAuYWNjZXB0KCdhcHBsaWNhdGlvbi9qc29uJylcbiAqICAgICAgICAuZW5kKGNhbGxiYWNrKTtcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gYWNjZXB0XG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUuYWNjZXB0ID0gZnVuY3Rpb24odHlwZSl7XG4gIHRoaXMuc2V0KCdBY2NlcHQnLCByZXF1ZXN0LnR5cGVzW3R5cGVdIHx8IHR5cGUpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2V0IEF1dGhvcml6YXRpb24gZmllbGQgdmFsdWUgd2l0aCBgdXNlcmAgYW5kIGBwYXNzYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdXNlclxuICogQHBhcmFtIHtTdHJpbmd9IHBhc3NcbiAqIEByZXR1cm4ge1JlcXVlc3R9IGZvciBjaGFpbmluZ1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS5hdXRoID0gZnVuY3Rpb24odXNlciwgcGFzcyl7XG4gIHZhciBzdHIgPSBidG9hKHVzZXIgKyAnOicgKyBwYXNzKTtcbiAgdGhpcy5zZXQoJ0F1dGhvcml6YXRpb24nLCAnQmFzaWMgJyArIHN0cik7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4qIEFkZCBxdWVyeS1zdHJpbmcgYHZhbGAuXG4qXG4qIEV4YW1wbGVzOlxuKlxuKiAgIHJlcXVlc3QuZ2V0KCcvc2hvZXMnKVxuKiAgICAgLnF1ZXJ5KCdzaXplPTEwJylcbiogICAgIC5xdWVyeSh7IGNvbG9yOiAnYmx1ZScgfSlcbipcbiogQHBhcmFtIHtPYmplY3R8U3RyaW5nfSB2YWxcbiogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4qIEBhcGkgcHVibGljXG4qL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS5xdWVyeSA9IGZ1bmN0aW9uKHZhbCl7XG4gIGlmICgnc3RyaW5nJyAhPSB0eXBlb2YgdmFsKSB2YWwgPSBzZXJpYWxpemUodmFsKTtcbiAgaWYgKHZhbCkgdGhpcy5fcXVlcnkucHVzaCh2YWwpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogV3JpdGUgdGhlIGZpZWxkIGBuYW1lYCBhbmQgYHZhbGAgZm9yIFwibXVsdGlwYXJ0L2Zvcm0tZGF0YVwiXG4gKiByZXF1ZXN0IGJvZGllcy5cbiAqXG4gKiBgYGAganNcbiAqIHJlcXVlc3QucG9zdCgnL3VwbG9hZCcpXG4gKiAgIC5maWVsZCgnZm9vJywgJ2JhcicpXG4gKiAgIC5lbmQoY2FsbGJhY2spO1xuICogYGBgXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqIEBwYXJhbSB7U3RyaW5nfEJsb2J8RmlsZX0gdmFsXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUuZmllbGQgPSBmdW5jdGlvbihuYW1lLCB2YWwpe1xuICBpZiAoIXRoaXMuX2Zvcm1EYXRhKSB0aGlzLl9mb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuICB0aGlzLl9mb3JtRGF0YS5hcHBlbmQobmFtZSwgdmFsKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFF1ZXVlIHRoZSBnaXZlbiBgZmlsZWAgYXMgYW4gYXR0YWNobWVudCB0byB0aGUgc3BlY2lmaWVkIGBmaWVsZGAsXG4gKiB3aXRoIG9wdGlvbmFsIGBmaWxlbmFtZWAuXG4gKlxuICogYGBgIGpzXG4gKiByZXF1ZXN0LnBvc3QoJy91cGxvYWQnKVxuICogICAuYXR0YWNoKG5ldyBCbG9iKFsnPGEgaWQ9XCJhXCI+PGIgaWQ9XCJiXCI+aGV5ITwvYj48L2E+J10sIHsgdHlwZTogXCJ0ZXh0L2h0bWxcIn0pKVxuICogICAuZW5kKGNhbGxiYWNrKTtcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBmaWVsZFxuICogQHBhcmFtIHtCbG9ifEZpbGV9IGZpbGVcbiAqIEBwYXJhbSB7U3RyaW5nfSBmaWxlbmFtZVxuICogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblJlcXVlc3QucHJvdG90eXBlLmF0dGFjaCA9IGZ1bmN0aW9uKGZpZWxkLCBmaWxlLCBmaWxlbmFtZSl7XG4gIGlmICghdGhpcy5fZm9ybURhdGEpIHRoaXMuX2Zvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCk7XG4gIHRoaXMuX2Zvcm1EYXRhLmFwcGVuZChmaWVsZCwgZmlsZSwgZmlsZW5hbWUpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2VuZCBgZGF0YWAsIGRlZmF1bHRpbmcgdGhlIGAudHlwZSgpYCB0byBcImpzb25cIiB3aGVuXG4gKiBhbiBvYmplY3QgaXMgZ2l2ZW4uXG4gKlxuICogRXhhbXBsZXM6XG4gKlxuICogICAgICAgLy8gcXVlcnlzdHJpbmdcbiAqICAgICAgIHJlcXVlc3QuZ2V0KCcvc2VhcmNoJylcbiAqICAgICAgICAgLmVuZChjYWxsYmFjaylcbiAqXG4gKiAgICAgICAvLyBtdWx0aXBsZSBkYXRhIFwid3JpdGVzXCJcbiAqICAgICAgIHJlcXVlc3QuZ2V0KCcvc2VhcmNoJylcbiAqICAgICAgICAgLnNlbmQoeyBzZWFyY2g6ICdxdWVyeScgfSlcbiAqICAgICAgICAgLnNlbmQoeyByYW5nZTogJzEuLjUnIH0pXG4gKiAgICAgICAgIC5zZW5kKHsgb3JkZXI6ICdkZXNjJyB9KVxuICogICAgICAgICAuZW5kKGNhbGxiYWNrKVxuICpcbiAqICAgICAgIC8vIG1hbnVhbCBqc29uXG4gKiAgICAgICByZXF1ZXN0LnBvc3QoJy91c2VyJylcbiAqICAgICAgICAgLnR5cGUoJ2pzb24nKVxuICogICAgICAgICAuc2VuZCgne1wibmFtZVwiOlwidGpcIn0pXG4gKiAgICAgICAgIC5lbmQoY2FsbGJhY2spXG4gKlxuICogICAgICAgLy8gYXV0byBqc29uXG4gKiAgICAgICByZXF1ZXN0LnBvc3QoJy91c2VyJylcbiAqICAgICAgICAgLnNlbmQoeyBuYW1lOiAndGonIH0pXG4gKiAgICAgICAgIC5lbmQoY2FsbGJhY2spXG4gKlxuICogICAgICAgLy8gbWFudWFsIHgtd3d3LWZvcm0tdXJsZW5jb2RlZFxuICogICAgICAgcmVxdWVzdC5wb3N0KCcvdXNlcicpXG4gKiAgICAgICAgIC50eXBlKCdmb3JtJylcbiAqICAgICAgICAgLnNlbmQoJ25hbWU9dGonKVxuICogICAgICAgICAuZW5kKGNhbGxiYWNrKVxuICpcbiAqICAgICAgIC8vIGF1dG8geC13d3ctZm9ybS11cmxlbmNvZGVkXG4gKiAgICAgICByZXF1ZXN0LnBvc3QoJy91c2VyJylcbiAqICAgICAgICAgLnR5cGUoJ2Zvcm0nKVxuICogICAgICAgICAuc2VuZCh7IG5hbWU6ICd0aicgfSlcbiAqICAgICAgICAgLmVuZChjYWxsYmFjaylcbiAqXG4gKiAgICAgICAvLyBkZWZhdWx0cyB0byB4LXd3dy1mb3JtLXVybGVuY29kZWRcbiAgKiAgICAgIHJlcXVlc3QucG9zdCgnL3VzZXInKVxuICAqICAgICAgICAuc2VuZCgnbmFtZT10b2JpJylcbiAgKiAgICAgICAgLnNlbmQoJ3NwZWNpZXM9ZmVycmV0JylcbiAgKiAgICAgICAgLmVuZChjYWxsYmFjaylcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R9IGRhdGFcbiAqIEByZXR1cm4ge1JlcXVlc3R9IGZvciBjaGFpbmluZ1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS5zZW5kID0gZnVuY3Rpb24oZGF0YSl7XG4gIHZhciBvYmogPSBpc09iamVjdChkYXRhKTtcbiAgdmFyIHR5cGUgPSB0aGlzLmdldEhlYWRlcignQ29udGVudC1UeXBlJyk7XG5cbiAgLy8gbWVyZ2VcbiAgaWYgKG9iaiAmJiBpc09iamVjdCh0aGlzLl9kYXRhKSkge1xuICAgIGZvciAodmFyIGtleSBpbiBkYXRhKSB7XG4gICAgICB0aGlzLl9kYXRhW2tleV0gPSBkYXRhW2tleV07XG4gICAgfVxuICB9IGVsc2UgaWYgKCdzdHJpbmcnID09IHR5cGVvZiBkYXRhKSB7XG4gICAgaWYgKCF0eXBlKSB0aGlzLnR5cGUoJ2Zvcm0nKTtcbiAgICB0eXBlID0gdGhpcy5nZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScpO1xuICAgIGlmICgnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyA9PSB0eXBlKSB7XG4gICAgICB0aGlzLl9kYXRhID0gdGhpcy5fZGF0YVxuICAgICAgICA/IHRoaXMuX2RhdGEgKyAnJicgKyBkYXRhXG4gICAgICAgIDogZGF0YTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fZGF0YSA9ICh0aGlzLl9kYXRhIHx8ICcnKSArIGRhdGE7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRoaXMuX2RhdGEgPSBkYXRhO1xuICB9XG5cbiAgaWYgKCFvYmopIHJldHVybiB0aGlzO1xuICBpZiAoIXR5cGUpIHRoaXMudHlwZSgnanNvbicpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogSW52b2tlIHRoZSBjYWxsYmFjayB3aXRoIGBlcnJgIGFuZCBgcmVzYFxuICogYW5kIGhhbmRsZSBhcml0eSBjaGVjay5cbiAqXG4gKiBAcGFyYW0ge0Vycm9yfSBlcnJcbiAqIEBwYXJhbSB7UmVzcG9uc2V9IHJlc1xuICogQGFwaSBwcml2YXRlXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUuY2FsbGJhY2sgPSBmdW5jdGlvbihlcnIsIHJlcyl7XG4gIHZhciBmbiA9IHRoaXMuX2NhbGxiYWNrO1xuICB0aGlzLmNsZWFyVGltZW91dCgpO1xuICBpZiAoMiA9PSBmbi5sZW5ndGgpIHJldHVybiBmbihlcnIsIHJlcyk7XG4gIGlmIChlcnIpIHJldHVybiB0aGlzLmVtaXQoJ2Vycm9yJywgZXJyKTtcbiAgZm4ocmVzKTtcbn07XG5cbi8qKlxuICogSW52b2tlIGNhbGxiYWNrIHdpdGggeC1kb21haW4gZXJyb3IuXG4gKlxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUuY3Jvc3NEb21haW5FcnJvciA9IGZ1bmN0aW9uKCl7XG4gIHZhciBlcnIgPSBuZXcgRXJyb3IoJ09yaWdpbiBpcyBub3QgYWxsb3dlZCBieSBBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nKTtcbiAgZXJyLmNyb3NzRG9tYWluID0gdHJ1ZTtcbiAgdGhpcy5jYWxsYmFjayhlcnIpO1xufTtcblxuLyoqXG4gKiBJbnZva2UgY2FsbGJhY2sgd2l0aCB0aW1lb3V0IGVycm9yLlxuICpcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cblJlcXVlc3QucHJvdG90eXBlLnRpbWVvdXRFcnJvciA9IGZ1bmN0aW9uKCl7XG4gIHZhciB0aW1lb3V0ID0gdGhpcy5fdGltZW91dDtcbiAgdmFyIGVyciA9IG5ldyBFcnJvcigndGltZW91dCBvZiAnICsgdGltZW91dCArICdtcyBleGNlZWRlZCcpO1xuICBlcnIudGltZW91dCA9IHRpbWVvdXQ7XG4gIHRoaXMuY2FsbGJhY2soZXJyKTtcbn07XG5cbi8qKlxuICogRW5hYmxlIHRyYW5zbWlzc2lvbiBvZiBjb29raWVzIHdpdGggeC1kb21haW4gcmVxdWVzdHMuXG4gKlxuICogTm90ZSB0aGF0IGZvciB0aGlzIHRvIHdvcmsgdGhlIG9yaWdpbiBtdXN0IG5vdCBiZVxuICogdXNpbmcgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIiB3aXRoIGEgd2lsZGNhcmQsXG4gKiBhbmQgYWxzbyBtdXN0IHNldCBcIkFjY2Vzcy1Db250cm9sLUFsbG93LUNyZWRlbnRpYWxzXCJcbiAqIHRvIFwidHJ1ZVwiLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUud2l0aENyZWRlbnRpYWxzID0gZnVuY3Rpb24oKXtcbiAgdGhpcy5fd2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEluaXRpYXRlIHJlcXVlc3QsIGludm9raW5nIGNhbGxiYWNrIGBmbihyZXMpYFxuICogd2l0aCBhbiBpbnN0YW5jZW9mIGBSZXNwb25zZWAuXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge1JlcXVlc3R9IGZvciBjaGFpbmluZ1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS5lbmQgPSBmdW5jdGlvbihmbil7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdmFyIHhociA9IHRoaXMueGhyID0gZ2V0WEhSKCk7XG4gIHZhciBxdWVyeSA9IHRoaXMuX3F1ZXJ5LmpvaW4oJyYnKTtcbiAgdmFyIHRpbWVvdXQgPSB0aGlzLl90aW1lb3V0O1xuICB2YXIgZGF0YSA9IHRoaXMuX2Zvcm1EYXRhIHx8IHRoaXMuX2RhdGE7XG5cbiAgLy8gc3RvcmUgY2FsbGJhY2tcbiAgdGhpcy5fY2FsbGJhY2sgPSBmbiB8fCBub29wO1xuXG4gIC8vIHN0YXRlIGNoYW5nZVxuICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKXtcbiAgICBpZiAoNCAhPSB4aHIucmVhZHlTdGF0ZSkgcmV0dXJuO1xuICAgIGlmICgwID09IHhoci5zdGF0dXMpIHtcbiAgICAgIGlmIChzZWxmLmFib3J0ZWQpIHJldHVybiBzZWxmLnRpbWVvdXRFcnJvcigpO1xuICAgICAgcmV0dXJuIHNlbGYuY3Jvc3NEb21haW5FcnJvcigpO1xuICAgIH1cbiAgICBzZWxmLmVtaXQoJ2VuZCcpO1xuICB9O1xuXG4gIC8vIHByb2dyZXNzXG4gIGlmICh4aHIudXBsb2FkKSB7XG4gICAgeGhyLnVwbG9hZC5vbnByb2dyZXNzID0gZnVuY3Rpb24oZSl7XG4gICAgICBlLnBlcmNlbnQgPSBlLmxvYWRlZCAvIGUudG90YWwgKiAxMDA7XG4gICAgICBzZWxmLmVtaXQoJ3Byb2dyZXNzJywgZSk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIHRpbWVvdXRcbiAgaWYgKHRpbWVvdXQgJiYgIXRoaXMuX3RpbWVyKSB7XG4gICAgdGhpcy5fdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICBzZWxmLmFib3J0KCk7XG4gICAgfSwgdGltZW91dCk7XG4gIH1cblxuICAvLyBxdWVyeXN0cmluZ1xuICBpZiAocXVlcnkpIHtcbiAgICBxdWVyeSA9IHJlcXVlc3Quc2VyaWFsaXplT2JqZWN0KHF1ZXJ5KTtcbiAgICB0aGlzLnVybCArPSB+dGhpcy51cmwuaW5kZXhPZignPycpXG4gICAgICA/ICcmJyArIHF1ZXJ5XG4gICAgICA6ICc/JyArIHF1ZXJ5O1xuICB9XG5cbiAgLy8gaW5pdGlhdGUgcmVxdWVzdFxuICB4aHIub3Blbih0aGlzLm1ldGhvZCwgdGhpcy51cmwsIHRydWUpO1xuXG4gIC8vIENPUlNcbiAgaWYgKHRoaXMuX3dpdGhDcmVkZW50aWFscykgeGhyLndpdGhDcmVkZW50aWFscyA9IHRydWU7XG5cbiAgLy8gYm9keVxuICBpZiAoJ0dFVCcgIT0gdGhpcy5tZXRob2QgJiYgJ0hFQUQnICE9IHRoaXMubWV0aG9kICYmICdzdHJpbmcnICE9IHR5cGVvZiBkYXRhICYmICFpc0hvc3QoZGF0YSkpIHtcbiAgICAvLyBzZXJpYWxpemUgc3R1ZmZcbiAgICB2YXIgc2VyaWFsaXplID0gcmVxdWVzdC5zZXJpYWxpemVbdGhpcy5nZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScpXTtcbiAgICBpZiAoc2VyaWFsaXplKSBkYXRhID0gc2VyaWFsaXplKGRhdGEpO1xuICB9XG5cbiAgLy8gc2V0IGhlYWRlciBmaWVsZHNcbiAgZm9yICh2YXIgZmllbGQgaW4gdGhpcy5oZWFkZXIpIHtcbiAgICBpZiAobnVsbCA9PSB0aGlzLmhlYWRlcltmaWVsZF0pIGNvbnRpbnVlO1xuICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKGZpZWxkLCB0aGlzLmhlYWRlcltmaWVsZF0pO1xuICB9XG5cbiAgLy8gc2VuZCBzdHVmZlxuICB0aGlzLmVtaXQoJ3JlcXVlc3QnLCB0aGlzKTtcbiAgeGhyLnNlbmQoZGF0YSk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBFeHBvc2UgYFJlcXVlc3RgLlxuICovXG5cbnJlcXVlc3QuUmVxdWVzdCA9IFJlcXVlc3Q7XG5cbi8qKlxuICogSXNzdWUgYSByZXF1ZXN0OlxuICpcbiAqIEV4YW1wbGVzOlxuICpcbiAqICAgIHJlcXVlc3QoJ0dFVCcsICcvdXNlcnMnKS5lbmQoY2FsbGJhY2spXG4gKiAgICByZXF1ZXN0KCcvdXNlcnMnKS5lbmQoY2FsbGJhY2spXG4gKiAgICByZXF1ZXN0KCcvdXNlcnMnLCBjYWxsYmFjaylcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbWV0aG9kXG4gKiBAcGFyYW0ge1N0cmluZ3xGdW5jdGlvbn0gdXJsIG9yIGNhbGxiYWNrXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiByZXF1ZXN0KG1ldGhvZCwgdXJsKSB7XG4gIC8vIGNhbGxiYWNrXG4gIGlmICgnZnVuY3Rpb24nID09IHR5cGVvZiB1cmwpIHtcbiAgICByZXR1cm4gbmV3IFJlcXVlc3QoJ0dFVCcsIG1ldGhvZCkuZW5kKHVybCk7XG4gIH1cblxuICAvLyB1cmwgZmlyc3RcbiAgaWYgKDEgPT0gYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIHJldHVybiBuZXcgUmVxdWVzdCgnR0VUJywgbWV0aG9kKTtcbiAgfVxuXG4gIHJldHVybiBuZXcgUmVxdWVzdChtZXRob2QsIHVybCk7XG59XG5cbi8qKlxuICogR0VUIGB1cmxgIHdpdGggb3B0aW9uYWwgY2FsbGJhY2sgYGZuKHJlcylgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmxcbiAqIEBwYXJhbSB7TWl4ZWR8RnVuY3Rpb259IGRhdGEgb3IgZm5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5yZXF1ZXN0LmdldCA9IGZ1bmN0aW9uKHVybCwgZGF0YSwgZm4pe1xuICB2YXIgcmVxID0gcmVxdWVzdCgnR0VUJywgdXJsKTtcbiAgaWYgKCdmdW5jdGlvbicgPT0gdHlwZW9mIGRhdGEpIGZuID0gZGF0YSwgZGF0YSA9IG51bGw7XG4gIGlmIChkYXRhKSByZXEucXVlcnkoZGF0YSk7XG4gIGlmIChmbikgcmVxLmVuZChmbik7XG4gIHJldHVybiByZXE7XG59O1xuXG4vKipcbiAqIEhFQUQgYHVybGAgd2l0aCBvcHRpb25hbCBjYWxsYmFjayBgZm4ocmVzKWAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHVybFxuICogQHBhcmFtIHtNaXhlZHxGdW5jdGlvbn0gZGF0YSBvciBmblxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge1JlcXVlc3R9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbnJlcXVlc3QuaGVhZCA9IGZ1bmN0aW9uKHVybCwgZGF0YSwgZm4pe1xuICB2YXIgcmVxID0gcmVxdWVzdCgnSEVBRCcsIHVybCk7XG4gIGlmICgnZnVuY3Rpb24nID09IHR5cGVvZiBkYXRhKSBmbiA9IGRhdGEsIGRhdGEgPSBudWxsO1xuICBpZiAoZGF0YSkgcmVxLnNlbmQoZGF0YSk7XG4gIGlmIChmbikgcmVxLmVuZChmbik7XG4gIHJldHVybiByZXE7XG59O1xuXG4vKipcbiAqIERFTEVURSBgdXJsYCB3aXRoIG9wdGlvbmFsIGNhbGxiYWNrIGBmbihyZXMpYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7UmVxdWVzdH1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxucmVxdWVzdC5kZWwgPSBmdW5jdGlvbih1cmwsIGZuKXtcbiAgdmFyIHJlcSA9IHJlcXVlc3QoJ0RFTEVURScsIHVybCk7XG4gIGlmIChmbikgcmVxLmVuZChmbik7XG4gIHJldHVybiByZXE7XG59O1xuXG4vKipcbiAqIFBBVENIIGB1cmxgIHdpdGggb3B0aW9uYWwgYGRhdGFgIGFuZCBjYWxsYmFjayBgZm4ocmVzKWAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHVybFxuICogQHBhcmFtIHtNaXhlZH0gZGF0YVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge1JlcXVlc3R9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbnJlcXVlc3QucGF0Y2ggPSBmdW5jdGlvbih1cmwsIGRhdGEsIGZuKXtcbiAgdmFyIHJlcSA9IHJlcXVlc3QoJ1BBVENIJywgdXJsKTtcbiAgaWYgKCdmdW5jdGlvbicgPT0gdHlwZW9mIGRhdGEpIGZuID0gZGF0YSwgZGF0YSA9IG51bGw7XG4gIGlmIChkYXRhKSByZXEuc2VuZChkYXRhKTtcbiAgaWYgKGZuKSByZXEuZW5kKGZuKTtcbiAgcmV0dXJuIHJlcTtcbn07XG5cbi8qKlxuICogUE9TVCBgdXJsYCB3aXRoIG9wdGlvbmFsIGBkYXRhYCBhbmQgY2FsbGJhY2sgYGZuKHJlcylgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmxcbiAqIEBwYXJhbSB7TWl4ZWR9IGRhdGFcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5yZXF1ZXN0LnBvc3QgPSBmdW5jdGlvbih1cmwsIGRhdGEsIGZuKXtcbiAgdmFyIHJlcSA9IHJlcXVlc3QoJ1BPU1QnLCB1cmwpO1xuICBpZiAoJ2Z1bmN0aW9uJyA9PSB0eXBlb2YgZGF0YSkgZm4gPSBkYXRhLCBkYXRhID0gbnVsbDtcbiAgaWYgKGRhdGEpIHJlcS5zZW5kKGRhdGEpO1xuICBpZiAoZm4pIHJlcS5lbmQoZm4pO1xuICByZXR1cm4gcmVxO1xufTtcblxuLyoqXG4gKiBQVVQgYHVybGAgd2l0aCBvcHRpb25hbCBgZGF0YWAgYW5kIGNhbGxiYWNrIGBmbihyZXMpYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsXG4gKiBAcGFyYW0ge01peGVkfEZ1bmN0aW9ufSBkYXRhIG9yIGZuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7UmVxdWVzdH1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxucmVxdWVzdC5wdXQgPSBmdW5jdGlvbih1cmwsIGRhdGEsIGZuKXtcbiAgdmFyIHJlcSA9IHJlcXVlc3QoJ1BVVCcsIHVybCk7XG4gIGlmICgnZnVuY3Rpb24nID09IHR5cGVvZiBkYXRhKSBmbiA9IGRhdGEsIGRhdGEgPSBudWxsO1xuICBpZiAoZGF0YSkgcmVxLnNlbmQoZGF0YSk7XG4gIGlmIChmbikgcmVxLmVuZChmbik7XG4gIHJldHVybiByZXE7XG59O1xuXG4vKipcbiAqIEV4cG9zZSBgcmVxdWVzdGAuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSByZXF1ZXN0O1xuIiwiXG4vKipcbiAqIEV4cG9zZSBgRW1pdHRlcmAuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBFbWl0dGVyO1xuXG4vKipcbiAqIEluaXRpYWxpemUgYSBuZXcgYEVtaXR0ZXJgLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gRW1pdHRlcihvYmopIHtcbiAgaWYgKG9iaikgcmV0dXJuIG1peGluKG9iaik7XG59O1xuXG4vKipcbiAqIE1peGluIHRoZSBlbWl0dGVyIHByb3BlcnRpZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHJldHVybiB7T2JqZWN0fVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gbWl4aW4ob2JqKSB7XG4gIGZvciAodmFyIGtleSBpbiBFbWl0dGVyLnByb3RvdHlwZSkge1xuICAgIG9ialtrZXldID0gRW1pdHRlci5wcm90b3R5cGVba2V5XTtcbiAgfVxuICByZXR1cm4gb2JqO1xufVxuXG4vKipcbiAqIExpc3RlbiBvbiB0aGUgZ2l2ZW4gYGV2ZW50YCB3aXRoIGBmbmAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7RW1pdHRlcn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUub24gPVxuRW1pdHRlci5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uKGV2ZW50LCBmbil7XG4gIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcyB8fCB7fTtcbiAgKHRoaXMuX2NhbGxiYWNrc1tldmVudF0gPSB0aGlzLl9jYWxsYmFja3NbZXZlbnRdIHx8IFtdKVxuICAgIC5wdXNoKGZuKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFkZHMgYW4gYGV2ZW50YCBsaXN0ZW5lciB0aGF0IHdpbGwgYmUgaW52b2tlZCBhIHNpbmdsZVxuICogdGltZSB0aGVuIGF1dG9tYXRpY2FsbHkgcmVtb3ZlZC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtFbWl0dGVyfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24oZXZlbnQsIGZuKXtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB0aGlzLl9jYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3MgfHwge307XG5cbiAgZnVuY3Rpb24gb24oKSB7XG4gICAgc2VsZi5vZmYoZXZlbnQsIG9uKTtcbiAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgb24uZm4gPSBmbjtcbiAgdGhpcy5vbihldmVudCwgb24pO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIHRoZSBnaXZlbiBjYWxsYmFjayBmb3IgYGV2ZW50YCBvciBhbGxcbiAqIHJlZ2lzdGVyZWQgY2FsbGJhY2tzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLm9mZiA9XG5FbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9XG5FbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPVxuRW1pdHRlci5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uKGV2ZW50LCBmbil7XG4gIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcyB8fCB7fTtcblxuICAvLyBhbGxcbiAgaWYgKDAgPT0gYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIHRoaXMuX2NhbGxiYWNrcyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gc3BlY2lmaWMgZXZlbnRcbiAgdmFyIGNhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrc1tldmVudF07XG4gIGlmICghY2FsbGJhY2tzKSByZXR1cm4gdGhpcztcblxuICAvLyByZW1vdmUgYWxsIGhhbmRsZXJzXG4gIGlmICgxID09IGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICBkZWxldGUgdGhpcy5fY2FsbGJhY2tzW2V2ZW50XTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIHJlbW92ZSBzcGVjaWZpYyBoYW5kbGVyXG4gIHZhciBjYjtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICBjYiA9IGNhbGxiYWNrc1tpXTtcbiAgICBpZiAoY2IgPT09IGZuIHx8IGNiLmZuID09PSBmbikge1xuICAgICAgY2FsbGJhY2tzLnNwbGljZShpLCAxKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogRW1pdCBgZXZlbnRgIHdpdGggdGhlIGdpdmVuIGFyZ3MuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge01peGVkfSAuLi5cbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgdGhpcy5fY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzIHx8IHt9O1xuICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKVxuICAgICwgY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzW2V2ZW50XTtcblxuICBpZiAoY2FsbGJhY2tzKSB7XG4gICAgY2FsbGJhY2tzID0gY2FsbGJhY2tzLnNsaWNlKDApO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBjYWxsYmFja3MubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgIGNhbGxiYWNrc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmV0dXJuIGFycmF5IG9mIGNhbGxiYWNrcyBmb3IgYGV2ZW50YC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEByZXR1cm4ge0FycmF5fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbihldmVudCl7XG4gIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcyB8fCB7fTtcbiAgcmV0dXJuIHRoaXMuX2NhbGxiYWNrc1tldmVudF0gfHwgW107XG59O1xuXG4vKipcbiAqIENoZWNrIGlmIHRoaXMgZW1pdHRlciBoYXMgYGV2ZW50YCBoYW5kbGVycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLmhhc0xpc3RlbmVycyA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgcmV0dXJuICEhIHRoaXMubGlzdGVuZXJzKGV2ZW50KS5sZW5ndGg7XG59O1xuIiwiXG4vKipcbiAqIFJlZHVjZSBgYXJyYCB3aXRoIGBmbmAuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gYXJyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHBhcmFtIHtNaXhlZH0gaW5pdGlhbFxuICpcbiAqIFRPRE86IGNvbWJhdGlibGUgZXJyb3IgaGFuZGxpbmc/XG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhcnIsIGZuLCBpbml0aWFsKXsgIFxuICB2YXIgaWR4ID0gMDtcbiAgdmFyIGxlbiA9IGFyci5sZW5ndGg7XG4gIHZhciBjdXJyID0gYXJndW1lbnRzLmxlbmd0aCA9PSAzXG4gICAgPyBpbml0aWFsXG4gICAgOiBhcnJbaWR4KytdO1xuXG4gIHdoaWxlIChpZHggPCBsZW4pIHtcbiAgICBjdXJyID0gZm4uY2FsbChudWxsLCBjdXJyLCBhcnJbaWR4XSwgKytpZHgsIGFycik7XG4gIH1cbiAgXG4gIHJldHVybiBjdXJyO1xufTsiLCIvLyAgICAgVmFsaWRhdGUuanMgMC40LjBcbi8vICAgICAoYykgMjAxMy0yMDE1IE5pY2tsYXMgQW5zbWFuLCAyMDEzIFdyYXBwXG4vLyAgICAgVmFsaWRhdGUuanMgbWF5IGJlIGZyZWVseSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG4vLyAgICAgRm9yIGFsbCBkZXRhaWxzIGFuZCBkb2N1bWVudGF0aW9uOlxuLy8gICAgIGh0dHA6Ly92YWxpZGF0ZWpzLm9yZy9cblxuKGZ1bmN0aW9uKGV4cG9ydHMsIG1vZHVsZSwgZGVmaW5lLCByZXF1aXJlKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuXG4gIC8vIFRoZSBtYWluIGZ1bmN0aW9uIHRoYXQgY2FsbHMgdGhlIHZhbGlkYXRvcnMgc3BlY2lmaWVkIGJ5IHRoZSBjb25zdHJhaW50cy5cbiAgLy8gVGhlIG9wdGlvbnMgYXJlIHRoZSBmb2xsb3dpbmc6XG4gIC8vICAgLSBmbGF0dGVuIChib29sZWFuKSAtIElmIGB0cnVlYCB3aWxsIHJldHVybiBhIGZsYXQgYXJyYXkgaW5zdGVhZCBvZiBhbiBvYmplY3QuXG4gIC8vICAgLSBmdWxsTWVzc2FnZXMgKGJvb2xlYW4pIC0gSWYgYHRydWVgIChkZWZhdWx0KSB0aGUgYXR0cmlidXRlIG5hbWUgaXMgcHJlcGVuZGVkIHRvIHRoZSBlcnJvci5cbiAgLy9cbiAgLy8gUGxlYXNlIG5vdGUgdGhhdCB0aGUgb3B0aW9ucyBhcmUgYWxzbyBwYXNzZWQgdG8gZWFjaCB2YWxpZGF0b3IuXG4gIHZhciB2YWxpZGF0ZSA9IGZ1bmN0aW9uKGF0dHJpYnV0ZXMsIGNvbnN0cmFpbnRzLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IHYuZXh0ZW5kKHt9LCB2Lm9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgdmFyIHJlc3VsdHMgPSB2LnJ1blZhbGlkYXRpb25zKGF0dHJpYnV0ZXMsIGNvbnN0cmFpbnRzLCBvcHRpb25zKVxuICAgICAgLCBhdHRyXG4gICAgICAsIHZhbGlkYXRvcjtcblxuICAgIGZvciAoYXR0ciBpbiByZXN1bHRzKSB7XG4gICAgICBmb3IgKHZhbGlkYXRvciBpbiByZXN1bHRzW2F0dHJdKSB7XG4gICAgICAgIGlmICh2LmlzUHJvbWlzZShyZXN1bHRzW2F0dHJdW3ZhbGlkYXRvcl0pKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVXNlIHZhbGlkYXRlLmFzeW5jIGlmIHlvdSB3YW50IHN1cHBvcnQgZm9yIHByb21pc2VzXCIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2YWxpZGF0ZS5wcm9jZXNzVmFsaWRhdGlvblJlc3VsdHMocmVzdWx0cywgb3B0aW9ucyk7XG4gIH07XG5cbiAgdmFyIHYgPSB2YWxpZGF0ZVxuICAgICwgcm9vdCA9IHRoaXNcbiAgICAvLyBGaW5kcyAle2tleX0gc3R5bGUgcGF0dGVybnMgaW4gdGhlIGdpdmVuIHN0cmluZ1xuICAgICwgRk9STUFUX1JFR0VYUCA9IC8lXFx7KFteXFx9XSspXFx9L2c7XG5cbiAgLy8gQ29waWVzIG92ZXIgYXR0cmlidXRlcyBmcm9tIG9uZSBvciBtb3JlIHNvdXJjZXMgdG8gYSBzaW5nbGUgZGVzdGluYXRpb24uXG4gIC8vIFZlcnkgbXVjaCBzaW1pbGFyIHRvIHVuZGVyc2NvcmUncyBleHRlbmQuXG4gIC8vIFRoZSBmaXJzdCBhcmd1bWVudCBpcyB0aGUgdGFyZ2V0IG9iamVjdCBhbmQgdGhlIHJlbWFpbmluZyBhcmd1bWVudHMgd2lsbCBiZVxuICAvLyB1c2VkIGFzIHRhcmdldHMuXG4gIHYuZXh0ZW5kID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLmZvckVhY2goZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICBmb3IgKHZhciBhdHRyIGluIHNvdXJjZSkge1xuICAgICAgICBvYmpbYXR0cl0gPSBzb3VyY2VbYXR0cl07XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICB2LmV4dGVuZCh2YWxpZGF0ZSwge1xuICAgIC8vIFRoaXMgXCJjbGFzc1wiIGlzIGp1c3QgYSB3cmFwcGVyIGFyb3VuZCBhIGRpY3Rpb25hcnkgYW5kIGlzIGhlcmUgdG8gYWxsb3dcbiAgICAvLyB5b3UgdG8gZGlmZmVyZW50aWF0ZSBiZXR3ZWVuIGxpYnJhcnkgZXJyb3JzIGFuZCB2YWxpZGF0aW9uIGVycm9yc1xuICAgIC8vIHdoZW4gdXNpbmcgcHJvbWlzZXMuXG4gICAgVmFsaWRhdGlvbkVycm9yczogZnVuY3Rpb24oZXJyb3JzKSB7XG4gICAgICB2LmV4dGVuZCh0aGlzLCBlcnJvcnMpO1xuICAgIH0sXG5cbiAgICAvLyBSdW5zIHRoZSB2YWxpZGF0b3JzIHNwZWNpZmllZCBieSB0aGUgY29uc3RyYWludHMgb2JqZWN0LlxuICAgIC8vIFdpbGwgcmV0dXJuIGFuIGFycmF5IG9mIHRoZSBmb3JtYXQ6XG4gICAgLy8gICAgIFt7YXR0cmlidXRlOiBcIjxhdHRyaWJ1dGUgbmFtZT5cIiwgZXJyb3I6IFwiPHZhbGlkYXRpb24gcmVzdWx0PlwifSwgLi4uXVxuICAgIHJ1blZhbGlkYXRpb25zOiBmdW5jdGlvbihhdHRyaWJ1dGVzLCBjb25zdHJhaW50cywgb3B0aW9ucykge1xuICAgICAgdmFyIHJlc3VsdHMgPSBbXVxuICAgICAgICAsIGF0dHJcbiAgICAgICAgLCB2YWxpZGF0b3JOYW1lXG4gICAgICAgICwgdmFsdWVcbiAgICAgICAgLCB2YWxpZGF0b3JzXG4gICAgICAgICwgdmFsaWRhdG9yXG4gICAgICAgICwgdmFsaWRhdG9yT3B0aW9uc1xuICAgICAgICAsIGVycm9yO1xuXG4gICAgICAvLyBMb29wcyB0aHJvdWdoIGVhY2ggY29uc3RyYWludHMsIGZpbmRzIHRoZSBjb3JyZWN0IHZhbGlkYXRvciBhbmQgcnVuIGl0LlxuICAgICAgZm9yIChhdHRyIGluIGNvbnN0cmFpbnRzKSB7XG4gICAgICAgIHZhbHVlID0gdi5nZXREZWVwT2JqZWN0VmFsdWUoYXR0cmlidXRlcywgYXR0cik7XG4gICAgICAgIHZhbGlkYXRvcnMgPSB2LnJlc3VsdChjb25zdHJhaW50c1thdHRyXSwgdmFsdWUsIGF0dHJpYnV0ZXMsIGF0dHIpO1xuXG4gICAgICAgIGZvciAodmFsaWRhdG9yTmFtZSBpbiB2YWxpZGF0b3JzKSB7XG4gICAgICAgICAgdmFsaWRhdG9yID0gdi52YWxpZGF0b3JzW3ZhbGlkYXRvck5hbWVdO1xuXG4gICAgICAgICAgaWYgKCF2YWxpZGF0b3IpIHtcbiAgICAgICAgICAgIGVycm9yID0gdi5mb3JtYXQoXCJVbmtub3duIHZhbGlkYXRvciAle25hbWV9XCIsIHtuYW1lOiB2YWxpZGF0b3JOYW1lfSk7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3IpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHZhbGlkYXRvck9wdGlvbnMgPSB2YWxpZGF0b3JzW3ZhbGlkYXRvck5hbWVdO1xuICAgICAgICAgIC8vIFRoaXMgYWxsb3dzIHRoZSBvcHRpb25zIHRvIGJlIGEgZnVuY3Rpb24uIFRoZSBmdW5jdGlvbiB3aWxsIGJlXG4gICAgICAgICAgLy8gY2FsbGVkIHdpdGggdGhlIHZhbHVlLCBhdHRyaWJ1dGUgbmFtZSBhbmQgdGhlIGNvbXBsZXRlIGRpY3Qgb2ZcbiAgICAgICAgICAvLyBhdHRyaWJ1dGVzLiBUaGlzIGlzIHVzZWZ1bCB3aGVuIHlvdSB3YW50IHRvIGhhdmUgZGlmZmVyZW50XG4gICAgICAgICAgLy8gdmFsaWRhdGlvbnMgZGVwZW5kaW5nIG9uIHRoZSBhdHRyaWJ1dGUgdmFsdWUuXG4gICAgICAgICAgdmFsaWRhdG9yT3B0aW9ucyA9IHYucmVzdWx0KHZhbGlkYXRvck9wdGlvbnMsIHZhbHVlLCBhdHRyaWJ1dGVzLCBhdHRyKTtcbiAgICAgICAgICBpZiAoIXZhbGlkYXRvck9wdGlvbnMpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICAgICAgYXR0cmlidXRlOiBhdHRyLFxuICAgICAgICAgICAgZXJyb3I6IHZhbGlkYXRvci5jYWxsKHZhbGlkYXRvciwgdmFsdWUsIHZhbGlkYXRvck9wdGlvbnMsIGF0dHIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlcylcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9LFxuXG4gICAgLy8gVGFrZXMgdGhlIG91dHB1dCBmcm9tIHJ1blZhbGlkYXRpb25zIGFuZCBjb252ZXJ0cyBpdCB0byB0aGUgY29ycmVjdFxuICAgIC8vIG91dHB1dCBmb3JtYXQuXG4gICAgcHJvY2Vzc1ZhbGlkYXRpb25SZXN1bHRzOiBmdW5jdGlvbihyZXN1bHRzLCBvcHRpb25zKSB7XG4gICAgICB2YXIgZXJyb3JzID0ge307XG5cbiAgICAgIC8vIFRoaXMgaW5kZXhlcyB0aGUgZXJyb3JzIHBlciBhdHRyaWJ1dGVcbiAgICAgIHJlc3VsdHMuZm9yRWFjaChmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgdmFyIGVycm9yID0gcmVzdWx0LmVycm9yXG4gICAgICAgICAgLCBhdHRyaWJ1dGUgPSByZXN1bHQuYXR0cmlidXRlO1xuXG4gICAgICAgIGlmICh2LmlzU3RyaW5nKGVycm9yKSkge1xuICAgICAgICAgIGVycm9yID0gW2Vycm9yXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgIGVycm9yc1thdHRyaWJ1dGVdID0gKGVycm9yc1thdHRyaWJ1dGVdIHx8IFtdKS5jb25jYXQoZXJyb3IpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gU2VtaSB1Z2x5IHdheSB0byBjaGVjayBpZiB0aGUgZXJyb3JzIGFyZSBlbXB0eSwgdHJ5IGl0ZXJhdGluZyBvdmVyXG4gICAgICAvLyB0aGVtIGFuZCBzaG9ydCBjaXJjdWl0IHdoZW4gc29tZXRoaW5nIGlzIGZvdW5kLlxuICAgICAgZm9yICh2YXIgXyBpbiBlcnJvcnMpIHtcbiAgICAgICAgcmV0dXJuIHYuZnVsbE1lc3NhZ2VzKGVycm9ycywgb3B0aW9ucyk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIC8vIFJ1bnMgdGhlIHZhbGlkYXRpb25zIHdpdGggc3VwcG9ydCBmb3IgcHJvbWlzZXMuXG4gICAgLy8gVGhpcyBmdW5jdGlvbiB3aWxsIHJldHVybiBhIHByb21pc2UgdGhhdCBpcyBzZXR0bGVkIHdoZW4gYWxsIHRoZVxuICAgIC8vIHZhbGlkYXRpb24gcHJvbWlzZXMgaGF2ZSBiZWVuIGNvbXBsZXRlZC5cbiAgICAvLyBJdCBjYW4gYmUgY2FsbGVkIGV2ZW4gaWYgbm8gdmFsaWRhdGlvbnMgcmV0dXJuZWQgYSBwcm9taXNlLlxuICAgIGFzeW5jOiBmdW5jdGlvbihhdHRyaWJ1dGVzLCBjb25zdHJhaW50cywgb3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9IHYuZXh0ZW5kKHt9LCB2LmFzeW5jLm9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgdmFyIHJlc3VsdHMgPSB2LnJ1blZhbGlkYXRpb25zKGF0dHJpYnV0ZXMsIGNvbnN0cmFpbnRzLCBvcHRpb25zKTtcblxuICAgICAgcmV0dXJuIHYuUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgdi53YWl0Rm9yUmVzdWx0cyhyZXN1bHRzKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBlcnJvcnMgPSB2LnByb2Nlc3NWYWxpZGF0aW9uUmVzdWx0cyhyZXN1bHRzLCBvcHRpb25zKTtcbiAgICAgICAgICBpZiAoZXJyb3JzKSB7XG4gICAgICAgICAgICBpZiAoIW9wdGlvbnMuZmxhdHRlbikge1xuICAgICAgICAgICAgICBlcnJvcnMgPSBuZXcgdi5WYWxpZGF0aW9uRXJyb3JzKGVycm9ycyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZWplY3QoZXJyb3JzKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzb2x2ZShhdHRyaWJ1dGVzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pLnRoZW4odW5kZWZpbmVkLCB2LmVycm9yKTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvLyBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IGlzIHJlc29sdmVkIHdoZW4gYWxsIHByb21pc2VzIGluIHRoZSByZXN1bHRzIGFycmF5XG4gICAgLy8gYXJlIHNldHRsZWQuIFRoZSBwcm9taXNlIHJldHVybmVkIGZyb20gdGhpcyBmdW5jdGlvbiBpcyBhbHdheXMgcmVzb2x2ZWQsXG4gICAgLy8gbmV2ZXIgcmVqZWN0ZWQuXG4gICAgLy8gVGhpcyBmdW5jdGlvbiBtb2RpZmllcyB0aGUgaW5wdXQgYXJndW1lbnQsIGl0IHJlcGxhY2VzIHRoZSBwcm9taXNlc1xuICAgIC8vIHdpdGggdGhlIHZhbHVlIHJldHVybmVkIGZyb20gdGhlIHByb21pc2UuXG4gICAgd2FpdEZvclJlc3VsdHM6IGZ1bmN0aW9uKHJlc3VsdHMpIHtcbiAgICAgIC8vIENyZWF0ZSBhIHNlcXVlbmNlIG9mIGFsbCB0aGUgcmVzdWx0cyBzdGFydGluZyB3aXRoIGEgcmVzb2x2ZWQgcHJvbWlzZS5cbiAgICAgIHZhciBwcm9taXNlID0gcmVzdWx0cy5yZWR1Y2UoZnVuY3Rpb24obWVtbywgcmVzdWx0KSB7XG4gICAgICAgIC8vIElmIHRoaXMgcmVzdWx0IGlzbid0IGEgcHJvbWlzZSBza2lwIGl0IGluIHRoZSBzZXF1ZW5jZS5cbiAgICAgICAgaWYgKCF2LmlzUHJvbWlzZShyZXN1bHQuZXJyb3IpKSB7XG4gICAgICAgICAgcmV0dXJuIG1lbW87XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbWVtby50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiByZXN1bHQuZXJyb3IudGhlbihcbiAgICAgICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZXN1bHQuZXJyb3IgPSBudWxsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgICAgICAgIC8vIElmIGZvciBzb21lIHJlYXNvbiB0aGUgdmFsaWRhdG9yIHByb21pc2Ugd2FzIHJlamVjdGVkIGJ1dCBub1xuICAgICAgICAgICAgICAvLyBlcnJvciB3YXMgc3BlY2lmaWVkLlxuICAgICAgICAgICAgICBpZiAoIWVycm9yKSB7XG4gICAgICAgICAgICAgICAgdi53YXJuKFwiVmFsaWRhdG9yIHByb21pc2Ugd2FzIHJlamVjdGVkIGJ1dCBkaWRuJ3QgcmV0dXJuIGFuIGVycm9yXCIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJlc3VsdC5lcnJvciA9IGVycm9yO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICkudGhlbih1bmRlZmluZWQsIHYuZXJyb3IpO1xuICAgICAgICB9KS50aGVuKHVuZGVmaW5lZCwgdi5lcnJvcik7XG4gICAgICB9LCB2LlByb21pc2UoZnVuY3Rpb24ocikgeyByKCk7IH0pKTsgLy8gQSByZXNvbHZlZCBwcm9taXNlXG5cbiAgICAgIHJldHVybiBwcm9taXNlLnRoZW4odW5kZWZpbmVkLCB2LmVycm9yKTtcbiAgICB9LFxuXG4gICAgLy8gSWYgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGEgY2FsbDogZnVuY3Rpb24gdGhlIGFuZDogZnVuY3Rpb24gcmV0dXJuIHRoZSB2YWx1ZVxuICAgIC8vIG90aGVyd2lzZSBqdXN0IHJldHVybiB0aGUgdmFsdWUuIEFkZGl0aW9uYWwgYXJndW1lbnRzIHdpbGwgYmUgcGFzc2VkIGFzXG4gICAgLy8gYXJndW1lbnRzIHRvIHRoZSBmdW5jdGlvbi5cbiAgICAvLyBFeGFtcGxlOlxuICAgIC8vIGBgYFxuICAgIC8vIHJlc3VsdCgnZm9vJykgLy8gJ2ZvbydcbiAgICAvLyByZXN1bHQoTWF0aC5tYXgsIDEsIDIpIC8vIDJcbiAgICAvLyBgYGBcbiAgICByZXN1bHQ6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdmFsdWUgPSB2YWx1ZS5hcHBseShudWxsLCBhcmdzKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9LFxuXG4gICAgLy8gQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBhIG51bWJlci4gVGhpcyBmdW5jdGlvbiBkb2VzIG5vdCBjb25zaWRlciBOYU4gYVxuICAgIC8vIG51bWJlciBsaWtlIG1hbnkgb3RoZXIgYGlzTnVtYmVyYCBmdW5jdGlvbnMgZG8uXG4gICAgaXNOdW1iZXI6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyAmJiAhaXNOYU4odmFsdWUpO1xuICAgIH0sXG5cbiAgICAvLyBSZXR1cm5zIGZhbHNlIGlmIHRoZSBvYmplY3QgaXMgbm90IGEgZnVuY3Rpb25cbiAgICBpc0Z1bmN0aW9uOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJztcbiAgICB9LFxuXG4gICAgLy8gQSBzaW1wbGUgY2hlY2sgdG8gdmVyaWZ5IHRoYXQgdGhlIHZhbHVlIGlzIGFuIGludGVnZXIuIFVzZXMgYGlzTnVtYmVyYFxuICAgIC8vIGFuZCBhIHNpbXBsZSBtb2R1bG8gY2hlY2suXG4gICAgaXNJbnRlZ2VyOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIHYuaXNOdW1iZXIodmFsdWUpICYmIHZhbHVlICUgMSA9PT0gMDtcbiAgICB9LFxuXG4gICAgLy8gVXNlcyB0aGUgYE9iamVjdGAgZnVuY3Rpb24gdG8gY2hlY2sgaWYgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGFuIG9iamVjdC5cbiAgICBpc09iamVjdDogZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gb2JqID09PSBPYmplY3Qob2JqKTtcbiAgICB9LFxuXG4gICAgLy8gUmV0dXJucyBmYWxzZSBpZiB0aGUgb2JqZWN0IGlzIGBudWxsYCBvZiBgdW5kZWZpbmVkYFxuICAgIGlzRGVmaW5lZDogZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gb2JqICE9PSBudWxsICYmIG9iaiAhPT0gdW5kZWZpbmVkO1xuICAgIH0sXG5cbiAgICAvLyBDaGVja3MgaWYgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGEgcHJvbWlzZS4gQW55dGhpbmcgd2l0aCBhIGB0aGVuYFxuICAgIC8vIGZ1bmN0aW9uIGlzIGNvbnNpZGVyZWQgYSBwcm9taXNlLlxuICAgIGlzUHJvbWlzZTogZnVuY3Rpb24ocCkge1xuICAgICAgcmV0dXJuICEhcCAmJiB0eXBlb2YgcC50aGVuID09PSAnZnVuY3Rpb24nO1xuICAgIH0sXG5cbiAgICAvLyBGb3JtYXRzIHRoZSBzcGVjaWZpZWQgc3RyaW5ncyB3aXRoIHRoZSBnaXZlbiB2YWx1ZXMgbGlrZSBzbzpcbiAgICAvLyBgYGBcbiAgICAvLyBmb3JtYXQoXCJGb286ICV7Zm9vfVwiLCB7Zm9vOiBcImJhclwifSkgLy8gXCJGb28gYmFyXCJcbiAgICAvLyBgYGBcbiAgICBmb3JtYXQ6IGZ1bmN0aW9uKHN0ciwgdmFscykge1xuICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKEZPUk1BVF9SRUdFWFAsIGZ1bmN0aW9uKG0wLCBtMSkge1xuICAgICAgICByZXR1cm4gU3RyaW5nKHZhbHNbbTFdKTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvLyBcIlByZXR0aWZpZXNcIiB0aGUgZ2l2ZW4gc3RyaW5nLlxuICAgIC8vIFByZXR0aWZ5aW5nIG1lYW5zIHJlcGxhY2luZyBbLlxcXy1dIHdpdGggc3BhY2VzIGFzIHdlbGwgYXMgc3BsaXR0aW5nXG4gICAgLy8gY2FtZWwgY2FzZSB3b3Jkcy5cbiAgICBwcmV0dGlmeTogZnVuY3Rpb24oc3RyKSB7XG4gICAgICByZXR1cm4gc3RyXG4gICAgICAgIC8vIFNwbGl0cyBrZXlzIHNlcGFyYXRlZCBieSBwZXJpb2RzXG4gICAgICAgIC5yZXBsYWNlKC8oW15cXHNdKVxcLihbXlxcc10pL2csICckMSAkMicpXG4gICAgICAgIC8vIFJlbW92ZXMgYmFja3NsYXNoZXNcbiAgICAgICAgLnJlcGxhY2UoL1xcXFwrL2csICcnKVxuICAgICAgICAvLyBSZXBsYWNlcyAtIGFuZCAtIHdpdGggc3BhY2VcbiAgICAgICAgLnJlcGxhY2UoL1tfLV0vZywgJyAnKVxuICAgICAgICAvLyBTcGxpdHMgY2FtZWwgY2FzZWQgd29yZHNcbiAgICAgICAgLnJlcGxhY2UoLyhbYS16XSkoW0EtWl0pL2csIGZ1bmN0aW9uKG0wLCBtMSwgbTIpIHtcbiAgICAgICAgICByZXR1cm4gXCJcIiArIG0xICsgXCIgXCIgKyBtMi50b0xvd2VyQ2FzZSgpO1xuICAgICAgICB9KVxuICAgICAgICAudG9Mb3dlckNhc2UoKTtcbiAgICB9LFxuXG4gICAgaXNTdHJpbmc6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJztcbiAgICB9LFxuXG4gICAgaXNBcnJheTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiB7fS50b1N0cmluZy5jYWxsKHZhbHVlKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbiAgICB9LFxuXG4gICAgY29udGFpbnM6IGZ1bmN0aW9uKG9iaiwgdmFsdWUpIHtcbiAgICAgIGlmICghdi5pc0RlZmluZWQob2JqKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAodi5pc0FycmF5KG9iaikpIHtcbiAgICAgICAgcmV0dXJuIG9iai5pbmRleE9mKHZhbHVlKSAhPT0gLTE7XG4gICAgICB9XG4gICAgICByZXR1cm4gdmFsdWUgaW4gb2JqO1xuICAgIH0sXG5cbiAgICBnZXREZWVwT2JqZWN0VmFsdWU6IGZ1bmN0aW9uKG9iaiwga2V5cGF0aCkge1xuICAgICAgaWYgKCF2LmlzT2JqZWN0KG9iaikgfHwgIXYuaXNTdHJpbmcoa2V5cGF0aCkpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cblxuICAgICAgdmFyIGtleSA9IFwiXCJcbiAgICAgICAgLCBpXG4gICAgICAgICwgZXNjYXBlID0gZmFsc2U7XG5cbiAgICAgIGZvciAoaSA9IDA7IGkgPCBrZXlwYXRoLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHN3aXRjaCAoa2V5cGF0aFtpXSkge1xuICAgICAgICAgIGNhc2UgJy4nOlxuICAgICAgICAgICAgaWYgKGVzY2FwZSkge1xuICAgICAgICAgICAgICBlc2NhcGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAga2V5ICs9ICcuJztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoa2V5IGluIG9iaikge1xuICAgICAgICAgICAgICBvYmogPSBvYmpba2V5XTtcbiAgICAgICAgICAgICAga2V5ID0gXCJcIjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgJ1xcXFwnOlxuICAgICAgICAgICAgaWYgKGVzY2FwZSkge1xuICAgICAgICAgICAgICBlc2NhcGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAga2V5ICs9ICdcXFxcJztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGVzY2FwZSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBlc2NhcGUgPSBmYWxzZTtcbiAgICAgICAgICAgIGtleSArPSBrZXlwYXRoW2ldO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHYuaXNEZWZpbmVkKG9iaikgJiYga2V5IGluIG9iaikge1xuICAgICAgICByZXR1cm4gb2JqW2tleV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBjYXBpdGFsaXplOiBmdW5jdGlvbihzdHIpIHtcbiAgICAgIGlmICghdi5pc1N0cmluZyhzdHIpKSB7XG4gICAgICAgIHJldHVybiBzdHI7XG4gICAgICB9XG4gICAgICByZXR1cm4gc3RyWzBdLnRvVXBwZXJDYXNlKCkgKyBzdHIuc2xpY2UoMSk7XG4gICAgfSxcblxuICAgIGZ1bGxNZXNzYWdlczogZnVuY3Rpb24oZXJyb3JzLCBvcHRpb25zKSB7XG4gICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgdmFyIHJldCA9IG9wdGlvbnMuZmxhdHRlbiA/IFtdIDoge31cbiAgICAgICAgLCBhdHRyO1xuXG4gICAgICBpZiAoIWVycm9ycykge1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBwcm9jZXNzRXJyb3JzKGF0dHIsIGVycm9ycykge1xuICAgICAgICBlcnJvcnMuZm9yRWFjaChmdW5jdGlvbihlcnJvcikge1xuICAgICAgICAgIGlmIChlcnJvclswXSA9PT0gJ14nKSB7XG4gICAgICAgICAgICBlcnJvciA9IGVycm9yLnNsaWNlKDEpO1xuICAgICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5mdWxsTWVzc2FnZXMgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICBlcnJvciA9IHYuZm9ybWF0KFwiJXthdHRyfSAle21lc3NhZ2V9XCIsIHtcbiAgICAgICAgICAgICAgYXR0cjogdi5jYXBpdGFsaXplKHYucHJldHRpZnkoYXR0cikpLFxuICAgICAgICAgICAgICBtZXNzYWdlOiBlcnJvclxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVycm9yID0gZXJyb3IucmVwbGFjZSgvXFxcXFxcXi9nLCBcIl5cIik7XG4gICAgICAgICAgLy8gSWYgZmxhdHRlbiBpcyB0cnVlIGEgZmxhdCBhcnJheSBpcyByZXR1cm5lZC5cbiAgICAgICAgICBpZiAob3B0aW9ucy5mbGF0dGVuKSB7XG4gICAgICAgICAgICByZXQucHVzaChlcnJvcik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgKHJldFthdHRyXSB8fCAocmV0W2F0dHJdID0gW10pKS5wdXNoKGVycm9yKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICAvLyBDb252ZXJ0cyB0aGUgZXJyb3JzIG9mIG9iamVjdCBvZiB0aGUgZm9ybWF0XG4gICAgICAvLyB7YXR0cjogWzxlcnJvcj4sIDxlcnJvcj4sIC4uLl19IHRvIGNvbnRhaW4gdGhlIGF0dHJpYnV0ZSBuYW1lLlxuICAgICAgZm9yIChhdHRyIGluIGVycm9ycykge1xuICAgICAgICBwcm9jZXNzRXJyb3JzKGF0dHIsIGVycm9yc1thdHRyXSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmV0O1xuICAgIH0sXG5cbiAgICAvLyBSZXR1cm5zIGEgcHJvbWlzZSwgc2hvdWxkIGJlIGNhbGxlZCB3aXRoIHRoZSBuZXcgb3BlcmF0b3IuXG4gICAgLy8gVGhlIGZpcnN0IGFyZ3VtZW50IHdpbGwgYmUgY2FsbGVkIHdpdGggdHdvIGZ1bmN0aW9ucywgdGhlIGZpcnN0IGZvclxuICAgIC8vIHJlc29sdmluZyB0aGUgcHJvbWlzZSBhbmQgdGhlIHNlY29uZCBmb3IgcmVqZWN0aW5nIGl0LlxuICAgIC8vIFN1cHBvcnRzIChpbiBvcmRlciBvZiBwcmVjZWRlbmNlKTpcbiAgICAvLyAgICogRWNtYVNjcmlwdCA2IFByb21pc2VzXG4gICAgLy8gICAqIFJTVlBcbiAgICAvLyAgICogd2hlblxuICAgIC8vICAgKiBRXG4gICAgLy9cbiAgICAvLyBJZiBubyBzdXBwb3J0ZWQgcHJvbWlzZXMgYXJlIGRldGVjdGVkIGFuIGVycm9yIGlzIHRocm93bi5cbiAgICAvLyBBIHdvcmQgb2Ygd2FybmluZywgb25seSBBKyBzdHlsZSBwcm9taXNlcyBhcmUgc3VwcG9ydGVkLiBqUXVlcnkgZGVmZXJyZWRzXG4gICAgLy8gYXJlIE5PVCBzdXBwb3J0ZWQuXG4gICAgUHJvbWlzZTogdi5leHRlbmQoZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgIHZhciBwcm9taXNlID0gdi5Qcm9taXNlLm5hdGl2ZVByb21pc2UoY2FsbGJhY2spIHx8XG4gICAgICAgICAgICAgICAgICAgIHYuUHJvbWlzZS5SU1ZQUHJvbWlzZShjYWxsYmFjaykgfHxcbiAgICAgICAgICAgICAgICAgICAgdi5Qcm9taXNlLndoZW5Qcm9taXNlKGNhbGxiYWNrKSB8fFxuICAgICAgICAgICAgICAgICAgICB2LlByb21pc2UuUVByb21pc2UoY2FsbGJhY2spO1xuXG4gICAgICBpZiAoIXByb21pc2UpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gcHJvbWlzZXMgY291bGQgYmUgZGV0ZWN0ZWRcIik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBwcm9taXNlO1xuICAgIH0sIHtcbiAgICAgIG5hdGl2ZVByb21pc2U6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBQcm9taXNlXywgbW9kdWxlO1xuICAgICAgICBpZiAodHlwZW9mIFByb21pc2UgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICBQcm9taXNlXyA9IFByb21pc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbW9kdWxlID0gdi50cnlSZXF1aXJlKFwiZXM2LXByb21pc2VcIik7XG4gICAgICAgICAgaWYgKG1vZHVsZSkge1xuICAgICAgICAgICAgUHJvbWlzZV8gPSBtb2R1bGUuUHJvbWlzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKFByb21pc2VfKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlXyhjYWxsYmFjayk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBSU1ZQUHJvbWlzZTogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIFByb21pc2UsIG1vZHVsZTtcbiAgICAgICAgaWYgKHR5cGVvZiBSU1ZQICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgUHJvbWlzZSA9IFJTVlAuUHJvbWlzZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBtb2R1bGUgPSB2LnRyeVJlcXVpcmUoXCJyc3ZwXCIpO1xuICAgICAgICAgIGlmIChtb2R1bGUpIHtcbiAgICAgICAgICAgIFByb21pc2UgPSBtb2R1bGUuUHJvbWlzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKFByb21pc2UpIHtcbiAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgd2hlblByb21pc2U6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBwcm9taXNlLCBtb2R1bGU7XG4gICAgICAgIGlmICh0eXBlb2Ygd2hlbiAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgIHByb21pc2UgPSB3aGVuLnByb21pc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbW9kdWxlID0gdi50cnlSZXF1aXJlKFwid2hlblwiKTtcbiAgICAgICAgICBpZiAobW9kdWxlKSB7XG4gICAgICAgICAgICBwcm9taXNlID0gbW9kdWxlLnByb21pc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChwcm9taXNlKSB7XG4gICAgICAgICAgcmV0dXJuIHByb21pc2UoY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgUVByb21pc2U6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBwcm9taXNlLCBtb2R1bGU7XG4gICAgICAgIGlmICh0eXBlb2YgUSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgIHByb21pc2UgPSBRLnByb21pc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbW9kdWxlID0gdi50cnlSZXF1aXJlKFwicVwiKTtcbiAgICAgICAgICBpZiAobW9kdWxlKSB7XG4gICAgICAgICAgICBwcm9taXNlID0gbW9kdWxlLnByb21pc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChwcm9taXNlKSB7XG4gICAgICAgICAgcmV0dXJuIHByb21pc2UoY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSksXG5cbiAgICB0cnlSZXF1aXJlOiBmdW5jdGlvbihtb2R1bGVOYW1lKSB7XG4gICAgICBpZiAoIXYucmVxdWlyZSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiB2LnJlcXVpcmUobW9kdWxlTmFtZSk7XG4gICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfSxcblxuICAgIHJlcXVpcmU6IHJlcXVpcmUsXG5cbiAgICBleHBvc2VNb2R1bGU6IGZ1bmN0aW9uKHZhbGlkYXRlLCByb290LCBleHBvcnRzLCBtb2R1bGUsIGRlZmluZSkge1xuICAgICAgaWYgKGV4cG9ydHMpIHtcbiAgICAgICAgaWYgKG1vZHVsZSAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgICAgIGV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHZhbGlkYXRlO1xuICAgICAgICB9XG4gICAgICAgIGV4cG9ydHMudmFsaWRhdGUgPSB2YWxpZGF0ZTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICByb290LnZhbGlkYXRlID0gdmFsaWRhdGU7XG4gICAgICAgIGlmICh2YWxpZGF0ZS5pc0Z1bmN0aW9uKGRlZmluZSkgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICAgIGRlZmluZShcInZhbGlkYXRlXCIsIFtdLCBmdW5jdGlvbiAoKSB7IHJldHVybiB2YWxpZGF0ZTsgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuXG4gICAgd2FybjogZnVuY3Rpb24obXNnKSB7XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUgIT09IFwidW5kZWZpbmVkXCIgJiYgY29uc29sZS53YXJuKSB7XG4gICAgICAgIGNvbnNvbGUud2Fybihtc2cpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBlcnJvcjogZnVuY3Rpb24obXNnKSB7XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUgIT09IFwidW5kZWZpbmVkXCIgJiYgY29uc29sZS5lcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICB2YWxpZGF0ZS52YWxpZGF0b3JzID0ge1xuICAgIC8vIFByZXNlbmNlIHZhbGlkYXRlcyB0aGF0IHRoZSB2YWx1ZSBpc24ndCBlbXB0eVxuICAgIHByZXNlbmNlOiBmdW5jdGlvbih2YWx1ZSwgb3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9IHYuZXh0ZW5kKHt9LCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgICB2YXIgbWVzc2FnZSA9IG9wdGlvbnMubWVzc2FnZSB8fCB0aGlzLm1lc3NhZ2UgfHwgXCJjYW4ndCBiZSBibGFua1wiXG4gICAgICAgICwgYXR0cjtcblxuICAgICAgLy8gTnVsbCBhbmQgdW5kZWZpbmVkIGFyZW4ndCBhbGxvd2VkXG4gICAgICBpZiAoIXYuaXNEZWZpbmVkKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gbWVzc2FnZTtcbiAgICAgIH1cblxuICAgICAgLy8gZnVuY3Rpb25zIGFyZSBva1xuICAgICAgaWYgKHYuaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICAvLyBUZXN0cyBpZiB0aGUgc3RyaW5nIGNvbnRhaW5zIG9ubHkgd2hpdGVzcGFjZSAodGFiLCBuZXdsaW5lLCBzcGFjZSBldGMpXG4gICAgICAgIGlmICgoL15cXHMqJC8pLnRlc3QodmFsdWUpKSB7XG4gICAgICAgICAgcmV0dXJuIG1lc3NhZ2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKHYuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgLy8gRm9yIGFycmF5cyB3ZSB1c2UgdGhlIGxlbmd0aCBwcm9wZXJ0eVxuICAgICAgICBpZiAodmFsdWUubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgcmV0dXJuIG1lc3NhZ2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKHYuaXNPYmplY3QodmFsdWUpKSB7XG4gICAgICAgIC8vIElmIHdlIGZpbmQgYXQgbGVhc3Qgb25lIHByb3BlcnR5IHdlIGNvbnNpZGVyIGl0IG5vbiBlbXB0eVxuICAgICAgICBmb3IgKGF0dHIgaW4gdmFsdWUpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1lc3NhZ2U7XG4gICAgICB9XG4gICAgfSxcbiAgICBsZW5ndGg6IGZ1bmN0aW9uKHZhbHVlLCBvcHRpb25zLCBhdHRyaWJ1dGUpIHtcbiAgICAgIC8vIE51bGwgYW5kIHVuZGVmaW5lZCBhcmUgZmluZVxuICAgICAgaWYgKCF2LmlzRGVmaW5lZCh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBvcHRpb25zID0gdi5leHRlbmQoe30sIHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgIHZhciBpcyA9IG9wdGlvbnMuaXNcbiAgICAgICAgLCBtYXhpbXVtID0gb3B0aW9ucy5tYXhpbXVtXG4gICAgICAgICwgbWluaW11bSA9IG9wdGlvbnMubWluaW11bVxuICAgICAgICAsIHRva2VuaXplciA9IG9wdGlvbnMudG9rZW5pemVyIHx8IGZ1bmN0aW9uKHZhbCkgeyByZXR1cm4gdmFsOyB9XG4gICAgICAgICwgZXJyXG4gICAgICAgICwgZXJyb3JzID0gW107XG5cbiAgICAgIHZhbHVlID0gdG9rZW5pemVyKHZhbHVlKTtcbiAgICAgIHZhciBsZW5ndGggPSB2YWx1ZS5sZW5ndGg7XG4gICAgICBpZighdi5pc051bWJlcihsZW5ndGgpKSB7XG4gICAgICAgIHYuZXJyb3Iodi5mb3JtYXQoXCJBdHRyaWJ1dGUgJXthdHRyfSBoYXMgYSBub24gbnVtZXJpYyB2YWx1ZSBmb3IgYGxlbmd0aGBcIiwge2F0dHI6IGF0dHJpYnV0ZX0pKTtcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMubWVzc2FnZSB8fCB0aGlzLm5vdFZhbGlkIHx8IFwiaGFzIGFuIGluY29ycmVjdCBsZW5ndGhcIjtcbiAgICAgIH1cblxuICAgICAgLy8gSXMgY2hlY2tzXG4gICAgICBpZiAodi5pc051bWJlcihpcykgJiYgbGVuZ3RoICE9PSBpcykge1xuICAgICAgICBlcnIgPSBvcHRpb25zLndyb25nTGVuZ3RoIHx8XG4gICAgICAgICAgdGhpcy53cm9uZ0xlbmd0aCB8fFxuICAgICAgICAgIFwiaXMgdGhlIHdyb25nIGxlbmd0aCAoc2hvdWxkIGJlICV7Y291bnR9IGNoYXJhY3RlcnMpXCI7XG4gICAgICAgIGVycm9ycy5wdXNoKHYuZm9ybWF0KGVyciwge2NvdW50OiBpc30pKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHYuaXNOdW1iZXIobWluaW11bSkgJiYgbGVuZ3RoIDwgbWluaW11bSkge1xuICAgICAgICBlcnIgPSBvcHRpb25zLnRvb1Nob3J0IHx8XG4gICAgICAgICAgdGhpcy50b29TaG9ydCB8fFxuICAgICAgICAgIFwiaXMgdG9vIHNob3J0IChtaW5pbXVtIGlzICV7Y291bnR9IGNoYXJhY3RlcnMpXCI7XG4gICAgICAgIGVycm9ycy5wdXNoKHYuZm9ybWF0KGVyciwge2NvdW50OiBtaW5pbXVtfSkpO1xuICAgICAgfVxuXG4gICAgICBpZiAodi5pc051bWJlcihtYXhpbXVtKSAmJiBsZW5ndGggPiBtYXhpbXVtKSB7XG4gICAgICAgIGVyciA9IG9wdGlvbnMudG9vTG9uZyB8fFxuICAgICAgICAgIHRoaXMudG9vTG9uZyB8fFxuICAgICAgICAgIFwiaXMgdG9vIGxvbmcgKG1heGltdW0gaXMgJXtjb3VudH0gY2hhcmFjdGVycylcIjtcbiAgICAgICAgZXJyb3JzLnB1c2godi5mb3JtYXQoZXJyLCB7Y291bnQ6IG1heGltdW19KSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChlcnJvcnMubGVuZ3RoID4gMCkge1xuICAgICAgICByZXR1cm4gb3B0aW9ucy5tZXNzYWdlIHx8IGVycm9ycztcbiAgICAgIH1cbiAgICB9LFxuICAgIG51bWVyaWNhbGl0eTogZnVuY3Rpb24odmFsdWUsIG9wdGlvbnMpIHtcbiAgICAgIGlmICghdi5pc0RlZmluZWQodmFsdWUpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgb3B0aW9ucyA9IHYuZXh0ZW5kKHt9LCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgICB2YXIgZXJyb3JzID0gW11cbiAgICAgICAgLCBuYW1lXG4gICAgICAgICwgY291bnRcbiAgICAgICAgLCBjaGVja3MgPSB7XG4gICAgICAgICAgICBncmVhdGVyVGhhbjogICAgICAgICAgZnVuY3Rpb24odiwgYykgeyByZXR1cm4gdiA+IGM7IH0sXG4gICAgICAgICAgICBncmVhdGVyVGhhbk9yRXF1YWxUbzogZnVuY3Rpb24odiwgYykgeyByZXR1cm4gdiA+PSBjOyB9LFxuICAgICAgICAgICAgZXF1YWxUbzogICAgICAgICAgICAgIGZ1bmN0aW9uKHYsIGMpIHsgcmV0dXJuIHYgPT09IGM7IH0sXG4gICAgICAgICAgICBsZXNzVGhhbjogICAgICAgICAgICAgZnVuY3Rpb24odiwgYykgeyByZXR1cm4gdiA8IGM7IH0sXG4gICAgICAgICAgICBsZXNzVGhhbk9yRXF1YWxUbzogICAgZnVuY3Rpb24odiwgYykgeyByZXR1cm4gdiA8PSBjOyB9XG4gICAgICAgICAgfTtcblxuICAgICAgLy8gQ29lcmNlIHRoZSB2YWx1ZSB0byBhIG51bWJlciB1bmxlc3Mgd2UncmUgYmVpbmcgc3RyaWN0LlxuICAgICAgaWYgKG9wdGlvbnMubm9TdHJpbmdzICE9PSB0cnVlICYmIHYuaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgICAgIHZhbHVlID0gK3ZhbHVlO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiBpdCdzIG5vdCBhIG51bWJlciB3ZSBzaG91bGRuJ3QgY29udGludWUgc2luY2UgaXQgd2lsbCBjb21wYXJlIGl0LlxuICAgICAgaWYgKCF2LmlzTnVtYmVyKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gb3B0aW9ucy5tZXNzYWdlIHx8IHRoaXMubm90VmFsaWQgfHwgXCJpcyBub3QgYSBudW1iZXJcIjtcbiAgICAgIH1cblxuICAgICAgLy8gU2FtZSBsb2dpYyBhcyBhYm92ZSwgc29ydCBvZi4gRG9uJ3QgYm90aGVyIHdpdGggY29tcGFyaXNvbnMgaWYgdGhpc1xuICAgICAgLy8gZG9lc24ndCBwYXNzLlxuICAgICAgaWYgKG9wdGlvbnMub25seUludGVnZXIgJiYgIXYuaXNJbnRlZ2VyKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gb3B0aW9ucy5tZXNzYWdlIHx8IHRoaXMubm90SW50ZWdlciAgfHwgXCJtdXN0IGJlIGFuIGludGVnZXJcIjtcbiAgICAgIH1cblxuICAgICAgZm9yIChuYW1lIGluIGNoZWNrcykge1xuICAgICAgICBjb3VudCA9IG9wdGlvbnNbbmFtZV07XG4gICAgICAgIGlmICh2LmlzTnVtYmVyKGNvdW50KSAmJiAhY2hlY2tzW25hbWVdKHZhbHVlLCBjb3VudCkpIHtcbiAgICAgICAgICAvLyBUaGlzIHBpY2tzIHRoZSBkZWZhdWx0IG1lc3NhZ2UgaWYgc3BlY2lmaWVkXG4gICAgICAgICAgLy8gRm9yIGV4YW1wbGUgdGhlIGdyZWF0ZXJUaGFuIGNoZWNrIHVzZXMgdGhlIG1lc3NhZ2UgZnJvbVxuICAgICAgICAgIC8vIHRoaXMubm90R3JlYXRlclRoYW4gc28gd2UgY2FwaXRhbGl6ZSB0aGUgbmFtZSBhbmQgcHJlcGVuZCBcIm5vdFwiXG4gICAgICAgICAgdmFyIG1zZyA9IHRoaXNbXCJub3RcIiArIHYuY2FwaXRhbGl6ZShuYW1lKV0gfHxcbiAgICAgICAgICAgIFwibXVzdCBiZSAle3R5cGV9ICV7Y291bnR9XCI7XG5cbiAgICAgICAgICBlcnJvcnMucHVzaCh2LmZvcm1hdChtc2csIHtcbiAgICAgICAgICAgIGNvdW50OiBjb3VudCxcbiAgICAgICAgICAgIHR5cGU6IHYucHJldHRpZnkobmFtZSlcbiAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKG9wdGlvbnMub2RkICYmIHZhbHVlICUgMiAhPT0gMSkge1xuICAgICAgICBlcnJvcnMucHVzaCh0aGlzLm5vdE9kZCB8fCBcIm11c3QgYmUgb2RkXCIpO1xuICAgICAgfVxuICAgICAgaWYgKG9wdGlvbnMuZXZlbiAmJiB2YWx1ZSAlIDIgIT09IDApIHtcbiAgICAgICAgZXJyb3JzLnB1c2godGhpcy5ub3RFdmVuIHx8IFwibXVzdCBiZSBldmVuXCIpO1xuICAgICAgfVxuXG4gICAgICBpZiAoZXJyb3JzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gb3B0aW9ucy5tZXNzYWdlIHx8IGVycm9ycztcbiAgICAgIH1cbiAgICB9LFxuICAgIGRhdGV0aW1lOiB2LmV4dGVuZChmdW5jdGlvbih2YWx1ZSwgb3B0aW9ucykge1xuICAgICAgaWYgKCF2LmlzRGVmaW5lZCh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBvcHRpb25zID0gdi5leHRlbmQoe30sIHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgIHZhciBlcnJcbiAgICAgICAgLCBlcnJvcnMgPSBbXVxuICAgICAgICAsIGVhcmxpZXN0ID0gb3B0aW9ucy5lYXJsaWVzdCA/IHRoaXMucGFyc2Uob3B0aW9ucy5lYXJsaWVzdCwgb3B0aW9ucykgOiBOYU5cbiAgICAgICAgLCBsYXRlc3QgPSBvcHRpb25zLmxhdGVzdCA/IHRoaXMucGFyc2Uob3B0aW9ucy5sYXRlc3QsIG9wdGlvbnMpIDogTmFOO1xuXG4gICAgICB2YWx1ZSA9IHRoaXMucGFyc2UodmFsdWUsIG9wdGlvbnMpO1xuXG4gICAgICBpZiAoaXNOYU4odmFsdWUpIHx8IG9wdGlvbnMuZGF0ZU9ubHkgJiYgdmFsdWUgJSA4NjQwMDAwMCAhPT0gMCkge1xuICAgICAgICByZXR1cm4gb3B0aW9ucy5tZXNzYWdlIHx8IHRoaXMubm90VmFsaWQgfHwgXCJtdXN0IGJlIGEgdmFsaWQgZGF0ZVwiO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWlzTmFOKGVhcmxpZXN0KSAmJiB2YWx1ZSA8IGVhcmxpZXN0KSB7XG4gICAgICAgIGVyciA9IHRoaXMudG9vRWFybHkgfHwgXCJtdXN0IGJlIG5vIGVhcmxpZXIgdGhhbiAle2RhdGV9XCI7XG4gICAgICAgIGVyciA9IHYuZm9ybWF0KGVyciwge2RhdGU6IHRoaXMuZm9ybWF0KGVhcmxpZXN0LCBvcHRpb25zKX0pO1xuICAgICAgICBlcnJvcnMucHVzaChlcnIpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWlzTmFOKGxhdGVzdCkgJiYgdmFsdWUgPiBsYXRlc3QpIHtcbiAgICAgICAgZXJyID0gdGhpcy50b29MYXRlIHx8IFwibXVzdCBiZSBubyBsYXRlciB0aGFuICV7ZGF0ZX1cIjtcbiAgICAgICAgZXJyID0gdi5mb3JtYXQoZXJyLCB7ZGF0ZTogdGhpcy5mb3JtYXQobGF0ZXN0LCBvcHRpb25zKX0pO1xuICAgICAgICBlcnJvcnMucHVzaChlcnIpO1xuICAgICAgfVxuXG4gICAgICBpZiAoZXJyb3JzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gb3B0aW9ucy5tZXNzYWdlIHx8IGVycm9ycztcbiAgICAgIH1cbiAgICB9LCB7XG4gICAgICAvLyBUaGlzIGlzIHRoZSBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgdXNlZCB0byBjb252ZXJ0IGlucHV0IHRvIHRoZSBudW1iZXJcbiAgICAgIC8vIG9mIG1pbGxpcyBzaW5jZSB0aGUgZXBvY2guXG4gICAgICAvLyBJdCBzaG91bGQgcmV0dXJuIE5hTiBpZiBpdCdzIG5vdCBhIHZhbGlkIGRhdGUuXG4gICAgICBwYXJzZTogZnVuY3Rpb24odmFsdWUsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKHYuaXNGdW5jdGlvbihyb290LlhEYXRlKSkge1xuICAgICAgICAgIHJldHVybiBuZXcgcm9vdC5YRGF0ZSh2YWx1ZSwgdHJ1ZSkuZ2V0VGltZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG1vbWVudCA9IHYudHJ5UmVxdWlyZShcIm1vbWVudFwiKSB8fCByb290Lm1vbWVudDtcbiAgICAgICAgaWYgKHYuaXNEZWZpbmVkKG1vbWVudCkpIHtcbiAgICAgICAgICByZXR1cm4gK21vbWVudC51dGModmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTmVpdGhlciBYRGF0ZSBvciBtb21lbnQuanMgd2FzIGZvdW5kXCIpO1xuICAgICAgfSxcbiAgICAgIC8vIEZvcm1hdHMgdGhlIGdpdmVuIHRpbWVzdGFtcC4gVXNlcyBJU084NjAxIHRvIGZvcm1hdCB0aGVtLlxuICAgICAgLy8gSWYgb3B0aW9ucy5kYXRlT25seSBpcyB0cnVlIHRoZW4gb25seSB0aGUgeWVhciwgbW9udGggYW5kIGRheSB3aWxsIGJlXG4gICAgICAvLyBvdXRwdXQuXG4gICAgICBmb3JtYXQ6IGZ1bmN0aW9uKGRhdGUsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGZvcm1hdCA9IG9wdGlvbnMuZGF0ZUZvcm1hdDtcblxuICAgICAgICBpZiAodi5pc0Z1bmN0aW9uKHJvb3QuWERhdGUpKSB7XG4gICAgICAgICAgZm9ybWF0ID0gZm9ybWF0IHx8IChvcHRpb25zLmRhdGVPbmx5ID8gXCJ5eXl5LU1NLWRkXCIgOiBcInl5eXktTU0tZGQgSEg6bW06c3NcIik7XG4gICAgICAgICAgcmV0dXJuIG5ldyBYRGF0ZShkYXRlLCB0cnVlKS50b1N0cmluZyhmb3JtYXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG1vbWVudCA9IHYudHJ5UmVxdWlyZShcIm1vbWVudFwiKSB8fCByb290Lm1vbWVudDtcbiAgICAgICAgaWYgKHYuaXNEZWZpbmVkKG1vbWVudCkpIHtcbiAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQgfHwgKG9wdGlvbnMuZGF0ZU9ubHkgPyBcIllZWVktTU0tRERcIiA6IFwiWVlZWS1NTS1ERCBISDptbTpzc1wiKTtcbiAgICAgICAgICByZXR1cm4gbW9tZW50LnV0YyhkYXRlKS5mb3JtYXQoZm9ybWF0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5laXRoZXIgWERhdGUgb3IgbW9tZW50LmpzIHdhcyBmb3VuZFwiKTtcbiAgICAgIH1cbiAgICB9KSxcbiAgICBkYXRlOiBmdW5jdGlvbih2YWx1ZSwgb3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9IHYuZXh0ZW5kKHt9LCBvcHRpb25zLCB7ZGF0ZU9ubHk6IHRydWV9KTtcbiAgICAgIHJldHVybiB2LnZhbGlkYXRvcnMuZGF0ZXRpbWUuY2FsbCh2LnZhbGlkYXRvcnMuZGF0ZXRpbWUsIHZhbHVlLCBvcHRpb25zKTtcbiAgICB9LFxuICAgIGZvcm1hdDogZnVuY3Rpb24odmFsdWUsIG9wdGlvbnMpIHtcbiAgICAgIGlmICh2LmlzU3RyaW5nKG9wdGlvbnMpIHx8IChvcHRpb25zIGluc3RhbmNlb2YgUmVnRXhwKSkge1xuICAgICAgICBvcHRpb25zID0ge3BhdHRlcm46IG9wdGlvbnN9O1xuICAgICAgfVxuXG4gICAgICBvcHRpb25zID0gdi5leHRlbmQoe30sIHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgIHZhciBtZXNzYWdlID0gb3B0aW9ucy5tZXNzYWdlIHx8IHRoaXMubWVzc2FnZSB8fCBcImlzIGludmFsaWRcIlxuICAgICAgICAsIHBhdHRlcm4gPSBvcHRpb25zLnBhdHRlcm5cbiAgICAgICAgLCBtYXRjaDtcblxuICAgICAgaWYgKCF2LmlzRGVmaW5lZCh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKCF2LmlzU3RyaW5nKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gbWVzc2FnZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHYuaXNTdHJpbmcocGF0dGVybikpIHtcbiAgICAgICAgcGF0dGVybiA9IG5ldyBSZWdFeHAob3B0aW9ucy5wYXR0ZXJuLCBvcHRpb25zLmZsYWdzKTtcbiAgICAgIH1cbiAgICAgIG1hdGNoID0gcGF0dGVybi5leGVjKHZhbHVlKTtcbiAgICAgIGlmICghbWF0Y2ggfHwgbWF0Y2hbMF0ubGVuZ3RoICE9IHZhbHVlLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gbWVzc2FnZTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGluY2x1c2lvbjogZnVuY3Rpb24odmFsdWUsIG9wdGlvbnMpIHtcbiAgICAgIGlmICghdi5pc0RlZmluZWQodmFsdWUpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICh2LmlzQXJyYXkob3B0aW9ucykpIHtcbiAgICAgICAgb3B0aW9ucyA9IHt3aXRoaW46IG9wdGlvbnN9O1xuICAgICAgfVxuICAgICAgb3B0aW9ucyA9IHYuZXh0ZW5kKHt9LCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgaWYgKHYuY29udGFpbnMob3B0aW9ucy53aXRoaW4sIHZhbHVlKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB2YXIgbWVzc2FnZSA9IG9wdGlvbnMubWVzc2FnZSB8fFxuICAgICAgICB0aGlzLm1lc3NhZ2UgfHxcbiAgICAgICAgXCJeJXt2YWx1ZX0gaXMgbm90IGluY2x1ZGVkIGluIHRoZSBsaXN0XCI7XG4gICAgICByZXR1cm4gdi5mb3JtYXQobWVzc2FnZSwge3ZhbHVlOiB2YWx1ZX0pO1xuICAgIH0sXG4gICAgZXhjbHVzaW9uOiBmdW5jdGlvbih2YWx1ZSwgb3B0aW9ucykge1xuICAgICAgaWYgKCF2LmlzRGVmaW5lZCh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKHYuaXNBcnJheShvcHRpb25zKSkge1xuICAgICAgICBvcHRpb25zID0ge3dpdGhpbjogb3B0aW9uc307XG4gICAgICB9XG4gICAgICBvcHRpb25zID0gdi5leHRlbmQoe30sIHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICBpZiAoIXYuY29udGFpbnMob3B0aW9ucy53aXRoaW4sIHZhbHVlKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB2YXIgbWVzc2FnZSA9IG9wdGlvbnMubWVzc2FnZSB8fCB0aGlzLm1lc3NhZ2UgfHwgXCJeJXt2YWx1ZX0gaXMgcmVzdHJpY3RlZFwiO1xuICAgICAgcmV0dXJuIHYuZm9ybWF0KG1lc3NhZ2UsIHt2YWx1ZTogdmFsdWV9KTtcbiAgICB9LFxuICAgIGVtYWlsOiB2LmV4dGVuZChmdW5jdGlvbih2YWx1ZSwgb3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9IHYuZXh0ZW5kKHt9LCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgdmFyIG1lc3NhZ2UgPSBvcHRpb25zLm1lc3NhZ2UgfHwgdGhpcy5tZXNzYWdlIHx8IFwiaXMgbm90IGEgdmFsaWQgZW1haWxcIjtcbiAgICAgIGlmICghdi5pc0RlZmluZWQodmFsdWUpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICghdi5pc1N0cmluZyh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIG1lc3NhZ2U7XG4gICAgICB9XG4gICAgICBpZiAoKC9eXFxzKiQvKS50ZXN0KHZhbHVlKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoIXRoaXMuUEFUVEVSTi5leGVjKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gbWVzc2FnZTtcbiAgICAgIH1cbiAgICB9LCB7XG4gICAgICBQQVRURVJOOiAvXlthLXowLTlcXHUwMDdGLVxcdWZmZmYhIyQlJicqK1xcLz0/Xl9ge3x9fi1dKyg/OlxcLlthLXowLTlcXHUwMDdGLVxcdWZmZmYhIyQlJicqK1xcLz0/Xl9ge3x9fi1dKykqQCg/OlthLXowLTldKD86W2EtejAtOS1dKlthLXowLTldKT9cXC4pK1thLXpdezIsfSQvaVxuICAgIH0pXG4gIH07XG5cbiAgdmFsaWRhdGUuZXhwb3NlTW9kdWxlKHZhbGlkYXRlLCByb290LCBleHBvcnRzLCBtb2R1bGUsIGRlZmluZSk7XG59KS5jYWxsKHRoaXMsXG4gICAgICAgIHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJyA/IGV4cG9ydHMgOiBudWxsLFxuICAgICAgICB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyA/IG1vZHVsZSA6IG51bGwsXG4gICAgICAgIHR5cGVvZiBkZWZpbmUgIT09ICd1bmRlZmluZWQnID8gZGVmaW5lIDogbnVsbCxcbiAgICAgICAgdHlwZW9mIHJlcXVpcmUgIT09ICd1bmRlZmluZWQnID8gcmVxdWlyZSA6IG51bGwpO1xuIl19
