let activeTooltip = null;
let hoverTimer = null;

// 1. Listen for mouseover events globally on the document
document.addEventListener("mouseover", (event) => {
  const target = event.target.closest("a");
  if (!target) return;

  const href = target.href;
  // Regex to match github.com/username links
  const githubRegex = /^https?:\/\/github\.com\/([a-zA-Z0-9_-]+)(?:\/)?$/;
  const match = href.match(githubRegex);

  if (match) {
    const username = match[1];
    
    // 500ms delay to prevent flashing during normal mouse movement
    hoverTimer = setTimeout(() => {
      fetchUserData(username, event.pageX, event.pageY);
    }, 500);
  }
});

// 2. Clear tooltip and cancel timer when mouse leaves the link
document.addEventListener("mouseout", (event) => {
  const target = event.target.closest("a");
  if (target && target.href && target.href.includes("github.com/")) {
    clearTimeout(hoverTimer);
    if (activeTooltip) {
      activeTooltip.remove();
      activeTooltip = null;
    }
  }
});

// 3. Request data from the background script via Message Passing
function fetchUserData(username, x, y) {
  chrome.runtime.sendMessage(
    { action: "fetch_github_user", username },
    (response) => {
      if (response && response.success) {
        showTooltip(response.data, x, y);
      } else {
        showErrorTooltip(response ? response.error : "Unknown error", x, y);
      }
    }
  );
}

// 4. Dynamically inject the redesigned, sleek preview card into the DOM
function showTooltip(user, x, y) {
  if (activeTooltip) activeTooltip.remove();

  // Inject smooth fade-in animation keyframes once
  if (!document.getElementById("git-peek-styles")) {
    const style = document.createElement("style");
    style.id = "git-peek-styles";
    style.innerHTML = `
      @keyframes gitPeekFadeIn {
        from { opacity: 0; transform: translateY(6px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
    `;
    document.head.appendChild(style);
  }

  activeTooltip = document.createElement("div");
  activeTooltip.style.position = "absolute";
  activeTooltip.style.left = `${x + 14}px`;
  activeTooltip.style.top = `${y + 14}px`;
  activeTooltip.style.zIndex = "999999";
  activeTooltip.style.background = "#0d1117";
  activeTooltip.style.color = "#c9d1d9";
  activeTooltip.style.padding = "16px";
  activeTooltip.style.borderRadius = "12px";
  activeTooltip.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  activeTooltip.style.fontSize = "13px";
  activeTooltip.style.boxShadow = "0 16px 32px rgba(1, 4, 9, 0.8), 0 0 0 1px #30363d";
  activeTooltip.style.width = "270px";
  activeTooltip.style.animation = "gitPeekFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards";
  activeTooltip.style.backdropFilter = "blur(8px)";

  const userBio = user.bio ? user.bio : "No bio available.";
  const userName = user.name || user.login;

  activeTooltip.innerHTML = `
    <div style="display: flex; align-items: center; margin-bottom: 12px;">
      <img src="${user.avatar_url}" style="width: 46px; height: 46px; border-radius: 50%; margin-right: 12px; border: 2px solid #30363d; object-fit: cover;">
      <div style="overflow: hidden;">
        <div style="font-weight: 600; font-size: 14px; color: #f0f6fc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${userName}</div>
        <div style="font-size: 12px; color: #8b949e;">@${user.login}</div>
      </div>
    </div>
    <p style="font-size: 12px; line-height: 1.4; margin: 0 0 12px 0; color: #8b949e; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${userBio}</p>
    <div style="border-top: 1px solid #21262d; padding-top: 10px; display: flex; gap: 8px;">
      <div style="flex: 1; background: #161b22; padding: 6px 10px; border-radius: 6px; text-align: center; border: 1px solid #30363d;">
        <div style="font-size: 10px; color: #8b949e; text-transform: uppercase; letter-spacing: 0.5px;">Repos</div>
        <div style="font-weight: 600; color: #58a6ff; font-size: 13px;">${user.public_repos}</div>
      </div>
      <div style="flex: 1; background: #161b22; padding: 6px 10px; border-radius: 6px; text-align: center; border: 1px solid #30363d;">
        <div style="font-size: 10px; color: #8b949e; text-transform: uppercase; letter-spacing: 0.5px;">Followers</div>
        <div style="font-weight: 600; color: #58a6ff; font-size: 13px;">${user.followers}</div>
      </div>
    </div>
  `;

  document.body.appendChild(activeTooltip);
}

// 5. Error handling for rate limits or non-existent users
function showErrorTooltip(errorMsg, x, y) {
  if (activeTooltip) activeTooltip.remove();

  activeTooltip = document.createElement("div");
  activeTooltip.style.position = "absolute";
  activeTooltip.style.left = `${x + 14}px`;
  activeTooltip.style.top = `${y + 14}px`;
  activeTooltip.style.zIndex = "999999";
  activeTooltip.style.background = "#da3633";
  activeTooltip.style.color = "#fff";
  activeTooltip.style.padding = "10px 14px";
  activeTooltip.style.borderRadius = "8px";
  activeTooltip.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  activeTooltip.style.fontSize = "12px";
  activeTooltip.style.boxShadow = "0 8px 24px rgba(0,0,0,0.5)";
  activeTooltip.innerText = `Git-Peek Error: ${errorMsg}`;

  document.body.appendChild(activeTooltip);
}