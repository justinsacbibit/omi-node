var mongoose = require('mongoose')
  , Schema   = mongoose.Schema
  , extend   = require('mongoose-schema-extend')
  , Ower     = require('./ower.js').Ower
  , FBToken  = require('../auth/fbToken.js').FBToken;

var User = Ower.extend({
  facebookId: {
    type:     Number,
    required: true,
    unique:   true
  },
  email: {
    type: String
  },
  fbToken: {
    type: [FBToken]
  }
});

var UserModel = mongoose.model('User', User);

exports.UserModel = UserModel;
