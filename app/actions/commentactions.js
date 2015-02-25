var flux = require('flux-react');

module.exports = flux.createActions([
  'addComment',
  'addReply',
  'setReplyId',
  'validateComment',
  'callCommentList',
  'populateConfig'
]);