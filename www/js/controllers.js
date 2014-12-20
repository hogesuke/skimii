var techBookControllers = angular.module('techBookControllers', ['ui.bootstrap']);

techBookControllers.controller('TagController', ['$scope', 'TagService',
  function($scope, TagService) {

    TagService.reqTags().then(function(tags) {
      $scope.tags = tags;
    })
  }]
);