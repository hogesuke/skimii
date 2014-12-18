angular.module('TechBookApp').
  factory('TagService', ['$http', '$q', function($http, $q) {
    var deferred = $q.defer();
    $http({
      method: 'get',
      url   : '/api/tag'
    }).success(function(res) {
      deferred.resolve(res);
    }).error(function() {
      deferred.reject();
    });
    return deferred.promise;
  }]
);