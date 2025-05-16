import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom whenever messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) return;

    // Add user message to chat
    const userMessage = { type: 'user', content: message };
    setMessages([...messages, userMessage]);

    // Clear input
    setMessage('');

    // Set loading state
    setLoading(true);

    try {
      // In your chat component or service
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      // Use in axios calls
      const res = await axios.post(`${API_URL}/api/chat`, { message });

      // Add AI response to chat
      const aiMessage = { type: 'ai', content: res.data.reply };
      setMessages(prevMessages => [...prevMessages, aiMessage]);
    } catch (err) {
      // Add error message to chat
      const errorMessage = { type: 'error', content: `Error: ${err.message}` };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Function to render message content
  const renderMessageContent = (content, type) => {
    if (type === 'user') {
      // Don't parse markdown for user messages
      return <span>You: {content}</span>;
    } else if (type === 'ai') {
      return (
        <div className="ai-content">
          <span className="ai-prefix">AI: </span>
          <div className="markdown-content">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      );
    } else {
      // For error messages
      return <span>System: {content}</span>;
    }
  };

  return (
    <div className="app-container">
      <div className="chat-container">
        <div className="chat-header">
          <h1>Prism</h1>
        </div>

        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="empty-state">
              <p>Start a conversation with Prism AI...</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.type}-message`}
              >
                <div className="message-bubble">
                  {renderMessageContent(msg.content, msg.type)}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="message ai-message">
              <div className="message-bubble loading">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="input-container" onSubmit={handleSubmit}>
          <input
            className="message-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={loading}
          />
          <button
            className="send-button"
            type="submit"
            disabled={loading || !message.trim()}
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;