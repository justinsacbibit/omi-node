'use strict';

// Omis controller
angular.module('omis').controller('OmisController', ['$scope', '$stateParams', '$location', 'Authentication', 'Omis',
	function($scope, $stateParams, $location, Authentication, Omis ) {
		$scope.authentication = Authentication;

		// Create new Omi
		$scope.create = function() {
			// Create new Omi object
			var from = this.direction === 'sending' ? Authentication.user._id : $location.search().friendId;
			var to = this.direction === 'sending' ? $location.search().friendId : Authentication.user._id;
			var omi = new Omis ({
				name: this.name,
				amount: this.amount,
				note: this.note,
				type: this.type,
				from: from,
				to: to
			});

			// Redirect after save
			omi.$save(function(response) {
				$location.path('omis/' + response._id);

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Omi
		$scope.remove = function( omi ) {
			if ( omi ) { omi.$remove();

				for (var i in $scope.omis ) {
					if ($scope.omis [i] === omi ) {
						$scope.omis.splice(i, 1);
					}
				}
			} else {
				$scope.omi.$remove(function() {
					$location.path('omis');
				});
			}
		};

		// Update existing Omi
		$scope.update = function() {
			var omi = $scope.omi ;

			omi.$update(function() {
				$location.path('omis/' + omi._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Omis
		$scope.find = function() {
			$scope.omis = Omis.query();
		};

		// Find existing Omi
		$scope.findOne = function() {
			$scope.omi = Omis.get({
				omiId: $stateParams.omiId
			});
		};
	}
]);