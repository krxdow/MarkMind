// background.js
browser.browserAction.onClicked.addListener(() => {
    // Ouvrir un nouvel onglet avec la liste des marque-pages
    browser.tabs.create({
        url: browser.runtime.getURL("bookmark_list.html")
    });
});
console.log("Bookmark Lister extension loaded.");