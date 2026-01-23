import React, { useState } from "react";
import "./Messages.css";

function Messages() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages, { sender: "You", text: input }]);
    setInput("");
  };

  return (
    <div className="msg-container">

      <h1 className="msg-title">Messages</h1>

      <div className="msg-box">
        {messages.map((m, i) => (
          <div key={i} className="msg-bubble">
            <strong>{m.sender}: </strong> {m.text}
          </div>
        ))}
      </div>

      <div className="msg-input-area">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
        />
        <button onClick={sendMessage}>Send</button>
      </div>

    </div>
  );
}

export default Messages;
