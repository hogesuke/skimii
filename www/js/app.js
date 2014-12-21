'use strict';

var techBookApp = angular.module('TechBookApp', [
  'ngRoute',
  'techBookControllers'
]);

techBookApp.config(['$routeProvider', '$httpProvider', '$locationProvider',
  function($routeProvider, $httpProvider, $locationProvider) {
    // todo あとでコメントアウト外す
    // $locationProvider.html5Mode(true);
    $routeProvider.
      when('/', {
        templateUrl: '../templates/entry_dashboard.tmpl.html',
        controller: 'DashboardController',
        resolve: {
          EntryService: 'EntryService',
          entries: function(EntryService) {
            // todo ロード中の画面表示どうしようね…
            return EntryService.all();
          }
        }
      }).
      when('/tag', {
        templateUrl: '../templates/tag_select.tmpl.html',
        controller: 'TagController',
        resolve: {
          TagService: 'TagService',
          tags: function(TagService) {
            // todo ロード中の画面表示どうしようね…
            return TagService.all();
          }
        }
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