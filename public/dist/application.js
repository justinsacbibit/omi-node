'use strict';

// Init the application configuration module for AngularJS application
var ApplicationConfiguration = (function() {
	// Init module configuration options
	var applicationModuleName = 'mean';
	var applicationModuleVendorDependencies = ['ngResource', 'ngAnimate', 'ui.router', 'ui.bootstrap', 'ui.utils'];

	// Add a new vertical module
	var registerModule = function(moduleName, dependencies) {
		// Create angular module
		angular.module(moduleName, dependencies || []);

		// Add the module to the AngularJS configuration file
		angular.module(applicationModuleName).requires.push(moduleName);
	};

	return {
		applicationModuleName: applicationModuleName,
		applicationModuleVendorDependencies: applicationModuleVendorDependencies,
		registerModule: registerModule
	};
})();
'use strict';

//Start by defining the main module and adding the module dependencies
angular.module(ApplicationConfiguration.applicationModuleName, ApplicationConfiguration.applicationModuleVendorDependencies);

// Setting HTML5 Location Mode
angular.module(ApplicationConfiguration.applicationModuleName).config(['$locationProvider',
	function($locationProvider) {
		$locationProvider.hashPrefix('!');
	}
]);

//Then define the init function for starting up the application
angular.element(document).ready(function() {
	//Fixing facebook bug with redirect
	if (window.location.hash === '#_=_') window.location.hash = '#!';

	//Then init the app
	angular.bootstrap(document, [ApplicationConfiguration.applicationModuleName]);
});
'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('core');
'use strict';

// Use applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('friends');
'use strict';

// Use applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('localomis');
'use strict';

// Use applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('omis');
'use strict';

// Use applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('owers');
'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('users');

'use strict';

// Setting up route
angular.module('core').config(['$stateProvider', '$urlRouterProvider',
	function($stateProvider, $urlRouterProvider) {
		// Redirect to home view when route not found
		$urlRouterProvider.otherwise('/');

		// Home state routing
		$stateProvider.
		state('home', {
			url: '/',
			templateUrl: 'modules/core/views/home.client.view.html'
		});
	}
])

.run(["$rootScope", "$location", "Authentication", function($rootScope, $location, Authentication) {
	$rootScope.$watch(function() {
		return $location.path();
	}, function(newValue, oldValue) {
		if (Authentication.user && newValue === '/') {
			$location.path('/owers');
		}
	});
}]);
'use strict';

angular.module('core').controller('HeaderController', ['$scope', 'Authentication', 'Menus',
	function($scope, Authentication, Menus) {
		$scope.authentication = Authentication;
		$scope.isCollapsed = false;
		$scope.menu = Menus.getMenu('topbar');

		$scope.toggleCollapsibleMenu = function() {
			$scope.isCollapsed = !$scope.isCollapsed;
		};

		// Collapsing the menu after navigation
		$scope.$on('$stateChangeSuccess', function() {
			$scope.isCollapsed = false;
		});
	}
]);
'use strict';


angular.module('core').controller('HomeController', ['$scope', 'Authentication',
	function($scope, Authentication) {
		// This provides Authentication context.
		$scope.authentication = Authentication;
	}
]);
'use strict';

//Menu service used for managing  menus
angular.module('core').service('Menus', [

	function() {
		// Define a set of default roles
		this.defaultRoles = ['*'];

		// Define the menus object
		this.menus = {};

		// A private function for rendering decision 
		var shouldRender = function(user) {
			if (user) {
				if (!!~this.roles.indexOf('*')) {
					return true;
				} else {
					for (var userRoleIndex in user.roles) {
						for (var roleIndex in this.roles) {
							if (this.roles[roleIndex] === user.roles[userRoleIndex]) {
								return true;
							}
						}
					}
				}
			} else {
				return this.isPublic;
			}

			return false;
		};

		// Validate menu existance
		this.validateMenuExistance = function(menuId) {
			if (menuId && menuId.length) {
				if (this.menus[menuId]) {
					return true;
				} else {
					throw new Error('Menu does not exists');
				}
			} else {
				throw new Error('MenuId was not provided');
			}

			return false;
		};

		// Get the menu object by menu id
		this.getMenu = function(menuId) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Return the menu object
			return this.menus[menuId];
		};

		// Add new menu object by menu id
		this.addMenu = function(menuId, isPublic, roles) {
			// Create the new menu
			this.menus[menuId] = {
				isPublic: isPublic || false,
				roles: roles || this.defaultRoles,
				items: [],
				shouldRender: shouldRender
			};

			// Return the menu object
			return this.menus[menuId];
		};

		// Remove existing menu object by menu id
		this.removeMenu = function(menuId) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Return the menu object
			delete this.menus[menuId];
		};

		// Add menu item object
		this.addMenuItem = function(menuId, menuItemTitle, menuItemURL, menuItemType, menuItemUIRoute, isPublic, roles, position) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Push new menu item
			this.menus[menuId].items.push({
				title: menuItemTitle,
				link: menuItemURL,
				menuItemType: menuItemType || 'item',
				menuItemClass: menuItemType,
				uiRoute: menuItemUIRoute || ('/' + menuItemURL),
				isPublic: ((isPublic === null || typeof isPublic === 'undefined') ? this.menus[menuId].isPublic : isPublic),
				roles: ((roles === null || typeof roles === 'undefined') ? this.menus[menuId].roles : roles),
				position: position || 0,
				items: [],
				shouldRender: shouldRender
			});

			// Return the menu object
			return this.menus[menuId];
		};

		// Add submenu item object
		this.addSubMenuItem = function(menuId, rootMenuItemURL, menuItemTitle, menuItemURL, menuItemUIRoute, isPublic, roles, position) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Search for menu item
			for (var itemIndex in this.menus[menuId].items) {
				if (this.menus[menuId].items[itemIndex].link === rootMenuItemURL) {
					// Push new submenu item
					this.menus[menuId].items[itemIndex].items.push({
						title: menuItemTitle,
						link: menuItemURL,
						uiRoute: menuItemUIRoute || ('/' + menuItemURL),
						isPublic: ((isPublic === null || typeof isPublic === 'undefined') ? this.menus[menuId].items[itemIndex].isPublic : isPublic),
						roles: ((roles === null || typeof roles === 'undefined') ? this.menus[menuId].items[itemIndex].roles : roles),
						position: position || 0,
						shouldRender: shouldRender
					});
				}
			}

			// Return the menu object
			return this.menus[menuId];
		};

		// Remove existing menu object by menu id
		this.removeMenuItem = function(menuId, menuItemURL) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Search for menu item to remove
			for (var itemIndex in this.menus[menuId].items) {
				if (this.menus[menuId].items[itemIndex].link === menuItemURL) {
					this.menus[menuId].items.splice(itemIndex, 1);
				}
			}

			// Return the menu object
			return this.menus[menuId];
		};

		// Remove existing menu object by menu id
		this.removeSubMenuItem = function(menuId, submenuItemURL) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Search for menu item to remove
			for (var itemIndex in this.menus[menuId].items) {
				for (var subitemIndex in this.menus[menuId].items[itemIndex].items) {
					if (this.menus[menuId].items[itemIndex].items[subitemIndex].link === submenuItemURL) {
						this.menus[menuId].items[itemIndex].items.splice(subitemIndex, 1);
					}
				}
			}

			// Return the menu object
			return this.menus[menuId];
		};

		//Adding the topbar menu
		this.addMenu('topbar');
	}
]);
'use strict';

//Setting up route
angular.module('friends').config(['$stateProvider',
	function($stateProvider) {
		// Friends state routing
		$stateProvider.
		state('listFriends', {
			url: '/friends',
			templateUrl: 'modules/friends/views/list-friends.client.view.html'
		}).
		state('createFriend', {
			url: '/friends/create',
			templateUrl: 'modules/friends/views/create-friend.client.view.html'
		}).
		state('viewFriend', {
			url: '/friends/:friendId',
			templateUrl: 'modules/friends/views/view-friend.client.view.html'
		}).
		state('editFriend', {
			url: '/friends/:friendId/edit',
			templateUrl: 'modules/friends/views/edit-friend.client.view.html'
		});
	}
])

.run(['Menus',
  function(Menus) {
    // Set top bar menu items
    Menus.addMenuItem('topbar', 'Friends', 'friends', 'dropdown', '/friends(/create)?');
    Menus.addSubMenuItem('topbar', 'friends', 'New Friend', 'friends/create');
  }
]);
'use strict';

// Friends controller
angular.module('friends').controller('FriendsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Friends',
	function($scope, $stateParams, $location, Authentication, Friends ) {
		$scope.authentication = Authentication;

		$scope.heading = function(ower) {
			var name = ower.firstName ? ower.firstName + ' ' + (ower.lastName ? ower.lastName + ' ' : '') : ower.displayName + ' ';
			var heading = name;
			if (ower.balance === 0) {
				heading += 'does not owe you anything';
			} else {
				if (ower.balance < 0) {
					heading += 'is owed';
				} else {
					heading += 'owes you';
				}
				heading += ' $' + Math.abs(ower.balance);
			}
			return heading;
		};

		// Create new Friend
		$scope.create = function() {
			// Create new Friend object
			var friend = new Friends ({
				username: this.username
			});

			// Redirect after save
			friend.$save(function(response) {
				$location.path('friends/' + response._id);

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Friend
		$scope.remove = function( friend ) {
			if ( friend ) { friend.$remove();

				for (var i in $scope.friends ) {
					if ($scope.friends [i] === friend ) {
						$scope.friends.splice(i, 1);
					}
				}
			} else {
				$scope.friend.$remove(function() {
					$location.path('owers');
				});
			}
		};

		// Update existing Friend
		$scope.update = function() {
			var friend = $scope.friend ;

			friend.$update(function() {
				$location.path('friends/' + friend._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Friends
		$scope.find = function() {
			$scope.friends = Friends.query();
		};

		// Find existing Friend
		$scope.findOne = function() {
			$scope.friend = Friends.get({
				friendId: $stateParams.friendId
			});
		};
	}
]);
'use strict';

//Friends service used to communicate Friends REST endpoints
angular.module('friends').factory('Friends', ['$resource',
	function($resource) {
		return $resource('friends/:friendId', { friendId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);
'use strict';

//Setting up route
angular.module('localomis').config(['$stateProvider',
	function($stateProvider) {
		// Localomis state routing
		$stateProvider.
		state('listLocalomis', {
			url: '/localomis',
			templateUrl: 'modules/localomis/views/list-localomis.client.view.html'
		}).
		state('createLocalomi', {
			url: '/owers/:owerId/localomis/create',
			templateUrl: 'modules/localomis/views/create-localomi.client.view.html'
		}).
		state('viewLocalomi', {
			url: '/localomis/:localomiId',
			templateUrl: 'modules/localomis/views/view-localomi.client.view.html'
		}).
		state('editLocalomi', {
			url: '/localomis/:localomiId/edit',
			templateUrl: 'modules/localomis/views/edit-localomi.client.view.html'
		});
	}
]);
'use strict';

// Localomis controller
angular.module('localomis').controller('LocalomisController', ['$scope', '$stateParams', '$location', 'Authentication', 'Localomis',
	function($scope, $stateParams, $location, Authentication, Localomis ) {
		$scope.authentication = Authentication;

		// Create new Localomi
		$scope.create = function() {
			// Create new Localomi object
			var localomi = new Localomis ({
				name: this.name,
				amount: this.amount,
				note: this.note,
				owerId: $stateParams.owerId,
				direction: this.direction,
				type: this.type
			});

			// Redirect after save
			localomi.$save(function(response) {
				$location.path('localomis/' + response._id);

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Localomi
		$scope.remove = function( localomi ) {
			if ( localomi ) { localomi.$remove();

				for (var i in $scope.localomis ) {
					if ($scope.localomis [i] === localomi ) {
						$scope.localomis.splice(i, 1);
					}
				}
			} else {
				$scope.localomi.$remove(function() {
					$location.path('localomis');
				});
			}
		};

		// Update existing Localomi
		$scope.update = function() {
			var localomi = $scope.localomi ;

			localomi.$update(function() {
				$location.path('localomis/' + localomi._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Localomis
		$scope.find = function() {
			$scope.localomis = Localomis.query({
				owerId: $stateParams.owerId
			});
		};

		// Find existing Localomi
		$scope.findOne = function() {
			$scope.localomi = Localomis.get({
				localomiId: $stateParams.localomiId
			});
		};

		$scope.direction = function direction(localomi) {
			if (localomi.type === 'omi') {
				if (localomi.direction === 'toOwer') {
					return 'lent';
				} else {
					return 'borrowed';
				}
			} else {
				if (localomi.direction === 'toOwer') {
					return 'paid';
				} else {
					return 'received';
				}
			}
		};
	}
]);
'use strict';

//Localomis service used to communicate Localomis REST endpoints
angular.module('localomis').factory('Localomis', ['$resource',
	function($resource) {
		return $resource('localomis/:localomiId', { localomiId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);
'use strict';

// Configuring the Articles module
angular.module('omis').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		// Menus.addMenuItem('topbar', 'Omis', 'omis', 'dropdown', '/omis(/create)?');
		// Menus.addSubMenuItem('topbar', 'omis', 'List Omis', 'omis');
		// Menus.addSubMenuItem('topbar', 'omis', 'New Omi', 'omis/create');
	}
]);
'use strict';

//Setting up route
angular.module('omis').config(['$stateProvider',
	function($stateProvider) {
		// Omis state routing
		$stateProvider.
		state('listOmis', {
			url: '/omis',
			templateUrl: 'modules/omis/views/list-omis.client.view.html'
		}).
		state('createOmi', {
			url: '/omis/create',
			templateUrl: 'modules/omis/views/create-omi.client.view.html'
		}).
		state('viewOmi', {
			url: '/omis/:omiId',
			templateUrl: 'modules/omis/views/view-omi.client.view.html'
		}).
		state('editOmi', {
			url: '/omis/:omiId/edit',
			templateUrl: 'modules/omis/views/edit-omi.client.view.html'
		});
	}
]);
'use strict';

// Omis controller
angular.module('omis').controller('OmisController', ['$scope', '$stateParams', '$location', 'Authentication', 'Omis',
	function($scope, $stateParams, $location, Authentication, Omis ) {
		$scope.authentication = Authentication;

		$scope.description = function(omi) {
			var description = 'You ';
			var direction, name;
			if (!omi.from || !omi.to) {
				return;
			}
			if (omi.type === 'omi') {
				if (String(omi.from._id) === String(Authentication.user._id)) {
					description += 'lent';
					direction = 'to';
				} else {
					description += 'borrowed';
					direction = 'from';
				}
			} else {
				if (String(omi.from._id) === String(Authentication.user._id)) {
					description += 'paid';
					direction = 'to';
				} else {
					description += 'received';
					direction = 'from';
				}
			}
			description += ' $';
			description += Math.abs(omi.amount);
			description += ' ' + direction + ' ';
			if (String(omi.from._id) === String(Authentication.user._id)) {
				name = omi.to.firstName ? omi.to.firstName + ' ' + omi.to.lastName : omi.to.displayName;
			} else {
				name = omi.from.firstName ? omi.from.firstName + ' ' + omi.from.lastName : omi.from.displayName;
			}
			description += name;
			return description;
		};

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
			$scope.omis = Omis.query({
				friendId: $stateParams.friendId
			});
		};

		// Find existing Omi
		$scope.findOne = function() {
			$scope.omi = Omis.get({
				omiId: $stateParams.omiId
			});
		};
	}
]);
'use strict';

//Omis service used to communicate Omis REST endpoints
angular.module('omis').factory('Omis', ['$resource',
	function($resource) {
		return $resource('omis/:omiId', { omiId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);
'use strict';

// Configuring the Articles module
angular.module('owers').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'Owers', 'owers', 'dropdown', '/owers(/create)?');
		Menus.addSubMenuItem('topbar', 'owers', 'List Owers', 'owers');
		Menus.addSubMenuItem('topbar', 'owers', 'New Ower', 'owers/create');
	}
]);
'use strict';

//Setting up route
angular.module('owers').config(['$stateProvider',
	function($stateProvider) {
		// Owers state routing
		$stateProvider.
		state('listOwers', {
			url: '/owers',
			templateUrl: 'modules/owers/views/list-owers.client.view.html'
		}).
		state('createOwer', {
			url: '/owers/create',
			templateUrl: 'modules/owers/views/create-ower.client.view.html'
		}).
		state('viewOwer', {
			url: '/owers/:owerId',
			templateUrl: 'modules/owers/views/view-ower.client.view.html'
		}).
		state('editOwer', {
			url: '/owers/:owerId/edit',
			templateUrl: 'modules/owers/views/edit-ower.client.view.html'
		});
	}
]);
'use strict';

// Owers controller
angular.module('owers').controller('OwersController', ['$scope', '$stateParams', '$location', 'Authentication', 'Owers',
	function($scope, $stateParams, $location, Authentication, Owers ) {
		$scope.authentication = Authentication;

		$scope.heading = function(ower) {
			var heading = ower.firstName + ' ' + (ower.lastName ? ower.lastName + ' ' : '');
			if (ower.balance === 0) {
				heading += 'does not owe you anything';
			} else {
				if (ower.balance < 0) {
					heading += 'is owed';
				} else {
					heading += 'owes you';
				}
				heading += ' $' + Math.abs(ower.balance);
			}
			return heading;
		};

		// Create new Ower
		$scope.create = function() {
			// Create new Ower object
			var ower = new Owers ({
				firstName: this.firstName,
				lastName: this.lastName
			});

			// Redirect after save
			ower.$save(function(response) {
				$location.path('owers/' + response._id);

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message.message;
			});
		};

		// Remove existing Ower
		$scope.remove = function( ower ) {
			if ( ower ) { ower.$remove();

				for (var i in $scope.owers ) {
					if ($scope.owers [i] === ower ) {
						$scope.owers.splice(i, 1);
					}
				}
			} else {
				$scope.ower.$remove(function() {
					$location.path('owers');
				});
			}
		};

		// Update existing Ower
		$scope.update = function() {
			var ower = $scope.ower ;

			ower.$update(function() {
				$location.path('owers/' + ower._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message.message;
			});
		};

		// Find a list of Owers
		$scope.find = function() {
			$scope.owers = Owers.query();
		};

		// Find existing Ower
		$scope.findOne = function() {
			$scope.ower = Owers.get({
				owerId: $stateParams.owerId
			});
		};
	}
]);
'use strict';

//Owers service used to communicate Owers REST endpoints
angular.module('owers').factory('Owers', ['$resource',
	function($resource) {
		return $resource('owers/:owerId', { owerId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);
'use strict';

// Config HTTP Error Handling
angular.module('users').config(['$httpProvider',
	function($httpProvider) {
		// Set the httpProvider "not authorized" interceptor
		$httpProvider.interceptors.push(['$q', '$location', 'Authentication',
			function($q, $location, Authentication) {
				return {
					responseError: function(rejection) {
						switch (rejection.status) {
							case 401:
								// Deauthenticate the global user
								Authentication.user = null;

								// Redirect to signin page
								$location.path('signin');
								break;
							case 403:
								// Add unauthorized behaviour 
								break;
						}

						return $q.reject(rejection);
					}
				};
			}
		]);
	}
]);
'use strict';

// Setting up route
angular.module('users').config(['$stateProvider',
	function($stateProvider) {
		// Users state routing
		$stateProvider.
		state('profile', {
			url: '/settings/profile',
			templateUrl: 'modules/users/views/settings/edit-profile.client.view.html'
		}).
		state('password', {
			url: '/settings/password',
			templateUrl: 'modules/users/views/settings/change-password.client.view.html'
		}).
		state('accounts', {
			url: '/settings/accounts',
			templateUrl: 'modules/users/views/settings/social-accounts.client.view.html'
		}).
		state('signup', {
			url: '/signup',
			templateUrl: 'modules/users/views/authentication/signup.client.view.html'
		}).
		state('signin', {
			url: '/signin',
			templateUrl: 'modules/users/views/authentication/signin.client.view.html'
		}).
		state('forgot', {
			url: '/password/forgot',
			templateUrl: 'modules/users/views/password/forgot-password.client.view.html'
		}).
		state('reset-invlaid', {
			url: '/password/reset/invalid',
			templateUrl: 'modules/users/views/password/reset-password-invalid.client.view.html'
		}).
		state('reset-success', {
			url: '/password/reset/success',
			templateUrl: 'modules/users/views/password/reset-password-success.client.view.html'
		}).
		state('reset', {
			url: '/password/reset/:token',
			templateUrl: 'modules/users/views/password/reset-password.client.view.html'
		});
	}
]);
'use strict';

angular.module('users').controller('AuthenticationController', ['$scope', '$http', '$location', 'Authentication',
	function($scope, $http, $location, Authentication) {
		$scope.authentication = Authentication;

		// If user is signed in then redirect back home
		if ($scope.authentication.user) $location.path('/');

		$scope.signup = function() {
			$http.post('/auth/signup', $scope.credentials).success(function(response) {
				// If successful we assign the response to the global user model
				$scope.authentication.user = response;

				// And redirect to the index page
				$location.path('/');
			}).error(function(response) {
				$scope.error = response.message;
			});
		};

		$scope.signin = function() {
			$http.post('/auth/signin', $scope.credentials).success(function(response) {
				// If successful we assign the response to the global user model
				$scope.authentication.user = response;

				// And redirect to the index page
				$location.path('/');
			}).error(function(response) {
				$scope.error = response.message;
			});
		};
	}
]);
'use strict';

angular.module('users').controller('PasswordController', ['$scope', '$stateParams', '$http', '$location', 'Authentication',
	function($scope, $stateParams, $http, $location, Authentication) {
		$scope.authentication = Authentication;

		//If user is signed in then redirect back home
		if ($scope.authentication.user) $location.path('/');

		// Submit forgotten password account id
		$scope.askForPasswordReset = function() {
			$scope.success = $scope.error = null;

			$http.post('/auth/forgot', $scope.credentials).success(function(response) {
				// Show user success message and clear form
				$scope.credentials = null;
				$scope.success = response.message;

			}).error(function(response) {
				// Show user error message and clear form
				$scope.credentials = null;
				$scope.error = response.message;
			});
		};

		// Change user password
		$scope.resetUserPassword = function() {
			$scope.success = $scope.error = null;

			$http.post('/auth/reset/' + $stateParams.token, $scope.passwordDetails).success(function(response) {
				// If successful show success message and clear form
				$scope.passwordDetails = null;

				// Attach user profile
				Authentication.user = response;

				// And redirect to the index page
				$location.path('/password/reset/success');
			}).error(function(response) {
				$scope.error = response.message;
			});
		};
	}
]);
'use strict';

angular.module('users').controller('SettingsController', ['$scope', '$http', '$location', 'Users', 'Authentication',
	function($scope, $http, $location, Users, Authentication) {
		$scope.user = Authentication.user;

		// If user is not signed in then redirect back home
		if (!$scope.user) $location.path('/');

		// Check if there are additional accounts 
		$scope.hasConnectedAdditionalSocialAccounts = function(provider) {
			for (var i in $scope.user.additionalProvidersData) {
				return true;
			}

			return false;
		};

		// Check if provider is already in use with current user
		$scope.isConnectedSocialAccount = function(provider) {
			return $scope.user.provider === provider || ($scope.user.additionalProvidersData && $scope.user.additionalProvidersData[provider]);
		};

		// Remove a user social account
		$scope.removeUserSocialAccount = function(provider) {
			$scope.success = $scope.error = null;

			$http.delete('/users/accounts', {
				params: {
					provider: provider
				}
			}).success(function(response) {
				// If successful show success message and clear form
				$scope.success = true;
				$scope.user = Authentication.user = response;
			}).error(function(response) {
				$scope.error = response.message;
			});
		};

		// Update a user profile
		$scope.updateUserProfile = function(isValid) {
			if (isValid){
				$scope.success = $scope.error = null;
				var user = new Users($scope.user);
	
				user.$update(function(response) {
					$scope.success = true;
					Authentication.user = response;
				}, function(response) {
					$scope.error = response.data.message;
				});
			} else {
				$scope.submitted = true;
			}
		};

		// Change user password
		$scope.changeUserPassword = function() {
			$scope.success = $scope.error = null;

			$http.post('/users/password', $scope.passwordDetails).success(function(response) {
				// If successful show success message and clear form
				$scope.success = true;
				$scope.passwordDetails = null;
			}).error(function(response) {
				$scope.error = response.message;
			});
		};
	}
]);

'use strict';

// Authentication service for user variables
angular.module('users').factory('Authentication', [

	function() {
		var _this = this;

		_this._data = {
			user: window.user
		};

		return _this._data;
	}
]);
'use strict';

// Users service used for communicating with the users REST endpoint
angular.module('users').factory('Users', ['$resource',
	function($resource) {
		return $resource('users', {}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);