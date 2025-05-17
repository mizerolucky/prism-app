import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [fullResponse, setFullResponse] = useState('');
  const [typingSpeed, setTypingSpeed] = useState(30); // ms per character
  const messagesEndRef = useRef(null);
  
  // Scroll to bottom whenever messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingText]);

  // Effect for typewriter animation
  useEffect(() => {
    if (isTyping && fullResponse) {
      if (typingText.length < fullResponse.length) {
        const timeout = setTimeout(() => {
          setTypingText(fullResponse.substring(0, typingText.length + 1));
        }, typingSpeed);
        
        return () => clearTimeout(timeout);
      } else {
        // Typing complete
        setIsTyping(false);
        
        // Update the messages array with the complete response
        setMessages(prevMessages => {
          const updatedMessages = [...prevMessages];
          // Replace the temporary typing message with the complete message
          updatedMessages[updatedMessages.length - 1] = {
            type: 'ai',
            content: fullResponse
          };
          return updatedMessages;
        });
        
        setFullResponse('');
        setTypingText('');
      }
    }
  }, [isTyping, typingText, fullResponse, typingSpeed]);

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

      // Stop loading
      setLoading(false);

      // Get the AI response
      const aiResponse = res.data.reply || res.data.reply;
      
      // Add a placeholder message that will be updated during typing
      setMessages(prevMessages => [...prevMessages, { type: 'ai', content: '' }]);
      
      // Start the typewriter effect
      setFullResponse(aiResponse);
      setTypingText('');
      setIsTyping(true);
      
    } catch (err) {
      console.error("API Error:", err);
      setLoading(false);
      // Add error message to chat
      const errorMessage = { type: 'error', content: `Error: ${err.message}` };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    }
  };

  // Function to render message content
  const renderMessageContent = (content, type, index) => {
    if (type === 'user') {
      // Don't parse markdown for user messages
      return <span>You: {content}</span>;
    } else if (type === 'ai') {
      // For the last AI message that's currently being typed
      if (isTyping && index === messages.length - 1) {
        return (
          <div className="ai-content">
            <span className="ai-prefix">Prism AI: </span>
            <div className="markdown-content">
              <ReactMarkdown>{typingText}</ReactMarkdown>
              <span className="cursor-blink">|</span>
            </div>
          </div>
        );
      }
      // For completed AI messages
      return (
        <div className="ai-content">
          <span className="ai-prefix">Prism AI: </span>
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
                  {renderMessageContent(msg.content, msg.type, index)}
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
            disabled={loading || isTyping}
          />
          <button
            className="send-button"
            type="submit"
            disabled={loading || isTyping || !message.trim()}
          >
            {loading ? 'Sending...' : isTyping ? 'Typing...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;