// @jsx React.DOM

React = require('react');
addons = require('classnames');
commentStore = require('../stores/commentstore.js');

var RateIcon = React.createClass({
	render: function () {
	var cx = addons;
	var classInsert = cx({
		'star': true,
		'filled': this.props.toggled 
	});
	return (<li className={classInsert} onMouseMove={this.props.onMouseEnter} onClick={this.props.onClickRating}><span>X</span></li>); 
	}
});

var RateBox = React.createClass({
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
				<RateIcon key={i} toggledClassName={halfClassName || this.props.toggledClassName} onMouseEnter={onMouseEnter.bind(this, i)} onClickRating={onClickRating.bind(this, i)} toggled={toggled} />
			);
		}
		return (
			<div className="ratebox">
                <div className="rateitem">
                    <p>Rate this Album</p>
                    <ul className="rating" onMouserLeave={this.onMouserLeave}>
                    {ratings}
                    </ul>
                </div>
                <figure className="album-art">
                    <img src={config.albumArt} width="100" height="100" />
                    <figcaption className="vote-info">
                        <p> <span className="count">{config.fiveRateNumber}</span> have voted</p>
                        <p> <span className="count">{config.voteRateTotal}</span> people gave it 5/5 </p>
                    </figcaption>
                </figure>
            </div>
		);
	}
});

module.exports = RateBox;