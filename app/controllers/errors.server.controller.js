'use strict';

/**
 * Get unique error field name
 */
var getUniqueErrorMessage = function getUniqueErrorMessage(err) {
	var output;

	try {
		var fieldName = err.err.substring(err.err.lastIndexOf('.$') + 2, err.err.lastIndexOf('_1'));
		output = fieldName.charAt(0).toUpperCase() + fieldName.slice(1) + ' already exists';

	} catch(ex) {
		output = 'Unique field already exists';
	}

	return output;
};

/**
 * Get the error message from error object
 */
var getErrorMessage = exports.getErrorMessage = function getErrorMessage(err) {
	var message = '';

	if (err.code) {
		switch (err.code) {
			case 11000:
			case 11001:
				message = getUniqueErrorMessage(err);
				break;
			default:
				message = 'Something went wrong';
		}
	} else {
		for (var errName in err.errors) {
			if (err.errors[errName].message) message = err.errors[errName].message;
		}
	}

	return message;
};

/**
 * Generic response creator
 */
var respond = function respond(res, code, err) {
	var msg;
	if (typeof err === Error) {
		msg = getErrorMessage(err);
	} else {
		msg = err;
	}
	res.status(code).send({
		message: msg
	});
};

/**
 * 400 Bad Request
 */
var badRequest = exports.badRequest = function badRequest(res, err) {
	respond(res, 400, err);
};

/**
 * 403 Forbidden
 */
var forbidden = exports.forbidden = function forbidden(res, msg) {
	respond(res, 403, msg);
};

/**
 * 404 Not Found
 */
var notFound = exports.notFound = function notFound(res, msg) {
	respond(res, 404, msg);
};

/**
 * 500 Server Error
 */
var server = exports.server = function server(res, err) {
	respond(res, 500, err);
};
