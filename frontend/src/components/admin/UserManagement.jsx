import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Card,
  CardContent,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(''); // 'view', 'edit', 'suspend', 'delete'
  const [actionResult, setActionResult] = useState(null);

  // Mock user data - in real implementation, this would come from API
  useEffect(() => {
    const mockUsers = [
      {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@email.com',
        role: 'user',
        status: 'active',
        isVerified: true,
        createdAt: new Date('2024-01-15'),
        lastLogin: new Date('2024-01-20'),
        vehicleListings: 0,
        bookings: 3,
      },
      {
        id: 2,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@dealership.com',
        role: 'dealer',
        status: 'active',
        isVerified: true,
        createdAt: new Date('2024-01-10'),
        lastLogin: new Date('2024-01-19'),
        vehicleListings: 15,
        bookings: 0,
      },
      {
        id: 3,
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike.johnson@service.com',
        role: 'service_provider',
        status: 'suspended',
        isVerified: true,
        createdAt: new Date('2024-01-05'),
        lastLogin: new Date('2024-01-18'),
        vehicleListings: 0,
        bookings: 25,
      },
      {
        id: 4,
        firstName: 'Sarah',
        lastName: 'Wilson',
        email: 'sarah.wilson@email.com',
        role: 'user',
        status: 'active',
        isVerified: false,
        createdAt: new Date('2024-01-20'),
        lastLogin: null,
        vehicleListings: 0,
        bookings: 0,
      },
    ];
    setUsers(mockUsers);
    setFilteredUsers(mockUsers);
  }, []);

  // Filter users based on search term, role, and status
  useEffect(() => {
    let filtered = users.filter(user => {
      const matchesSearch = 
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
    
    setFilteredUsers(filtered);
    setPage(0);
  }, [users, searchTerm, roleFilter, statusFilter]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleDialogOpen = (type) => {
    setDialogType(type);
    setDialogOpen(true);
    handleMenuClose();
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedUser(null);
    setDialogType('');
    setActionResult(null);
  };

  const handleUserAction = async (action) => {
    // Mock API call - in real implementation, this would call the backend
    try {
      let message = '';
      switch (action) {
        case 'suspend':
          message = `User ${selectedUser.email} has been suspended`;
          // Update local state
          setUsers(prev => prev.map(user => 
            user.id === selectedUser.id 
              ? { ...user, status: 'suspended' }
              : user
          ));
          break;
        case 'activate':
          message = `User ${selectedUser.email} has been activated`;
          setUsers(prev => prev.map(user => 
            user.id === selectedUser.id 
              ? { ...user, status: 'active' }
              : user
          ));
          break;
        case 'delete':
          message = `User ${selectedUser.email} has been deleted`;
          setUsers(prev => prev.filter(user => user.id !== selectedUser.id));
          break;
        default:
          message = 'Action completed successfully';
      }
      
      setActionResult({ type: 'success', message });
      setTimeout(() => {
        handleDialogClose();
      }, 2000);
    } catch (error) {
      setActionResult({ type: 'error', message: 'Action failed. Please try again.' });
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'dealer':
        return 'primary';
      case 'service_provider':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'suspended':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const UserDetailsDialog = () => (
    <Dialog open={dialogOpen && dialogType === 'view'} onClose={handleDialogClose} maxWidth="md" fullWidth>
      <DialogTitle>User Details</DialogTitle>
      <DialogContent>
        {selectedUser && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Personal Information
                  </Typography>
                  <Typography><strong>Name:</strong> {selectedUser.firstName} {selectedUser.lastName}</Typography>
                  <Typography><strong>Email:</strong> {selectedUser.email}</Typography>
                  <Typography><strong>Role:</strong> 
                    <Chip 
                      label={selectedUser.role} 
                      color={getRoleColor(selectedUser.role)} 
                      size="small" 
                      sx={{ ml: 1 }} 
                    />
                  </Typography>
                  <Typography><strong>Status:</strong> 
                    <Chip 
                      label={selectedUser.status} 
                      color={getStatusColor(selectedUser.status)} 
                      size="small" 
                      sx={{ ml: 1 }} 
                    />
                  </Typography>
                  <Typography><strong>Verified:</strong> {selectedUser.isVerified ? 'Yes' : 'No'}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Activity Information
                  </Typography>
                  <Typography><strong>Created:</strong> {selectedUser.createdAt.toLocaleDateString()}</Typography>
                  <Typography><strong>Last Login:</strong> {selectedUser.lastLogin?.toLocaleDateString() || 'Never'}</Typography>
                  <Typography><strong>Vehicle Listings:</strong> {selectedUser.vehicleListings}</Typography>
                  <Typography><strong>Bookings:</strong> {selectedUser.bookings}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDialogClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  const ActionDialog = () => (
    <Dialog open={dialogOpen && ['suspend', 'delete'].includes(dialogType)} onClose={handleDialogClose}>
      <DialogTitle>
        {dialogType === 'suspend' ? 'Suspend User' : 'Delete User'}
      </DialogTitle>
      <DialogContent>
        {actionResult ? (
          <Alert severity={actionResult.type} sx={{ mt: 2 }}>
            {actionResult.message}
          </Alert>
        ) : (
          <>
            <Typography>
              Are you sure you want to {dialogType} user <strong>{selectedUser?.email}</strong>?
            </Typography>
            {dialogType === 'delete' && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This action cannot be undone. All user data will be permanently deleted.
              </Alert>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        {!actionResult && (
          <>
            <Button onClick={handleDialogClose}>Cancel</Button>
            <Button 
              onClick={() => handleUserAction(dialogType)} 
              color={dialogType === 'delete' ? 'error' : 'warning'}
              variant="contained"
            >
              {dialogType === 'suspend' ? 'Suspend' : 'Delete'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        User Management
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={roleFilter}
                label="Role"
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <MenuItem value="all">All Roles</MenuItem>
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="dealer">Dealer</MenuItem>
                <MenuItem value="service_provider">Service Provider</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Verified</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={user.role} 
                      color={getRoleColor(user.role)} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={user.status} 
                      color={getStatusColor(user.status)} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    {user.isVerified ? (
                      <CheckCircleIcon color="success" />
                    ) : (
                      <BlockIcon color="error" />
                    )}
                  </TableCell>
                  <TableCell>{user.createdAt.toLocaleDateString()}</TableCell>
                  <TableCell>
                    {user.lastLogin ? user.lastLogin.toLocaleDateString() : 'Never'}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="More actions">
                      <IconButton onClick={(e) => handleMenuOpen(e, user)}>
                        <MoreVertIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleDialogOpen('view')}>
          <VisibilityIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleDialogOpen('edit')}>
          <EditIcon sx={{ mr: 1 }} />
          Edit User
        </MenuItem>
        {selectedUser?.status === 'active' ? (
          <MenuItem onClick={() => handleDialogOpen('suspend')}>
            <BlockIcon sx={{ mr: 1 }} />
            Suspend User
          </MenuItem>
        ) : (
          <MenuItem onClick={() => handleUserAction('activate')}>
            <CheckCircleIcon sx={{ mr: 1 }} />
            Activate User
          </MenuItem>
        )}
        <MenuItem onClick={() => handleDialogOpen('delete')} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete User
        </MenuItem>
      </Menu>

      {/* Dialogs */}
      <UserDetailsDialog />
      <ActionDialog />
    </Box>
  );
};

export default UserManagement;