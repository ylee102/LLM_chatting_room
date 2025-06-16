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
  const [isConversationComplete, setIsConversationComplete] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [summaryModel, setSummaryModel] = useState(MODEL_OPTIONS[1].value); // default: GPT-4.1
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
    setIsConversationComplete(false);
    setSummary('');
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
    
    // 대화 완료 상태 설정
    if (!stopRequested.current) {
      setIsConversationComplete(true);
    }
    
    setIsLoading(false);
  };

  const handleStop = () => {
    stopRequested.current = true;
    setIsLoading(false);
  };

  const handleSummaryRequest = async () => {
    if (!isConversationComplete || conversation.length <= 1) {
      setError('대화가 완료되지 않았거나 요약할 내용이 없습니다.');
      return;
    }

    setIsSummaryLoading(true);
    setError('');

    try {
      // 대화 메시지만 추출 (주제 메시지 제외)
      const conversationMessages = conversation
        .filter(item => item.type === 'message')
        .map(item => ({
          speaker: item.speaker,
          message: item.text
        }));

      const response = await fetch('http://localhost:8000/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          role_a: roleA,
          role_b: roleB,
          conversation: conversationMessages,
          summary_model: summaryModel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate summary');
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      setError(error.message || 'Failed to generate summary. Please try again.');
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const handleTemperatureChange = (e) => {
    const value = e.target.value;
    const temp = value / 100;
    setTemperature(temp);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>DialogueLab</h1>
      </header>
      <main>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="topic">💬 Conversation Topic:</label>
            <input
              type="text"
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Delicious food, Travel plans, Hobbies, etc."
              required
            />
          </div>
          
          <div className="role-model-group">
            <div className="role-section">
              <label htmlFor="roleA">🤖 First Role (Speaker A):</label>
              <input
                type="text"
                id="roleA"
                value={roleA}
                onChange={(e) => setRoleA(e.target.value)}
                placeholder="e.g., Friendly person, Expert, Critical thinker"
                required
              />
              <label htmlFor="modelA">AI Model A:</label>
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
            
            <div className="role-section">
              <label htmlFor="roleB">🎭 Second Role (Speaker B):</label>
              <input
                type="text"
                id="roleB"
                value={roleB}
                onChange={(e) => setRoleB(e.target.value)}
                placeholder="e.g., Cautious friend, Opposition, Experienced person"
                required
              />
              <label htmlFor="modelB">AI Model B:</label>
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
          </div>
          
          <div className="settings-group">
            <div className="form-group">
              <label htmlFor="turns">🔄 Number of Turns:</label>
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
              <label htmlFor="temperature">🎯 MBTI Style (T ↔ F):</label>
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
                Current: {temperature.toFixed(2)} ({temperature < 0.3 ? 'Very Thinking' : temperature < 0.7 ? 'Balanced' : 'Very Feeling'})
              </div>
            </div>
          </div>
          
          <div className="button-group">
            <button type="submit" disabled={isLoading} className="start-btn">
              {isLoading ? '🔄 Conversation in Progress...' : '🚀 Start Dialogue'}
            </button>
            {isLoading && (
              <button type="button" className="stop-btn" onClick={handleStop}>
                ⏹️ Stop
              </button>
            )}
          </div>
        </form>

        {/* Summary Section */}
        {isConversationComplete && !isLoading && (
          <div className="summary-section">
            <h3>📝 Conversation Summary</h3>
            <div className="form-group">
              <label htmlFor="summaryModel">Summary Generation Model:</label>
              <select
                id="summaryModel"
                value={summaryModel}
                onChange={(e) => setSummaryModel(e.target.value)}
              >
                {MODEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <button 
              type="button" 
              className="summary-btn" 
              onClick={handleSummaryRequest}
              disabled={isSummaryLoading}
            >
              {isSummaryLoading ? '📝 Generating Summary...' : '📋 Generate Summary'}
            </button>
          </div>
        )}

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}
        
        {conversation.length > 0 && (
          <div className="conversation-header">
            <h3>💬 Conversation</h3>
            {!isConversationComplete && isLoading && (
              <div className="progress-indicator">
                In Progress... ({conversation.filter(item => item.type === 'message').length}/{turns * 2} turns)
              </div>
            )}
            {isConversationComplete && (
              <div className="completion-indicator">
                ✅ Conversation Complete! ({conversation.filter(item => item.type === 'message').length} messages)
              </div>
            )}
          </div>
        )}
        
        <div className="conversation">
          {conversation.map((item, index) => (
            item.type === 'topic' ? (
              <div key={index} className="message topic-bubble">
                <strong>💡 Topic:</strong> {item.text}
              </div>
            ) : (
              <div key={index} className={`message ${item.speaker === 'A' ? 'a-bubble' : 'b-bubble'}`}>
                <div className="speaker-info">
                  <strong>{item.speaker === 'A' ? roleA : roleB}</strong>
                  <span className="model-tag">({item.model})</span>
                </div>
                <div className="message-text">{item.text}</div>
              </div>
            )
          ))}
          {isLoading && <div className="message loading-message">🤔 Thinking...</div>}
        </div>

        {/* Summary Results */}
        {summary && (
          <div className="summary-result">
            <h3>📊 Summary Results</h3>
            <div className="summary-content">
              {summary.split('\n').map((line, index) => (
                <div key={index} className={`summary-line ${line.startsWith('##') ? 'summary-heading' : ''}`}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
