import React, { useState } from "react";
import "./App.css";

function AuditTrail() {
  // Sample state (in real app, this will come from blockchain/IPFS API)
  const [files, setFiles] = useState([
    {
      name: "File1.png",
      ipfsHash: "Qm123456789",
      url: "https://ipfs.io/ipfs/Qm123456789",
    },
    {
      name: "Report.pdf",
      ipfsHash: "Qm987654321",
      url: "https://ipfs.io/ipfs/Qm987654321",
    },
  ]);

  // Function to delete file (logical delete)
  const handleDelete = (hash) => {
    const updatedFiles = files.filter((file) => file.ipfsHash !== hash);
    setFiles(updatedFiles);
  };

  return (
    <div className="app">
      <div className="container">
        <h2 className="title" style={{ marginBottom: "20px" }}>
          Audit Trail
        </h2>

        {files.length === 0 ? (
          <p style={{ color: "#cbd5e1" }}>No files uploaded yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "20px" }}>
            {files.map((file) => (
              <div
                key={file.ipfsHash}
                style={{
                  background: "#1e293b",
                  padding: "16px",
                  borderRadius: "12px",
                  boxShadow: "0px 4px 12px rgba(0,0,0,0.3)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <p style={{ color: "#e2e8f0", marginBottom: "8px" }}>
                    <strong>{file.name}</strong>
                  </p>
                  <a
                    href={file.url}
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
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(file.ipfsHash)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: "600",
                    color: "white",
                    background: "linear-gradient(90deg, #ff5f6d, #ffc371)",
                    boxShadow: "0px 4px 12px rgba(255, 95, 109, 0.4)",
                    transition: "all 0.3s ease-in-out",
                  }}
                  onMouseOver={(e) =>
                    (e.target.style.background =
                      "linear-gradient(90deg, #ff416c, #ff4b2b)")
                  }
                  onMouseOut={(e) =>
                    (e.target.style.background =
                      "linear-gradient(90deg, #ff5f6d, #ffc371)")
                  }
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditTrail;
