/** @jsx React.DOM */
var React = require('react');
var CommentComponent = require('./components/commentcomponent.js');
React.render(<CommentComponent url="http://localhost:8000/commentdata.json" pollInterval={10000000} />, document.getElementById('content'));