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
      $scope.switchLater = function(lateredEntry) {
        var isToLatered = !lateredEntry.latered;
        angular.forEach($scope.allTagEntries, function(tagEntries) {
          angular.forEach(tagEntries, function(entry) {
            if (entry.url === lateredEntry.url && entry.date === lateredEntry.date) {
              entry.latered = !lateredEntry.latered;
            }
          });
        });
        if (isToLatered) {
          LaterService.save(lateredEntry);
        } else {
          LaterService.remove(lateredEntry);
        }
      };
      $scope.switchCheck = function(checkedEntry) {
        var isToChecked = !checkedEntry.checked;
        angular.forEach($scope.allTagEntries, function(tagEntries) {
          angular.forEach(tagEntries, function(entry) {
            if (entry.url === checkedEntry.url && entry.date === checkedEntry.date) {
              entry.checked = !checkedEntry.checked;
            }
          });
        });
        if (isToChecked) {
          CheckService.save(checkedEntry);
        } else {
          CheckService.remove(checkedEntry);
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

      $scope.switchLater = function(lateredEntry) {
        var isToLatered = !lateredEntry.latered;
        angular.forEach($scope.entries, function(entry) {
          if (entry.url === lateredEntry.url && entry.date === lateredEntry.date) {
            entry.latered = !lateredEntry.latered;
          }
        });
        if (isToLatered) {
          LaterService.save(lateredEntry);
        } else {
          LaterService.remove(lateredEntry);
        }
      };
      $scope.switchCheck = function(checkedEntry) {
        var isToChecked = !checkedEntry.checked;
        angular.forEach($scope.entries, function(entry) {
          if (entry.url === checkedEntry.url && entry.date === checkedEntry.date) {
            entry.checked = !checkedEntry.checked;
          }
        });
        if (isToChecked) {
          CheckService.save(checkedEntry);
        } else {
          CheckService.remove(checkedEntry);
        }
      };
    }]
);

techBookControllers.controller('LaterListController', ['$scope', 'LaterService',
    function($scope, LaterService) {
      $scope.viewName = 'later_list';
      LaterService.all().then(function(entries) {
        $scope.entries = entries;
      });
    }]
);

techBookControllers.controller('EntryViewController', ['$scope',
    function($scope) {
      $scope.getViewSize = function(viewName) {
        return localStorage.getItem(viewName + '.view_size');
      };
      $scope.setViewSize = function(viewName, size) {
        localStorage.setItem(viewName + '.view_size', size);
      };
    }]
);

techBookControllers.controller('SidebarController', ['$scope', 'TagService',
    function($scope, TagService) {
    }]
);
