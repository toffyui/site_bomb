// Per-tab ON/OFF state. In-memory map keyed by tabId.
// Service workers can be torn down; if that happens a tab is treated as OFF,
// which is harmless for this UX.
const active = {};

function setOn(tabId) {
  active[tabId] = true;
  chrome.action.setBadgeText({ tabId: tabId, text: "ON" });
  chrome.action.setBadgeBackgroundColor({ tabId: tabId, color: "#2e7d32" });
  chrome.action.setTitle({ tabId: tabId, title: "Site Bomb: ON" });
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ["explosion.js"],
  });
}

function setOff(tabId) {
  delete active[tabId];
  chrome.action.setBadgeText({ tabId: tabId, text: "" });
  chrome.action.setTitle({ tabId: tabId, title: "Site Bomb: OFF" });
}

chrome.action.onClicked.addListener(function (tab) {
  if (active[tab.id]) {
    // Currently ON -> turn OFF. There is no teardown in explosion.js, so the
    // cleanest way to remove bomb mode is to reload the tab to a clean page.
    setOff(tab.id);
    chrome.tabs.reload(tab.id);
  } else {
    // Currently OFF -> turn ON.
    setOn(tab.id);
  }
});

// When a tab navigates/reloads on its own, the injected script is gone, so the
// state must reset to OFF to keep the badge honest.
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
  if (changeInfo.status === "loading" && active[tabId]) {
    setOff(tabId);
  }
});

// Clean up state when a tab is closed.
chrome.tabs.onRemoved.addListener(function (tabId) {
  delete active[tabId];
});
