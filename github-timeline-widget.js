function GitHubTimeline(options) {
    var username = options.username || "timeline",
        limit = options.limit || 5,
        header = options.header || "octocat",
        $this = options.id || 'github-timeline-widget',
        exclude = options.exclude || [],
        cb = options.callback || null;

    //Make JSONP Request for GitHub Timeline
    var jsonp = document.createElement('script');
    jsonp.src = 'https://github.com/' + username + '.json?callback=parseGitHubTimeline';
    //JSONP callbacks must be brought into global scope --- we will remove later
    if (typeof window.parseGitHubTimeline !== 'function') window.parseGitHubTimeline = parseGitHubTimeline;
    document.head.appendChild(jsonp);

    $this = document.getElementById($this); //$this refers to our target DIV

    //convert excludes to lowercase for case-insensitive comparison -- do this once instead of per event
    if (exclude.length > 0) for (var i = 0; i < exclude.length; i++) exclude[i] = exclude[i].toLowerCase();

    if (header) {
        var header_html = '<a class="github-timeline-header" href="' + "https://github.com/" + username + '">' + username + ' on GitHub <hr></a>';
        if (header === "octocat") header_html = '<span class="gh-header mega-icon mega-icon-octocat">' + header_html + '</span>';
        $this.innerHTML = header_html;
    }

    list = document.createElement('ul');
    list.className = "github-timeline-events";
    $this.appendChild(list);

    function parseTimelineEvents(events) {
        var event, icon_class, text, timestamp, timestamp_ago, url, innerHTML = [];

        for (var x = 0, event_len = events.length; x < event_len; x++) {
            if(limit-- === 0) break; //stop after event limit is reached

            //no checking 'event' for expected parameters, we only pass proper events
            event = events[x],
                url = event[0],
                icon_class = event[1].toLowerCase(),
                timestamp = event[2],
                text = event[3],
                timestamp_ago = formatAsTimeAgo(new Date() - timestamp, 'years', 'minutes', 1);

            innerHTML.push('<li class="github-timeline-event"><a href="' + url + '">'
                + '<span class="github-timeline-event-icon mini-icon mini-icon-' + icon_class + '">'
                + '</span></a><div class="github-timeline-event-text"><a href="' + url + '">' + text
                + '</strong></a><div class="github-timeline-event-time">' + timestamp_ago
                + '</div></div></li>');
        }

        list.innerHTML = innerHTML.join("\n");

        delete window.parseGitHubTimeline; //remove JSONP handler from global scope

        if (typeof cb === 'function') cb(); //invoke callback if specified
    }

    function formatAsTimeAgo(ms) {
        var tc = [3.15569e7, 2629741, 604800, 86400, 3600, 60, 1],
            td = ['year', 'month', 'week', 'day', 'hour', 'minute', 'second'],
            ti = {year: 0, month: 1, week: 2, day: 3, hour: 4, minute: 5, second: 6},
            // HACK: older browser support/performance hack - ti avoids use of Array.indexOf for
            // accepting shortest/longest args as strings
            base = 1000,
            time = ms / base,
            shortest = (arguments[2]) ? ti[arguments[2].replace(/s\b/gi, '')] : 6,
            longest = (arguments[1]) ? ti[arguments[1].replace(/s\b/gi, '')] : 0,
            limit = arguments[3] || shortest - longest;

        if (ms < base) return "Just now";

        var time_in_units = 0, ret_val = [], depth = 0;

        for (var x = longest; x <= shortest; x++) {
            time_in_units = Math.floor(time / tc[x]);
            if (time_in_units >= 1) {
                depth++;
                time = time - (time_in_units * tc[x]);
                if (depth === 1 && td[x] === 'day' && time_in_units === 1) return 'Yesterday';
                if (depth === 1 && td[x] === 'week' && time_in_units === 1) return 'Last week';
                if (depth === 1 && td[x] === 'month' && time_in_units === 1) return 'Last month';
                ret_val.push(time_in_units);
                ret_val.push(td[x] + ((ret_val[ret_val.length - 1] > 1) ? 's' : '') + ' ago');
            }
            if (depth === limit) break;
        }

        return ret_val.join(' ');
    }

    function parseGitHubEvent(event) {
        //check to see if event is malformed
        for (var x = 0, req = ['payload', 'type', 'created_at']; x < 3; x++) {
            if (!(req[x] in event) && event[req[x]] !== null) return [];
        }

        var branch, icon_class, repository, text,
            repository = ('repository' in event) ? event.repository.owner + "/" + event.repository.name : null,
            url = ('url' in event) ? event.url : ('url' in _ref) ? _ref.url : 'https://github.com/',
            timestamp = new Date(event.created_at),
            _ref = event.payload,
            event_type = event.type.replace('Event', '');

        url = url.replace("github.com//", "github.com/"); //fix broken URLs

        //et contains the icon classes and text for each event type. There are two types of events:
        //SIMPLE:
        // eventName : {t : ['event','text','as',array'], i: eventIconClass}
        //COMPLEX (events with CRUD):
        // eventName: {t: create : ['create','event',text'], update: ['update','event','text']}
        //=== Where: ===
        //t = text (required)and is required, i is optional
        //i = icon (optional)... if not specified the icon class is set to the event type
        //=== Note: ===
        //text is stored as an array to speed up substitutions and concatenation in generateText() [see below]
        var et =
        {
            Create: {
                t: {
                    repository: ['created repo', '$repo'],
                    tag: ['created tag', '$.ref', 'at', '$repo'],
                    branch: ['created branch', '$.ref', 'at', '$repo']
                }
            },

            ForkApply: {
                i: 'merge',
                t: ['merged to', '$repo']
            },

            Fork: {
                i: 'repo-forked',
                t: ['forked ', '$repo']
            },

            Watch: {
                i: {
                    started: 'watching',
                    stopped: 'unwatch'
                },
                t: {
                    started: ['started watching', '$repo'],
                    stopped: ['stopped watching', '$repo']
                }
            },

            PullRequest: {
                i: {
                    opened: 'issue-opened',
                    reopened: 'issue-reopened',
                    closed: 'issue-closed'
                },
                t: {
                    opened: ['opened issue on', '$repo'],
                    reopened: ['reopened issue on', '$repo'],
                    closed: ['closed issue on', '$repo']
                }
            },

            Gist: {
                i: {
                    update: 'gist-add',
                    fork: 'gist-forked',
                    create: 'gist'
                },
                t: {
                    create: ['created', '$.name'],
                    update: ['updated', '$.name'],
                    fork: ['forked', '$.name'
                    ]
                }
            },

            Gollum: {
                i: 'wiki',
                t: {
                    created: ['created a wiki page on', '$repo'],
                    edited: ['edited a wiki page on', '$repo']
                }
            },

            CommitComment: {
                i: 'commit-comment',
                t: ['commented on', '$repo']
            },

            Delete: {
                i: 'branch-delete',
                t: ['deleted branch', '$.ref', 'at', '$repo']
            },

            Public: {
                i: 'public-mirror',
                t: ['open sourced', '$repo']
            },

            IssueComment: {
                i: 'discussion',
                t: ['commented on an issue at', '$repo']
            },

            Member: {
                t: {
                    added: ['added$.member', 'to', '$repo']
                }
            },

            Push: {
                t: ['pushed to', '$branch', 'at', '$repo']
            },

            Follow: {
                t: ['started following', '$.target.login']
            }
        };

        //These events appear identically, don't duplicate data:
        et.Issues = et.PullRequest;
        et.Wiki = et.Gollum;

        //eti = icon; ett = text --- these default to the event_type unless otherwise specified

        if(!(event_type in et)) {
            // ignore events we can't parse
            return false;
         }

        var eti = et[event_type].i || event_type,
            ett = et[event_type].t || event_type;

        icon_class = (typeof eti === 'string') ? eti : eti[event.payload.action];

        function generateText(arr) {
            for (var x = 0; x < arr.length; x++) {
                if (arr[x].substr(0, 1) === '$') {
                    if (arr[x] === '$repo') {
                        arr[x] = repository;
                    } else if (arr[x].substring(0, 2) === '$.') {
                        var pv = arr[x].substring(2).split('.');
                        arr[x] = (pv.length === 1) ? event.payload[pv[0]] : event.payload[pv[0]][pv[1]];
                    } else if (arr[x] === '$branch') {
                        arr[x] = event.payload.ref.substr(event.payload.ref.lastIndexOf("/") + 1);
                    }
                    if (arr[x] === undefined) return null;
                    arr[x] = '<strong>' + arr[x] + '</strong>';
                }
            }
            return arr.join(' ');
        }

        if (typeof ett === 'object' && ett instanceof Array === false) {
            //the following payload properties are used to differentiate CRUD specifiers for different actions
            text = generateText(('ref_type' in _ref) ? ett[_ref.ref_type]
                : ('action' in _ref) ? ett[_ref.action]
                : ('action' in _ref.pages[0]) ? ett[_ref.pages[0].action]
                : null);
        } else {
            text = generateText(ett);
        }

        if (text && icon_class && timestamp && url) {
            //do not return events that contain any of the strings in the exclude array
            var exclude_len = exclude.length, ltext = text.toLowerCase();
            for (var z = 0; z < exclude_len; z++) {
                if (ltext.indexOf(exclude[z]) !== -1) return [];
            }
            return[url, icon_class, timestamp, text];
        } else {
            return [];
        }
    }

    function parseGitHubTimeline(data) {
        var event_data, events = [];
        for (var i = 0, event_len = data.length; i < event_len; i++) {
            event_data = parseGitHubEvent(data[i]);
            if (event_data.length) events.push(event_data)
        }
        parseTimelineEvents(events);
    }
}