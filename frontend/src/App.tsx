import React, { useState } from 'react';
import {
  Container,
  TextField,
  Button,
  Paper,
  Typography,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import axios from 'axios';

interface Message {
  speaker: string;
  message: string;
}

const AVAILABLE_MODELS = [
  'openai/gpt-4.1-2025-04-14',
  'google/gemini-2.5-flash-preview-05-20',
  'anthropic/claude-3-opus-20240229',
  'meta-llama/llama-2-70b-chat',
] as const;

type ModelType = typeof AVAILABLE_MODELS[number];

function App() {
  const [topic, setTopic] = useState('');
  const [roleA, setRoleA] = useState('');
  const [roleB, setRoleB] = useState('');
  const [modelA, setModelA] = useState<ModelType>('openai/gpt-4.1-2025-04-14');
  const [modelB, setModelB] = useState<ModelType>('google/gemini-2.5-flash-preview-05-20');
  const [turns, setTurns] = useState(3);
  const [temperature, setTemperature] = useState(0.7);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentTurn, setCurrentTurn] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:8000/simulate', {
        topic,
        role_a: roleA,
        role_b: roleB,
        model_a: modelA,
        model_b: modelB,
        temperature,
        turns: 1,
        conversation: conversation,
      });
      
      // 새 메시지만 추가
      const newMessage = response.data.conversation[0];
      setConversation(prev => [...prev, newMessage]);
      setCurrentTurn(prev => prev + 1);
      
      // 다음 턴이 필요한 경우 예약
      if (currentTurn < turns * 2 - 1) {
        setTimeout(() => handleSubmit(e), 1000);
      }
    } catch (err) {
      setError('Failed to simulate conversation. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startNewConversation = (e: React.FormEvent) => {
    e.preventDefault();
    setConversation([]);
    setCurrentTurn(0);
    handleSubmit(e);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        LLM Chatting Room
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <form onSubmit={startNewConversation}>
          <TextField
            fullWidth
            label="Topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            margin="normal"
            required
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="Role A"
              value={roleA}
              onChange={(e) => setRoleA(e.target.value)}
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Model A</InputLabel>
              <Select
                value={modelA}
                label="Model A"
                onChange={(e) => setModelA(e.target.value as ModelType)}
                required
              >
                {AVAILABLE_MODELS.map((model) => (
                  <MenuItem key={model} value={model}>
                    {model}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="Role B"
              value={roleB}
              onChange={(e) => setRoleB(e.target.value)}
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Model B</InputLabel>
              <Select
                value={modelB}
                label="Model B"
                onChange={(e) => setModelB(e.target.value as ModelType)}
                required
              >
                {AVAILABLE_MODELS.map((model) => (
                  <MenuItem key={model} value={model}>
                    {model}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="Number of Turns"
              type="number"
              value={turns}
              onChange={(e) => setTurns(Number(e.target.value))}
              margin="normal"
              required
              inputProps={{ min: 1, max: 10 }}
            />
            <TextField
              fullWidth
              label="Temperature"
              type="number"
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              margin="normal"
              required
              inputProps={{ min: 0, max: 1, step: 0.1 }}
            />
          </Box>
          <Box sx={{ mt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Start Simulation'}
            </Button>
          </Box>
        </form>
      </Paper>

      {error && (
        <Typography color="error" align="center" gutterBottom>
          {error}
        </Typography>
      )}

      {conversation.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Conversation
          </Typography>
          <List>
            {conversation.map((msg, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemText
                    primary={`${msg.speaker === 'A' ? roleA : roleB} (${msg.speaker})`}
                    secondary={msg.message}
                  />
                </ListItem>
                {index < conversation.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Container>
  );
}

export default App; 