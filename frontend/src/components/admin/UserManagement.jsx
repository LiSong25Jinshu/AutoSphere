import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination,
  TextField, InputAdornment, IconButton, Chip, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  FormControl, InputLabel, Select, Grid, Alert, Tooltip, CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon, MoreVert as MoreVertIcon,
  Block as BlockIcon, CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon, Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { userAPI } from '../../services/api';

const ROLE_COLOR = { admin: 'error', dealer: 'primary', service_provider: 'secondary', user: 'default' };
const STATUS_COLOR = { active: 'success', suspended: 'error', pending: 'warning' };

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialog, setDialog] = useState(''); // 'view' | 'suspend' | 'delete'
  const [actionMsg, setActionMsg] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page: page + 1, limit: rowsPerPage };
      if (search) params.search = search;
      if (roleFilter !== 'all') params.role = roleFilter;
      const res = await userAPI.getAll(params);
      setUsers(res.data?.data || []);
      setTotal(res.data?.pagination?.total || 0);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Debounce search
  useEffect(() => {
    setPage(0);
  }, [search, roleFilter]);

  const openMenu = (e, user) => { setAnchorEl(e.currentTarget); setSelectedUser(user); };
  const closeMenu = () => { setAnchorEl(null); };
  const openDialog = (type) => { setDialog(type); setActionMsg(null); closeMenu(); };
  const closeDialog = () => { setDialog(''); setSelectedUser(null); setActionMsg(null); };

  const handleStatusToggle = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const newStatus = selectedUser.isActive === false ? true : false;
      await userAPI.updateStatus(selectedUser.id, newStatus);
      setUsers((prev) => prev.map((u) =>
        u.id === selectedUser.id ? { ...u, isActive: newStatus } : u
      ));
      setActionMsg({ type: 'success', text: `User ${newStatus ? 'activated' : 'suspended'}` });
      setTimeout(closeDialog, 1500);
    } catch (e) {
      setActionMsg({ type: 'error', text: e.response?.data?.message || 'Action failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await userAPI.updateRole(userId, role);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update role');
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>User Management</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField fullWidth placeholder="Search by name or email..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select value={roleFilter} label="Role" onChange={(e) => setRoleFilter(e.target.value)}>
                <MenuItem value="all">All Roles</MenuItem>
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="dealer">Dealer</MenuItem>
                <MenuItem value="service_provider">Service Provider</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="body2" color="text.secondary">{total} users total</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        {loading && <Box sx={{ p: 2, textAlign: 'center' }}><CircularProgress size={24} /></Box>}
        {!loading && (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Verified</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>{u.firstName} {u.lastName}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Select
                      value={u.role}
                      size="small"
                      variant="standard"
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      sx={{ fontSize: '0.875rem' }}
                    >
                      {['user', 'dealer', 'service_provider', 'admin'].map((r) => (
                        <MenuItem key={r} value={r}>{r.replace('_', ' ')}</MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={u.isActive === false ? 'suspended' : 'active'}
                      color={u.isActive === false ? 'error' : 'success'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {u.isVerified
                      ? <CheckCircleIcon color="success" fontSize="small" />
                      : <BlockIcon color="disabled" fontSize="small" />}
                  </TableCell>
                  <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Tooltip title="Actions">
                      <IconButton size="small" onClick={(e) => openMenu(e, u)}>
                        <MoreVertIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">No users found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        />
      </TableContainer>

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
        <MenuItem onClick={() => openDialog('view')}>
          <VisibilityIcon sx={{ mr: 1 }} fontSize="small" /> View Details
        </MenuItem>
        <MenuItem onClick={() => openDialog('suspend')}>
          {selectedUser?.isActive === false
            ? <><CheckCircleIcon sx={{ mr: 1 }} fontSize="small" /> Activate</>
            : <><BlockIcon sx={{ mr: 1 }} fontSize="small" /> Suspend</>}
        </MenuItem>
      </Menu>

      {/* View Dialog */}
      <Dialog open={dialog === 'view'} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>User Details</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ pt: 1 }}>
              <Typography><strong>Name:</strong> {selectedUser.firstName} {selectedUser.lastName}</Typography>
              <Typography><strong>Email:</strong> {selectedUser.email}</Typography>
              <Typography><strong>Role:</strong> {selectedUser.role}</Typography>
              <Typography><strong>Status:</strong> {selectedUser.isActive === false ? 'Suspended' : 'Active'}</Typography>
              <Typography><strong>Verified:</strong> {selectedUser.isVerified ? 'Yes' : 'No'}</Typography>
              <Typography><strong>Joined:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Suspend/Activate Dialog */}
      <Dialog open={dialog === 'suspend'} onClose={closeDialog}>
        <DialogTitle>
          {selectedUser?.isActive === false ? 'Activate User' : 'Suspend User'}
        </DialogTitle>
        <DialogContent>
          {actionMsg ? (
            <Alert severity={actionMsg.type}>{actionMsg.text}</Alert>
          ) : (
            <Typography>
              {selectedUser?.isActive === false
                ? `Activate ${selectedUser?.email}?`
                : `Suspend ${selectedUser?.email}? They will lose access to the platform.`}
            </Typography>
          )}
        </DialogContent>
        {!actionMsg && (
          <DialogActions>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button
              onClick={handleStatusToggle}
              color={selectedUser?.isActive === false ? 'success' : 'warning'}
              variant="contained"
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' : selectedUser?.isActive === false ? 'Activate' : 'Suspend'}
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
};

export default UserManagement;
