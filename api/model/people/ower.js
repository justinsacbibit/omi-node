var mongoose = require('mongoose')
  , Schema   = mongoose.Schema;

var Ower = new Schema({
  created: {
    type:    Date,
    default: Date.now
  },
  name: {
    type:     String,
    required: true
  },
  facebookId: {
    type:   Number,
    unique: true
  },
  owers: {
    type: [Schema.Types.ObjectId],
    ref:  'Ower'
  },
  omis: {
    type: [Schema.Types.ObjectId],
    ref:  'Omi'
  }
}, {
  discriminatorKey: '_type'
});

Ower.methods.toJSON = function() {
  var obj = this.toObject();
  delete obj.__v;
  return obj;
}

var OwerModel = mongoose.model('Ower', Ower, 'owers');

exports.Ower = Ower;
exports.OwerModel = OwerModel;
