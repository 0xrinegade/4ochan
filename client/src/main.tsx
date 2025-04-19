// Import polyfills first
import './polyfills';

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import Roboto font
const robotoFont = document.createElement("link");
robotoFont.rel = "stylesheet";
robotoFont.href = "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap";
document.head.appendChild(robotoFont);

// Add page title
const titleElement = document.createElement("title");
titleElement.textContent = "4ochan.org - Decentralized Imageboard";
document.head.appendChild(titleElement);

// Add FontAwesome for icons
const fontAwesome = document.createElement("link");
fontAwesome.rel = "stylesheet";
fontAwesome.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
document.head.appendChild(fontAwesome);

// Add manifest link for PWA
const manifestLink = document.createElement("link");
manifestLink.rel = "manifest";
manifestLink.href = "/manifest.json";
document.head.appendChild(manifestLink);

// Add theme color for PWA
const themeColorMeta = document.createElement("meta");
themeColorMeta.name = "theme-color";
themeColorMeta.content = "#800000";
document.head.appendChild(themeColorMeta);

// Add apple touch icon for iOS PWA
const appleTouchIcon = document.createElement("link");
appleTouchIcon.rel = "apple-touch-icon";
appleTouchIcon.href = "/icon-192x192.svg";
document.head.appendChild(appleTouchIcon);

// Register the service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(
  <App />
);
