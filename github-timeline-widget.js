function GitHubTimeline(options) {
    var defaults = {username:"timeline", limit:5, header:"octocat"},
        username = options.username || "timeline",
        limit = options.limit || 5,
        header = options.header || "octocat",
        $this = options.id || 'github-timeline-widget',
        exclude = options.exclude || [];

    var jsonp = document.createElement('script');
    jsonp.src = 'https://github.com/' + username + '.json?callback=parseGitHubTimeline';
    if (typeof window.parseGitHubTimeline !== 'function') window.parseGitHubTimeline = parseGitHubTimeline;
    document.head.appendChild(jsonp);

    $this = document.getElementById($this);

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

        main_loop:
        for (var x = 0, event_len = events.length; x < event_len; x++) {
            if (limit-- === 0) break main_loop;

            event = events[x],
            url = event[0],
            icon_class = event[1],
            timestamp = event[2],
            text = event[3],
            timestamp_ago = formatAsTimeAgo(new Date() - timestamp, 'years', 'minutes', 1);

            for (var y = 0; y < 4; y++) if (!event[0]) break main_loop;

            innerHTML.push('<li class="github-timeline-event"><a href="' + url
                + '"><span class="github-timeline-event-icon mini-icon mini-icon-' + icon_class
                + '"></span></a><div class="github-timeline-event-text"><a href="' + url + '">' + text
                + '</strong></a><div class="github-timeline-event-time">' + timestamp_ago
                + '</div></div></li>');
        }

        list.innerHTML = innerHTML.join("\n");
        delete window.parseGitHubTimeline;
        if (typeof options.cb === 'function') options.cb();
    }

    function formatAsTimeAgo(ms) {
        var tc = [3.15569e7, 2629741, 604800, 86400, 3600, 60, 1],
            td = ['year', 'month', 'week', 'day', 'hour', 'minute', 'second'],
            ti = {year:0, month:1, week:2, day:3, hour:4, minute:5, second:6};
        //ti avoids use of Array.indexOf for accepting shortest/longest args as strings
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
                ret_val.push(time_in_units);
                ret_val.push(td[x] + ((ret_val[ret_val.length - 1] > 1) ? 's' : '') + ' ago');
            }
            if (depth === limit) break;
        }

        return ret_val.join(' ');
    }

    function parseGitHubEvent(event) {
        var branch, icon_class, repository, text, timestamp, url, _ref;
        url = (event.url != null ? event.url : void 0) || (((_ref = event.payload) != null ? _ref.url : void 0) != null ? event.payload.url : void 0) || "https://github.com";
        url = url.replace("github.com//", "github.com/");
        timestamp = new Date((event.created_at != null ? event.created_at : void 0) || 0).valueOf();
        if (event.repository != null) {
            repository = event.repository.owner + "/" + event.repository.name;
        }

        var event_type = event.type.replace('Event', '');

        var et = {
            Create:{t:{repository:['created repo', '$repo'], tag:['created tag', '$.ref', 'at', '$repo'], branch:['created branch', '$.ref', 'at', '$repo']}},
            ForkApply:{i:'merge', t:['merged to', '$repo']},
            Fork:{i:'repo-forked', t:['forked ', '$repo']},
            Watch:{i:{started:'watching', stopped:'unwatch'}, t:{ started:['started watching', '$repo'], stopped:['stopped watching', '$repo']}},
            PullRequest:{i:{opened:'issue-opened', reopened:'issue-reopened', closed:'issue-closed'}, t:{opened:['opened issue on', '$repo'], reopened:['reopened issue on', '$repo'], closed:['closed issue on', '$repo']}},
            Gist:{i:{update:'gist-add', fork:'gist-forked', create:'gist'}, t:{create:['created', '$.name'], update:['updated', '$.name'], fork:['forked', '$.name']}},
            Gollum:{i:'wiki', t:{created:['created a wiki page on', '$repo'], edited:['edited a wiki page on', '$repo']}},
            CommitComment:{i:'commit-comment', t:['commented on', '$repo']},
            Delete:{i:'branch-delete', t:['deleted branch', '$.ref', 'at', '$repo']},
            Public:{i:'public-mirror', t:['open sourced', '$repo']},
            IssueComment:{i:'discussion', t:['commented on an issue at', '$repo']},
            Member:{t:{added:['added' + '$.member', 'to', '$repo']}},
            Push:{t:['pushed to', '$branch', 'at', '$repo'] },
            Follow:{t:['started following', '$.target.login']}
        };

        et.Issues = et.PullRequest;
        et.Wiki = et.Gollum;

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
            text = generateText(ett[event.payload.ref_type] || ett[event.payload.action] || ett[event.payload.pages[0].action]);
        } else {
            text = generateText(ett);
        }

        if (text != null) {
            for (var z = 0, exclude_len = exclude.length; z < exclude_len; z++) if (text.indexOf(exclude[z]) !== -1) return [];
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