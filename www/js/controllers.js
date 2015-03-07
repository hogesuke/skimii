var techBookControllers = angular.module('techBookControllers', ['ui.bootstrap']);

techBookControllers.controller('BaseController', ['$scope', 'TagService',
  function($scope, TagService) {
    // todo このタグの実装要見直し
    TagService.loadMine().then(function(tags) {
      TagService.setTags(tags);
      $scope.tags = TagService.getTags();
    });
  }]
);

techBookControllers.controller('AuthController', ['$scope', 'AuthService',
    function($scope, AuthService) {
      $scope.getAuthUrl = function() {
        AuthService.getAuthUrl().then(function(res) {
          location.href = res.auth_url;
        });
      };
    }]
);

techBookControllers.controller('TagController', ['$scope', '$q', 'authStatus', 'TagService',
  function($scope, $q, authStatus, TagService) {
    $scope.loading = true;

    $q.all([TagService.loadOfficial(), TagService.loadMine()]).then(function (res) {
      var officialTags = res[0];
      var mineTags     = res[1];

      var originalTags = mineTags.filter(function (tag) {
        return tag.official === "0";
      });
      $scope.tags = officialTags.concat(originalTags);

      $scope.tags.forEach(function (tag) {
        mineTags.forEach(function (mineTag) {
          if (mineTag.name === tag.name) {
            tag.checked = true;
            return false;
          }
        });
      });
    }).finally(function() {
      $scope.loading = false;
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
        return TagService.loadMine();
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

      $scope.convertToHatebuUrl = function(url) {
        return EntryService.convertToHatebuUrl(url);
      };
      $scope.visibleEntry = function(entry) {
        return $scope.settings.visible_marked == 1 || (!entry.checked && !entry.latered);
      };
    }]
);

techBookControllers.controller('CheckListController', ['$scope', '$q', 'authStatus', 'CheckService', 'LaterService', 'SettingService',
    function($scope, $q, authStatus, CheckService, LaterService, SettingService) {
      $scope.viewName   = 'check_list';
      $scope.loading    = true;
      $scope.page       = 1;
      var deferred      = $q.defer();
      var prev          = deferred.promise;

      // todo directiveに移動させる
      if (authStatus.is_authed) {
        deferred.resolve();
        prev = prev.then(function () {
          return SettingService.load();
        });
        prev = prev.then(function (res) {
          $scope.settings = res;
          return CheckService.load($scope.page);
        });
        prev.then(function (entriesData) {
          $scope.entries = entriesData.entries;
          $scope.loading = false;
        });
      } else {
        $scope.loading = false;
      }

      $scope.remove = function(entry, index) {
        CheckService.remove(entry, index);
        entry.checked = false;
        $('[index=' + index + ']').fadeOut(300);
      };
    }]
);

techBookControllers.controller('LaterListController', ['$scope', '$q', 'authStatus', 'LaterService', 'CheckService', 'SettingService',
    function($scope, $q, authStatus, LaterService, CheckService, SettingService) {
      $scope.viewName = 'later_list';
      $scope.loading  = true;
      $scope.page     = 1;
      var deferred    = $q.defer();
      var prev        = deferred.promise;

      if (authStatus.is_authed) {
        deferred.resolve();
        prev = prev.then(function () {
          return SettingService.load();
        });
        prev = prev.then(function (res) {
          $scope.settings = res;
          return LaterService.load($scope.page);
        });
        prev.then(function (entriesData) {
          $scope.entries = entriesData.entries;
          $scope.loading = false;
        });
      } else {
        $scope.loading = false;
      }

      $scope.remove = function(entry, index) {
        LaterService.remove(entry);
        entry.latered = false;
        $('[index=' + index + ']').fadeOut(300);
      };
    }]
);

techBookControllers.controller('SidebarController', ['$scope', 'TagService',
    function($scope, TagService) {
    }]
);

techBookControllers.controller('SettingController', ['$scope', 'authStatus', 'SettingService',
    function($scope, authStatus, SettingService) {
      SettingService.load().then(function(setting) {
        $scope.setting = setting;
      });

      $scope.save = function() {
        SettingService.save($scope.setting);
      };

      $scope.options = SettingService.options;
    }]
);
