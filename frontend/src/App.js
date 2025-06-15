import React, { useState, useRef } from 'react';
import './App.css';

const MODEL_OPTIONS = [
  { value: 'google/gemini-2.5-flash-preview-05-20', label: 'Google Gemini 2.5' },
  { value: 'openai/gpt-4.1-2025-04-14', label: 'OpenAI GPT-4.1' },
  { value: 'openai/gpt-4.1-mini', label: 'OpenAI GPT-4.1 Mini' },
  { value: 'deepseek/deepseek-r1-0528:free', label: 'DeepSeek R1' },
  { value: 'anthropic/claude-sonnet-4', label: 'Anthropic Claude Sonnet 4' },
  { value: 'x-ai/grok-3-beta', label: 'xAI Grok 3 Beta' },
  { value: 'perplexity/sonar', label: 'Perplexity Sonar' },
];

function App() {
  const [topic, setTopic] = useState('');
  const [roleA, setRoleA] = useState('');
  const [roleB, setRoleB] = useState('');
  const [turns, setTurns] = useState(3);
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [error, setError] = useState('');
  const [modelA, setModelA] = useState(MODEL_OPTIONS[1].value); // default: GPT-4.1
  const [modelB, setModelB] = useState(MODEL_OPTIONS[0].value); // default: Gemini
  const stopRequested = useRef(false);

  // 모델 value로 label 찾기
  const getModelLabel = (value) => {
    const found = MODEL_OPTIONS.find((m) => m.value === value);
    return found ? found.label : value;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setConversation([]);
    stopRequested.current = false;

    // 첫 말풍선: 주제
    setConversation([{ type: 'topic', text: topic }]);

    let currentConversation = [];
    for (let i = 0; i < turns; i++) {
      if (stopRequested.current) break;
      const currentSpeaker = i % 2 === 0 ? 'A' : 'B';
      const currentRole = currentSpeaker === 'A' ? roleA : roleB;
      const currentModel = currentSpeaker === 'A' ? modelA : modelB;
      try {
        const response = await fetch('http://localhost:8000/simulate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic,
            role_a: roleA,
            role_b: roleB,
            turns: 1, // 한 턴씩만 요청
            temperature,
            model_a: modelA,
            model_b: modelB,
            conversation: currentConversation, // 이전 대화 전달(추후 백엔드에서 지원 시)
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to simulate conversation');
        }
        const data = await response.json();
        // data.conversation은 항상 1턴만 반환한다고 가정
        const answer = data.conversation[0];
        setConversation((prev) => [
          ...prev,
          {
            type: 'message',
            model: getModelLabel(currentModel),
            text: answer.message,
            speaker: currentSpeaker,
          },
        ]);
        // 다음 턴을 위해 대화 기록에 추가
        currentConversation.push({
          speaker: currentSpeaker,
          message: answer.message,
        });
      } catch (error) {
        setError(error.message || 'Failed to connect to the server. Please try again.');
        break;
      }
    }
    setIsLoading(false);
  };

  const handleStop = () => {
    stopRequested.current = true;
    setIsLoading(false);
  };

  const handleTemperatureChange = (e) => {
    const value = e.target.value;
    const temp = value / 100;
    setTemperature(temp);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>LLM Chatting Room</h1>
      </header>
      <main>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="topic">Topic:</label>
            <input
              type="text"
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="roleA">Role A (Speaker A):</label>
            <input
              type="text"
              id="roleA"
              value={roleA}
              onChange={(e) => setRoleA(e.target.value)}
              required
            />
            <label htmlFor="modelA">Model for Role A:</label>
            <select
              id="modelA"
              value={modelA}
              onChange={(e) => setModelA(e.target.value)}
            >
              {MODEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="roleB">Role B (Speaker B):</label>
            <input
              type="text"
              id="roleB"
              value={roleB}
              onChange={(e) => setRoleB(e.target.value)}
              required
            />
            <label htmlFor="modelB">Model for Role B:</label>
            <select
              id="modelB"
              value={modelB}
              onChange={(e) => setModelB(e.target.value)}
            >
              {MODEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="turns">Number of Turns:</label>
            <input
              type="number"
              id="turns"
              value={turns}
              onChange={(e) => setTurns(parseInt(e.target.value))}
              min="1"
              max="10"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="temperature">MBTI Style (T-F):</label>
            <div className="temperature-slider">
              <span>T</span>
              <input
                type="range"
                id="temperature"
                min="0"
                max="100"
                value={temperature * 100}
                onChange={handleTemperatureChange}
              />
              <span>F</span>
            </div>
            <div className="temperature-value">
              Current: {temperature.toFixed(2)}
            </div>
          </div>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Simulating...' : 'Start Simulation'}
          </button>
          {isLoading && (
            <button type="button" className="stop-btn" onClick={handleStop} style={{marginLeft: '10px'}}>
              답변 중지
            </button>
          )}
        </form>
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        <div className="conversation">
          {conversation.map((item, index) => (
            item.type === 'topic' ? (
              <div key={index} className="message topic-bubble">
                <strong>주제:</strong> {item.text}
              </div>
            ) : (
              <div key={index} className={`message ${item.speaker === 'A' ? 'a-bubble' : 'b-bubble'}`}>
                <strong>{item.model}:</strong> {item.text}
              </div>
            )
          ))}
          {isLoading && <div className="message loading-message">로딩 중...</div>}
        </div>
      </main>
    </div>
  );
}

export default App;
