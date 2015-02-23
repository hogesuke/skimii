var techBookControllers = angular.module('techBookControllers', ['ui.bootstrap']);

techBookControllers.controller('BaseController', ['$scope', 'TagService',
  function($scope, TagService) {
    // todo このタグの実装要見直し
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
          return false;
        }
      });
      if (!isDuplicated) {
        $scope.tags.push({
          name: originalTag.name,
          official: 0,
          checked: true
        })
      }
      $scope.tag.name = '';
    };

    // タグの登録
    $scope.save = function() {
      var checkedTags = $scope.tags.filter(function(tag) {
        return !!tag.checked;
      });
      if (checkedTags.length > 50) {
        $scope.msg = "タグの登録上限数を越えています。";
        return;
      }
      // todo save中の表示・save後の表示
      // todo 登録に失敗した場合の実装
      TagService.save(checkedTags).then(function(tags) {
        TagService.setTags(tags);
      }, function(res) {
        $scope.msg = res.err_msg;
      });
    };
  }]
);

techBookControllers.controller('DashboardController', ['$scope', 'TagService', 'EntryService', 'LaterService', 'CheckService', 'SettingService',
    function($scope, TagService, EntryService, LaterService, CheckService, SettingService) {
      $scope.allEntriesDatas = {};

      SettingService.load().then(function(res) {
        $scope.settings = res;
        return TagService.mine();
      }).then(function(tags) {
        angular.forEach(tags, function(tag) {
          $scope.allEntriesDatas[tag.name] = { entries: [], completed: false, loading: true };
          EntryService.load(tag.name, 1).then(function(entriesData) {
            entriesData.loading = false;
            entriesData.page    = 1;
            entriesData.entries = entriesData.entries.filter(function(entry) {
              return !entry.checked && !entry.latered;
            }).slice(0, $scope.settings.dashboard_count);

            $scope.allEntriesDatas[tag.name] = entriesData;
          });
        });
      });
      $scope.toggleLater = function(lateredEntry) {
        var joinedEntries = [];
        angular.forEach($scope.allEntriesDatas, function(entriesData) {
          joinedEntries = joinedEntries.concat(entriesData.entries);
        });
        LaterService.toggle(joinedEntries, lateredEntry);
        if (lateredEntry.checked) {
          // laterにマークされたのでcheckは削除
          CheckService.toggle(joinedEntries, lateredEntry);
        }
      };
      $scope.toggleCheck = function(checkedEntry) {
        var joinedEntries = [];
        angular.forEach($scope.allEntriesDatas, function(entriesData) {
          joinedEntries = joinedEntries.concat(entriesData.entries);
        });
        CheckService.toggle(joinedEntries, checkedEntry);
        if (checkedEntry.latered) {
          // checkにマークされたのでlaterは削除
          LaterService.toggle(joinedEntries, checkedEntry);
        }
      };
      $scope.convertToHatebuUrl = function(url) {
        return EntryService.convertToHatebuUrl(url);
      };
      $scope.visibleEntry = function(entry) {
        return $scope.settings.visible_marked == 1 || (!entry.checked && !entry.latered);
      };
    }]
);

techBookControllers.controller('EntryListController', ['$scope', '$routeParams', '$q', 'EntryService', 'LaterService', 'CheckService', 'SettingService',
    function($scope, $routeParams, $q, EntryService, LaterService, CheckService, SettingService) {
      $scope.viewName = 'entry_list';
      $scope.entries  = [];
      $scope.tag      = $routeParams.tag;
      $scope.page     = 0;
      $scope.settings = null;
      var deferred = $q.defer();
      var prev     = deferred.promise;

      deferred.resolve();
      prev = prev.then(function() {
        return SettingService.load();
      });
      prev.then(function(res) {
        $scope.settings = res;
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
      $scope.convertToHatebuUrl = function(url) {
        return EntryService.convertToHatebuUrl(url);
      };
      $scope.visibleEntry = function(entry) {
        return $scope.settings.visible_marked == 1 || (!entry.checked && !entry.latered);
      };
    }]
);

techBookControllers.controller('CheckListController', ['$scope', 'CheckService', 'LaterService',
    function($scope, CheckService, LaterService) {
      $scope.viewName = 'check_list';
      $scope.loading  = true;

      CheckService.all().then(function(entries) {
        $scope.entries = entries;
        $scope.loading = false;
      });
      $scope.remove = function(entry, index) {
        CheckService.remove(entry, index);
        entry.checked = false;
        $('[index=' + index + ']').fadeOut(300);
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
      $scope.loading  = true;

      LaterService.all().then(function(entries) {
        $scope.entries = entries;
        $scope.loading  = false;
      });
      $scope.remove = function(entry, index) {
        LaterService.remove(entry);
        entry.latered = false;
        $('[index=' + index + ']').fadeOut(300);
      };

      $scope.toggleCheck = function(checkedEntry) {
        CheckService.toggle($scope.entries, checkedEntry);
        LaterService.toggle($scope.entries, checkedEntry);
      };
    }]
);

techBookControllers.controller('SidebarController', ['$scope', 'TagService',
    function($scope, TagService) {
    }]
);

techBookControllers.controller('SettingController', ['$scope', 'SettingService',
    function($scope, SettingService) {
      SettingService.load().then(function(setting) {
        $scope.setting = setting;
      });

      $scope.save = function() {
        SettingService.save($scope.setting);
      };

      $scope.options = SettingService.options;
    }]
);
