import React, { useState } from "react";
import { ethers } from "ethers";
import contractJson from "./BlockVault.json";
import "./App.css";

const CONTRACT_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
const contractABI = contractJson.abi;

const shorten = (addr) =>
  addr ? addr.slice(0, 6) + "..." + addr.slice(-4) : "";
const formatDate = (ts) => (ts ? new Date(ts * 1000).toLocaleString() : "");

function EMRPage() {
  const [tab, setTab] = useState("upload");
  const [selectedFile, setSelectedFile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [txHash, setTxHash] = useState("");
  const [verifyFile, setVerifyFile] = useState(null);
  const [verifyStatus, setVerifyStatus] = useState("");
  const [verifyInfo, setVerifyInfo] = useState(null);
  const [auditTrail, setAuditTrail] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState("");

  // --- Fetch audit trail ---
  const loadAuditTrail = async () => {
    setAuditTrail([]);
    setAuditLoading(true);
    setAuditError("");
    try {
      const resp = await fetch("https://docguardvault-backend.onrender.com/auditTrail");
      const text = await resp.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error("Server returned non-JSON response:\n" + text);
      }
      if (json.status === "success") setAuditTrail(json.data);
      else setAuditError(json.error || "Unknown error loading audit.");
    } catch (e) {
      setAuditError("Error fetching audit trail: " + e.message);
    } finally {
      setAuditLoading(false);
    }
  };

  const switchTab = (next) => {
    setTab(next);
    if (next === "audit") loadAuditTrail();
  };

  async function connectWallet() {
    if (!window.ethereum) return setUploadStatus("MetaMask not detected.");
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWallet(accounts[0]);
      setUploadStatus("Wallet connected: " + accounts[0]);
    } catch {
      setUploadStatus("User denied wallet connection.");
    }
  }

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setUploadStatus("");
    setTxHash("");
  };

  const handleVerifyChange = (e) => {
    setVerifyFile(e.target.files[0]);
    setVerifyStatus("");
    setVerifyInfo(null);
  };

  async function handleUpload(e) {
    e.preventDefault();
    if (!selectedFile) return setUploadStatus("Please select a file.");
    if (!wallet) return setUploadStatus("Connect your wallet first!");

    setUploadStatus("Hashing file...");
    const buffer = await selectedFile.arrayBuffer();
    const hash = ethers.keccak256(new Uint8Array(buffer));
    setUploadStatus("File hash: " + hash);

    setUploadStatus("Requesting signature...");
    let signature;
    try {
      signature = await window.ethereum.request({
        method: "personal_sign",
        params: [hash, wallet],
      });
    } catch {
      setUploadStatus("Signature denied.");
      return;
    }

    setUploadStatus("Uploading to server...");
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("walletAddress", wallet);
    formData.append("signature", signature);

    try {
      const resp = await fetch("https://docguardvault-backend.onrender.com/upload", {
        method: "POST",
        body: formData,
      });

      const text = await resp.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server returned non-JSON response:\n" + text);
      }
      if (data.status === "success") {
        setUploadStatus("Upload successful! Tx hash: " + data.txHash);
        setTxHash(data.txHash);
      } else {
        setUploadStatus("Upload failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      setUploadStatus("Network/server error: " + err.message);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    if (!verifyFile) return setVerifyStatus("Choose a file to verify.");

    setVerifyStatus("Hashing file...");
    const buffer = await verifyFile.arrayBuffer();
    const hash = ethers.keccak256(new Uint8Array(buffer));
    setVerifyStatus("Searching blockchain...");

    try {
      const resp = await fetch(`https://docguardvault-backend.onrender.com/getFile/${hash}`);
      const text = await resp.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server returned non-JSON response:\n" + text);
      }

      if (!data || !data.uploader || data.uploader === "0x0000000000000000000000000000000000000000") {
        setVerifyStatus("File tampered!");
        setVerifyInfo(null);
        return;
      }

      setVerifyStatus("File found!");
      setVerifyInfo({ ...data, hash });
    } catch (err) {
      setVerifyStatus("Verification failed: " + err.message);
      setVerifyInfo(null);
    }
  }

  const statusStyle = (status) => {
    const s = (status || "").toLowerCase();
    const color =
      s.includes("success") || s.includes("found")
        ? "#16a34a"
        : s.includes("fail") || s.includes("denied") || s.includes("not found") || s.includes("tampered")
        ? "#dc2626"
        : "#bde50d";
    return { minHeight: 36, fontSize: "1.1rem", fontWeight: 600, color };
  };

  return (
    <div className="app">
      <div className="container">
        <h2 className="title">DocGuard Vault</h2>

        {/* Tabs */}
        <div className="tab-switcher">
          <button className={tab === "upload" ? "tab active" : "tab"} onClick={() => switchTab("upload")}>
            Upload File
          </button>
          <button className={tab === "verify" ? "tab active" : "tab"} onClick={() => switchTab("verify")}>
            Verify File
          </button>
          <button className={tab === "audit" ? "tab active" : "tab"} onClick={() => switchTab("audit")}>
            Audit Trail
          </button>
        </div>

        {/* --- Upload Tab --- */}
        {tab === "upload" && (
          <div className="panel">
            <form onSubmit={handleUpload} className="stack">
              <input type="file" onChange={handleFileChange} />
              <button type="submit" className="action-btn">
                Upload & Log to Blockchain
              </button>
            </form>
            <div className="status" style={statusStyle(uploadStatus)}>
              {uploadStatus}
              {txHash && (
                <div style={{ marginTop: 8 }}>
                  <a
                    href={`https://amoy.polygonscan.com/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Transaction
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- Verify Tab --- */}
        {tab === "verify" && (
          <div className="panel">
            <form onSubmit={handleVerify} className="stack">
              <input type="file" onChange={handleVerifyChange} />
              <button type="submit" className="action-btn">
                Verify File Integrity
              </button>
            </form>
            <div className="status" style={statusStyle(verifyStatus)}>{verifyStatus}</div>

            {verifyInfo && (
              <div className="verify-box">
                <div>
                  <b>File Hash:</b> <span>{verifyInfo.hash}</span>
                </div>
                <div>
                  <b>Uploader:</b>{" "}
                  <a
                    href={`https://amoy.polygonscan.com/address/${verifyInfo.uploader}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {shorten(verifyInfo.uploader)}
                  </a>
                </div>
                <div>
                  <b>IPFS CID:</b>{" "}
                  <a
                    href={`https://ipfs.io/ipfs/${verifyInfo.ipfsCID}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {verifyInfo.ipfsCID}
                  </a>
                </div>
                <div>
                  <b>Signature:</b>{" "}
                  <span>
                    {verifyInfo.signature?.slice(0, 10)}...
                    {verifyInfo.signature?.slice(-8)}
                  </span>
                </div>
                <div>
                  <b>Timestamp:</b> {formatDate(verifyInfo.timestamp)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- Audit Tab --- */}
        {tab === "audit" && (
          <div
            className="panel"
            style={{
              background: "#23293a",
              borderRadius: 18,
              padding: 30,
              boxShadow: "0 6px 32px #0003",
              color: "#e3e7ef",
              fontSize: "1.05rem",
            }}
          >
            <h3 style={{ color: "#fff", marginBottom: 20, fontWeight: 700, fontSize: "1.3rem" }}>
              Audit Trail (All Uploaded Files)
            </h3>

            {auditLoading && <p>Loading...</p>}
            {auditError && <p style={{ color: "#f55" }}>{auditError}</p>}

            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {auditTrail.map((ev) => (
                <li
                  key={ev.fileHash}
                  style={{
                    background: "#222836",
                    borderRadius: 12,
                    marginBottom: 16,
                    padding: "16px 20px",
                    boxShadow: "0 2px 16px #0002",
                    border: "1px solid #313c4e",
                  }}
                >
                  <div>
                    <b style={{ color: "#7fd7e8" }}>Hash:</b>{" "}
                    <span style={{ fontFamily: "monospace", color: "#c0e5ff", marginLeft: 7 }}>
                      {ev.fileHash.slice(0, 10)}...
                    </span>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <b style={{ color: "#b3b3b3" }}>Uploader:</b>{" "}
                    <span style={{ color: "#ffe082", marginLeft: 6 }}>{shorten(ev.uploader)}</span>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <b style={{ color: "#b3b3b3" }}>Time:</b>{" "}
                    <span style={{ color: "#a8e6cf", marginLeft: 6 }}>{formatDate(ev.timestamp)}</span>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <a
                      href={`https://ipfs.io/ipfs/${ev.ipfsCID}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#54f5e7",
                        fontWeight: 600,
                        fontSize: "1rem",
                        textDecoration: "underline",
                      }}
                    >
                      IPFS
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* --- Wallet footer: always at the end --- */}
        <div className="wallet-footer">
          {wallet && <span className="address-pill">{shorten(wallet)}</span>}
          <button className="wallet-btn" onClick={connectWallet}>
            {wallet ? "Connected" : "Connect MetaMask"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EMRPage;
