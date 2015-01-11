var techBookControllers = angular.module('techBookControllers', ['ui.bootstrap']);

techBookControllers.controller('BaseController', ['$scope', 'TagService',
  function($scope, TagService) {
    TagService.mine().then(function(tags) {
      TagService.setTags(tags);
      $scope.tags = TagService.getTags();
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

techBookControllers.controller('DashboardController', ['$scope', 'LaterService', 'CheckService', 'entries',
    function($scope, LaterService, CheckService, entries) {
      $scope.allTagEntries = entries;
      $scope.toggleLater = function(lateredEntry) {
        var entries = [];
        angular.forEach($scope.allTagEntries, function(tagEntries) {
          entries = entries.concat(tagEntries);
        });
        LaterService.toggle(entries, lateredEntry);
        if (lateredEntry.checked) {
          lateredEntry.checked = false;
          CheckService.remove(lateredEntry);
        }
      };
      $scope.toggleCheck = function(checkedEntry) {
        var entries = [];
        angular.forEach($scope.allTagEntries, function(tagEntries) {
          entries = entries.concat(tagEntries);
        });
        CheckService.toggle(entries, checkedEntry);
        if (checkedEntry.latered) {
          checkedEntry.latered = false;
          LaterService.remove(checkedEntry);
        }
      };
    }]
);

techBookControllers.controller('EntryListController', ['$scope', '$routeParams', 'EntryService', 'LaterService', 'CheckService',
    function($scope, $routeParams, EntryService, LaterService, CheckService) {
      $scope.viewName = 'entry_list';
      $scope.tag = $routeParams.tag;

      EntryService.one($routeParams.tag).then(function(entries) {
        $scope.entries = entries;
      });

      $scope.toggleLater = function(lateredEntry) {
        LaterService.toggle($scope.entries, lateredEntry);
        if (lateredEntry.checked) {
          lateredEntry.checked = false;
          CheckService.remove(lateredEntry);
        }
      };
      $scope.toggleCheck = function(checkedEntry) {
        CheckService.toggle($scope.entries, checkedEntry);
        if (checkedEntry.latered) {
          checkedEntry.latered = false;
          LaterService.remove(checkedEntry);
        }
      };
    }]
);

techBookControllers.controller('CheckListController', ['$scope', 'CheckService', 'LaterService',
    function($scope, CheckService, LaterService) {
      $scope.viewName = 'check_list';
      CheckService.all().then(function(entries) {
        $scope.entries = entries;
      });
      $scope.remove = function(entry) {
        CheckService.remove(entry);
        entry.checked = false;
      };

      $scope.toggleLater = function(lateredEntry) {
        LaterService.toggle($scope.entries, lateredEntry);
        CheckService.toggle($scope.entries, lateredEntry);
      };
    }]
);

techBookControllers.controller('LaterListController', ['$scope', 'LaterService', 'CheckService',
    function($scope, LaterService, CheckService) {
      $scope.viewName = 'later_list';
      LaterService.all().then(function(entries) {
        $scope.entries = entries;
      });
      $scope.remove = function(entry) {
        LaterService.remove(entry);
        entry.latered = false;
      };

      $scope.toggleCheck = function(checkedEntry) {
        CheckService.toggle($scope.entries, checkedEntry);
        LaterService.toggle($scope.entries, checkedEntry);
      };
    }]
);

techBookControllers.controller('EntryViewController', ['$scope',
    function($scope) {
      $scope.getViewSize = function(viewName) {
        return localStorage.getItem(viewName + '.view_size') || 'small';
      };
      $scope.setViewSize = function(viewName, size) {
        localStorage.setItem(viewName + '.view_size', size);
      };
      $scope.isRemovable = function() {
        return !!$scope.viewName.match(/check_list|later_list/);
      };
    }]
);

techBookControllers.controller('SidebarController', ['$scope', 'TagService',
    function($scope, TagService) {
    }]
);
