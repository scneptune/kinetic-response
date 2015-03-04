var App = require('./../app/main.js');
var React = require('react-addons');
var TestUtils = require('react-addons').TestUtils;


describe("Kinetic-application", function () {

	it("init test ", function(){
		var appRaw = TestUtils.renderIntoDocument(App());
		expect(app.state.data).toEqual([]);
	})


  // it("Should load comments on load", function () {
  // 	var component = TestUtils.renderIntoDocument(CommentComponent());
  // 	expect(component.state.data).toBe([]);
  // });

});