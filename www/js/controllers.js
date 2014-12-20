var techBookControllers = angular.module('techBookControllers', ['ui.bootstrap']);

techBookControllers.controller('TagController', ['$scope', 'TagService',
  function($scope, TagService) {

    TagService.all().then(function(tags) {
      $scope.tags = tags;
    });

    $scope.add = function(originalTag) {
      var isDuplicated = false;
      $scope.tags.forEach(function(tag) {
        if (originalTag.name == tag.name) {
          isDuplicated = true;
          return;
        }
      });
      if (!isDuplicated) {
        $scope.tags.push({
          name: originalTag.name,
          official: 0,
          checked: true
        })
      }
    };

    $scope.save = function() {
      var checkedTags = $scope.tags.filter(function(tag) {
        return !!tag.checked;
      });
      // todo save中の表示・save後の表示
      TagService.save(checkedTags);
    };
  }]
);

techBookControllers.controller('EntryController', ['$scope', 'EntryService',
    function($scope, EntryService) {
      EntryService.all().then(function(entries) {
        // todo 取得中の表示
        $scope.entriesPack = entries;
      })
    }]
);
