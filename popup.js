document.addEventListener('DOMContentLoaded', () => {
  const slowFillingCheckbox = document.getElementById('slowFilling');

  // Load current setting
  chrome.storage.local.get(['slowFilling'], (result) => {
    slowFillingCheckbox.checked = !!result.slowFilling;
  });

  // Save setting on change
  slowFillingCheckbox.addEventListener('change', () => {
    chrome.storage.local.set({ slowFilling: slowFillingCheckbox.checked });
  });

  // Force fill button
  document.getElementById('forceFill').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'forceFill' });
      }
    });
  });
});
