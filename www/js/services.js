angular.module('TechBookApp').
  factory('currentTag', [function() {
    return {
      name: ''
    };
  }]).
  factory('TagService', ['$http', '$q', 'currentTag', function($http, $q, currentTag) {
    return {
      all: function() {
        var deferred = $q.defer();
        $http({
          method: 'get',
          url: '/api/tag'
        }).success(function (res) {
          deferred.resolve(res);
        }).error(function () {
          deferred.reject();
        });
        return deferred.promise;
      },
      mine: function() {
        var deferred = $q.defer();
        $http({
          method: 'get',
          url: '/api/user/my/tag'
        }).success(function (res) {
          deferred.resolve(res);
        }).error(function () {
          deferred.reject();
        });
        return deferred.promise;
      },
      save: function(tags) {
        var deferred = $q.defer();
        console.debug(tags);
        $http({
          method: 'post',
          url: '/api/user/my/tag',
          data: {tags: tags}
        }).success(function (res) {
          deferred.resolve(res);
        }).error(function () {
          deferred.reject();
        });
        return deferred.promise;
      },
      setCurrentTag: function(tagName) {
        currentTag.name = tagName;
      },
      getCurrentTag: function() {
        return currentTag;
      }
    }
  }]).
  factory('EntryService', ['$http', '$q', function($http, $q) {
    return {
      all: function() {
        var deferred = $q.defer();
        $http({
          method: 'get',
          url: '/api/user/my/entry'
        }).success(function (res) {
          deferred.resolve(res);
        }).error(function () {
          deferred.reject();
        });
        return deferred.promise;
      }
    }
  }]);