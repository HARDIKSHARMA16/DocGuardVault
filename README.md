
# MedChain Vault Frontend

This is the frontend of the MedChain Vault project – a secure, blockchain-powered platform for Electronic Medical Record (EMR) upload, verification, and audit trail management.

---

## Features

- **Upload EMR**: Connect MetaMask, hash and sign EMR files, and upload with full blockchain audit.
- **Verify EMR**: Check any file’s authenticity by verifying against the blockchain log.
- **Audit Trail**: View all uploaded files, access management (grant/revoke), and see on-chain proofs.
- **Access Control**: Only authorized users can access or verify files, controlled by the uploader.

---

## Tech Stack

- React.js (with functional components & hooks)
- Ethers.js (for client-side hash/signature)
- MetaMask (for wallet connection)
- REST API calls to backend

---

## ⚡ Getting Started

### 1. **Install dependencies**

```bash
npm install
````

### 2. **Run the frontend**

```bash
npm start
```

### 3. **Configuration**

* Ensure your backend API is running at `http://localhost:5000` or update the endpoints in `EMRPage.js` if needed.

---

## Folder Structure

* `src/`

  * `App.js` – Main app routes
  * `HomePage.js` – Landing/intro page
  * `EMRPage.js` – Core upload/verify/audit UI
  * `App.css` – Styles
  * `...` – Other assets

---

## Screenshots

> *See `/docs/` or the main project README for UI walkthrough.*

---

## Credits

* Built by Team Hack Demons

````

---

## **Backend README (backend/README.md)**

```markdown
# MedChain Vault Backend

This is the backend server for MedChain Vault – handling file uploads, blockchain logging, access control, and audit queries.

---

## Features

- **Upload API**: Accepts EMR file + MetaMask-signed hash, uploads to IPFS, writes to smart contract.
- **Audit Trail API**: Lists all file uploads (on-chain events) for transparency.
- **Access Control API**: Uploader can grant, revoke, or check access for any address per file.
- **Verification API**: Retrieve blockchain file record for validation.

---

## Tech Stack

- Node.js (Express.js)
- Ethers.js (Ethereum smart contract interaction)
- Multer (file upload handling)
- Pinata IPFS (decentralized file storage)
- Dotenv (for environment config)

---

## Getting Started

### 1. **Install dependencies**

```bash
npm install
````

### 2. **Set up environment**

Copy `.env.example` to `.env` and fill in:

```
CONTRACT_ADDRESS=0x...
PRIVATE_KEY=...
RPC_URL=...
PINATA_API_KEY=...
PINATA_API_SECRET=...
```

### 3. **Start the backend server**

```bash
npm start
```

* By default, runs on Render Sever

---

## Key API Endpoints

* `POST /upload` – Uploads file, logs on-chain
* `GET /getFile/:hash` – Fetch file record by hash
* `GET /auditTrail` – Get recent upload events
* `POST /grantAccess` – Grant access to another address
* `POST /revokeAccess` – Revoke access for an address
* `GET /canAccess/:fileHash/:address` – Check access

---

## Security Notes

* Never share your private key. Use `.env` files and restrict access.
* Ensure MetaMask signing on client for non-repudiation.

---

## Credits

* Built by Team Hack Demons

