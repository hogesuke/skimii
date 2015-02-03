'use strict';

var techBookApp = angular.module('TechBookApp', [
  'ngRoute',
  'techBookControllers',
  'techBookDirectives'
]);

techBookApp.config(['$routeProvider', '$httpProvider', '$locationProvider',
  function($routeProvider, $httpProvider, $locationProvider) {
    // todo あとでコメントアウト外す
    // $locationProvider.html5Mode(true);
    $routeProvider.
      when('/', {
        templateUrl: '../templates/entry_dashboard.tmpl.html',
        controller: 'DashboardController'
      }).
      when('/entry/:tag', {
        templateUrl: '../templates/entry_list.tmpl.html',
        controller: 'EntryListController'
      }).
      when('/check', {
        templateUrl: '../templates/check_list.tmpl.html',
        controller: 'CheckListController'
      }).
      when('/later', {
        templateUrl: '../templates/later_list.tmpl.html',
        controller: 'LaterListController'
      }).
      when('/tag', {
        templateUrl: '../templates/tag_select.tmpl.html',
        controller: 'TagController',
        resolve: {
          TagService: 'TagService',
          officialTags: function(TagService) {
            // todo ロード中の画面表示どうしようね…
            return TagService.all();
          },
          mineTags: function(TagService) {
            // todo ロード中の画面表示どうしようね…
            return TagService.mine();
          }
        }
      }).
      when('/setting', {
        templateUrl: '../templates/setting.tmpl.html',
        controller: 'SettingController'
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