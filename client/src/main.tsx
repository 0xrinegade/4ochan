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
titleElement.textContent = "NostrChan";
document.head.appendChild(titleElement);

// Add FontAwesome for icons
const fontAwesome = document.createElement("link");
fontAwesome.rel = "stylesheet";
fontAwesome.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
document.head.appendChild(fontAwesome);

createRoot(document.getElementById("root")!).render(
  <App />
);
