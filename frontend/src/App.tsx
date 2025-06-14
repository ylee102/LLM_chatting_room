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
} from '@mui/material';
import axios from 'axios';

interface Message {
  speaker: string;
  message: string;
}

function App() {
  const [topic, setTopic] = useState('');
  const [roleA, setRoleA] = useState('');
  const [roleB, setRoleB] = useState('');
  const [turns, setTurns] = useState(3);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:8000/simulate', {
        topic,
        role_a: roleA,
        role_b: roleB,
        turns,
      });
      
      setConversation(response.data.conversation);
    } catch (err) {
      setError('Failed to simulate conversation. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        LLM Chatting Room
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Role A"
            value={roleA}
            onChange={(e) => setRoleA(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Role B"
            value={roleB}
            onChange={(e) => setRoleB(e.target.value)}
            margin="normal"
            required
          />
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