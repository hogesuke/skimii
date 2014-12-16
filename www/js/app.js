'use strict';

var techBooksApp = angular.module('techBooksApp', [
	'ngRoute',
	'techBooksControllers'
]);

techBooksApp.config(['$routeProvider', '$httpProvider', '$locationProvider',
	function($routeProvider, $httpProvider, $locationProvider) {
		$locationProvider.html5Mode(true);
		$routeProvider.
			when('/', {
				templateUrl: '../templates/entry_list.tmpl.html'
			}).
			when('/field', {
				templateUrl: '../templates/field_select.tmpl.html'
			}).
			otherwise({
				redirectTo: '/'
			});

		// IEにてajaxリクエストをキャッシュしてしまう問題の対処
		if (!$httpProvider.defaults.headers.get) {
			$httpProvider.defaults.headers.get = {};
		}
		$httpProvider.defaults.headers.get['If-Modified-Since'] = '0';
	}
]);