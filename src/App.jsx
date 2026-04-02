import React, { useState } from 'react';
import { Sparkles, Image as ImageIcon, Wand2, Download, AlertCircle, Maximize2 } from 'lucide-react';
import './index.css';

function App() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!response.ok) {
        // Attempt to extract the server-provided error message
        let errorMsg = `API returned an error (${response.status}).`;
        try {
          const errorData = await response.json();
          if (errorData.error) errorMsg = errorData.error;
        } catch (e) {
          // Fallback if parsing fails
        }
        throw new Error(errorMsg);
      }

      const blob = await response.blob();
      const newImage = URL.createObjectURL(blob);
      setImageUrl(newImage);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to generate image. Please try again later.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFullscreen = () => {
    if (imageUrl) {
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <div className="app-container">
      {/* Left Panel: Input & Controls */}
      <div className="panel input-panel">
        <div className="brand">
          <h1 className="brand-title">
            <Sparkles size={40} color="var(--primary)" />
            <span className="brand-text">DreamSpace</span>
          </h1>
          <p className="brand-subtitle">
            Harness the power of Stable Diffusion XL to bring your imagination to life.
          </p>
        </div>

        <div className="input-group">
          <label className="input-label">
            <Wand2 size={18} color="var(--accent)" />
            Prompt Description
          </label>
          <textarea
            className="text-area"
            placeholder="A futuristic city with flying cars at sunset, highly detailed, cyberpunk aesthetic..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
            disabled={isGenerating}
          />
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <button
          className="generate-btn"
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
        >
          {isGenerating ? (
            <>
              <div className="loader-spinner"></div>
              <span>Synthesizing...</span>
            </>
          ) : (
            <>
              <span>Generate Masterpiece</span>
              <Sparkles size={20} />
            </>
          )}
        </button>
      </div>

      {/* Right Panel: Image Display */}
      <div className="panel preview-panel">
        <div className={`image-container ${imageUrl ? 'has-image' : ''}`}>

          {isGenerating && (
            <div className="shimmer-bg"></div>
          )}

          {isGenerating && !imageUrl && (
            <div className="loading-text">
              <div className="loader-spinner lg"></div>
              <span>Waking up the AI model...</span>
            </div>
          )}

          {imageUrl ? (
            <>
              <img src={imageUrl} alt={prompt} className="generated-image" />
              {!isGenerating && (
                <div className="action-buttons">
                  <button
                    onClick={handleFullscreen}
                    className="icon-btn"
                    title="View Fullscreen"
                  >
                    <Maximize2 size={20} />
                  </button>
                  <a
                    href={imageUrl}
                    className="icon-btn"
                    title="Download Image"
                    download="dreamspace-creation.png"
                  >
                    <Download size={20} />
                  </a>
                </div>
              )}
            </>
          ) : (
            !isGenerating && (
              <div className="empty-state">
                <div className="empty-icon-wrapper">
                  <ImageIcon size={32} />
                </div>
                <div>
                  <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>No Image Yet</h3>
                  <p>Provide a detailed prompt and hit generate to see the magic happen.</p>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
