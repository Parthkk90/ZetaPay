console.log("ZetaPay content script loaded.");

function injectButton() {
  const button = document.createElement("button");
  button.innerHTML = "Pay with Crypto via ZetaChain";
  button.style.backgroundColor = "#4CAF50";
  button.style.color = "white";
  button.style.padding = "15px 32px";
  button.style.textAlign = "center";
  button.style.textDecoration = "none";
  button.style.display = "inline-block";
  button.style.fontSize = "16px";
  button.style.margin = "4px 2px";
  button.style.cursor = "pointer";

  // In a real scenario, we would target a specific element on the checkout page.
  // For now, we'll just append it to the body.
  document.body.appendChild(button);
}

injectButton();
