(function( $ ){
  function githubTimelineWidgetStrongify(text) {
    return '<strong>' + text + '</strong>';
  }

  function githubTimelineWidgetAppendEvent(event, list) {
    event_url = '';
    if ('url' in event) {
      event_url = event['url'];
    } else if ('payload' in event && 'url' in event['payload']) {
      event_url = event['payload']['url'];
    } else {
      return; // bomb out: nothing to link to
    }

    // FIX for GitHub URL bug?
    // Replace more than one forward slash with just one forward slash
    event_url = event_url.replace('github.com//', 'github.com/');

    repository_strongified = '';
    if ('repository' in event) {
      repository_strongified = githubTimelineWidgetStrongify(event['repository']['owner'] + '/' + event['repository']['name']);
    }

    image_url = '';
    text = '';
    switch(event['type']) {
    case 'CreateEvent':
      image_url = 'https://github.com/images/modules/dashboard/news/create.png';

      switch(event['payload']['object']) {
      case 'repository':
        text = 'created repo ' + repository_strongified;
        break;
      case 'tag':
        text = 'created tag ' + githubTimelineWidgetStrongify(event['payload']['object_name']) + ' at ' + repository_strongified;
        break;
      case 'branch':
        text = 'created branch ' + githubTimelineWidgetStrongify(event['payload']['object_name']) + ' at ' + repository_strongified;
        break;
      }

      break;
    case 'MemberEvent':
      switch(event['payload']['action']) {
      case 'added':
        image_url = 'https://github.com/images/modules/dashboard/news/member_add.png';
        text = 'added ' + githubTimelineWidgetStrongify(event['payload']['member']) + ' to ' + repository_strongified;
        break;
      }

      break;
    case 'PushEvent':
      image_url = 'https://github.com/images/modules/dashboard/news/push.png';
      text = 'pushed to ' + githubTimelineWidgetStrongify(event['payload']['ref'].substr(event['payload']['ref'].lastIndexOf('/') + 1)) + ' at ' + repository_strongified;
      break;
    case 'ForkApplyEvent':
      image_url = 'https://github.com/images/modules/dashboard/news/merge.png';
      text = 'merged to ' + repository_strongified;
      break;
    case 'ForkEvent':
      image_url = 'https://github.com/images/modules/dashboard/news/fork.png';
      text = 'forked ' + repository_strongified;
      break;
    case 'WatchEvent':
      switch(event['payload']['action']) {
      case 'started':
        image_url = 'https://github.com/images/modules/dashboard/news/watch_started.png';
        text = 'started watching ' + repository_strongified;
        break;
      case 'stopped':
        image_url = 'https://github.com/images/modules/dashboard/news/watch_stopped.png';
        text = 'stopped watching ' + repository_strongified;
        break;
      }

      break;
    case 'FollowEvent':
      // Not implemented b/c there is not enough useful information from the API (e.g., what user is being followed)
      break;
    case 'IssuesEvent':
    case 'PullRequestEvent':
      switch(event['payload']['action']) {
      case 'opened':
      case 'reopened':
        image_url = 'https://github.com/images/modules/dashboard/news/issues_opened.png';
        text = 'opened issue on ' + repository_strongified;
        break;
      case 'closed':
        image_url = 'https://github.com/images/modules/dashboard/news/issues_closed.png';
        text = 'closed issue on ' + repository_strongified;
        break;
      }

      break;
    case 'GistEvent':
      image_url = 'https://github.com/images/modules/dashboard/news/gist.png';
      
      switch(event['payload']['action']) {
      case 'create':
        text = 'created ' + githubTimelineWidgetStrongify(event['payload']['name']);
        break;
      case 'update':
        text = 'updated ' + githubTimelineWidgetStrongify(event['payload']['name']);
        break;
      case 'fork':
        text = 'forked ' + githubTimelineWidgetStrongify(event['payload']['name']);
        break;
      }

      break;
    case 'WikiEvent':
    case 'GollumEvent': // Gollum is the Github wiki system
      image_url = 'https://github.com/images/modules/dashboard/news/wiki.png';

      switch (event['payload']['action']) {
      case 'created':
        text = 'created a page in the ' + repository_strongified + ' wiki';
        break;
      case 'edited':
        text = 'edited a page in the ' + repository_strongified + ' wiki';
        break;
      }

      break;
    case 'CommitCommentEvent':
      image_url = 'https://github.com/images/modules/dashboard/news/comment.png';
      text = 'commented on ' + repository_strongified;
      break;
    case 'DeleteEvent':
      // TODO
      break;
    case 'PublicEvent':
      // TODO: Not sure what this event means
      break;
    case 'DownloadEvent':
      // TODO: Not sure what this event means
      break;
    }

    if (text != '') {
      list_item = $('<li>')
        .attr('class', 'github-timeline-event')
        .appendTo(list);

      link_item = $('<a>')
        .attr('class', 'github-timeline-event-link')
        .attr('href', event_url)
        .appendTo(list_item);

      $('<img/>')
        .attr('class', 'github-timeline-event-icon')
        .attr('src', image_url)
        .appendTo(link_item);
      $('<span>')
        .attr('class', 'github-timeline-event-text')
        .html(text)
        .appendTo(link_item);
    }
  }

  $.fn.githubTimelineWidget = function(options) {
    var defaults = {
      'username': 'timeline',
      'limit': 5
    };

    return this.each(function() {
      var it = this, $this = $(this);
      it.opts = $.extend({}, defaults, options);

      // https://github.com/{username}.json
      $.ajaxSetup({cache: true});
      $.getJSON('https://github.com/' + it.opts.username + '.json?callback=?', function(data) {
        list = $('<ul>')
          .attr('class', 'github-timeline-events')
          .appendTo($this);

        i = 0;
        for (index in data) {
          githubTimelineWidgetAppendEvent(data[index], list);

          i++;
          if (it.opts.limit > 0 && i >= it.opts.limit) {
            break;
          }
        }
      });
    });
  };
})( jQuery );
