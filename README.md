# 🌟 Freshers 2026 - Multi-Device Event Portal & Management System

Official web application and management system for **Freshers 2026** (Friday, October 16, 2026).

---

## 🚀 Key Highlights & Multi-Device Capabilities

### 1. 🔄 Multi-Device Cloud Sync & Independent Operability
- **Independent Cross-Device Sync**: Works across phones, laptops, and tablets anywhere. When an attendee signs up on their device, their registration and email instantly appear in the **Super Admin Master Dashboard** on Devansh's device.
- **Dual Cloud Backend Options**:
  - **Node.js Express Server (`server.js`)**: Persistent REST API backend with file database (`data/database.json`) for hosting on Render or running locally.
  - **Firebase Realtime Database (Serverless)**: Plug in a free Firebase Realtime Database URL via the in-app **Cloud Setup** modal for instant serverless websocket sync on static hosts (GitHub Pages, Vercel, Netlify, Render Static).
- **Auto-Sync Engine**: Periodic live background sync (every 6 seconds) ensures real-time updates without refreshing.

### 2. ⚡ Instant Auto-Login on Sign Up
- Students register with their **Name**, **Email**, and **Password**.
- The portal **instantly creates their session and logs them in** upon signup with a welcome celebration and confetti.

### 3. 👑 Devansh's Master Dashboard & User Management
- **Live User Roster**: Displays every registered user across all devices with:
  - Full Name & Email Address
  - Device & Browser Type (e.g. `Android 📱 (Chrome)`, `iOS 📱 (Safari)`, `Windows 💻 (Chrome)`)
  - Exact Registration & Last Login timestamps
  - Role Badge (`Super Admin`, `Editor`, `Attendee`)
- **1-Click Live Rights Toggle**: Master switch to grant or revoke editing permissions for any user in real time.
- **📋 Copy All Emails**: 1-click button to copy all attendee emails for announcements and WhatsApp broadcasts.
- **📥 Export CSV**: Download a complete spreadsheet of all registered attendees.

### 4. 📋 41-Segment Chronological Run of Show
- Full itinerary with anchor links, performances, 4 ramp rounds, open slots, crowning, BTS video, and DJ & dining.
- Live edit mode for approved editors and Super Admin.

### 5. 👥 Department-wise Committee Roster
- 8 organizing departments with 37+ student members and roll numbers.
- Filter, search, and live in-place editing.

### 6. 🖨️ Clean Black & White PDF / Print Export
- Formatted for official documentation and committee distribution (`Ctrl + P`).

---

## 💻 Running Locally

To run the fullstack server on your local machine:
```bash
# 1. Install dependencies (if not already installed)
npm install

# 2. Start the server
npm start
```
Then open: **`http://localhost:3000`** in your browser.

---

## 🌐 Deploying to Render

### Option A: Node.js Web Service (Recommended for zero-config multi-device backend)
1. Push this repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com/) -> **New +** -> **Web Service**.
3. Connect your repository.
4. Set **Environment** to `Node`, **Build Command** to `npm install`, and **Start Command** to `node server.js`.
5. Click **Deploy Web Service**.

### Option B: Static Site + Firebase Realtime DB
1. In Render, select **Static Site** (using `render.yaml`).
2. Open your deployed portal, go to **Admin Dashboard -> ⚙️ Cloud Setup**, and paste your Firebase Database URL.
