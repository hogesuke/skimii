angular.module('TechBookApp').
  factory('Tags', [function() {
    return {
      mine: []
    };
  }]).
  factory('TagService', ['$http', '$q', 'Tags', function($http, $q, Tags) {
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
      },
      one: function(tag) {
        var deferred = $q.defer();
        $http({
          method: 'get',
          url: '/api/entry/' + tag
        }).success(function (res) {
          deferred.resolve(res);
        }).error(function () {
          deferred.reject();
        });
        return deferred.promise;
      }
    }
  }]).
  factory('LaterService', ['$http', '$q', function($http, $q) {
    return {
      all: function() {
        var deferred = $q.defer();
        $http({
          method: 'get',
          url: '/api/user/my/later'
        }).success(function (res) {
          deferred.resolve(res);
        }).error(function () {
          deferred.reject();
        });
        return deferred.promise;
      },
      save: function(url) {
        var deferred = $q.defer();
        $http({
          method: 'post',
          url: '/api/user/my/later',
          data: { url: url }
        }).success(function (res) {
          deferred.resolve(res);
        }).error(function () {
          deferred.reject();
        });
        return deferred.promise;
      },
      remove: function(url) {
        var deferred = $q.defer();
        $http({
          method: 'delete',
          url: '/api/user/my/later',
          data: { url: url }
        }).success(function (res) {
          deferred.resolve(res);
        }).error(function () {
          deferred.reject();
        });
        return deferred.promise;
      }
    }
  }]).
  factory('CheckService', ['$http', '$q', function($http, $q) {
    return {
      all: function () {
        var deferred = $q.defer();
        $http({
          method: 'get',
          url: '/api/user/my/check'
        }).success(function (res) {
          deferred.resolve(res);
        }).error(function () {
          deferred.reject();
        });
        return deferred.promise;
      },
      save: function (url) {
        var deferred = $q.defer();
        $http({
          method: 'post',
          url: '/api/user/my/check',
          data: {url: url}
        }).success(function (res) {
          deferred.resolve(res);
        }).error(function () {
          deferred.reject();
        });
        return deferred.promise;
      },
      remove: function (url) {
        var deferred = $q.defer();
        $http({
          method: 'delete',
          url: '/api/user/my/check',
          data: {url: url}
        }).success(function (res) {
          deferred.resolve(res);
        }).error(function () {
          deferred.reject();
        });
        return deferred.promise;
      }
    }
  }]);
