import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Block as BlockIcon,
  CheckCircle as ApproveIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

const ContentModeration = () => {
  const [selectedContent, setSelectedContent] = useState(null);
  const [moderationDialog, setModerationDialog] = useState(false);
  const [moderationAction, setModerationAction] = useState('');
  const [moderationReason, setModerationReason] = useState('');

  // Mock content data - in real implementation, this would come from API
  const [contentItems] = useState([
    {
      id: 1,
      type: 'Vehicle Listing',
      title: '2020 BMW X5 - Luxury SUV',
      author: 'john.dealer@example.com',
      status: 'pending',
      reportCount: 2,
      createdAt: '2024-01-15T10:30:00Z',
      content: 'Excellent condition BMW X5 with low mileage...',
    },
    {
      id: 2,
      type: 'User Review',
      title: 'Review for AutoFix Garage',
      author: 'customer@example.com',
      status: 'approved',
      reportCount: 0,
      createdAt: '2024-01-14T15:45:00Z',
      content: 'Great service, highly recommended!',
    },
    {
      id: 3,
      type: 'Message',
      title: 'Conversation between users',
      author: 'user1@example.com',
      status: 'flagged',
      reportCount: 5,
      createdAt: '2024-01-13T09:20:00Z',
      content: 'Inappropriate content reported by multiple users...',
    },
  ]);

  const handleModerationAction = (content, action) => {
    setSelectedContent(content);
    setModerationAction(action);
    setModerationDialog(true);
  };

  const handleModerationSubmit = () => {
    // In real implementation, this would call API to perform moderation action
    console.log('Moderation action:', {
      contentId: selectedContent.id,
      action: moderationAction,
      reason: moderationReason,
    });
    
    setModerationDialog(false);
    setSelectedContent(null);
    setModerationAction('');
    setModerationReason('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'flagged': return 'error';
      case 'blocked': return 'default';
      default: return 'default';
    }
  };

  const getReportSeverity = (count) => {
    if (count === 0) return 'success';
    if (count <= 2) return 'warning';
    return 'error';
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Content Moderation
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Review and moderate user-generated content including vehicle listings, reviews, and messages.
      </Typography>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Author</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Reports</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contentItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Chip label={item.type} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {item.title}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.author}</TableCell>
                    <TableCell>
                      <Chip 
                        label={item.status} 
                        color={getStatusColor(item.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={item.reportCount}
                        color={getReportSeverity(item.reportCount)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => handleModerationAction(item, 'view')}
                        title="View Details"
                      >
                        <ViewIcon />
                      </IconButton>
                      {item.status === 'pending' && (
                        <>
                          <IconButton 
                            size="small" 
                            color="success"
                            onClick={() => handleModerationAction(item, 'approve')}
                            title="Approve"
                          >
                            <ApproveIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleModerationAction(item, 'block')}
                            title="Block"
                          >
                            <BlockIcon />
                          </IconButton>
                        </>
                      )}
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleModerationAction(item, 'delete')}
                        title="Delete"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Moderation Action Dialog */}
      <Dialog 
        open={moderationDialog} 
        onClose={() => setModerationDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {moderationAction === 'view' ? 'Content Details' : `${moderationAction} Content`}
        </DialogTitle>
        <DialogContent>
          {selectedContent && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedContent.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                By: {selectedContent.author}
              </Typography>
              <Typography variant="body1" paragraph>
                {selectedContent.content}
              </Typography>
              
              {moderationAction !== 'view' && (
                <Box mt={2}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Action</InputLabel>
                    <Select
                      value={moderationAction}
                      label="Action"
                      onChange={(e) => setModerationAction(e.target.value)}
                    >
                      <MenuItem value="approve">Approve</MenuItem>
                      <MenuItem value="block">Block</MenuItem>
                      <MenuItem value="delete">Delete</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Reason (optional)"
                    value={moderationReason}
                    onChange={(e) => setModerationReason(e.target.value)}
                    margin="normal"
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModerationDialog(false)}>
            Cancel
          </Button>
          {moderationAction !== 'view' && (
            <Button 
              onClick={handleModerationSubmit}
              variant="contained"
              color={moderationAction === 'delete' ? 'error' : 'primary'}
            >
              {moderationAction}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContentModeration;