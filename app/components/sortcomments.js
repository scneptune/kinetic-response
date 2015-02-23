// @jsx React.DOM

React = require('react');
addons = require('classnames');

var SortIndicator = React.createClass({
	render: function () {
		var self = this,
			cx = addons,
			itemSort = this.props.sortItem,
			keyVal = this.props.keyId,
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
			{'active': false, 'label': 'Best', 'icon': 'fa-thumbs-up', 'value': 'best'},
			{'active' : false, 'label': 'Worst', 'icon': 'fa-thumbs-down', 'value': 'worst'}
		]};
	},
	handleSortChange: function (newvalue) {
		newSort = [];
		for (var i = 0, slen = this.state.sorts.length; i < slen; i++) {
			currentSort = this.state.sorts[i];
			if (newvalue == currentSort) {
				currentSort.active = true;
				this.props.onSendSort(currentSort.value, 'sortBy');
			} else {
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
