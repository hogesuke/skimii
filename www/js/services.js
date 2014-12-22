angular.module('TechBookApp').
  factory('Tags', [function() {
    return {
      mine: []
    };
  }]).
  factory('CurrentTag', [function() {
    return {
      name: ''
    };
  }]).
  factory('TagService', ['$http', '$q', 'Tags', 'CurrentTag', function($http, $q, Tags, CurrentTag) {
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
      setTags: function(tags) {
        Tags.mine.length = 0;
        Tags.mine = tags;
      },
      getTags: function() {
        return Tags;
      },
      setCurrentTag: function(tagName) {
        CurrentTag.name = tagName;
      },
      getCurrentTag: function() {
        return CurrentTag;
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