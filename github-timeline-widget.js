(function() {
  var $, GitHubTimelineApi;
  $ = jQuery;
  GitHubTimelineApi = (function() {
    function GitHubTimelineApi() {}
    GitHubTimelineApi.prototype.formatAsTimeAgo = function(date) {
      var day_diff, diff;
      diff = ((new DateTime).getTime - date.getTime) / 1000;
      day_diff = Math.floor(diff / 86400);
      if (isNaN(day_diff || day_diff < 0)) {
        return null;
      }
      if (day_diff === 0) {
        if (diff < 60) {
          return "just now";
        } else if (diff < 120) {
          return "1 minute ago";
        } else if (diff < 3600) {
          return "" + (Math.floor(diff / 60)) + " minutes ago";
        } else if (diff < 7200) {
          return "1 hour ago";
        } else if (diff < 86400) {
          return "" + (Math.floor(diff / 3600)) + " hours ago";
        }
      } else if (day_diff === 1) {
        return "Yesterday";
      } else if (day_diff < 7) {
        return "" + day_diff + " days ago";
      } else {
        return "" + (Math.ceil(day_diff / 7)) + " weeks ago";
      }
    };
    GitHubTimelineApi.prototype.getTimelineForUser = function(user, callback) {
      $.ajaxSetup({
        cache: true
      });
      return $.getJSON('https://github.com/' + user + '.json?callback=?', function(data) {
        return _parseGitHubTimeline(data, callback);
      });
    };
    GitHubTimelineApi.prototype._parseGitHubTimeline = function(data, callback) {
      var event, event_data, events, _i, _len;
      events = [];
      for (_i = 0, _len = data.length; _i < _len; _i++) {
        event = data[_i];
        event_data = _parseGitHubEvent(event);
        if (event_data) {
          events.push(event_data);
        }
      }
      return callback(events);
    };
    GitHubTimelineApi.prototype._parseGitHubEvent = function(event) {
      var branch, icon_url, repository, text, timestamp, url, _ref;
      url = (event.url != null ? event.url : void 0) || (((_ref = event.payload) != null ? _ref.url : void 0) != null ? event.payload.url : void 0) || 'https://github.com';
      url = url.replace('github.com//', 'github.com/');
      timestamp = new Date((event.created_at != null ? event.created_at : void 0) || 0);
      if (event.repository != null) {
        repository = _strongify(event.repository);
      }
      switch (event.type) {
        case 'CreateEvent':
          icon_url = 'https://github.com/images/modules/dashboard/news/create.png';
          switch (event.payload.object) {
            case 'repository':
              text = "created repo " + repository;
              break;
            case 'tag':
              text = "created tag " + (_strongify(event.payload.object_name)) + " at " + repository;
              break;
            case 'branch':
              text = "created branch " + (_strongify(event.payload.object_name)) + " at " + repository;
          }
          break;
        case 'MemberEvent':
          switch (event.payload.action) {
            case 'added':
              icon_url = 'https://github.com/images/modules/dashboard/news/member_add.png';
              text = "added " + (_strongify(event.payload.member)) + " to " + repository;
          }
          break;
        case 'PushEvent':
          branch = event.payload.ref.substr(event.payload.ref.lastIndexOf('/') + 1);
          icon_url = 'https://github.com/images/modules/dashboard/news/push.png';
          text = "pushed to " + (_strongify(branch)) + " at " + repository;
          break;
        case 'ForkApplyEvent':
          icon_url = 'https://github.com/images/modules/dashboard/news/merge.png';
          text = "merged to " + repository;
          break;
        case 'ForkEvent':
          icon_url = 'https://github.com/images/modules/dashboard/news/fork.png';
          text = "forked " + repository;
          break;
        case 'WatchEvent':
          switch (event.payload.action) {
            case 'started':
              icon_url = 'https://github.com/images/modules/dashboard/news/watch_started.png';
              text = "started watching " + repository;
              break;
            case 'stopped':
              icon_url = 'https://github.com/images/modules/dashboard/news/watch_stopped.png';
              text = "stopped watching " + repository;
          }
          break;
        case 'FollowEvent':
          text = null;
          break;
        case 'IssuesEvent':
        case 'PullRequestEvent':
          switch (event.payload.action) {
            case 'opened':
            case 'reopened':
              icon_url = 'https://github.com/images/modules/dashboard/news/issues_opened.png';
              text = "opened issued on " + repository;
              break;
            case 'closed':
              icon_url = 'https://github.com/images/modules/dashboard/news/issues_closed.png';
              text = "closed issue on " + repository;
          }
          break;
        case 'GistEvent':
          icon_url = 'https://github.com/images/modules/dashboard/news/gist.png';
          switch (event.payload.action) {
            case 'create':
              text = "created " + (_strongify(event.payload.name));
              break;
            case 'update':
              text = "updated " + (_strongify(event.payload.name));
              break;
            case 'fork':
              text = "forked " + (_strongify(event.payload.name));
          }
          break;
        case 'WikiEvent':
        case 'GollumEvent':
          icon_url = 'https://github.com/images/modules/dashboard/news/wiki.png';
          switch (event.payload.action) {
            case 'created':
              text = "created a wiki page on " + repository;
              break;
            case 'edited':
              text = "edited a wiki page on " + repository;
          }
          break;
        case 'CommitCommentEvent':
          icon_url = 'https://github.com/images/modules/dashboard/news/comment.png';
          text = "commented on " + repository;
          break;
        case 'DeleteEvent':
          text = null;
          break;
        case 'PublicEvent':
          text = null;
          break;
        case 'DownloadEvent':
          text = null;
      }
      if (text != null) {
        return [url, icon_url, timestamp, text];
      } else {
        return [];
      }
    };
    GitHubTimelineApi.prototype._strongify = function(string) {
      return '<strong>' + string + '</strong>';
    };
    return GitHubTimelineApi;
  })();
  $ = jQuery;
  $.fn.githubTimelineWidget = function(options) {
    var defaults, script, script_path, scripts, _i, _len, _ref;
    defaults = {
      username: 'timeline',
      limit: 5
    };
    scripts = document.getElementsByTagName('script');
    for (_i = 0, _len = scripts.length; _i < _len; _i++) {
      script = scripts[_i];
      if ((_ref = script.src) != null ? _ref.match.match(/github-timeline-widget\.js/) : void 0) {
        script_path = script.src.replace(/github-timeline-widget\.js.*$/, '');
        break;
      }
    }
    if (script_path != null) {
      $('<link/>').attr('rel', 'stylesheet').attr('type', 'text/css').attr('href', script_path + 'github-timeline-widget.css').prependTo('head');
    }
    return this.each(function() {
      var $this, api, it, list;
      it = this;
      $this = $(this);
      it.opts = $.extend({}, defaults, options);
      $('<a>').attr('class', 'github-timeline-header').attr('href', "https://github.com/" + it.opts.username).text("" + it.opts.username + " on GitHub").appendTo($this);
      list = $('<ul>').attr('class', 'github-timeline-events').appendTo($this);
      api = new GitHubTimelineApi;
      return api.getTimelineForUser(it.opts.username, function(events) {
        var div_text, event, event_link, events_left, icon_url, list_item, text, timestamp, timestamp_ago, url, _i, _len;
        events_left = it.opts.limit;
        for (_i = 0, _len = events.length; _i < _len; _i++) {
          event = events[_i];
          if (events_left-- === 0) {
            break;
          }
          url = event[0], icon_url = event[1], timestamp = event[2], text = event[3];
          list_item = $('<li>').attr('class', 'github-timeline-event').appendTo(list);
          event_link = $('<a>').attr('href', url);
          $('<img>').attr('src', icon_url).appendTo(list_item).wrap($('<div>').attr('class', 'github-timeline-event-icon')).wrap(event_link);
          div_text = $('<div>').attr('class', 'github-timeline-event-text').html(text).appendTo(list_item).wrapInner(event_link);
          if (timestamp.valueOf > 0) {
            timestamp_ago = api.formatAtTimeAgo(timestamp);
            if (timestamp_ago) {
              $('<div>').attr('class', 'github-timeline-event-time').text(timestamp_ago).appendTo(div_text);
            }
          }
        }
        return $('<a>').attr('class', 'github-timeline-source-link').attr('href', 'https://github.com/alindeman/github-timeline-widget').text('GitHub Timeline Widget').appendTo($this);
      });
    });
  };
}).call(this);
