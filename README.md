
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

## Getting Started

### 1. **Install dependencies**

```bash
npm install
````

### 2. **Run the frontend**

```bash
npm start
```

### 3. **Configuration**

* Ensure your backend API is running at `https://medchainvaultbackend.onrender.com` or update the endpoints in `EMRPage.js` if needed.

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

> <img width="1920" height="751" alt="image" src="https://github.com/user-attachments/assets/988d1cc4-7eac-42ed-8ce9-29446b5fe6ab" />


---

## Credits

* Built by Team Hack Demons


