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
      var isAuthed = null;

      AuthService.getStatus().then(function(res) {
        isAuthed = res.is_authed;
      });

      $scope.visibleLogin = function() {
        if (isAuthed === null) {
          return false;
        }
        return !isAuthed;
      };
      $scope.visibleLogout = function() {
        if (isAuthed === null) {
          return false;
        }
        return isAuthed;
      };
      $scope.login = function() {
        AuthService.getAuthUrl().then(function(res) {
          location.href = res.auth_url;
        });
      };
      $scope.logout = function() {
        AuthService.logout().then(function() {
          location.reload();
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
          name    : originalTag.name,
          official: 0,
          checked : true
        })
      }
      $scope.tag.name = '';
    };

    // タグの登録
    $scope.save = function() {
      if (!authStatus.is_authed) {
        $('#login-modal').modal();
        return;
      }

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
      $scope.viewName        = 'dashboard';
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
      $scope.viewName = 'check_list';
      $scope.page     = 1;

      if (!authStatus.is_authed) {
        $('#login-modal').modal();
        return;
      }

      var deferred    = $q.defer();
      var prev        = deferred.promise;
      deferred.resolve();
      prev = prev.then(function () {
        $scope.loading = true;
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
      $scope.page     = 1;

      if (!authStatus.is_authed) {
        $('#login-modal').modal();
        return;
      }

      var deferred    = $q.defer();
      var prev        = deferred.promise;
      deferred.resolve();
      prev = prev.then(function () {
        $scope.loading = true;
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
        if (!authStatus.is_authed) {
          $('#login-modal').modal();
          return;
        }

        SettingService.save($scope.setting);
      };

      $scope.options = SettingService.options;
    }]
);
