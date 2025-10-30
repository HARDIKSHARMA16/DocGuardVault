import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

const shorten = (addr) =>
  addr ? addr.slice(0, 6) + "..." + addr.slice(-4) : "";
const formatDate = (ts) => (ts ? new Date(ts * 1000).toLocaleString() : "");

function AuditTrail() {
  const navigate = useNavigate();
  const [auditTrail, setAuditTrail] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load audit trail data from backend
  const loadAuditTrail = async () => {
    setAuditTrail([]);
    setLoading(true);
    setError("");
    try {
      const resp = await fetch("http://localhost:5002/auditTrail");
      const text = await resp.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error("Server returned non-JSON response:\n" + text);
      }
      if (json.status === "success") {
        setAuditTrail(json.data);
      } else {
        setError(json.error || "Unknown error loading audit trail.");
      }
    } catch (e) {
      setError("Error fetching audit trail: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadAuditTrail();
  }, []);

  return (
    <div className="app">
      <div className="container">
        <h2 className="title" style={{ marginBottom: "20px" }}>
          Audit Trail
        </h2>

        {loading && <p style={{ color: "#cbd5e1" }}>Loading...</p>}
        {error && <p style={{ color: "#ef4444" }}>{error}</p>}

        {!loading && !error && auditTrail.length === 0 ? (
          <p style={{ color: "#cbd5e1" }}>No files uploaded yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "20px" }}>
            {auditTrail.map((ev) => (
              <div
                key={ev.fileHash}
                style={{
                  background: "#1e293b",
                  padding: "16px",
                  borderRadius: "12px",
                  boxShadow: "0px 4px 12px rgba(0,0,0,0.3)",
                }}
              >
                <div>
                  <p style={{ color: "#e2e8f0", marginBottom: "8px" }}>
                    <strong>File Hash:</strong> {shorten(ev.fileHash)}
                  </p>
                  <p style={{ color: "#e2e8f0", marginBottom: "8px" }}>
                    <strong>Uploader:</strong> {shorten(ev.uploader)}
                  </p>
                  <p style={{ color: "#e2e8f0", marginBottom: "8px" }}>
                    <strong>Time:</strong> {formatDate(ev.timestamp)}
                  </p>
                  <a
                    href={`https://ipfs.io/ipfs/${ev.ipfsCID}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#38bdf8",
                      fontSize: "14px",
                      textDecoration: "underline",
                    }}
                  >
                    View on IPFS
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditTrail;
