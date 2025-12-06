import React, { useState, useEffect, useRef } from "react";

export default function SearchBar({ onSearch, inputValue = null, onInputChange = null, modeValue = null, onModeChange = null }) {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("or");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const wrapperRef = useRef(null);

  const currentInput = inputValue !== null ? inputValue : input;
  const currentMode = modeValue !== null ? modeValue : mode;

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!currentInput || currentInput.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      try {
        const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(currentInput.trim())}`);
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
        setShowSuggestions(data.length > 0);
      } catch (err) {
        console.error("Erreur autocomplete:", err);
        setSuggestions([]);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [currentInput]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentInput || currentInput.trim() === "") {
      alert('Il faut écrire quelque chose');
      return;
    }
    setShowSuggestions(false);
    onSearch(currentInput, currentMode);
  };

  const handleSuggestionClick = (suggestion) => {
    if (onInputChange) onInputChange(suggestion);
    else setInput(suggestion);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestionIndex(i => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestionIndex(i => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && activeSuggestionIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[activeSuggestionIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="d-flex justify-content-center align-items-center flex-wrap gap-2">
      <div ref={wrapperRef} style={{ position: 'relative', flex: '1', maxWidth: '600px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          border: '1px solid #dfe1e5',
          borderRadius: '24px',
          padding: '5px 15px',
          boxShadow: '0 1px 6px rgba(32,33,36,.28)',
          background: 'white'
        }}>
          <span style={{ color: '#9aa0a6', fontSize: '1.2rem', marginRight: '10px' }}>🔍</span>
          <input
            type="text"
            className="form-control border-0"
            placeholder="Rechercher..."
            value={currentInput}
            onChange={(e) => {
              if (onInputChange) onInputChange(e.target.value);
              else setInput(e.target.value);
              setActiveSuggestionIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            style={{ boxShadow: 'none', outline: 'none', padding: '5px 0' }}
          />
          <button 
            type="submit" 
            className="btn btn-link p-0 ms-2"
            style={{ color: '#4285f4', fontSize: '1.2rem', textDecoration: 'none' }}
          >
            ▶
          </button>
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <ul style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: '1px solid #dfe1e5',
            borderRadius: '0 0 24px 24px',
            boxShadow: '0 4px 6px rgba(32,33,36,.28)',
            listStyle: 'none',
            margin: 0,
            padding: '8px 0',
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 1000,
            marginTop: '-8px'
          }}>
            {suggestions.map((s, idx) => {
              const isExactMatch = s.toLowerCase().startsWith(currentInput.toLowerCase());
              return (
                <li
                  key={idx}
                  onClick={() => handleSuggestionClick(s)}
                  style={{
                    padding: '8px 20px',
                    cursor: 'pointer',
                    background: idx === activeSuggestionIndex ? '#f0f0f0' : 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.95rem'
                  }}
                  onMouseEnter={() => setActiveSuggestionIndex(idx)}
                >
                  <span style={{ color: '#9aa0a6' }}>🔍</span>
                  <span>{s}</span>
                  {!isExactMatch && <span style={{fontSize:'0.7rem', color:'#f59e0b', marginLeft: 'auto'}}>correction</span>}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <select
        className="form-select"
        style={{ 
          maxWidth: "200px",
          border: '1px solid #dfe1e5',
          borderRadius: '24px',
          padding: '8px 16px',
          fontSize: '0.9rem',
          color: '#5f6368'
        }}
        value={currentMode}
        onChange={(e) => {
          if (onModeChange) onModeChange(e.target.value);
          else setMode(e.target.value);
        }}
      >
        <option value="all_words_and">∀ Tous les mots (ET)</option>
        <option value="or">∃ N'importe quel mot (OU)</option>
        <option value="exact">= Phrase exacte</option>
      </select>
    </form>
  );
}
