describe('GitHubTimelineApi', function() {
  // GitHubTimelineApi instance (class under test)
  var api;

  // Response sent by mock $.getJSON call
  var jsonResponse = null;

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
  });
  
  describe("getTimelineForUser", function() {
    it("should make an AJAX request for the correct URL", function() {
      jsonResponse = []

      api.getTimelineForUser('alindeman', function(events) { });

      expect(jQuery.ajaxSetup).toHaveBeenCalledWith({cache: true});
      expect(jQuery.getJSON.mostRecentCall.args[0]).toEqual('https://github.com/alindeman.json?callback=?');
    });

    it("should call the callback function", function() {
      jsonResponse = []

      callbackSpy = jasmine.createSpy();
      api.getTimelineForUser('alindeman', callbackSpy);

      expect(callbackSpy).toHaveBeenCalled();
    });
  });

  describe("formatAsTimeAgo", function() {
    var unixTimeNow;
    beforeEach(function() {
      unixTimeNow = new Date().valueOf();
    });

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
