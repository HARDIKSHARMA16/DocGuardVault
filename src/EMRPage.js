import React, { useState } from "react";
import { ethers } from "ethers";
// import contractJson from "./BlockVault.json"; // Make sure this is the correct ABI path
import "./App.css";

// ---- CONFIGURATION ----
const CONTRACT_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS"; // <-- PUT YOUR CONTRACT ADDRESS HERE
const contractABI = contractJson.abi;

const shorten = (addr) => addr ? addr.slice(0, 6) + "..." + addr.slice(-4) : "";
const formatDate = (ts) => ts ? new Date(ts * 1000).toLocaleString() : "";

// --- On-chain access control helpers ---
async function getEthersContract() {
  if (!window.ethereum) throw new Error("MetaMask not detected");
  await window.ethereum.request({ method: "eth_requestAccounts" });
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
}
async function grantAccess(fileHash, grantee) {
  const contract = await getEthersContract();
  const tx = await contract.grantAccess(fileHash, grantee);
  await tx.wait();
  return tx.hash;
}
async function revokeAccess(fileHash, grantee) {
  const contract = await getEthersContract();
  const tx = await contract.revokeAccess(fileHash, grantee);
  await tx.wait();
  return tx.hash;
}
async function canAccess(fileHash, address) {
  const contract = await getEthersContract();
  return await contract.canAccess(fileHash, address);
}

function EMRPage() {
  const [tab, setTab] = useState("upload");
  const [selectedFile, setSelectedFile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [txHash, setTxHash] = useState("");
  const [verifyFile, setVerifyFile] = useState(null);
  const [verifyStatus, setVerifyStatus] = useState("");
  const [verifyInfo, setVerifyInfo] = useState(null);

  // Audit trail and access control
  const [auditTrail, setAuditTrail] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState("");
  const [selectedAuditFile, setSelectedAuditFile] = useState(null);
  const [accessStatus, setAccessStatus] = useState("");
  const [grantAddr, setGrantAddr] = useState("");
  const [canAccessStatus, setCanAccessStatus] = useState("");

  // --- Fetch audit trail ---
  const loadAuditTrail = async () => {
    setAuditTrail([]);
    setAuditLoading(true);
    setAuditError("");
    setSelectedAuditFile(null);
    try {
      const resp = await fetch("https://medchainvaultbackend.onrender.com/auditTrail");
      const json = await resp.json();
      if (json.status === "success") setAuditTrail(json.data);
      else setAuditError(json.error || "Unknown error loading audit.");
    } catch (e) {
      setAuditError("Error fetching audit trail: " + e.message);
    } finally {
      setAuditLoading(false);
    }
  };

  // Tab switcher: auto-load audit tab
  function switchTab(next) {
    setTab(next);
    setAccessStatus("");
    setCanAccessStatus("");
    setSelectedAuditFile(null);
    if (next === "audit") loadAuditTrail();
  }

  // --- New Access Control: on-chain (MetaMask) ---
  async function handleGrantAccess(fileHash) {
    if (!grantAddr) return setAccessStatus("Enter an address!");
    setAccessStatus("Granting...");
    try {
      const txhash = await grantAccess(fileHash, grantAddr);
      setAccessStatus("Access granted! Tx: " + txhash);
    } catch (err) {
      setAccessStatus("Grant failed: " + (err.reason || err.message));
    }
  }
  async function handleRevokeAccess(fileHash) {
    if (!grantAddr) return setAccessStatus("Enter address!");
    setAccessStatus("Revoking...");
    try {
      const txhash = await revokeAccess(fileHash, grantAddr);
      setAccessStatus("Access revoked. Tx: " + txhash);
    } catch (err) {
      setAccessStatus("Revoke failed: " + (err.reason || err.message));
    }
  }
  async function handleCheckAccess(fileHash) {
    if (!grantAddr) return setCanAccessStatus("Enter address!");
    setCanAccessStatus("Checking...");
    try {
      const result = await canAccess(fileHash, grantAddr);
      setCanAccessStatus(result ? "✅ This address has access." : "❌ No access.");
    } catch (err) {
      setCanAccessStatus("Error: " + (err.reason || err.message));
    }
  }

  async function connectWallet() {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setWallet(accounts[0]);
        setUploadStatus("Wallet connected: " + accounts[0]);
      } catch {
        setUploadStatus("User denied wallet connection.");
      }
    } else {
      setUploadStatus("MetaMask not detected.");
    }
  }

  function handleFileChange(e) {
    setSelectedFile(e.target.files[0]);
    setUploadStatus("");
    setTxHash("");
  }

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
        params: [hash, wallet]
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
      const resp = await fetch("https://medchainvaultbackend.onrender.com", {
        method: "POST",
        body: formData
      });
      const data = await resp.json();
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

  function handleVerifyChange(e) {
    setVerifyFile(e.target.files[0]);
    setVerifyStatus("");
    setVerifyInfo(null);
  }

  async function handleVerify(e) {
    e.preventDefault();
    if (!verifyFile) return setVerifyStatus("Choose a file to verify.");

    setVerifyStatus("Hashing file...");
    const buffer = await verifyFile.arrayBuffer();
    const hash = ethers.keccak256(new Uint8Array(buffer));
    setVerifyStatus("Searching blockchain...");

    try {
      const resp = await fetch(`https://medchainvaultbackend.onrender.com/getFile/${hash}`);
      const data = await resp.json();

      if (!data || !data.uploader || data.uploader === "0x0000000000000000000000000000000000000000") {
        setVerifyStatus("File Tampered!!");
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

  const statusStyle = (status) => ({
    minHeight: 36,
    fontSize: "1.25rem",
    fontWeight: 600,
    color: status.toLowerCase().includes("success") || status.toLowerCase().includes("found")
      ? "#16a34a"
      : status.toLowerCase().includes("fail") || status.toLowerCase().includes("denied") || status.toLowerCase().includes("not found") || status.toLowerCase().includes("File Tampered!!")
        ? "#dc2626"
        : "#bde50dff"
  });

  return (
    <div className="app">
      <div className="container">
        <h2 className="title">DocGuard Vault</h2>
        <div className="tab-switcher">
          <button className={tab === "upload" ? "tab active" : "tab"} onClick={() => switchTab("upload")}>
            Upload File
          </button>
          <button className={tab === "verify" ? "tab active" : "tab"} onClick={() => switchTab("verify")}>
            Verify File
          </button>
          <button className={tab === "audit" ? "tab active" : "tab"} onClick={() => switchTab("audit")}>Audit Trail</button>
        </div>

        {tab === "upload" && (
          <div>
            <button className="wallet-btn" onClick={connectWallet}>
              {wallet ? shorten(wallet) : "Connect MetaMask"}
            </button>
            <form onSubmit={handleUpload}>
              <input type="file" onChange={handleFileChange} />
              <button type="submit" className="action-btn">Upload & Log to Blockchain</button>
            </form>
            <div className="status" style={statusStyle(uploadStatus)}>
              {uploadStatus}
              {txHash && (
                <div style={{ marginTop: 8 }}>
                  <a href={`https://amoy.polygonscan.com/tx/${txHash}`} target="_blank" rel="noopener noreferrer">
                    View Transaction
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "verify" && (
          <div>
            <form onSubmit={handleVerify}>
              <input type="file" onChange={handleVerifyChange} />
              <button type="submit" className="action-btn">Verify File Integrity</button>
            </form>
            <div className="status" style={statusStyle(verifyStatus)}>{verifyStatus}</div>
            {verifyInfo && (
              <div className="verify-box">
                <div><b>File Hash:</b> <span>{verifyInfo.hash}</span></div>
                <div><b>Uploader:</b> <a href={`https://amoy.polygonscan.com/address/${verifyInfo.uploader}`} target="_blank" rel="noopener noreferrer">{shorten(verifyInfo.uploader)}</a></div>
                <div><b>IPFS CID:</b> <a href={`https://ipfs.io/ipfs/${verifyInfo.ipfsCID}`} target="_blank" rel="noopener noreferrer">{verifyInfo.ipfsCID}</a></div>
                <div><b>Signature:</b> <span>{verifyInfo.signature?.slice(0, 10)}...{verifyInfo.signature?.slice(-8)}</span></div>
                <div><b>Timestamp:</b> {formatDate(verifyInfo.timestamp)}</div>
              </div>
            )}
          </div>
        )}

        {tab === "audit" && (
          <div
            style={{
              background: "#23293a",
              borderRadius: 18,
              padding: "30px clamp(12px, 4vw, 36px) 32px clamp(12px, 4vw, 36px)",
              margin: "32px auto",
              boxShadow: "0 6px 32px #0003",
              color: "#e3e7ef",
              minHeight: 240,
              fontSize: "1.13rem",
              width: "100%",
              maxWidth: "700px",
              boxSizing: "border-box"
            }}
          >
            <h3 style={{
              color: "#fff",
              marginBottom: 28,
              fontWeight: 700,
              fontSize: "1.45rem",
              letterSpacing: "0.5px"
            }}>Audit Trail (All Uploaded Files)</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {auditTrail.map(ev => (
                <li key={ev.fileHash}
                  style={{
                    background: "#222836",
                    borderRadius: 12,
                    marginBottom: 18,
                    padding: "18px 22px",
                    boxShadow: "0 2px 16px #0002",
                    border: "1px solid #313c4e"
                  }}>
                  <div>
                    <b style={{ color: "#7fd7e8" }}>Hash:</b>
                    <span style={{
                      fontFamily: "monospace",
                      color: "#c0e5ff",
                      marginLeft: 7
                    }}>{ev.fileHash.slice(0, 10)}...</span>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <b style={{ color: "#b3b3b3" }}>Uploader:</b>
                    <span style={{
                      color: "#ffe082",
                      marginLeft: 6
                    }}>{shorten(ev.uploader)}</span>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <b style={{ color: "#b3b3b3" }}>Time:</b>
                    <span style={{ color: "#a8e6cf", marginLeft: 6 }}>
                      {formatDate(ev.timestamp)}
                    </span>
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
                        marginRight: 15,
                        textDecoration: "underline"
                      }}
                    >IPFS</a>
                    <button
                      style={{
                        padding: "7px 16px",
                        borderRadius: 7,
                        border: "none",
                        background: "#51fa7b",
                        color: "#181d21",
                        fontWeight: 600,
                        fontSize: "1rem",
                        boxShadow: "0 1px 8px #0002",
                        marginLeft: 6,
                        cursor: "pointer",
                        transition: "background 0.2s"
                      }}
                      onClick={() => setSelectedAuditFile(ev.fileHash)}
                    >Manage Access</button>
                  </div>
                </li>
              ))}
            </ul>
            {/* Access Control Section */}
            {selectedAuditFile && (
              <div style={{
                margin: "28px auto 0 auto",
                background: "#25344e",
                borderRadius: 16,
                padding: 26,
                boxShadow: "0 2px 10px #0003",
                maxWidth: 440
              }}>
                <h4 style={{
                  color: "#fff",
                  marginBottom: 15
                }}>Manage Access for File:
                  <span style={{
                    fontSize: 13,
                    color: "#94f0ff",
                    fontFamily: "monospace",
                    marginLeft: 10
                  }}>{selectedAuditFile.slice(0, 12)}...</span>
                </h4>
                <input
                  placeholder="Enter wallet address"
                  value={grantAddr}
                  onChange={e => setGrantAddr(e.target.value)}
                  style={{
                    width: 280,
                    margin: "6px 10px 10px 0",
                    padding: 9,
                    borderRadius: 7,
                    border: "1px solid #2e6a92",
                    background: "#131c29",
                    color: "#d7f9ff",
                    fontSize: 16
                  }}
                />
                <div style={{ marginBottom: 12 }}>
                  <button onClick={() => handleGrantAccess(selectedAuditFile)} className="action-btn" style={{
                    margin: "0 7px 7px 0", background: "#3beaaa", color: "#213", fontWeight: 700
                  }}>
                    Grant
                  </button>
                  <button onClick={() => handleRevokeAccess(selectedAuditFile)} className="action-btn" style={{
                    margin: "0 7px 7px 0", background: "#fc5c65", color: "#fff"
                  }}>
                    Revoke
                  </button>
                  <button onClick={() => handleCheckAccess(selectedAuditFile)} className="action-btn" style={{
                    margin: "0 7px 7px 0", background: "#28c76f", color: "#fff"
                  }}>
                    Check Access
                  </button>
                </div>
                <div style={{ marginTop: 6, color: "#FFD600", fontWeight: 600 }}>{accessStatus}</div>
                <div style={{ marginTop: 4, color: "#18f785", fontWeight: 500 }}>{canAccessStatus}</div>
                <button onClick={() => setSelectedAuditFile(null)} style={{
                  marginTop: 18, color: "#9ac", background: "none", border: "none", fontWeight: 600
                }}>
                  Close
                </button>
              </div>
            )}
          </div>
        )}

      </div>
      <Footer />
    </div>
  );
}

export default EMRPage;
