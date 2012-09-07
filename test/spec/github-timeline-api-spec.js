describe('GitHubTimelineApi', function() {
  // GitHubTimelineApi instance (class under test)
  var api;

  // Response sent by mock $.getJSON call
  var jsonResponse = [];

  // Unix time at the start of the current test
  var unixTimeNow;

  // Setup mock objects
  beforeEach(function() {
    JQueryMock.prototype.ajaxSetup = function(opts) {
    }
    JQueryMock.prototype.getJSON = function(url, callback) {
      callback(jsonResponse);
    };

    spyOn(jQuery, 'ajaxSetup');
    spyOn(jQuery, 'getJSON').andCallThrough();

    api = new GitHubTimelineApi();

    unixTimeNow = new Date().valueOf();
    jsonResponse = [];
  });

  describe("getUserIdForUser", function() {
    beforeEach(function() {
      jsonResponse = {"user":
        {"gravatar_id":"3da9aebb918d0d1b12d66fcca93c289d",
         "company":"Highgroove Studios",
         "name":"Andy Lindeman",
         "created_at":"2010/09/11 07:25:10 -0700",
         "location":"Atlanta, GA",
         "public_repo_count":20,
         "public_gist_count":25,
         "blog":"http://www.andylindeman.com/",
         "following_count":11,
         "id":395621,
         "type":"User",
         "permission":null,
         "followers_count":17,
         "login":"alindeman",
         "email":null}};
    });

    it("should make an AJAX request for the correct URL", function() {
      api.getUserIdForUser('alindeman', function(id) { });

      expect(jQuery.ajaxSetup).toHaveBeenCalledWith({cache: true});
      expect(jQuery.getJSON.mostRecentCall.args[0]).toEqual('https://github.com/api/v2/json/user/show/alindeman?callback=?');
    });

    it("should call the callback function", function() {
      callbackSpy = jasmine.createSpy();
      api.getUserIdForUser('alindeman', callbackSpy);

      expect(callbackSpy).toHaveBeenCalledWith(395621);
    });
  });

  describe("getTimelineForUser", function() {
    it("should make an AJAX request for the correct URL", function() {
      api.getTimelineForUser('alindeman', function(events) { });

      expect(jQuery.ajaxSetup).toHaveBeenCalledWith({cache: true});
      expect(jQuery.getJSON.mostRecentCall.args[0]).toEqual('https://github.com/alindeman.json?callback=?');
    });

    it("should call the callback function", function() {
      callbackSpy = jasmine.createSpy();
      api.getTimelineForUser('alindeman', callbackSpy);

      expect(callbackSpy).toHaveBeenCalled();
    });

    describe("CreateEvent", function() {
      it("parses a repository create event", function() {
        timestamp = truncateTimeToSecond(new Date(unixTimeNow - 30));
        jsonResponse.push({url: 'https://github.com/foo/bar',
          created_at: timestamp.toString(),
          repository: {owner: 'alindeman', name: 'github-timeline-widget'},
          type: 'CreateEvent',
          payload: {object: 'repository'}});

        callbackSpy = jasmine.createSpy();
        api.getTimelineForUser('alindeman', callbackSpy);

        expect(callbackSpy).toHaveBeenCalledWith(
          [['https://github.com/foo/bar',
            'https://github.com/images/modules/dashboard/news/create.png',
            timestamp.valueOf(),
            'created repo <strong>alindeman/github-timeline-widget</strong>']]);
      });
      
      it("parses a tag create event", function() {
        timestamp = truncateTimeToSecond(new Date(unixTimeNow - 30));
        jsonResponse.push({url: 'https://github.com/foo/bar',
          created_at: timestamp.toString(),
          repository: {owner: 'alindeman', name: 'github-timeline-widget'},
          type: 'CreateEvent',
          payload: {object: 'tag', object_name: 'v1.0'}});

        callbackSpy = jasmine.createSpy();
        api.getTimelineForUser('alindeman', callbackSpy);

        expect(callbackSpy).toHaveBeenCalledWith(
          [['https://github.com/foo/bar',
            'https://github.com/images/modules/dashboard/news/create.png',
            timestamp.valueOf(),
            'created tag <strong>v1.0</strong> at <strong>alindeman/github-timeline-widget</strong>']]);
      });
      
      it("parses a branch create event", function() {
        timestamp = truncateTimeToSecond(new Date(unixTimeNow - 30));
        jsonResponse.push({url: 'https://github.com/foo/bar',
          created_at: timestamp.toString(),
          repository: {owner: 'alindeman', name: 'github-timeline-widget'},
          type: 'CreateEvent',
          payload: {object: 'branch', object_name: 'awesome-branch'}});

        callbackSpy = jasmine.createSpy();
        api.getTimelineForUser('alindeman', callbackSpy);

        expect(callbackSpy).toHaveBeenCalledWith(
          [['https://github.com/foo/bar',
            'https://github.com/images/modules/dashboard/news/create.png',
            timestamp.valueOf(),
            'created branch <strong>awesome-branch</strong> at <strong>alindeman/github-timeline-widget</strong>']]);
      });
    });

    describe("PublicEvent", function() {
      it("parses an open sourced event", function() {
        timestamp = truncateTimeToSecond(new Date(unixTimeNow - 30));
        jsonResponse.push({url: 'https://github.com/foo/bar',
          created_at: timestamp.toString(),
          repository: {owner: 'alindeman', name: 'github-timeline-widget'},
          type: 'PublicEvent'});

        callbackSpy = jasmine.createSpy();
        api.getTimelineForUser('alindeman', callbackSpy);

        expect(callbackSpy).toHaveBeenCalledWith(
          [['https://github.com/foo/bar',
            'https://github.com/images/modules/dashboard/news/public.png',
            timestamp.valueOf(),
            'open sourced <strong>alindeman/github-timeline-widget</strong>']]);
      });
    });
  });

  describe("formatAsTimeAgo", function() {
    it("should return 'just now' for times less than 60 second ago", function() {
      expect(api.formatAsTimeAgo(new Date(unixTimeNow - 30000))).toEqual("just now");
      expect(api.formatAsTimeAgo(new Date(unixTimeNow - 55000))).toEqual("just now");
      expect(api.formatAsTimeAgo(new Date(unixTimeNow - 1000))).toEqual("just now");
    });

    it("should return '1 minute ago' for times greater than 60 seconds but less than 120 seconds", function() {
      expect(api.formatAsTimeAgo(new Date(unixTimeNow - 70000))).toEqual("1 minute ago");
      expect(api.formatAsTimeAgo(new Date(unixTimeNow - 90000))).toEqual("1 minute ago");
      expect(api.formatAsTimeAgo(new Date(unixTimeNow - 110000))).toEqual("1 minute ago");
    });

    it("should return 'X minutes ago' for times greater than 120 seconds but less than 1 hour", function() {
      expect(api.formatAsTimeAgo(new Date(unixTimeNow - 150000))).toEqual("2 minutes ago");
      expect(api.formatAsTimeAgo(new Date(unixTimeNow - 2045000))).toEqual("34 minutes ago");
      expect(api.formatAsTimeAgo(new Date(unixTimeNow - 3305000))).toEqual("55 minutes ago");
    });

    it("should return '1 hour ago' for times greater than 1 hour but less than 2 hours", function() {
      expect(api.formatAsTimeAgo(new Date(unixTimeNow - 3660000))).toEqual("1 hour ago");
      expect(api.formatAsTimeAgo(new Date(unixTimeNow - 5340000))).toEqual("1 hour ago");
      expect(api.formatAsTimeAgo(new Date(unixTimeNow - 6900000))).toEqual("1 hour ago");
    });
    
    it("should return 'X hours ago' for times greater than 2 hour but less than 1 day", function() {
      expect(api.formatAsTimeAgo(new Date(unixTimeNow - 10860000))).toEqual("3 hours ago");
      expect(api.formatAsTimeAgo(new Date(unixTimeNow - 28860000))).toEqual("8 hours ago");
      expect(api.formatAsTimeAgo(new Date(unixTimeNow - 54060000))).toEqual("15 hours ago");
    });
    
    it("should return 'Yesterday' for times greater than 1 day but less than 2 days", function() {
      expect(api.formatAsTimeAgo(new Date(unixTimeNow - 90000000))).toEqual("Yesterday");
      expect(api.formatAsTimeAgo(new Date(unixTimeNow - 129600000))).toEqual("Yesterday");
      expect(api.formatAsTimeAgo(new Date(unixTimeNow - 169200000))).toEqual("Yesterday");
    });
    
    it("should return 'X days ago' for times greater than 2 days but less than 1 week", function() {
      expect(api.formatAsTimeAgo(new Date(unixTimeNow - 172860000))).toEqual("2 days ago");
      expect(api.formatAsTimeAgo(new Date(unixTimeNow - 345606000))).toEqual("4 days ago");
      expect(api.formatAsTimeAgo(new Date(unixTimeNow - 518406000))).toEqual("6 days ago");
    });
    
    it("should return 'X weeks ago' for times greater than 7 days", function() {
      expect(api.formatAsTimeAgo(new Date(unixTimeNow - 691206000))).toEqual("2 weeks ago");
      expect(api.formatAsTimeAgo(new Date(unixTimeNow - 2419206000))).toEqual("4 weeks ago");
      expect(api.formatAsTimeAgo(new Date(unixTimeNow - 7862406000))).toEqual("13 weeks ago");
    });
  });
});
