'use strict';

var techBookApp = angular.module('TechBookApp', [
  'ngRoute'
]);

techBookApp.config(['$routeProvider', '$httpProvider', '$locationProvider',
  function($routeProvider, $httpProvider, $locationProvider) {
    // todo あとでコメントアウト外す
    // $locationProvider.html5Mode(true);
    $routeProvider.
      when('/', {
        templateUrl: '../templates/entry_list.tmpl.html'
      }).
      when('/tag', {
        templateUrl: '../templates/tag_select.tmpl.html'
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