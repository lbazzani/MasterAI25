'use client';

import { useState, useEffect, useRef } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4a5568',
    },
    secondary: {
      main: '#718096',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#2d3748',
      secondary: '#718096',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0 2px 4px rgba(0,0,0,0.05)',
    '0 4px 6px rgba(0,0,0,0.07)',
    '0 10px 15px rgba(0,0,0,0.1)',
    '0 20px 25px rgba(0,0,0,0.15)',
    ...Array(20).fill('0 25px 50px rgba(0,0,0,0.25)'),
  ] as any,
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface MenuItem {
  nome: string;
  descrizione: string;
  prezzo: number;
  categoria: string;
}

interface AIResponse {
  data: MenuItem[];
  message: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [menuData, setMenuData] = useState<MenuItem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll quando cambiano i messaggi o il loading
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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
        setMenuData(data.menuData || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const parseAssistantMessage = (content: string): AIResponse | null => {
    try {
      return JSON.parse(content);
    } catch {
      return null;
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
        // Aggiorna i dati del menu
        if (data.data) {
          setMenuData(data.data);
        }
      } else {
        setMessages([
          ...messages,
          userMessage,
          {
            role: 'assistant',
            content: JSON.stringify({
              data: menuData,
              message: `Error: ${data.error}`,
            }),
          },
        ]);
      }
    } catch (error) {
      setMessages([
        ...messages,
        userMessage,
        {
          role: 'assistant',
          content: JSON.stringify({
            data: menuData,
            message: 'Error: Failed to connect to the server',
          }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = async () => {
    if (!confirm('Vuoi cancellare tutta la conversazione e il menu?')) return;

    try {
      const response = await fetch('/api/chat', {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessages([]);
        setMenuData([]);
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

  const calculateTotal = () => {
    return menuData.reduce((sum, item) => sum + item.prezzo, 0).toFixed(2);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          gap: 3,
        }}
      >
        {/* Colonna sinistra - Chat */}
        <Container maxWidth="md" sx={{ flex: 1, maxWidth: '600px !important' }}>
          <Paper
            elevation={4}
            sx={{
              height: '85vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#ffffff',
              borderRadius: 3,
              overflow: 'hidden',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              },
            }}
          >
            <Box
              sx={{
                p: 3,
                backgroundColor: '#2d3748',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="h5" sx={{ color: '#ffffff', fontWeight: 600 }}>
                🍕 SimpleChat - Menu Creator
              </Typography>
              <Box>
                <IconButton
                  onClick={loadMessages}
                  sx={{
                    color: '#ffffff',
                    mr: 1,
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                  }}
                  title="Ricarica messaggi"
                >
                  <RefreshIcon />
                </IconButton>
                <IconButton
                  onClick={clearMessages}
                  sx={{
                    color: '#ffffff',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                  }}
                  title="Cancella tutto"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>

            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                backgroundColor: '#f7fafc',
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
                    Chiedi di creare un menu per il tuo ristorante
                  </Typography>
                </Box>
              )}

              {messages.map((message, index) => {
                if (message.role === 'user') {
                  return (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <Paper
                        elevation={1}
                        sx={{
                          p: 2.5,
                          maxWidth: '70%',
                          backgroundColor: '#4a5568',
                          color: '#ffffff',
                          borderRadius: 3,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }}
                      >
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                          {message.content}
                        </Typography>
                      </Paper>
                    </Box>
                  );
                } else {
                  const parsed = parseAssistantMessage(message.content);
                  return (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                      }}
                    >
                      <Paper
                        elevation={1}
                        sx={{
                          p: 2.5,
                          maxWidth: '70%',
                          backgroundColor: '#ffffff',
                          color: '#2d3748',
                          borderRadius: 3,
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        }}
                      >
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                          {parsed?.message || message.content}
                        </Typography>
                      </Paper>
                    </Box>
                  );
                }
              })}

              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2.5,
                      backgroundColor: '#ffffff',
                      borderRadius: 3,
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <CircularProgress size={24} sx={{ color: '#4a5568' }} />
                  </Paper>
                </Box>
              )}

              {/* Elemento invisibile per auto-scroll */}
              <div ref={messagesEndRef} />
            </Box>

            <Box
              sx={{
                p: 3,
                borderTop: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
              }}
            >
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Es: Vorrei ordinare una Margherita..."
                  disabled={loading}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#f7fafc',
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#4a5568',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#4a5568',
                      },
                    },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  sx={{
                    minWidth: '60px',
                    backgroundColor: '#4a5568',
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: '#2d3748',
                    },
                    '&:disabled': {
                      backgroundColor: '#cbd5e0',
                    },
                  }}
                >
                  <SendIcon />
                </Button>
              </Box>
            </Box>
          </Paper>
        </Container>

        {/* Colonna destra - Preventivo Menu */}
        <Container maxWidth="sm" sx={{ flex: 1, maxWidth: '500px !important' }}>
          <Paper
            elevation={4}
            sx={{
              height: '85vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#ffffff',
              borderRadius: 3,
              overflow: 'hidden',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              },
            }}
          >
            <Box
              sx={{
                p: 3,
                backgroundColor: '#2d3748',
              }}
            >
              <Typography variant="h5" sx={{ color: '#ffffff', fontWeight: 600 }}>
                📋 Ordinazioni
              </Typography>
            </Box>

            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                p: 3,
                backgroundColor: '#f7fafc',
              }}
            >
              {menuData.length === 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                  }}
                >
                  <Typography variant="body1" color="text.secondary">
                    Nessuna ordinazione ancora
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#e2e8f0' }}>
                        <TableCell sx={{ fontWeight: 'bold', color: '#2d3748' }}>Piatto</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: '#2d3748' }}>Categoria</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          Prezzo
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {menuData.map((item, index) => (
                        <TableRow
                          key={index}
                          sx={{
                            '&:nth-of-type(odd)': { backgroundColor: '#ffffff' },
                            '&:nth-of-type(even)': { backgroundColor: '#f7fafc' },
                            '&:hover': { backgroundColor: '#edf2f7' },
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight="500" color="#2d3748">
                              {item.nome}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.descrizione}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ textTransform: 'capitalize', color: '#4a5568' }}>
                              {item.categoria}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="600" color="#2d3748">
                              €{item.prezzo.toFixed(2)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>

            {menuData.length > 0 && (
              <Box
                sx={{
                  p: 3,
                  borderTop: '2px solid #e2e8f0',
                  backgroundColor: '#2d3748',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" fontWeight="bold" color="#ffffff">
                    Totale Piatti: {menuData.length}
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="#ffffff">
                    €{calculateTotal()}
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
