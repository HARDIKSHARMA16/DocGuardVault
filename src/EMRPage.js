import React, { useState } from "react";
import { ethers } from "ethers";
import contractJson from "./BlockVault.json";
import LocationCapture from "./LocationCapture";
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
  
  // Location-related state
  const [uploadLocation, setUploadLocation] = useState(null);
  const [hasLocationLock, setHasLocationLock] = useState(false);
  const [locationRadius, setLocationRadius] = useState(100);
  const [verifyLocation, setVerifyLocation] = useState(null);

  // --- Fetch audit trail ---
  const loadAuditTrail = async () => {
    setAuditTrail([]);
    setAuditLoading(true);
    setAuditError("");
    try {
      const resp = await fetch("http://localhost:5002/auditTrail");
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
    // Reset location when file changes
    setUploadLocation(null);
    setHasLocationLock(false);
  };

  const handleVerifyChange = (e) => {
    setVerifyFile(e.target.files[0]);
    setVerifyStatus("");
    setVerifyInfo(null);
    setVerifyLocation(null);
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
    formData.append("fileHash", hash); // Send the file hash
    formData.append("hasLocationLock", hasLocationLock.toString());
    if (uploadLocation) {
      formData.append("latitude", uploadLocation.latitude.toString());
      formData.append("longitude", uploadLocation.longitude.toString());
      formData.append("radius", locationRadius.toString());
    }

    try {
      const resp = await fetch("http://localhost:5002/upload", {
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
      const resp = await fetch(`http://localhost:5002/getFile/${hash}`);
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

      // Check if file has location lock
      if (data.hasLocationLock) {
        setVerifyStatus("File has location lock. Capturing your location...");
        
        // Get user's current location
        if (!navigator.geolocation) {
          setVerifyStatus("Location verification failed: Geolocation not supported");
          setVerifyInfo(null);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const userLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            };
            setVerifyLocation(userLocation);

            // Verify location with backend
            try {
              const locationResp = await fetch("http://localhost:5002/verifyLocation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  fileHash: hash,
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude
                })
              });

              const locationData = await locationResp.json();
              
              if (locationData.isValidLocation) {
                setVerifyStatus("File found and location verified!");
                setVerifyInfo({ ...data, hash, locationVerified: true, userLocation });
              } else {
                setVerifyStatus("File found but location verification failed!");
                setVerifyInfo({ ...data, hash, locationVerified: false, userLocation });
              }
            } catch (locationErr) {
              setVerifyStatus("File found but location verification failed: " + locationErr.message);
              setVerifyInfo({ ...data, hash, locationVerified: false, userLocation });
            }
          },
          (error) => {
            setVerifyStatus("File found but location access denied. Cannot verify location lock.");
            setVerifyInfo({ ...data, hash, locationVerified: false });
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        setVerifyStatus("File found!");
        setVerifyInfo({ ...data, hash, locationVerified: null });
      }
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
              
              {/* Location Lock Toggle */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                marginTop: '12px',
                padding: '12px',
                background: 'rgba(15, 23, 42, 0.5)',
                borderRadius: '8px',
                border: '1px solid rgba(148, 163, 184, 0.2)'
              }}>
                <input
                  type="checkbox"
                  id="locationLock"
                  checked={hasLocationLock}
                  onChange={(e) => setHasLocationLock(e.target.checked)}
                  style={{ transform: 'scale(1.2)' }}
                />
                <label htmlFor="locationLock" style={{ 
                  color: '#e2e8f0', 
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}>
                  🔒 Enable Location Lock
                </label>
              </div>

              {/* Location Capture Component */}
              {hasLocationLock && (
                <LocationCapture
                  onLocationChange={setUploadLocation}
                  disabled={!selectedFile}
                />
              )}

              {/* Radius Setting */}
              {hasLocationLock && uploadLocation && (
                <div style={{ 
                  marginTop: '12px',
                  padding: '12px',
                  background: 'rgba(15, 23, 42, 0.5)',
                  borderRadius: '8px',
                  border: '1px solid rgba(148, 163, 184, 0.2)'
                }}>
                  <label style={{ 
                    color: '#e2e8f0', 
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'block',
                    marginBottom: '8px'
                  }}>
                    📏 Verification Radius (meters):
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    value={locationRadius}
                    onChange={(e) => setLocationRadius(parseInt(e.target.value))}
                    style={{ width: '100%', marginBottom: '8px' }}
                  />
                  <div style={{ 
                    color: '#6b7280', 
                    fontSize: '12px',
                    textAlign: 'center'
                  }}>
                    {locationRadius}m radius
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                className="action-btn"
                disabled={hasLocationLock && !uploadLocation}
                style={{
                  opacity: hasLocationLock && !uploadLocation ? 0.6 : 1,
                  cursor: hasLocationLock && !uploadLocation ? 'not-allowed' : 'pointer'
                }}
              >
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
                
                {/* Location Information */}
                {verifyInfo.hasLocationLock !== undefined && (
                  <div style={{ 
                    marginTop: '16px', 
                    padding: '12px', 
                    background: 'rgba(15, 23, 42, 0.7)',
                    borderRadius: '8px',
                    border: '1px solid rgba(148, 163, 184, 0.2)'
                  }}>
                    <div style={{ 
                      color: '#e2e8f0', 
                      fontWeight: '600', 
                      marginBottom: '8px',
                      fontSize: '14px'
                    }}>
                      📍 Location Lock Status:
                    </div>
                    
                    {verifyInfo.hasLocationLock ? (
                      <div>
                        <div style={{ 
                          color: verifyInfo.locationVerified === true ? '#10b981' : 
                                 verifyInfo.locationVerified === false ? '#ef4444' : '#6b7280',
                          fontSize: '14px',
                          marginBottom: '8px'
                        }}>
                          {verifyInfo.locationVerified === true ? '✅ Location Verified' :
                           verifyInfo.locationVerified === false ? '❌ Location Verification Failed' :
                           '⏳ Location verification required'}
                        </div>
                        
                        {verifyInfo.userLocation && (
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            Your location: {verifyInfo.userLocation.latitude.toFixed(6)}, {verifyInfo.userLocation.longitude.toFixed(6)}
                          </div>
                        )}
                        
                        {verifyInfo.latitude && verifyInfo.longitude && (
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                            Required location: {verifyInfo.latitude.toFixed(6)}, {verifyInfo.longitude.toFixed(6)}
                            {verifyInfo.radius && ` (±${verifyInfo.radius}m)`}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ color: '#6b7280', fontSize: '14px' }}>
                        🔓 No location lock (standard verification)
                      </div>
                    )}
                  </div>
                )}
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
                    {ev.hasLocationLock && (
                      <div style={{ 
                        marginTop: '8px', 
                        fontSize: '12px', 
                        color: '#fbbf24',
                        fontWeight: '500'
                      }}>
                        🔒 Location Locked
                        {ev.latitude && ev.longitude && (
                          <span style={{ color: '#6b7280', marginLeft: '4px' }}>
                            ({ev.latitude.toFixed(4)}, {ev.longitude.toFixed(4)})
                          </span>
                        )}
                      </div>
                    )}
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
