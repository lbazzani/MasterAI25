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
          backgroundColor: '#e0e0e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          gap: 2,
        }}
      >
        {/* Colonna sinistra - Chat */}
        <Container maxWidth="md" sx={{ flex: 1, maxWidth: '600px !important' }}>
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
                SimpleChat - Menu Creator
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
                        sx={{
                          p: 2,
                          maxWidth: '70%',
                          backgroundColor: '#757575',
                          color: '#ffffff',
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
                        sx={{
                          p: 2,
                          maxWidth: '70%',
                          backgroundColor: '#e0e0e0',
                          color: '#212121',
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
                  placeholder="Es: Crea un menu per un ristorante italiano..."
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

        {/* Colonna destra - Preventivo Menu */}
        <Container maxWidth="sm" sx={{ flex: 1, maxWidth: '500px !important' }}>
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
                backgroundColor: '#757575',
              }}
            >
              <Typography variant="h5" sx={{ color: '#ffffff' }}>
                Preventivo Menu
              </Typography>
            </Box>

            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                p: 2,
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
                    Nessun piatto nel menu
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#e0e0e0' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Piatto</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Categoria</TableCell>
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
                            '&:nth-of-type(odd)': { backgroundColor: '#fafafa' },
                            '&:nth-of-type(even)': { backgroundColor: '#f5f5f5' },
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight="500">
                              {item.nome}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.descrizione}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                              {item.categoria}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="500">
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
                  p: 2,
                  borderTop: '2px solid #616161',
                  backgroundColor: '#e0e0e0',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" fontWeight="bold">
                    Totale Piatti: {menuData.length}
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
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
