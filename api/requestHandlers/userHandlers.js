var UserModel         = require('../model/people/user.js').UserModel
  , OwerModel         = require('../model/people/ower.js').OwerModel
  , TetheredOwerModel = require('../model/people/tetheredOwer.js').TetheredOwerModel
  , FBTokenModel      = require('../model/auth/fbToken.js').FBTokenModel
  , error             = require('./error.js')
  , fb                = require('../fb.js')
  , paginate          = require('../paginate.js')
  , debug             = require('../debug.js')
  , _                 = require('underscore');

var ascending = function(key) {
  return function(a, b) {
    if (a[key] < b[key]) {
      return -1;
    } else if (a[key] > b[key]) {
      return 1;
    }
    return 0;
  };
};

var logError = function(functionName, failure, err, description) {
  error.log('user', functionName, failure, err, description);
};

var userInfo = function(req, res) {
  return res.json({
    facebook_id: req.user.facebookId,
    name:        req.user.name
  });
};

var getUser = function(req, res) {
  var facebookId = req.param('facebook_id');

  if (isNaN(facebookId)) {
    return error.badRequest(res, 'Invalid parameter: facebook_id must be a number');
  }

  UserModel.findOne({
    facebookId: facebookId
  }, function(err, user) {
    if (err) {
      logError('getUser', 'UserModel.findOne', err);
      return error.server(res);
    }

    if (!user) {
      return error.notFound(res, 'User');
    }

    return res.json(user);
  });
};

var checkToken = function(res, fbToken) {
  if (fb.expired(fbToken)) {
    error.unauthorized(res, 'Access token has expired, please log in again', 2);
    return false;
  }

  if (fb.needPermissions(fbToken, 'user_friends')) {
    error.unauthorized(res, 'Permission required to access user friends', 1);
    return false;
  }

  return true;
};

var getFriends = function(req, res) {
  var fbToken    = req.user.fbToken[0]
    , facebookId = req.param('facebook_id')
    , name       = req.query.name
    , offset     = req.query.skip
    , limit      = req.query.limit;

  if (!checkToken(res, fbToken)) {
    return;
  }

  var conditions = {
    facebookId: facebookId
  };

  if (!paginate(req, res, conditions)) {
    return;
  }

  fb.friends(fbToken, function(err, friends, totalCount, errMessageObj) {
    if (err) {
      logError('getFriends', 'fb.friends', err);
      return error.server(res);
    }

    if (!friends) {
      return error.server(res);
    }

    if (name) {
      friends = friends.filter(function(element) {
        var fullFriendName = element['name'];
        return fullFriendName.indexOf(name) > -1;
      });
    }

    friends = friends.sort(ascending('name'));

    if (offset && limit) {
      friends = friends.slice(offset, offset + limit);;
    }

    var JSON = {
      friends: friends
    };

    if (totalCount) {
      JSON['total_count'] = totalCount;
    }

    return res.json(JSON);
  });
};

var getOwers = function(req, res) {
  var user       = req.user
    , fbToken    = user.fbToken[0]
    , owerIds    = user.owers
    , facebookId = req.param('facebook_id')
    , offset     = req.query.skip
    , limit      = req.query.limit
    , name       = req.query.name
    , fbFilterId = req.query.facebook_id
    , type       = req.query.type;

  if (!checkToken(res, fbToken)) {
    return;
  }

  var conditions = {
    _id: {
      $in: owerIds
    }
  };

  if (!paginate(req, res, conditions)) {
    return;
  }

  if (name && fbFilterId) {
    return error.badRequest(res, 'Invalid parameters: Cannot filter by name and facebook_id simultaneously');
  }

  if (fbFilterId && type) {
    return error.badRequest(res, 'Invalid parameters: Cannot filter by facebook_id and type simultaneously');
  }

  if (name) {
    conditions['name'] = new RegExp(name, 'i');
  } else if (fbFilterId) {
    conditions['facebookId'] = fbFilterId;
  }

  if (type) {
    if (type !== 'User' && type !== 'TetheredOwer') {
      return error.badRequest(res, 'Invalid parameter: Type is invalid');
    }
    conditions['_type'] = type;
  }

  debug.log(conditions);

  OwerModel.find(conditions, function(err, owers) {
    if (err) {
      logError('getOwers', 'OwerModel.find', err);
      return error.server(res);
    }

    return res.json(owers);
  });
};

var newOwer = function(req, res) {
  var fbToken    = req.user.fbToken[0]
    , facebookId = req.param('facebook_id')
    , name       = req.body.name
    , owerFbId   = req.body.facebook_id;

  if (!checkToken(res, fbToken)) {
    return;
  }

  if (name && owerFbId) {
    return error.badRequest(res, 'Invalid parameters: must not send name and facebook_id simultaneously in request');
  }

  if (facebookId == owerFbId) {
    return error.badRequest(res, 'Invalid parameter: facebook_id cannot be own Facebook ID');
  }

  var conditions = {
    tetheredTo:  facebookId,
    _type: 'TetheredOwer'
  };

  if (!name) {
    if (!owerFbId) {
      return error.missingParam(res, 'Name');
    }

    conditions['facebookId'] = owerFbId;
  } else {
    conditions['name'] = name;
  }

  // first check if the same tethered ower exists
  return TetheredOwerModel.findOne(conditions, function(err, tetheredOwer) {
    if (err) {
      logError('newOwer', 'TetheredOwerModel.findOne', err);
      return error.server(res);
    }

    if (tetheredOwer) {
      return error.exists(res, 'Ower');
    }

    var sendOwer = function(owerName, existingOwer) {
      var properties = {
        name: owerName,
        tetheredTo: facebookId
      };

      if (owerFbId) {
        properties['facebookId'] = owerFbId;
      }

      if (existingOwer) {
        properties['counterpart'] = existingOwer._id;
      }

      tetheredOwer = new TetheredOwerModel(properties);

      return tetheredOwer.save(function(err) {
        if (err) {
          logError('newOwer', 'tetheredOwer.save', err);
          return error.server(res);
        }

        if (existingOwer) {
          existingOwer.counterpart = tetheredOwer._id;
          return existingOwer.save(function(err) {
            if (err) {
              logError('newOwer', 'existingOwer.save', err);
              debug.log('Unable to update existing ower counterpart');
            }

            return res.status(201).json(tetheredOwer);
          });
        }

        return res.status(201).json(tetheredOwer);
      });
    };

    if (owerFbId) {
      // using a facebook friend to create a tethered ower
      return UserModel.findOne({
        facebookId: owerFbId
      }, function(err, user) {
        if (err) {
          logError('newOwer', 'UserModel.findOne', err);
          return error.server(res);
        }

        if (!user) {
          return error.notFound(res, 'Facebook user');
        }

        /**
         * If the user has the requester as an ower
         *     Create new tetheredOwer obj
         *     Set counterpart ID on both tetheredOwer objs to point to each other
         * Else
         *     Create new tetheredOwer obj
         */

        // check if the user has added the requester as an ower
        return TetheredOwerModel.findOne({
          tetheredTo: user.facebookId,
          facebookId: facebookId,
          _type: 'TetheredOwer'
        }, function(err, ower) {
          if (err) {
            logError('newOwer', 'OwerModel.findOne', err);
            return error.server(res);
          }

          // if the user has, then confirm the tethered owers and send
          if (ower) {
            return sendOwer(user.name, ower);

            // remove this code
            return ower.save(function(err) {
              if (err) {
                logError('newOwer', 'ower.save', err);
                return error.server(res);
              }

              return sendOwer(user.name, ower);
            });
          }

          // TODO: send a request to this user

          // if the user hasn't, create a tethered ower and send it
          return sendOwer(user.name);
        });
      });
    }

    // only using a name, create a tethered ower and send it
    return sendOwer(name);
  });
};

var getOwer = function(req, res) {
  var fbToken    = req.user.fbToken[0]
    , facebookId = req.param('facebook_id')
    , owerId     = req.param('ower_id');

  if (!checkToken(res, fbToken)) {
    return;
  }

  OwerModel.findById(owerId, function(err, ower) {
    if (err) {
      logError('getOwer', 'OwerModel.findById', err);
      return error.server(res);
    }

    if (!ower) {
      return error.notFound(res, 'Ower');
    }

    res.json(ower);
  });
};

var putOwer = function(req, res) {
  var fbToken = req.user.fbToken[0]
    , owerId  = req.param('ower_id')
    , newName = req.body.name
    , newFbId = req.body.facebook_id;

  if (!checkToken(res, fbToken)) {
    return;
  }

  if (newName && newFbId) {
    return error.badRequest(res, 'Invalid parameters: Must only send name or facebook_id');
  } else if (!newName && !newFbId) {
    return error.missingParam(res, 'name or facebook_id');
  }

  TetheredOwerModel.findOne({
    _id: owerId,
    _type: 'TetheredOwer'
  }, function(err, tetheredOwer) {
    if (err) {
      logError('putOwer', 'TetheredOwerModel.findOne', err);
      return error.server(res);
    }

    if (!tetheredOwer) {
      return error.notFound(res, 'Tethered ower');
    }

    if (tetheredOwer.facebookId) {
      if (newName) {
        return error.conflict(res, 'Cannot update name for a tethered ower linked to a Facebook account');
      }

      return error.conflict(res, 'Cannot update Facebook ID for a tethered ower already linked to a Facebook account');
    }

    if (newName) {
      tetheredOwer.name = newName;
    } else {
      tetheredOwer.facebookId = facebookId;

      // TODO: Make a request or add counterpart
    }

    tetheredOwer.save(function(err) {
      if (err) {
        logError('putOwer', 'tetheredOwer.save', err);
        return error.server(res);
      }

      return res.json(tetheredOwer);
    });
  });
};

var removeOwer = function(req, res) {
  var fbToken    = req.user.fbToken[0]
    , owerId     = req.param('ower_id');

  if (!checkToken(res, fbToken)) {
    return;
  }

  TetheredOwerModel.findOne({
    _id: owerId,
    _type: 'TetheredOwer'
  }, function(err, tetheredOwer) {
    if (err) {
      logError('removeOwer', 'TetheredOwerModel.findById', err);
      return error.server(res);
    }

    if (!tetheredOwer) {
      return error.notFound(res, 'Tethered ower');
    }

    tetheredOwer.remove(function(err) {
      if (err) {
        logError('removeOwer', 'tetheredOwer.remove', err);
        return error.server(res);
      }

      // TODO: Remove omis

      var counterpartId = tetheredOwer.counterpart;
      if (counterpartId) {
        TetheredOwerModel.findById(counterpartId, function(err, counterpartOwer) {
          if (err) {
            logError('removeOwer', 'TetheredOwerModel.findById', err);
          }

          counterpartOwer.counterpart = undefined;
          counterpartOwer.save(function(err) {
            if (err) {
              logError('removeOwer', 'counterpartOwer.save', err);
              debug.log('Error removing counterpart ID');
            }
          });
        });
      }

      return res.json({
        success: true
      });
    });
  });
};

exports.userInfo = userInfo;
exports.user = getUser;
exports.friends = getFriends;
exports.owers = getOwers;
exports.newOwer = newOwer;
exports.ower = getOwer;
exports.putOwer = putOwer;
exports.removeOwer = removeOwer;