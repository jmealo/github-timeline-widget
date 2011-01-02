$ = jQuery
class GitHubTimelineApi
  # Adds <strong> tags around a string
  _strongify: (string) ->
    '<strong>' + string + '</strong>'
  
  # Converts the date into a human readable "time ago" form
  # e.g., "just now" or "Yesterday"
  formatAsTimeAgo: (date) ->
    diff = ((new DateTime).getTime - date.getTime) / 1000
    day_diff = Math.floor diff / 86400

    if isNaN day_diff || day_diff < 0
      return null
    
    if day_diff == 0
      if diff < 60
        "just now"
      else if diff < 120
        "1 minute ago"
      else if diff < 3600
        "#{Math.floor diff/60} minutes ago"
      else if diff < 7200
        "1 hour ago"
      else if diff < 86400
        "#{Math.floor diff/3600} hours ago"
    else if day_diff == 1
      "Yesterday"
    else if day_diff < 7
      "#{day_diff} days ago"
    else
      "#{Math.ceil day_diff/7} weeks ago"

  # Parses an individual GitHub timeline event into an array with structure:
  # [url, icon_url, timestamp, text]
  # Returns an empty array if the event cannot be parsed.
  _parseGitHubEvent: (event) ->
    # URL could be event.url or event.payload.url
    url = (event.url if event.url?) || (event.payload.url if event.payload?.url?) || 'https://github.com'

    # URL sometimes comes back like https://github.com//foo which is invalid
    url = url.replace 'github.com//', 'github.com/'

    # Timestamp, if it exists, is event.created_at
    timestamp = new Date (event.created_at if event.created_at?) || 0

    # Pull out repository if it exists
    repository = this._strongify event.repository if event.repository?

    # Based on event type, set icon_url and text
    switch event.type
      when 'CreateEvent'
        icon_url = 'https://github.com/images/modules/dashboard/news/create.png'
        switch event.payload.object
          when 'repository'
            text = "created repo #{repository}"
          when 'tag'
            text = "created tag #{this._strongify event.payload.object_name} at #{repository}"
          when 'branch'
            text = "created branch #{this._strongify event.payload.object_name} at #{repository}"
      when 'MemberEvent'
        switch event.payload.action
          when 'added'
            icon_url = 'https://github.com/images/modules/dashboard/news/member_add.png'
            text = "added #{this._strongify event.payload.member} to #{repository}"
          # TODO: There are likely more types 
      when 'PushEvent'
        branch = event.payload.ref.substr event.payload.ref.lastIndexOf('/')+1
        icon_url = 'https://github.com/images/modules/dashboard/news/push.png'
        text = "pushed to #{this._strongify branch} at #{repository}"
      when 'ForkApplyEvent'
        icon_url = 'https://github.com/images/modules/dashboard/news/merge.png'
        text = "merged to #{repository}"
      when 'ForkEvent'
        icon_url = 'https://github.com/images/modules/dashboard/news/fork.png'
        text = "forked #{repository}"
      when 'WatchEvent'
        switch event.payload.action
          when 'started'
            icon_url = 'https://github.com/images/modules/dashboard/news/watch_started.png'
            text = "started watching #{repository}"
          when 'stopped'
            icon_url = 'https://github.com/images/modules/dashboard/news/watch_stopped.png'
            text = "stopped watching #{repository}"
      when 'FollowEvent'
        # TODO: At this point, it doesn't seem like there is enough information
        # in the API to handle this event (i.e., the username of the followee)
        text = null
      when 'IssuesEvent', 'PullRequestEvent'
        switch event.payload.action
          when 'opened', 'reopened'
            icon_url = 'https://github.com/images/modules/dashboard/news/issues_opened.png'
            text = "opened issued on #{repository}"
          when 'closed'
            icon_url = 'https://github.com/images/modules/dashboard/news/issues_closed.png'
            text = "closed issue on #{repository}"
      when 'GistEvent'
        icon_url = 'https://github.com/images/modules/dashboard/news/gist.png'
        switch event.payload.action
          when 'create'
            text = "created #{this._strongify event.payload.name}"
          when 'update'
            text = "updated #{this._strongify event.payload.name}"
          when 'fork'
            text = "forked #{this._strongify event.payload.name}"
      when 'WikiEvent', 'GollumEvent'
        icon_url = 'https://github.com/images/modules/dashboard/news/wiki.png'
        switch event.payload.action
          when 'created'
            text = "created a wiki page on #{repository}"
          when 'edited'
            text = "edited a wiki page on #{repository}"
      when 'CommitCommentEvent'
        icon_url = 'https://github.com/images/modules/dashboard/news/comment.png'
        text = "commented on #{repository}"
      when 'DeleteEvent'
        # TODO: What is this?
        text = null
      when 'PublicEvent'
        # TODO: What is this?
        text = null
      when 'DownloadEvent'
        # TODO: What is this?
        text = null

    if text?
      [url, icon_url, timestamp, text]
    else
      []
  
  # Parses the JSON data that is returned from the GitHub timeline API
  # Calls the callback function passing an array with structure:
  # [ [url_0, icon_url_0, timestamp_0, text_0], ..., [url_n, icon_url_n, timestamp_n, text_n] ]
  _parseGitHubTimeline: (data, callback) ->
    events = []
    for event in data
      event_data = this._parseGitHubEvent event
      if event_data
        events.push event_data
    
    callback events
  
  # Fetches the GitHub timeline for the specified user
  # Calls the callback function passing an array with structure:
  # [ [url_0, icon_url_0, timestamp_0, text_0], ..., [url_n, icon_url_n, timestamp_n, text_n] ]
  getTimelineForUser: (user, callback) ->
    $.ajaxSetup { cache: true }
    $.getJSON 'https://github.com/' + user + '.json?callback=?', (data) => this._parseGitHubTimeline(data, callback)
