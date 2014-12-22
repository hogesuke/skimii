var techBookControllers = angular.module('techBookControllers', ['ui.bootstrap']);

techBookControllers.controller('BaseController', ['$scope', 'TagService',
  function($scope, TagService) {
    TagService.mine().then(function(tags) {
      TagService.setTags(tags);
      $scope.tags = TagService.getTags();
      $scope.currentTag = TagService.getCurrentTag();
      TagService.setCurrentTag(tags[0].name);
    });
  }]
);

techBookControllers.controller('TagController', ['$scope', 'TagService', 'officialTags', 'mineTags',
  function($scope, TagService, officialTags, mineTags) {
    var originalTags = mineTags.filter(function(tag) {
      return tag.official === "0";
    });
    $scope.tags = officialTags.concat(originalTags);

    $scope.tags.forEach(function(tag) {
      mineTags.forEach(function(mineTag) {
        if (mineTag.name === tag.name) {
          tag.checked = true;
          return false;
        }
      });
    });

    // タグの追加
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

    // タグの登録
    $scope.save = function() {
      var checkedTags = $scope.tags.filter(function(tag) {
        return !!tag.checked;
      });
      // todo save中の表示・save後の表示
      // todo 登録に失敗した場合の実装
      TagService.save(checkedTags).then(function(tags) {
        TagService.setTags(tags);
      });
    };
  }]
);

techBookControllers.controller('DashboardController', ['$scope', 'entries',
    function($scope, entries) {
      $scope.allTagEntries = entries;
    }]
);

techBookControllers.controller('EntryListController', ['$scope', 'TagService', 'entries',
    function($scope, TagService, entries) {
      $scope.allTagEntries = entries;
    }]
);

techBookControllers.controller('SidebarController', ['$scope', 'TagService',
    function($scope, TagService) {
      $scope.currentTag = TagService.getCurrentTag();
      $scope.setCurrentTag = TagService.setCurrentTag
    }]
);
