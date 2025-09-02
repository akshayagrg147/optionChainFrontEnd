import React, { useEffect, useState } from "react";

// Your Upstox App credentials
const CLIENT_ID = "e2468cce-a478-4f9a-8340-2ceb52187087";
const CLIENT_SECRET = "lhb2maqkcs"; // Keep this secret in production
const REDIRECT_URI = "http://localhost:3000/"; // Update with your actual redirect URI

export default function UpstoxAuth() {
  const [users, setUsers] = useState([]);

  const handleLogin = () => {
    const authUrl = `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}`;
    window.location.href = authUrl;
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get("code");

    if (authCode) {
      // Exchange code for tokens directly from client
      fetch("https://api.upstox.com/v2/login/authorization/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: authCode,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.access_token) {
            setUsers((prev) => [...prev, data]);
            alert("Token saved ✅");
            // Remove code from URL
            window.history.replaceState({}, document.title, "/");
          }
        });
    }
  }, []);

  // Export tokens to CSV
  const downloadCSV = () => {
    if (users.length === 0) return alert("No tokens yet!");

    const headers = ["access_token", "refresh_token", "expires_in"];
    const rows = users.map((u) =>
      [u.access_token, u.refresh_token, u.expires_in].join(",")
    );

    const csvContent =
      headers.join(",") + "\n" + rows.join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "upstox_tokens.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Upstox Multi-User Token Manager</h1>
      <button
        onClick={handleLogin}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg mb-4"
      >
        Connect with Upstox
      </button>

      {users.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mb-2">Saved Users</h2>
          <ul className="mb-4">
            {users.map((u, i) => (
              <li key={i} className="text-sm">
                User {i + 1} – Token: {u.access_token.slice(0, 10)}...
              </li>
            ))}
          </ul>
          <button
            onClick={downloadCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            Download CSV
          </button>
        </>
      )}
    </div>
  );
}
