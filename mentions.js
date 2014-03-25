// Generated by CoffeeScript 1.7.1
(function() {
  var $, plugins, root, utils, _ref, _ref1;

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  $ = root.jQuery;

  utils = root.RedactorUtils = (_ref = root.RedactorUtils) != null ? _ref : {};

  plugins = root.RedactorPlugins = (_ref1 = root.RedactorPlugins) != null ? _ref1 : {};

  $.extend(utils, (function() {
    return {
      getCursorInfo: function() {
        var container, offset, range, selection;
        selection = window.getSelection();
        range = selection.getRangeAt(0);
        offset = range.startOffset;
        container = range.startContainer;
        return {
          selection: selection,
          range: range,
          offset: offset,
          container: container
        };
      },
      any: function(arr) {
        var element, _i, _len;
        for (_i = 0, _len = arr.length; _i < _len; _i++) {
          element = arr[_i];
          if (element) {
            return true;
          }
        }
        return false;
      }
    };
  })());

  $.extend(plugins, (function() {
    var update_select;
    update_select = function() {
      if (this.cursorInMention()) {
        this.filterUsers();
        return this.$userSelect.show();
      } else {
        return this.$userSelect.hide();
      }
    };
    return {
      mentions: {
        init: function() {
          this.users = null;
          this.select_state = null;
          this.selected = null;
          this.$userSelect = null;
          this.validateOptions();
          this.loadUsers();
          this.setupUserSelect();
          this.$editor.keydown($.proxy(this.editorKeydown, this));
          return this.$editor.mousedown($.proxy(this.editorMousedown, this));
        },
        validateOptions: function() {
          var name, required, _i, _len, _results;
          required = ["usersUrl", "maxUsers"];
          _results = [];
          for (_i = 0, _len = required.length; _i < _len; _i++) {
            name = required[_i];
            if (!this.opts[name]) {
              throw "Mention plugin requires option: " + name;
            } else {
              _results.push(void 0);
            }
          }
          return _results;
        },
        loadUsers: function() {
          var that;
          that = this;
          this.users = [];
          return $.getJSON(this.opts.usersUrl, function(data) {
            var user, _i, _len, _ref2, _results;
            that.users = data;
            _ref2 = that.users;
            _results = [];
            for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
              user = _ref2[_i];
              user.$element = $('<li class="user">\n    <img src="#{ user.icon }" />#{ user.username }  (#{ user.name })\n</li>');
              _results.push(user.$element.data('username', user.username));
            }
            return _results;
          });
        },
        setupUserSelect: function() {
          this.select_state = false;
          this.$userSelect = $('<ol class="redactor_ user_select"></ol>');
          this.$userSelect.mousemove($.proxy(this.selectMousemove, this));
          this.$userSelect.mousedown($.proxy(this.selectMousedown, this));
          this.$userSelect.hide();
          return this.$editor.after(this.$userSelect);
        },
        selectMousemove: function(e) {
          var $target;
          $target = $(e.target);
          if ($target.hasClass('user')) {
            this.selected = this.$userSelect.children().index($target);
            return this.paintSelected();
          }
        },
        selectMousedown: function(e) {
          if (this.select_state) {
            e.preventDefault();
            this.chooseUser();
            this.closeMention();
            this.setCursorAfterMention();
            return this.disableSelect();
          }
        },
        editorKeydown: function(e) {
          var tabFocus, that;
          that = this;
          if (this.cursorInMention()) {
            switch (e.keyCode) {
              case 27:
              case 32:
                this.closeMention();
                this.disableSelect();
                break;
              case 9:
              case 13:
                e.preventDefault();
                tabFocus = this.opts.tabFocus;
                this.opts.tabFocus = false;
                this.chooseUser();
                this.closeMention();
                this.setCursorAfterMention();
                this.disableSelect();
                setTimeout(function() {
                  return that.opts.tabFocus = tabFocus;
                }, 0);
                break;
              case 38:
                e.preventDefault();
                this.moveSelectUp();
                break;
              case 40:
                e.preventDefault();
                this.moveSelectDown();
            }
          } else if (this.cursorAfterMentionStart()) {
            this.createMention();
            this.enableSelect();
          }
          return setTimeout($.proxy(update_select, this), 0);
        },
        editorMousedown: function() {
          return setTimeout($.proxy(update_select, this), 0);
        },
        moveSelectUp: function() {
          if (this.selected > 0) {
            this.selected -= 1;
          }
          return this.paintSelected();
        },
        moveSelectDown: function() {
          if (this.selected < this.$userSelect.children().length - 1) {
            this.selected += 1;
          }
          return this.paintSelected();
        },
        enableSelect: function() {
          var i, _i, _ref2;
          this.select_state = true;
          this.selected = 0;
          for (i = _i = 0, _ref2 = this.opts.maxUsers; 0 <= _ref2 ? _i < _ref2 : _i > _ref2; i = 0 <= _ref2 ? ++_i : --_i) {
            this.$userSelect.append(this.users[i].$element);
          }
          this.paintSelected();
          return this.$userSelect.show();
        },
        disableSelect: function() {
          this.select_state = false;
          this.selected = null;
          this.$userSelect.children().detach();
          return this.$userSelect.hide();
        },
        paintSelected: function() {
          var $elements;
          $elements = $('li', this.$userSelect);
          $elements.removeClass('selected');
          return $elements.eq(this.selected).addClass('selected');
        },
        chooseUser: function() {
          var mention, username;
          username = this.$userSelect.children().eq(this.selected).data('username');
          mention = this.getCurrentMention();
          mention.attr("href", "/user/{# username }");
          return mention.text("@{# username }");
        },
        filterUsers: function() {
          var filter_string, i, user, _i, _len, _ref2;
          this.$userSelect.children().detach();
          filter_string = this.getFilterString();
          _ref2 = this.users;
          for (i = _i = 0, _len = _ref2.length; _i < _len; i = ++_i) {
            user = _ref2[i];
            if (i >= this.opts.maxUsers) {
              break;
            }
            if (this.filterTest(user, filter_string)) {
              this.$userSelect.append(user.$element);
            }
          }
          return this.paintSelected();
        },
        filterTest: function(user, filter_string) {
          var test_strings;
          filter_string = filter_string.toLowerCase();
          test_strings = [user.username.toLowerCase(), user.name.toLowerCase()];
          return utils.any(test_strings.map(function(el) {
            return el.indexOf(filter_string) !== -1;
          }));
        },
        getFilterString: function() {
          var filter_str, mention;
          mention = this.getCurrentMention();
          filter_str = mention.text();
          filter_str = filter_str.slice(1);
          return filter_str.replace(/\u200B/g, '');
        },
        createMention: function() {
          var cursor_info, left, mention, new_range, right;
          cursor_info = utils.getCursorInfo();
          mention = $('<a href="#" class="mention">@\u200b</a>');
          mention.click(function(e) {
            return e.preventDefault();
          });
          left = cursor_info.container.data.slice(0, cursor_info.offset);
          right = cursor_info.container.data.slice(cursor_info.offset);
          left = left.slice(0, -1);
          cursor_info.container.data = left;
          mention.insertAfter(cursor_info.container);
          mention.after(right);
          new_range = document.createRange();
          new_range.setStart(mention[0].firstChild, 1);
          new_range.setEnd(mention[0].firstChild, 1);
          cursor_info.selection.removeAllRanges();
          return cursor_info.selection.addRange(new_range);
        },
        closeMention: function() {
          var mention;
          mention = this.getCurrentMention();
          return mention.attr("contenteditable", "false");
        },
        getCurrentMention: function() {
          var current, parents;
          current = $(this.getCurrent());
          if (current.hasClass('mention')) {
            return current;
          }
          parents = current.parents('.mention');
          if (parents.length > 0) {
            return parents.eq(0);
          }
          return false;
        },
        cursorInMention: function() {
          return this.getCurrentMention().length > 0;
        },
        cursorAfterMentionStart: function() {
          var cursor_info, left, matches, previous_chars;
          matches = ["@", " @", "\u200b@", "@\u200B"];
          cursor_info = utils.getCursorInfo();
          if (cursor_info.container.nodeName !== "#text") {
            return false;
          }
          left = cursor_info.container.data.slice(0, cursor_info.offset);
          previous_chars = left.slice(-2);
          return utils.any(matches.map(function(el) {
            return el === previous_chars;
          }));
        },
        setCursorAfterMention: function() {
          var mention, new_range, selection;
          mention = this.getCurrentMention();
          mention.after(" ");
          selection = window.getSelection();
          new_range = document.createRange();
          new_range.setStart(mention[0].nextSibling, 1);
          new_range.setEnd(mention[0].nextSibling, 1);
          selection.removeAllRanges();
          return selection.addRange(new_range);
        }
      }
    };
  })());

}).call(this);
