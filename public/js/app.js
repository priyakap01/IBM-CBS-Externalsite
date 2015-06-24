'use strict';
/* App Module */
var cbsExtApp = angular.module('cbsExtApp', [
'ngRoute',
'phonecatControllers'
]);
cbsExtApp.config(['$routeProvider',
function($routeProvider) {
$routeProvider.
when('/welcome', {
	templateUrl: 'partials/welcome.html',
	controller: 'abtCtrl'
}).
when('/about', {
	templateUrl: 'partials/about.html',
	controller: 'abtCtrl'
}).
when('/dashboard', {
	templateUrl: 'partials/dashboard.html',
	controller: 'abtCtrl'
}).
when('/messageboard', {
	templateUrl: 'partials/messageboard.html',
	controller: 'abtCtrl'
}).
when('/messagereply/:messageInfo', {
	templateUrl: 'partials/messageboardreply.html',
	controller: 'messageCtrl'
	
}).
when('/report', {
	templateUrl: 'partials/report.html',
	controller: 'abtCtrl'
}).
when('/knowledgebase', {
	templateUrl: 'partials/knowledgebase.html',
	controller: 'abtCtrl'
}).
otherwise({
redirectTo: '/welcome'
});
}]);