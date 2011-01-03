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

    it ("should call the callback function", function() {
      jsonResponse = []

      callbackSpy = jasmine.createSpy();
      api.getTimelineForUser('alindeman', callbackSpy);

      expect(callbackSpy).toHaveBeenCalled();
    });
  });
});
