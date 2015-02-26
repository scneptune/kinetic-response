// @jsx React.DOM

React = require('react');
cx = require('classnames');
actions = require('../actions/commentactions.js');

var SortIndicator = React.createClass({
	render: function () {
		var self = this,
			itemSort = this.props.sortItem,
			iconName = itemSort.icon;
			iconSet = cx('fa', iconName);
			sortSelect = cx({'active': itemSort.active}, 'sortoption');		
		return (<div className={sortSelect} onClick={this.props.handleSortChange}>
					<div className="sorttext"> <i className={iconSet}></i></div>
					<div className="sorttext">{itemSort.label}</div>
				</div>);
	}
})

var SortComments = React.createClass({
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
				return (<SortIndicator key={sortItem.value} keyId={i} handleSortChange={self.handleSortChange.bind(self, sortItem)} sortItem={sortItem}  />);
			});
		return (
			<div className="comment-sort clearfix" data-toggle="sorttext">
				{sortIndics}
			</div>
		);
	}
});

module.exports = SortComments;
