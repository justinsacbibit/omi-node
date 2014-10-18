'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Ower = mongoose.model('Ower');

/**
 * Globals
 */
var user, ower;

/**
 * Unit tests
 */
describe('Ower Model Unit Tests:', function() {
	beforeEach(function(done) {
		user = new User({
			firstName: 'Full',
			lastName: 'Name',
			displayName: 'Full Name',
			email: 'test@test.com',
			username: 'username',
			password: 'password'
		});

		user.save(function() {
			ower = new Ower({
				firstName: 'Ower',
				tetheredTo: user.id
			});

			done();
		});
	});

	describe('Method Save', function() {
		it('should be able to save without problems', function(done) {
			return ower.save(function(err) {
				should.not.exist(err);
				done();
			});
		});

		it('should error without first name', function(done) {
			ower.firstName = undefined;
			return ower.save(function(err) {
				should.exist(err);
				done();
			});
		});

		it('should error without a tethered user', function(done) {
			ower.tetheredTo = undefined;
			return ower.save(function(err) {
				should.exist(err);
				done();
			});
		});
	});

	afterEach(function(done) {
		Ower.remove().exec();
		User.remove().exec();

		done();
	});
});