import React, { useEffect, useState } from "react";
import "./App.css";

const shortAddr = addr =>
  addr ? addr.slice(0, 6) + "..." + addr.slice(-4) : "";
const formatDate = ts =>
  ts ? new Date(ts * 1000).toLocaleString() : "";

function AuditTrail() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:5000/auditTrail")
      .then(r => r.json())
      .then(res => {
        if (res.status === "success") setLogs(res.data);
        else setErr(res.error || "Failed to load audit trail");
        setLoading(false);
      })
      .catch(e => {
        setErr(e.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="container" style={{ marginTop: "32px" }}>
      <h2 style={{ fontSize: "2rem", marginBottom: 24 }}>Audit Trail</h2>
      {loading && <div className="status">Loading...</div>}
      {err && (
        <div className="status" style={{ color: "red", fontWeight: 600 }}>
          {err}
        </div>
      )}
      {!loading && !err && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#11182e", color: "#94f4eb" }}>
                <th>#</th>
                <th>File Hash</th>
                <th>Uploader</th>
                <th>IPFS CID</th>
                <th>Signature</th>
                <th>Timestamp</th>
                <th>Tx</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ color: "#888" }}>
                    No uploads yet.
                  </td>
                </tr>
              )}
              {logs.map((log, idx) => (
                <tr key={log.txHash}>
                  <td>{idx + 1}</td>
                  <td style={{ fontFamily: "monospace" }}>{log.fileHash.slice(0, 8) + "..."}</td>
                  <td>
                    <a
                      href={`https://amoy.polygonscan.com/address/${log.uploader}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#8ecae6", textDecoration: "none" }}
                    >
                      {shortAddr(log.uploader)}
                    </a>
                  </td>
                  <td>
                    <a
                      href={`https://ipfs.io/ipfs/${log.ipfsCID}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#f5a623" }}
                    >
                      {log.ipfsCID.slice(0, 8)}...
                    </a>
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: "0.82em" }}>
                    {log.signature.slice(0, 8)}...
                  </td>
                  <td>{formatDate(log.timestamp)}</td>
                  <td>
                    <a
                      href={`https://amoy.polygonscan.com/tx/${log.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#77dd77" }}
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <footer style={{ marginbottom: 32, color: "#aaa", fontSize: "16px", textAlign: "center" }}>
        &copy; {new Date().getFullYear()} Team Hack Demons
      </footer>
    </div>
  );
}

export default AuditTrail;
