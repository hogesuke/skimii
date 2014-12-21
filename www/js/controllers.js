var techBookControllers = angular.module('techBookControllers', ['ui.bootstrap']);

techBookControllers.controller('TagController', ['$scope', 'TagService', 'tags',
  function($scope, TagService, tags) {
    $scope.tags = tags;

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

techBookControllers.controller('DashboardController', ['$scope', 'entries',
    function($scope, entries) {
      $scope.allTagEntries = entries;
    }]
);

techBookControllers.controller('EntryListController', ['$scope', 'TagService', 'tags', 'entries',
    function($scope, TagService, tags, entries) {
      $scope.tags = tags;
      $scope.allTagEntries = entries;
      $scope.currentTag = TagService.getCurrentTag();

      if (!$scope.currentTag.name) {
        TagService.setCurrentTag(tags[0].name)
      }
    }]
);

techBookControllers.controller('SidebarController', ['$scope', 'TagService',
    function($scope, TagService) {
      TagService.mine().then(function(tags) {
        $scope.tags = tags;
      });

      $scope.currentTag = TagService.getCurrentTag();
      $scope.setCurrentTag = TagService.setCurrentTag
    }]
);
