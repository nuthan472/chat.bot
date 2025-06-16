"use client";

import { useState, useEffect } from "react";
import { db } from "@/app/lib/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  doc,
  getDocs,
  where,
  writeBatch,
} from "firebase/firestore";

export default function AdminPage() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [selectedSessions, setSelectedSessions] = useState(new Set());

  const ADMIN_CREDENTIALS = { username: "admin", password: "admin123" };

  useEffect(() => {
    if (!authenticated) return;

    const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const uniqueSessions = [
        ...new Set(msgs.map((msg) => msg.sessionId).filter(Boolean)),
      ];
      setSessions(uniqueSessions);

      if (selectedSession) {
        const filtered = msgs.filter(
          (msg) => msg.sessionId === selectedSession
        );
        setMessages(filtered);
      }
    });

    return () => unsubscribe();
  }, [selectedSession, authenticated]);

  const sendReply = async () => {
    if (!reply.trim() || !selectedSession) return;

    await addDoc(collection(db, "messages"), {
      text: reply,
      sender: "admin",
      sessionId: selectedSession,
      timestamp: serverTimestamp(),
    });

    setReply("");
  };

  const handleLogin = () => {
    if (
      loginData.username === ADMIN_CREDENTIALS.username &&
      loginData.password === ADMIN_CREDENTIALS.password
    ) {
      setAuthenticated(true);
    } else {
      alert("Invalid credentials");
    }
  };

  const deleteMessage = async (id) => {
    await deleteDoc(doc(db, "messages", id));
  };

  const deleteSession = async (sessionId) => {
    try {
      const messagesRef = collection(db, "messages");
      const messagesQuery = query(
        messagesRef,
        where("sessionId", "==", sessionId)
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      const batch = writeBatch(db);

      messagesSnapshot.forEach((docSnap) => {
        batch.delete(doc(db, "messages", docSnap.id));
      });

      await batch.commit();

      setSessions((prev) => prev.filter((s) => s !== sessionId));
      if (selectedSession === sessionId) {
        setSelectedSession(null);
        setMessages([]);
      }

      setSelectedSessions((prev) => {
        const updated = new Set(prev);
        updated.delete(sessionId);
        return updated;
      });
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  };

  const deleteSelectedSessions = async () => {
    if (selectedSessions.size === 0) return;

    for (let sessionId of selectedSessions) {
      await deleteSession(sessionId);
    }

    setSelectedSessions(new Set());
  };

  const toggleSessionSelection = (sessionId) => {
    setSelectedSessions((prev) => {
      const updated = new Set(prev);
      if (updated.has(sessionId)) {
        updated.delete(sessionId);
      } else {
        updated.add(sessionId);
      }
      return updated;
    });
  };

  if (!authenticated) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          backgroundColor: "#0f172a",
          color: "#f1f5f9",
        }}
      >
        <h2 style={{ marginBottom: 20 }}>Admin Login</h2>
        <input
          type="text"
          placeholder="Username"
          value={loginData.username}
          onChange={(e) =>
            setLoginData({ ...loginData, username: e.target.value })
          }
          style={{ marginBottom: 10, padding: 10 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={loginData.password}
          onChange={(e) =>
            setLoginData({ ...loginData, password: e.target.value })
          }
          style={{ marginBottom: 10, padding: 10 }}
        />
        <button
          onClick={handleLogin}
          style={{
            padding: "10px 20px",
            backgroundColor: "#22c55e",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        padding: 20,
        minHeight: "100vh",
        backgroundColor: "#1e293b",
        color: "#f8fafc",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: "270px",
          borderRight: "2px solid #334155",
          paddingRight: 20,
        }}
      >
        <h2 style={{ marginBottom: 20, color: "#e2e8f0" }}>User Sessions</h2>
        <button
          onClick={deleteSelectedSessions}
          style={{
            marginBottom: 10,
            padding: "8px 12px",
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Delete Selected
        </button>

        {sessions.map((sessionId) =>
          sessionId ? (
            <div
              key={sessionId}
              style={{
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "5px",
                backgroundColor:
                  selectedSession === sessionId ? "#334155" : "#475569",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <input
                type="checkbox"
                checked={selectedSessions.has(sessionId)}
                onChange={() => toggleSessionSelection(sessionId)}
                style={{ marginRight: 5 }}
              />
              <span
                onClick={() => setSelectedSession(sessionId)}
                style={{ flex: 1 }}
              >
                {String(sessionId).slice(0, 8)}...
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSession(sessionId);
                }}
                style={{
                  marginLeft: 10,
                  background: "transparent",
                  border: "none",
                  color: "#f87171",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
          ) : null
        )}
      </div>

      {/* Chat Section */}
      <div style={{ flex: 1, paddingLeft: 20 }}>
        <h2 style={{ marginBottom: 10, color: "#f1f5f9" }}>
          Chat with:{" "}
          <span style={{ color: "#94a3b8" }}>
            {selectedSession || "Select a session"}
          </span>
        </h2>

        <div
          style={{
            height: "400px",
            overflowY: "auto",
            border: "1px solid #334155",
            padding: "10px",
            marginBottom: 10,
            borderRadius: "6px",
            background: "#0f172a",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {messages.length === 0 && selectedSession ? (
            <p style={{ color: "#94a3b8" }}>No messages yet...</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  backgroundColor:
                    msg.sender === "admin" ? "#1e40af" : "#0369a1",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  maxWidth: "80%",
                  alignSelf:
                    msg.sender === "admin" ? "flex-end" : "flex-start",
                  color: "white",
                  position: "relative",
                }}
              >
                <div>
                  <strong>{msg.sender === "admin" ? "Admin" : "User"}:</strong>{" "}
                  {msg.text}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#cbd5e1",
                    marginTop: "4px",
                  }}
                >
                  {msg.timestamp?.toDate?.().toLocaleString?.() || "Just now"}
                </div>
                <button
                  onClick={() => deleteMessage(msg.id)}
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    background: "transparent",
                    border: "none",
                    color: "#f87171",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* Reply Box */}
        {selectedSession && (
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type your reply..."
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #334155",
                backgroundColor: "#f1f5f9",
                color: "#0f172a",
              }}
            />
            <button
              onClick={sendReply}
              style={{
                padding: "10px 20px",
                backgroundColor: "#22c55e",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
