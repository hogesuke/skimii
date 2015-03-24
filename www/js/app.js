'use strict';

var techBookApp = angular.module('TechBookApp', [
  'ngRoute',
  'techBookControllers',
  'techBookDirectives',
  'ui.bootstrap'
]);

techBookApp.config(['$routeProvider', '$httpProvider', '$locationProvider',
  function($routeProvider, $httpProvider, $locationProvider) {
    // todo あとでコメントアウト外す
    // $locationProvider.html5Mode(true);
    $routeProvider.
      when('/', {
        templateUrl: '../templates/entry_dashboard.tmpl.html',
        controller : 'DashboardController'
      }).
      when('/entry/:tag', {
        templateUrl: '../templates/entry_list.tmpl.html',
        controller : 'EntryListController'
      }).
      when('/check', {
        templateUrl: '../templates/check_list.tmpl.html',
        controller : 'CheckListController',
        resolve    : {
          authStatus : function(AuthService) {
            return AuthService.getStatus();
          }
        }
      }).
      when('/later', {
        templateUrl: '../templates/later_list.tmpl.html',
        controller : 'LaterListController',
        resolve    : {
          authStatus : function(AuthService) {
            return AuthService.getStatus();
          }
        }
      }).
      when('/tag', {
        templateUrl: '../templates/tag_select.tmpl.html',
        controller : 'TagController',
        resolve    : {
          authStatus : function(AuthService) {
            return AuthService.getStatus();
          }
        }
      }).
      when('/setting', {
        templateUrl: '../templates/setting.tmpl.html',
        controller : 'SettingController',
        resolve    : {
          authStatus : function(AuthService) {
            return AuthService.getStatus();
          }
        }
      }).
      when('/500', {
        templateUrl: '../templates/500.tmpl.html'
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