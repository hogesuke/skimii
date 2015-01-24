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
      one: function(tag, page) {
        var deferred = $q.defer();
        $http({
          method: 'get',
          url: '/api/entry' + '?page=' + page + '&tag=' + tag
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
      save: function(entry) {
        var deferred = $q.defer();
        $http({
          method: 'post',
          url: '/api/user/my/later',
          data: entry
        }).success(function (res) {
          deferred.resolve(res);
        }).error(function () {
          deferred.reject();
        });
        return deferred.promise;
      },
      remove: function(entry) {
        var deferred = $q.defer();
        $http({
          method: 'delete',
          url: '/api/user/my/later',
          data: entry
        }).success(function (res) {
          deferred.resolve(res);
        }).error(function () {
          deferred.reject();
        });
        return deferred.promise;
      },
      toggle: function (entries, lateredEntry) {
        var isToLatered = !lateredEntry.latered;
        angular.forEach(entries, function(entry) {
          if (entry.url === lateredEntry.url && entry.hotentry_date === lateredEntry.hotentry_date) {
            entry.latered = !lateredEntry.latered;
          }
        });
        if (isToLatered) {
          this.save(lateredEntry);
        } else {
          this.remove(lateredEntry);
        }
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
      save: function (entry) {
        var deferred = $q.defer();
        console.debug(entry);
        $http({
          method: 'post',
          url: '/api/user/my/check',
          data: entry
        }).success(function (res) {
          deferred.resolve(res);
        }).error(function () {
          deferred.reject();
        });
        return deferred.promise;
      },
      remove: function (entry) {
        var deferred = $q.defer();
        console.debug(entry);
        $http({
          method: 'delete',
          url: '/api/user/my/check',
          data: entry
        }).success(function (res) {
          deferred.resolve(res);
        }).error(function () {
          deferred.reject();
        });
        return deferred.promise;
      },
      toggle: function (entries, checkedEntry) {
        var isToChecked = !checkedEntry.checked;
        angular.forEach(entries, function(entry) {
          if (entry.url === checkedEntry.url && entry.hotentry_date === checkedEntry.hotentry_date) {
            entry.checked = !checkedEntry.checked;
          }
        });
        if (isToChecked) {
          this.save(checkedEntry);
        } else {
          this.remove(checkedEntry);
        }
      }
    }
  }]).
  factory('SettingService', ['$http', '$q', function($http, $q) {
    return {
      load: function () {
        var deferred = $q.defer();
        $http({
          method: 'get',
          url: '/api/setting'
        }).success(function (res) {
          deferred.resolve(res);
        }).error(function () {
          deferred.reject();
        });
        return deferred.promise;
      },
      save: function (entry) {
        var deferred = $q.defer();
        console.debug(entry);
        $http({
          method: 'put',
          url: '/api/setting',
          data: entry
        }).success(function (res) {
          deferred.resolve(res);
        }).error(function () {
          deferred.reject();
        });
        return deferred.promise;
      },
      options: {
        bookmarkCount: [ 1, 3, 5, 10, 30, 100 ],
        hotentryDays: [ 1, 3, 5, 10, 30, 100 ],
        laterDays: [ 1, 3, 5, 10, 30, 100 ],
        dashboardCount: [ 5, 10, 20, 30 ]
      }
    }
  }]);
