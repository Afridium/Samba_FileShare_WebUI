# Samba Web UI

A self-hosted web app for accessing a Samba (SMB) share on your home network from any device — phone, tablet, or computer — through a simple webpage instead of configuring SMB clients on each device.

## Overview

An Ubuntu machine runs a Samba server that shares a folder on the local network. A Node.js/Express backend connects to that share using the `@marsaud/smb2` package and exposes a small REST API for browsing, uploading, downloading, and deleting files. A React + Tailwind frontend consumes that API so the share can be used like a simple file manager from a browser. Since the server has a fixed IP on the home router, it's reachable at the same local address every time.

## Features

Currently supported (client):
- 📁 Browse files and folders on the Samba share
- ⬆️ Upload files to the current folder
- 🗑️ Delete files
- 📱 Works from any device on the home Wi-Fi network

Supported by the server, not yet wired up in the client:
- ⬇️ File download
- 🗂️ Folder deletion

Planned / future work:
- Folder creation
- Rename / move files
- File previews

## Tech Stack

**Server (Ubuntu)**
- Samba, sharing a local folder over the network

**Backend**
- Node.js
- Express
- [`@marsaud/smb2`](https://www.npmjs.com/package/@marsaud/smb2) — connects to the Samba share and performs `readdir`, `stat`, `createReadStream`, `writeFile`, `unlink`, and `rmdir` operations
- `multer` — handles incoming file uploads before they're streamed to the Samba share
- `cors` — open CORS policy so devices on the LAN (phones, other computers) can reach the API
- `dotenv` — loads Samba credentials from environment variables

**Frontend**
- React
- Tailwind CSS

## How It Works

1. Samba is configured on Ubuntu to share a folder on the local network.
2. `smbClient.js` creates a single shared SMB2 connection using credentials from environment variables.
3. The Express server (`index.js`) exposes REST endpoints that call into that SMB connection:
   - `GET /files?path=` — lists files/folders in a directory, sorted by most recently modified
   - `GET /download?path=` — streams a file from the share back to the browser as an attachment
   - `POST /upload?path=` — accepts a file via `multer`, appends a timestamp to avoid name collisions, then writes it to the share
   - `DELETE /delete?path=&isFolder=` — deletes a file or folder, automatically retrying up to 5 times (300ms apart) if the share reports a sharing violation
4. On startup, the server detects its own LAN IP address and logs both the `localhost` and network URLs, so it can be reached from other devices on the same Wi-Fi.
5. The React frontend calls these endpoints to browse, upload, and delete files, and (in future) download and manage folders.

## Getting Started

### Prerequisites

- Ubuntu machine with Samba installed and a share configured
- Node.js installed on the machine running the backend
- A fixed/reserved local IP address for the server on your home router

### Samba Setup (quick reference)

```bash
sudo apt update
sudo apt install samba
sudo nano /etc/samba/smb.conf
```

Add a share definition, e.g.:

```ini
[shared]
   path = /path/to/shared/folder
   browseable = yes
   read only = no
   guest ok = no
   valid users = your_username
```

Restart Samba and set a password for the Samba user:

```bash
sudo smbpasswd -a your_username
sudo systemctl restart smbd
```

### Installation

This project is split into two folders: `server` (the Express/SMB2 backend) and `client` (the React frontend).

1. Clone the repository

   ```bash
   git clone https://github.com/your-username/samba-webui.git
   cd samba-webui
   ```

2. Install server dependencies

   ```bash
   cd server
   npm install
   ```

3. Install client dependencies

   ```bash
   cd ../client
   npm install
   ```

4. Configure environment variables in `server/.env` (see below)

5. Run the server

   ```bash
   cd server
   node index.js
   ```

6. Run the client

   ```bash
   cd client
   npm run dev
   ```

7. On any device connected to the same home Wi-Fi, open the network URL printed in the server console, e.g.:

   ```
   http://<your-fixed-local-ip>:5000
   ```

### Environment Variables

**Server (`server/.env`)**

```
PORT=5000
SMB_SHARE=shared
SMB_USER=your_samba_username
SMB_PASS=your_samba_password
SMB_DOMAIN=WORKGROUP
```

## Notes

- CORS is currently open (`origin: '*'`) to make it easy to connect from any device on the home network. Tighten this if the server is ever exposed beyond your LAN.
- Uploaded files are renamed with a timestamp suffix to avoid collisions with existing files on the share.
- Delete requests automatically retry on `STATUS_SHARING_VIOLATION` errors, since Samba can briefly lock files that are in use.

## License

This project is open source and available under the [MIT License](LICENSE).