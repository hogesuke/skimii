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

techBookControllers.controller('TagController', ['$scope', '$q', '$interval', 'authStatus', 'TagService',
  function($scope, $q, $interval, authStatus, TagService) {
    $scope.tags    = [];
    $scope.alerts  = [];
    $scope.loading = true;
    $scope.saving  = false;
    $scope.onError = false;

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
    }, function() {
      $scope.alerts.push({type: 'danger', msg: 'タグの取得に失敗しました。しばらくしてからページを更新し直してください。'});
      $scope.onError = true;
    }).finally(function() {
      $scope.loading = false;
    });

    $scope.add = function(originalTag) {
      var isDuplicated = false;
      var tagName = originalTag.name.toLowerCase();

      $scope.tags.forEach(function(tag) {
        if (tagName == tag.name) {
          isDuplicated = true;
          return false;
        }
      });
      if (!isDuplicated) {
        $scope.tags.push({
          name    : tagName,
          official: 0,
          checked : true
        })
      }
      $scope.tag.name = '';
    };

    $scope.save = function() {
      $scope.msg    = '';
      $scope.alerts = [];

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

      $scope.saving = true;

      TagService.save(checkedTags).then(function(tags) {
        TagService.setTags(tags);
        $scope.msg = '保存しました';
      }, function() {
        $scope.alerts.push({type: 'danger', msg: '保存に失敗しました。しばらくしてからやり直してください。'});
      }).finally(function() {
        $scope.saving = false;
      });
    };
    $scope.closeAlert = function(index) {
      $scope.alerts.splice(index, 1);
    };
  }]
);

techBookControllers.controller('DashboardController', ['$scope', 'TagService', 'EntryService', 'LaterService', 'CheckService', 'SettingService',
    function($scope, TagService, EntryService, LaterService, CheckService, SettingService) {
      $scope.viewName        = 'dashboard';
      $scope.allEntriesDatas = {};
      $scope.alerts          = [];

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
              if ($scope.settings.visible_marked === 0) { return !entry.checked && !entry.latered; }
              return true;
            }).slice(0, $scope.settings.dashboard_count);

            $scope.allEntriesDatas[tag.name] = entriesData;
          });
        });
      }, function() {
        $scope.alerts.push({type: 'danger', msg: 'ページの取得に失敗しました。しばらくしてからページを更新し直してください。'});
      });

      $scope.convertToHatebuUrl = function(url) {
        return EntryService.convertToHatebuUrl(url);
      };
      $scope.isEmpty = function(entriesData) {
        return !entriesData.loading && entriesData.entries.length <= 0;
      };
      $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
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
      $scope.alerts   = [];
      $scope.onError  = false;

      SettingService.load().then(function(res) {
        $scope.settings = res;
      }, function() {
        $scope.alerts.push({type: 'danger', msg: 'ページの取得に失敗しました。しばらくしてからページを更新し直してください。'});
        $scope.onError = true;
      });

      $scope.convertToHatebuUrl = function(url) {
        return EntryService.convertToHatebuUrl(url);
      };
      $scope.visibleEntry = function(entry) {
        return $scope.settings.visible_marked == 1 || (!entry.checked && !entry.latered);
      };
      $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
      };
    }]
);

techBookControllers.controller('CheckListController', ['$scope', '$q', 'authStatus', 'CheckService', 'LaterService', 'SettingService',
    function($scope, $q, authStatus, CheckService, LaterService, SettingService) {
      $scope.viewName = 'check_list';
      $scope.page     = 1;
      $scope.alerts   = [];

      $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
      };

      if (!authStatus.is_authed) {
        $scope.alerts.push({type: 'info', msg: 'この機能をご利用いただくにはログインが必要です。'});
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
      }, function() {
        $scope.alerts.push({type: 'danger', msg: 'ページの取得に失敗しました。しばらくしてからページを更新し直してください。'});
      }).finally(function() {
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
      $scope.alerts   = [];

      $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
      };

      if (!authStatus.is_authed) {
        $scope.alerts.push({type: 'info', msg: 'この機能をご利用いただくにはログインが必要です。'});
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
      }, function() {
        $scope.alerts.push({type: 'danger', msg: 'ページの取得に失敗しました。しばらくしてからページを更新し直してください。'});
      }).finally(function() {
        $scope.loading = false;
      });

      $scope.remove = function(entry, index) {
        LaterService.remove(entry);
        entry.latered = false;
        $('[index=' + index + ']').fadeOut(300);
      };
    }]
);

techBookControllers.controller('SidebarController', ['$scope', 'AuthService',
    function($scope, AuthService) {
      $scope.isAuthed = null;

      AuthService.getStatus().then(function(res) {
        $scope.isAuthed = res.is_authed;
        $scope.userRawName = res.raw_name;
      }, function() {
        $scope.isAuthed = false;
      });

      $scope.visibleLogin = function() {
        if ($scope.isAuthed === null) {
          return false;
        }
        return !$scope.isAuthed;
      };
      $scope.visibleUserContainer = function() {
        if ($scope.isAuthed === null) {
          return false;
        }
        return $scope.isAuthed;
      };
    }]
);

techBookControllers.controller('AuthController', ['$scope', 'AuthService',
    function($scope, AuthService) {

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

techBookControllers.controller('SettingController', ['$scope', 'authStatus', 'SettingService',
    function($scope, authStatus, SettingService) {
      $scope.msg     = '';
      $scope.alerts  = [];
      $scope.saving  = false;
      $scope.alerts  = [];
      $scope.onError = false;

      SettingService.load().then(function(setting) {
        $scope.setting = setting;
      }, function() {
        $scope.alerts.push({type: 'danger', msg: 'ページの取得に失敗しました。しばらくしてからページを更新し直してください。'});
        $scope.onError = true;
      });

      $scope.save = function() {
        $scope.msg    = '';
        $scope.alerts = [];

        if (!authStatus.is_authed) {
          $('#login-modal').modal();
          return;
        }

        $scope.saving = true;

        SettingService.save($scope.setting).then(function() {
          $scope.msg = '保存しました';
        }, function() {
          $scope.alerts.push({type: 'danger', msg: '保存に失敗しました。しばらくしてからやり直してください。'});
        }).finally(function() {
          $scope.saving = false;
        });
      };
      $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
      };

      $scope.options = SettingService.options;
    }]
);
