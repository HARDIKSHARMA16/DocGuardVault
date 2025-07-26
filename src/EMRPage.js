import React, { useState } from "react";
import { ethers } from "ethers";
import "./App.css";

const shorten = (addr) => addr ? addr.slice(0, 6) + "..." + addr.slice(-4) : "";
const formatDate = (ts) => ts ? new Date(ts * 1000).toLocaleString() : "";

function EMRPage() {
  const [tab, setTab] = useState("upload");
  const [selectedFile, setSelectedFile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [txHash, setTxHash] = useState("");
  const [verifyFile, setVerifyFile] = useState(null);
  const [verifyStatus, setVerifyStatus] = useState("");
  const [verifyInfo, setVerifyInfo] = useState(null);

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
      const resp = await fetch("http://localhost:5000/upload", {
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
      const resp = await fetch(`http://localhost:5000/getFile/${hash}`);
      const data = await resp.json();

      if (!data || !data.uploader || data.uploader === "0x0000000000000000000000000000000000000000") {
        setVerifyStatus("Not found on blockchain.");
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
      : status.toLowerCase().includes("fail") || status.toLowerCase().includes("denied") || status.toLowerCase().includes("not found")
      ? "#dc2626"
      : "#2e2e2e"
  });

  return (
    <div className="app">
      <div className="container">
        <h2 className="title">MedChain Vault</h2>
        <div className="tab-switcher">
          <button className={tab === "upload" ? "tab active" : "tab"} onClick={() => setTab("upload")}>
            Upload EMR
          </button>
          <button className={tab === "verify" ? "tab active" : "tab"} onClick={() => setTab("verify")}>
            Verify EMR
          </button>
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
      </div>
      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer style={{
      marginTop: 40,
      fontSize: 16,
      color: "#95a5b6",
      textAlign: "center",
      fontWeight: 500,
      letterSpacing: "0.5px"
    }}>
      &copy; {new Date().getFullYear()} Hack Demons
    </footer>
  );
}

export default EMRPage;
