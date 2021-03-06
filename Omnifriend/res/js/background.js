chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason === "install") chrome.tabs.create({url: chrome.runtime.getURL("/res/html/options.html")});
});
var friends;
var searchOpts = {
    fuzzy: true,
    starredOnly: false,
    editControls: true
};
chrome.omnibox.onInputStarted.addListener(function() {
    friends = [];
    chrome.storage.local.get(function(store) {
        var networks = ["Email", "Facebook", "Google+", "Reddit", "Steam", "Twitter"];
        ["em-addresses", "fb-friends", "gp-circled", "rd-mates", "st-friends", "tw-follows"].map(function(key, i, arr) {
            if (store[key]) {
                for (var j in store[key]) store[key][j].network = networks[i];
                friends = friends.concat(store[key]);
            }
        });
        friends.sort(function(a, b) {
            var m = a.name.toLowerCase();
            var n = b.name.toLowerCase();
            if (m === n) {
                m = a.user ? a.user.toLowerCase() : "";
                n = b.user ? b.user.toLowerCase() : "";
            }
            return (m === n ? 0 : (m > n ? 1 : -1));
        });
        for (var x in searchOpts) {
            if (x in store.search) searchOpts[x] = store.search[x];
        }
    });
});
chrome.omnibox.onInputChanged.addListener(function(text, suggest) {
    text = text.toLowerCase();
    var matches = [];
    var regex = new RegExp(text.toLowerCase().split("").join(".*?"), "i");
    for (var i in friends) {
        var friend = friends[i];
        var test = friend.name + (friend.user ? " " + friend.user : "")
                + (friend.id ? " " + friend.id : "") + " " + friend.network;
        if (searchOpts.fuzzy && test.match(regex) || !searchOpts.fuzzy && test.toLowerCase().indexOf(text) >= 0) {
            if (searchOpts.starredOnly && !friends[i].star) continue;
            var desc = friend.name + "  <url>" + friend.network
                    + (friend.user ? ": " + friend.user : "") + "</url>";
            var match = {
                content: friend.url,
                description: desc.replace(/&/g, "&amp;")
            };
            matches.push(match);
        }
    }
    suggest(matches);
});
chrome.omnibox.onInputEntered.addListener(function(text, disposition) {
    var url = text;
    // press Enter on "run extension command", show search page
    if (!text.match(/^.*?:(\/\/)?/)) {
        url = chrome.runtime.getURL("/res/html/search.html#" + encodeURIComponent(text));
    }
    switch (disposition) {
        case "currentTab":
            chrome.tabs.update({url: url});
            break;
        case "newForegroundTab":
            chrome.tabs.create({url: url});
            break;
        case "newBackgroundTab":
            chrome.tabs.create({url: url, active: false});
            break;
    }
});
