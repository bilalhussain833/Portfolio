chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetch_github_user") {
    const username = request.username;
    
    fetch(`https://api.github.com/users/${username}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(response.status === 404 ? "User not found" : "API rate limit or error");
        }
        return response.json();
      })
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    
    // Required to let Chrome know sendResponse will be called asynchronously
    return true; 
  }
});