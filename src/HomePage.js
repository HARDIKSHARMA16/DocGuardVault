import React from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="app">
      <div className="container">
        <h1
          className="title"
          style={{ fontSize: "32px", marginBottom: "24px" }}
        >
          File Authentication and Verification System
        </h1>

        <p
          style={{
            color: "#cbd5e1",
            fontSize: "18px",
            lineHeight: "1.8",
            marginBottom: "24px",
          }}
        >
          Welcome to the trusted and secure platform for handling{" "}
          <strong>Files</strong>. This system ensures every file is:
        </p>

        <ul
          style={{
            color: "#e2e8f0",
            fontSize: "17px",
            paddingLeft: "20px",
            lineHeight: "1.9",
            marginBottom: "30px",
          }}
        >
          <li>Cryptographically verified using blockchain technology</li>
          <li>Logged immutably to prevent tampering or rollback</li>
          <li>Independently verifiable for data integrity and authenticity</li>
        </ul>

        {/* Centered Button */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            onClick={() => navigate("/emr")}
            style={{
              marginTop: "20px",
              fontSize: "18px",
              padding: "14px 36px",
              borderRadius: "12px",
              border: "none",
              cursor: "pointer",
              fontWeight: "600",
              color: "white",
              background: "linear-gradient(90deg, #4facfe 0%, #003ffeff 100%)",
              boxShadow: "0px 6px 18px rgba(0, 242, 254, 0.4)",
              transition: "all 0.3s ease-in-out",
            }}
            onMouseOver={(e) =>
              (e.target.style.background =
                "linear-gradient(90deg, #43e97b 0%, #04721cff 100%)")
            }
            onMouseOut={(e) =>
              (e.target.style.background =
                "linear-gradient(90deg, #4facfe 0%,  #003ffeff 100%)")
            }
          >
            Proceed to Upload & Verify Files
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
