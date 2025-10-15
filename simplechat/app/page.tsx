'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Container,
  CircularProgress,
  ThemeProvider,
  createTheme,
  IconButton,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#616161',
    },
    secondary: {
      main: '#9e9e9e',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
  },
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Carica i messaggi all'avvio
  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const response = await fetch('/api/chat');
      const data = await response.json();
      if (response.ok) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Aggiorna con tutti i messaggi dal server
        setMessages(data.allMessages);
      } else {
        setMessages([
          ...messages,
          userMessage,
          {
            role: 'assistant',
            content: `Error: ${data.error}`,
          },
        ]);
      }
    } catch (error) {
      setMessages([
        ...messages,
        userMessage,
        {
          role: 'assistant',
          content: 'Error: Failed to connect to the server',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = async () => {
    if (!confirm('Vuoi cancellare tutta la conversazione?')) return;

    try {
      const response = await fetch('/api/chat', {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error clearing messages:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: '#e0e0e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <Container maxWidth="md">
          <Paper
            elevation={3}
            sx={{
              height: '85vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#fafafa',
            }}
          >
            <Box
              sx={{
                p: 2,
                borderBottom: '1px solid #bdbdbd',
                backgroundColor: '#616161',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="h5" sx={{ color: '#ffffff' }}>
                SimpleChat - ChatGPT Test
              </Typography>
              <Box>
                <IconButton
                  onClick={loadMessages}
                  sx={{ color: '#ffffff', mr: 1 }}
                  title="Ricarica messaggi"
                >
                  <RefreshIcon />
                </IconButton>
                <IconButton
                  onClick={clearMessages}
                  sx={{ color: '#ffffff' }}
                  title="Cancella conversazione"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>

            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              {messages.length === 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                  }}
                >
                  <Typography variant="body1" color="text.secondary">
                    Invia un messaggio per iniziare la conversazione
                  </Typography>
                </Box>
              )}

              {messages.map((message, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent:
                      message.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <Paper
                    sx={{
                      p: 2,
                      maxWidth: '70%',
                      backgroundColor:
                        message.role === 'user' ? '#757575' : '#e0e0e0',
                      color: message.role === 'user' ? '#ffffff' : '#212121',
                    }}
                  >
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {message.content}
                    </Typography>
                  </Paper>
                </Box>
              ))}

              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <Paper sx={{ p: 2, backgroundColor: '#e0e0e0' }}>
                    <CircularProgress size={24} sx={{ color: '#616161' }} />
                  </Paper>
                </Box>
              )}
            </Box>

            <Box
              sx={{
                p: 2,
                borderTop: '1px solid #bdbdbd',
                backgroundColor: '#ffffff',
              }}
            >
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Scrivi un messaggio..."
                  disabled={loading}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#fafafa',
                    },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  sx={{
                    minWidth: '60px',
                    backgroundColor: '#616161',
                    '&:hover': {
                      backgroundColor: '#424242',
                    },
                  }}
                >
                  <SendIcon />
                </Button>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
