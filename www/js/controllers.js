var techBookControllers = angular.module('techBookControllers', ['ui.bootstrap']);

techBookControllers.controller('BaseController', ['$scope', 'TagService',
  function($scope, TagService) {
    TagService.mine().then(function(tags) {
      tags.forEach(function(tag) {
        tag.encoded = encodeURI(tag.name);
      });
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

techBookControllers.controller('DashboardController', ['$scope', 'TagService', 'EntryService', 'LaterService', 'CheckService',
    function($scope, TagService, EntryService, LaterService, CheckService) {
      $scope.allTagEntries = {};

      TagService.mine().then(function(tags) {
        angular.forEach(tags, function(tag) {
          $scope.allTagEntries[tag.name] = [];
          EntryService.one(tag.name, 0).then(function(tagEntries) {
            $scope.allTagEntries[tag.name] = tagEntries;
          });
        });
      });
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
      $scope.entries = [];
      $scope.tag = $routeParams.tag;
      $scope.page = 1;
      $scope.loading = true;
      $scope.terminal = false;

      EntryService.one($routeParams.tag, $scope.page).then(function(entries) {
        var prevDate = '9999-99-99';
        angular.forEach(entries, function(entry) {
          if (prevDate > entry.hotentry_date) {
            entry.visibleDate = true;
          }
          prevDate = entry.hotentry_date;
        });
        $scope.entries = entries;
      }).finally(function() {
        $scope.loading = false;
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

      // オートページネーション
      $(window).scroll(function() {
        var total = $(document).height();
        var position = $(window).scrollTop() + $(window).height();

        if (!$scope.loading && !$scope.terminal && position >= total - 200) {
          $scope.loading = true;
          EntryService.one($routeParams.tag, ++$scope.page).then(function(entries) {
            if (entries.length > 0) {
              var prevDate = $scope.entries.pop.hotentry_date;
              angular.forEach(entries, function(entry) {
                if (prevDate > entry.hotentry_date) {
                  entry.visibleDate = true;
                }
                prevDate = entry.hotentry_date;
              });
              $scope.entries = $scope.entries.concat(entries);
            } else {
              $scope.terminal = true;
            }
          }).finally(function() {
            $scope.loading = false;
          });
        }
      });
    }]
);

techBookControllers.controller('CheckListController', ['$scope', 'CheckService', 'LaterService',
    function($scope, CheckService, LaterService) {
      $scope.viewName = 'check_list';
      CheckService.all().then(function(entries) {
        $scope.entries = entries;
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
      LaterService.all().then(function(entries) {
        $scope.entries = entries;
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
