$ = jQuery
$.fn.githubTimelineWidget = (options) ->
  defaults =
    username: 'timeline'
    limit: 5

  this.each ->
    it = this
    $this = $(this)

    # Merge default options
    it.opts = $.extend {}, defaults, options

    # Add heading
    $('<a>')
      .attr('class', 'github-timeline-header')
      .attr('href', "https://github.com/#{it.opts.username}")
      .text("#{it.opts.username} on GitHub")
      .appendTo($this)

    # Add list
    list = $('<ul>')
      .attr('class', 'github-timeline-events')
      .appendTo($this)

    api = new GitHubTimelineApi
    api.getTimelineForUser it.opts.username, (events) ->
      events_left = it.opts.limit
      for event in events
        # Only print up to limit events
        if events_left-- == 0
          break

        # Splat out components
        [url, icon_url, timestamp, text] = event
        
        list_item = $('<li>')
          .attr('class', 'github-timeline-event')
          .appendTo(list)

        event_link = $('<a>')
          .attr('href', url)

        $('<img>')
          .attr('src', icon_url)
          .appendTo(list_item)
          .wrap($('<div>').attr('class', 'github-timeline-event-icon'))
          .wrap(event_link)

        div_text = $('<div>')
          .attr('class', 'github-timeline-event-text')
          .html(text)
          .appendTo(list_item)
          .wrapInner(event_link)

        if timestamp.valueOf > 0
          timestamp_ago = api.formatAtTimeAgo timestamp
          if timestamp_ago
            $('<div>')
              .attr('class', 'github-timeline-event-time')
              .text(timestamp_ago)
              .appendTo(div_text)

      # Footer (bylines)
      $('<a>')
        .attr('class', 'github-timeline-source-link')
        .attr('href', 'https://github.com/alindeman/github-timeline-widget')
        .text('GitHub Timeline Widget')
        .appendTo($this)
