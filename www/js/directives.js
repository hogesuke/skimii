'use strict';

(function() {
  angular.module('techBookDirectives', []).
    directive('tagOption', function () {
      return {
        restrict: 'A',
        link: function(scope, element) {
          var $el = $(element[0]);
          var $tagOp = $el.find('.tag-option');

          $el.on('click', function(e) {
            $tagOp.trigger('click');
            e.preventDefault();
          });
          $tagOp.on('click', function(e) {
            e.stopPropagation();
          });
        }
      };
    }).
    directive('entryBoard', function () {
      return {
        restrict: 'A',
        link: function(scope) {
          scope.getViewSize = function(viewName) {
            return localStorage.getItem(viewName + '.view_size') || 'small';
          };
          scope.setViewSize = function(viewName, size) {
            localStorage.setItem(viewName + '.view_size', size);
          };
          scope.isRemovable = function() {
            return !!scope.viewName.match(/check_list|later_list/);
          };
        }
      };
    }).
    directive('tagListScrollbar', function () {
      return {
        restrict: 'A',
        link: function(scope, element) {
          var $tagList = $(element[0]);

          setHeight($tagList);

          scope.$watch(function() {
            return scope.isAuthed;
          }, function() {
            setHeight($tagList);
          });

          $(window).resize(function() {
            setHeight($tagList);
          });

          $tagList.mCustomScrollbar({
            theme        : 'light',
            scrollInertia: 100,
            mouseWheel   : { scrollAmount: 10, normalizeDelta: false },
            advanced     : { updateOnImageLoad: false }
          });

          function setHeight($tagList) {
            var sidebar_h = $('#sidebar').height();
            var user_h    = scope.isAuthed ? $('#user-container').height() : 0;
            var listTop   = $tagList.offset().top;
            var bottomPad = 10;

            $tagList.height(sidebar_h - user_h - listTop - bottomPad);
          }
        }
      };
    }).
    directive('primitiveScrollbar', function () {
      return {
        restrict: 'A',
        link: function(scope, element) {
          $(element[0]).mCustomScrollbar({
            theme        : 'dark',
            scrollInertia: 100,
            mouseWheel   : { scrollAmount: 10, normalizeDelta: false },
            advanced     : { updateOnImageLoad: false }
          });
        }
      };
    }).
    directive('dashboardEntryList', ['EntryService', function (EntryService) {
      return {
        restrict: 'A',
        link: function(scope, element) {
          var $entryList = $(element[0]);
          var $container = $('#dashboard');

          setWidthAndHeight($entryList, $container);

          $(window).resize(function() {
            setWidthAndHeight($entryList, $container);
          });

          scope.entriesData = { entries: [], page: 1, completed: false, loading: true, hasMore: false };
          load('dashboard', scope, scope.tag.name, 1, EntryService);

          // 次ページの取得
          scope.$watch(function() {
            return scope.entriesData.loading;
          }, function(loading) {
            if (loading === false && !scope.entriesData.completed && !isReachedLimit()) {
              load('dashboard', scope, scope.tag.name, ++scope.entriesData.page, EntryService);
            }
          });

          function setWidthAndHeight($entryList, $container) {
            // for width variables
            var container_w  = $container.width() - 16;
            // for height variables
            var count        = scope.settings.dashboard_count;
            var entry_h      = 100;
            var moreButton_h = 55;
            var listHeader_h = $entryList.children('.tag-name').outerHeight(true);
            var list_h       = entry_h * count + moreButton_h + listHeader_h;

            $entryList.height(list_h);

            var paddingWidth = parseInt($entryList.css('padding-left')) + parseInt($entryList.css('padding-right'));
            var marginWidth  = parseInt($entryList.css('margin-left')) + parseInt($entryList.css('margin-right'));
            var borderWidth  = parseInt($entryList.css('border-left-width')) + parseInt($entryList.css('border-left-width'));
            var excludeWidth = paddingWidth + marginWidth + borderWidth;

            if (container_w < 450) {
              $entryList.width(450 - excludeWidth);
              $entryList.css({height: ''});
            } else if (container_w < 800) {
              $entryList.width(container_w - excludeWidth);
              $entryList.css({height: ''});
            } else if (container_w < 1200) {
              $entryList.width((container_w - excludeWidth * 2) / 2);
            } else {
              $entryList.width((container_w - excludeWidth * 3) / 3);
            }
          }

          function isReachedLimit() {
            return scope.settings.dashboard_count <= scope.entriesData.entries.length;
          }
        }
      };
    }]).
    directive('entryList', ['$routeParams','EntryService', function ($routeParams, EntryService) {
      return {
        restrict: 'A',
        link: function(scope) {

          var watcher = scope.$watch(function() {
            return scope.settings;
          }, function() {
            if (!scope.settings) {
              return;
            }

            watcher(); // clear watch
            load('list', scope, $routeParams.tag, ++scope.page, EntryService);
          });
        }
      };
    }]).
    directive('entryRepeat', ['$routeParams', '$timeout','EntryService', function ($routeParams, $timeout, EntryService) {
      return {
        restrict: 'A',
        link: function(scope) {
          if (scope.$last) {
            $timeout(function() {
              if (unvisibleScrollBar()) {
                var targetScope = scope.$parent.$parent;
                load('list', targetScope, $routeParams.tag, ++targetScope.page, EntryService);
              }
            }, 500);
          }

          function unvisibleScrollBar() {
            return $('#entryboard [id$=_scrollbar_vertical]').css('display') === 'none';
          }
        }
      };
    }]).
    directive('checkButton', ['CheckService', 'LaterService',function (CheckService, LaterService) {
      return {
        restrict: 'A',
        link: function(scope, element) {

          element.bind('click', function() {
            var entries      = getEntries(scope);
            var checkedEntry = getOwnEntry(scope);

            CheckService.toggle(entries, checkedEntry);
            if (checkedEntry.latered) {
              LaterService.toggle(entries, checkedEntry);
            }
          });
        }
      };
    }]).
    directive('laterButton', ['LaterService', 'CheckService',function (LaterService, CheckService) {
      return {
        restrict: 'A',
        link: function(scope, element) {

          element.bind('click', function() {
            var entries      = getEntries(scope);
            var lateredEntry = getOwnEntry(scope);

            LaterService.toggle(entries, lateredEntry);
            if (lateredEntry.checked) {
              CheckService.toggle(entries, lateredEntry);
            }
          });
        }
      };
    }]).
    directive('sidebarLink', function () {
      return {
        restrict: 'A',
        link: function(scope, element, attrs) {
          var $el         = $(element[0]);
          var nextHash    = attrs.sidebarLink;
          var currentHash = document.location.hash;

          if (nextHash === currentHash) {
            $el.addClass('active');
          }

          $el.on('click', function() {
            $el.parents('#sidebar').find('.active').removeClass('active');
            $el.addClass('active');
            document.location.href = nextHash;
          });
        }
      };
    }
  );

  // ====== common functions ======
  function load(type, scope, tag, page, service) {
    if (type === 'dashboard') {
      scope.entriesData.loading = true;
    } else if (/list|check|later/.test(type)) {
      scope.loading = true;
    }

    var prev = tag ? service.load(tag, page) : service.load(page);
    prev.then(function(entriesData) {
      setEntries(type, scope, entriesData);
    }).finally(function() {
      if (type === 'dashboard') {
        scope.entriesData.loading = false;
      } else if (/list|check|later/.test(type)) {
        scope.loading = false;
      }
    });
  }
  function setEntries(type, scope, entriesData) {
    if (type === 'dashboard') {
      var limitCount      = scope.settings.dashboard_count;
      var filteredEntries = entriesData.entries.filter(function(entry) {
        return scope.settings.visible_marked === 1 || (!entry.checked && !entry.latered);
      });

      scope.entriesData.entries   = scope.entriesData.entries.concat(filteredEntries).slice(0, limitCount);
      scope.entriesData.completed = entriesData.completed;
      scope.entriesData.hasMore   = scope.settings.dashboard_count <= filteredEntries.length;
      return;
    }

    if (entriesData.completed) {
      scope.completed = true;
      return;
    }
    if (entriesData.sort === 'recent') {
      var lastEntry = scope.entries[scope.entries.length - 1];
      var prevDate  = lastEntry ? lastEntry.hotentry_date : '9999-99-99';
      angular.forEach(entriesData.entries, function (entry) {
        // マーク済みのエントリを表示しない場合は、未マークのエントリのみを対象とする
        if (scope.settings.visible_marked === 0 && (entry.checked || entry.latered)) {
          return;
        }
        if (prevDate > entry.hotentry_date) {
          entry.visibleDate = true;
        }
        prevDate = entry.hotentry_date;
      });
    }

    scope.entries = scope.entries.concat(entriesData.entries);
  }

  function getEntries(scope) {
    if (scope.viewName === 'dashboard') {
      // todo 全タグを横断するように要修正
      // var joinedEntries = [];
      // angular.forEach(scope.allEntriesDatas, function(entriesData) {
      //   joinedEntries = joinedEntries.concat(entriesData.entries);
      // });
      // return joinedEntries;
      return scope.entriesData.entries;
    } else {
      return scope.entries;
    }
  }
  function getOwnEntry(scope) {
    if (scope.viewName === 'dashboard') {
      return scope.entriesData.entries[scope.$index];
    } else {
      var entries = getEntries(scope);
      return entries[scope.$index];
    }
  }
})();
