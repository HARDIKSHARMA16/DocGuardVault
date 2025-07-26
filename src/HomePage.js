import React from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="app">
      <div className="container">
        <h1 className="title" style={{ fontSize: "32px", marginBottom: "24px" }}>
          Secure EMR Upload & Verification Portal
        </h1>
        <p style={{
          color: "#cbd5e1",
          fontSize: "18px",
          lineHeight: "1.8",
          marginBottom: "24px"
        }}>
          Welcome to the trusted and secure platform for handling <strong>Electronic Medical Records</strong> (EMRs). This system ensures every file is:
        </p>
        <ul style={{
          color: "#e2e8f0",
          fontSize: "17px",
          paddingLeft: "20px",
          lineHeight: "1.9",
          marginBottom: "30px"
        }}>
          <li>Cryptographically verified using blockchain technology</li>
          <li>Logged immutably to prevent tampering or rollback</li>
          <li>Independently verifiable for data integrity and authenticity</li>
        </ul>
        <button
          className="action-btn"
          style={{
            marginTop: "20px",
            fontSize: "18px",
            padding: "12px 28px",
            borderRadius: "10px"
          }}
          onClick={() => navigate("/emr")}
        >
           Proceed to Upload & Verify EMR
        </button>
        <br />
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

export default HomePage;