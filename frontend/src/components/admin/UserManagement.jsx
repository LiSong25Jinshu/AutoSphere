import { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination,
  TextField, InputAdornment, IconButton, Chip, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  FormControl, InputLabel, Select, Grid, Alert, Tooltip,
  CircularProgress, Tabs, Tab, Badge, Divider,
} from '@mui/material';
import {
  Search as SearchIcon, MoreVert as MoreVertIcon,
  Block as BlockIcon, CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon, ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon, HourglassEmpty as PendingIcon,
} from '@mui/icons-material';
import { userAPI, adminAPI } from '../../services/api';
import axios from '../../utils/axiosConfig.js';

// ─── helpers ──────────────────────────────────────────────────────────────────

const APPROVAL_COLOR = {
  approved: 'success',
  pending:  'warning',
  rejected: 'error',
};

const ROLE_LABEL = {
  user:             'User',
  dealer:           'Dealer',
  service_provider: 'Service Provider',
  admin:            'Admin',
};

// ─── Pending Approvals panel ──────────────────────────────────────────────────

const PendingApprovals = ({ refreshSignal, onCountChange }) => {
  const [pending, setPending]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [selected, setSelected]       = useState(null);
  const [dialog, setDialog]           = useState(''); // 'approve' | 'reject' | 'view'
  const [reason, setReason]           = useState('');
  const [actionLoading, setActionLoad] = useState(false);
  const [actionMsg, setActionMsg]     = useState(null);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await userAPI.getAll({ role: 'dealer', limit: 100 });
      const res2 = await userAPI.getAll({ role: 'service_provider', limit: 100 });
      const combined = [
        ...(res.data?.data || []),
        ...(res2.data?.data || []),
      ].filter(u => u.approvalStatus === 'pending');
      setPending(combined);
      onCountChange(combined.length);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load pending applications');
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => { fetchPending(); }, [fetchPending, refreshSignal]);

  const openDialog = (type, user) => {
    setSelected(user);
    setDialog(type);
    setReason('');
    setActionMsg(null);
  };

  const closeDialog = () => {
    setDialog('');
    setSelected(null);
    setActionMsg(null);
    setReason('');
  };

  const handleApproval = async (approvalStatus) => {
    if (!selected) return;
    setActionLoad(true);
    try {
      await axios.patch(`/api/users/${selected.id}/approval`, {
        approvalStatus,
        reason: reason.trim() || undefined,
      });
      setActionMsg({
        type: 'success',
        text: `Application ${approvalStatus} successfully. ${
          approvalStatus === 'approved'
            ? 'The user can now log in.'
            : 'The user has been notified.'
        }`,
      });
      setPending(prev => prev.filter(u => u.id !== selected.id));
      onCountChange(pending.length - 1);
      setTimeout(closeDialog, 2000);
    } catch (e) {
      setActionMsg({ type: 'error', text: e.response?.data?.message || 'Action failed' });
    } finally {
      setActionLoad(false);
    }
  };

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error)   return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Dealers and service providers must be approved before they can log in.
      </Typography>

      {pending.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', color: '#888' }}>
          <PendingIcon sx={{ fontSize: 48, mb: 1, color: '#ccc' }} />
          <Typography>No pending applications — all caught up!</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Role</strong></TableCell>
                <TableCell><strong>Business</strong></TableCell>
                <TableCell><strong>Registered</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pending.map(u => (
                <TableRow key={u.id} hover>
                  <TableCell>{u.firstName} {u.lastName}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Chip label={ROLE_LABEL[u.role] || u.role} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell>{u.businessName || '—'}</TableCell>
                  <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Tooltip title="View details">
                      <IconButton size="small" onClick={() => openDialog('view', u)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Approve">
                      <IconButton size="small" color="success" onClick={() => openDialog('approve', u)}>
                        <ThumbUpIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reject">
                      <IconButton size="small" color="error" onClick={() => openDialog('reject', u)}>
                        <ThumbDownIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* View Details Dialog */}
      <Dialog open={dialog === 'view'} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Application Details</DialogTitle>
        <DialogContent dividers>
          {selected && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[
                ['Name',         `${selected.firstName} ${selected.lastName}`],
                ['Email',        selected.email],
                ['Phone',        selected.phone || '—'],
                ['Role',         ROLE_LABEL[selected.role] || selected.role],
                ['Business',     selected.businessName || '—'],
                ['Business Type',selected.businessType || '—'],
                ['Description',  selected.businessDescription || '—'],
                ['Address',      selected.address || '—'],
                ['Registered',   new Date(selected.createdAt).toLocaleString()],
                ['Email Verified', selected.isVerified ? 'Yes' : 'No'],
              ].map(([label, val]) => (
                <Box key={label} sx={{ display: 'flex', gap: 1 }}>
                  <Typography sx={{ minWidth: 140, fontWeight: 600, color: '#555', fontSize: 14 }}>{label}:</Typography>
                  <Typography sx={{ fontSize: 14 }}>{String(val)}</Typography>
                </Box>
              ))}
              {selected.consentData && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">Verification Info</Typography>
                  {[
                    ['ID Type',     selected.consentData.idType || '—'],
                    ['ID Number',   selected.consentData.idNumber || '—'],
                    ['Location',    selected.consentData.location || '—'],
                    ['Country',     selected.consentData.country || '—'],
                    ['Experience',  selected.consentData.yearsOfExperience ? `${selected.consentData.yearsOfExperience} years` : '—'],
                  ].map(([label, val]) => (
                    <Box key={label} sx={{ display: 'flex', gap: 1 }}>
                      <Typography sx={{ minWidth: 140, fontWeight: 600, color: '#555', fontSize: 14 }}>{label}:</Typography>
                      <Typography sx={{ fontSize: 14 }}>{val}</Typography>
                    </Box>
                  ))}
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Close</Button>
          <Button variant="contained" color="success" onClick={() => { closeDialog(); openDialog('approve', selected); }}>
            Approve
          </Button>
          <Button variant="outlined" color="error" onClick={() => { closeDialog(); openDialog('reject', selected); }}>
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={dialog === 'approve'} onClose={closeDialog} maxWidth="xs" fullWidth>
        <DialogTitle>✅ Approve Application</DialogTitle>
        <DialogContent>
          {actionMsg ? (
            <Alert severity={actionMsg.type}>{actionMsg.text}</Alert>
          ) : (
            <>
              <Typography sx={{ mb: 2 }}>
                Approve <strong>{selected?.firstName} {selected?.lastName}</strong> ({selected?.email}) as a{' '}
                <strong>{ROLE_LABEL[selected?.role]}</strong>?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                They will receive an email notification and can log in immediately.
              </Typography>
            </>
          )}
        </DialogContent>
        {!actionMsg && (
          <DialogActions>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button variant="contained" color="success" disabled={actionLoading}
              onClick={() => handleApproval('approved')}>
              {actionLoading ? 'Approving…' : 'Confirm Approve'}
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={dialog === 'reject'} onClose={closeDialog} maxWidth="xs" fullWidth>
        <DialogTitle>❌ Reject Application</DialogTitle>
        <DialogContent>
          {actionMsg ? (
            <Alert severity={actionMsg.type}>{actionMsg.text}</Alert>
          ) : (
            <>
              <Typography sx={{ mb: 2 }}>
                Reject <strong>{selected?.firstName} {selected?.lastName}</strong>'s application?
              </Typography>
              <TextField
                fullWidth multiline rows={3}
                label="Reason for rejection (optional)"
                placeholder="e.g. Incomplete documentation, suspicious activity…"
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </>
          )}
        </DialogContent>
        {!actionMsg && (
          <DialogActions>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button variant="contained" color="error" disabled={actionLoading}
              onClick={() => handleApproval('rejected')}>
              {actionLoading ? 'Rejecting…' : 'Confirm Reject'}
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
};

// ─── All Users panel ──────────────────────────────────────────────────────────

const AllUsers = ({ refreshSignal }) => {
  const [users, setUsers]             = useState([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch]           = useState('');
  const [roleFilter, setRoleFilter]   = useState('all');
  const [approvalFilter, setApprovalFilter] = useState('all');
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [anchorEl, setAnchorEl]       = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialog, setDialog]           = useState('');
  const [actionMsg, setActionMsg]     = useState(null);
  const [actionLoading, setActionLoad] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page: page + 1, limit: rowsPerPage };
      if (search) params.search = search;
      if (roleFilter !== 'all') params.role = roleFilter;
      const res = await userAPI.getAll(params);
      let data = res.data?.data || [];
      if (approvalFilter !== 'all') {
        data = data.filter(u => u.approvalStatus === approvalFilter);
      }
      setUsers(data);
      setTotal(res.data?.pagination?.total || 0);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, roleFilter, approvalFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers, refreshSignal]);
  useEffect(() => { setPage(0); }, [search, roleFilter, approvalFilter]);

  const openMenu  = (e, user) => { setAnchorEl(e.currentTarget); setSelectedUser(user); };
  const closeMenu = () => setAnchorEl(null);
  const openDialog  = (type) => { setDialog(type); setActionMsg(null); setRejectReason(''); closeMenu(); };
  const closeDialog = () => { setDialog(''); setSelectedUser(null); setActionMsg(null); };

  const handleStatusToggle = async () => {
    if (!selectedUser) return;
    setActionLoad(true);
    try {
      const newStatus = !selectedUser.isActive;
      await userAPI.updateStatus(selectedUser.id, newStatus);
      setUsers(prev => prev.map(u =>
        u.id === selectedUser.id ? { ...u, isActive: newStatus } : u
      ));
      setActionMsg({ type: 'success', text: `User ${newStatus ? 'activated' : 'suspended'}` });
      setTimeout(closeDialog, 1500);
    } catch (e) {
      setActionMsg({ type: 'error', text: e.response?.data?.message || 'Action failed' });
    } finally {
      setActionLoad(false);
    }
  };

  const handleApproval = async (approvalStatus) => {
    if (!selectedUser) return;
    setActionLoad(true);
    try {
      await axios.patch(`/api/users/${selectedUser.id}/approval`, {
        approvalStatus,
        reason: rejectReason.trim() || undefined,
      });
      setUsers(prev => prev.map(u =>
        u.id === selectedUser.id ? { ...u, approvalStatus } : u
      ));
      setActionMsg({ type: 'success', text: `Application ${approvalStatus}` });
      setTimeout(closeDialog, 1500);
    } catch (e) {
      setActionMsg({ type: 'error', text: e.response?.data?.message || 'Action failed' });
    } finally {
      setActionLoad(false);
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await userAPI.updateRole(userId, role);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update role');
    }
  };

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField fullWidth placeholder="Search name or email…"
              value={search} onChange={e => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Role</InputLabel>
              <Select value={roleFilter} label="Role" onChange={e => setRoleFilter(e.target.value)}>
                <MenuItem value="all">All Roles</MenuItem>
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="dealer">Dealer</MenuItem>
                <MenuItem value="service_provider">Service Provider</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Approval</InputLabel>
              <Select value={approvalFilter} label="Approval" onChange={e => setApprovalFilter(e.target.value)}>
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
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
        {loading
          ? <Box sx={{ p: 3, textAlign: 'center' }}><CircularProgress size={28} /></Box>
          : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Role</strong></TableCell>
                  <TableCell><strong>Account</strong></TableCell>
                  <TableCell><strong>Approval</strong></TableCell>
                  <TableCell><strong>Verified</strong></TableCell>
                  <TableCell><strong>Joined</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.id} hover>
                    <TableCell>{u.firstName} {u.lastName}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{u.email}</TableCell>
                    <TableCell>
                      <Select
                        value={u.role} size="small" variant="standard"
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                        sx={{ fontSize: '0.8rem' }}
                      >
                        {['user','dealer','service_provider','admin'].map(r => (
                          <MenuItem key={r} value={r}>{ROLE_LABEL[r]}</MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={u.isActive === false ? 'Suspended' : 'Active'}
                        color={u.isActive === false ? 'error' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {['dealer','service_provider'].includes(u.role) ? (
                        <Chip
                          label={u.approvalStatus || 'approved'}
                          color={APPROVAL_COLOR[u.approvalStatus] || 'default'}
                          size="small"
                        />
                      ) : (
                        <Typography variant="body2" color="text.disabled">N/A</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.isVerified
                        ? <CheckCircleIcon color="success" fontSize="small" />
                        : <BlockIcon color="disabled" fontSize="small" />}
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Tooltip title="Actions">
                        <IconButton size="small" onClick={e => openMenu(e, u)}>
                          <MoreVertIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 3, color: '#888' }}>
                      No users found
                    </TableCell>
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
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        />
      </TableContainer>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
        <MenuItem onClick={() => openDialog('view')}>
          <VisibilityIcon sx={{ mr: 1 }} fontSize="small" /> View Details
        </MenuItem>
        <MenuItem onClick={() => openDialog('suspend')}>
          {selectedUser?.isActive === false
            ? <><CheckCircleIcon sx={{ mr: 1 }} fontSize="small" /> Activate</>
            : <><BlockIcon sx={{ mr: 1 }} fontSize="small" /> Suspend</>}
        </MenuItem>
        {['dealer','service_provider'].includes(selectedUser?.role) && [
          <Divider key="div" />,
          <MenuItem key="approve" onClick={() => openDialog('approve')}>
            <ThumbUpIcon sx={{ mr: 1 }} fontSize="small" color="success" /> Approve Application
          </MenuItem>,
          <MenuItem key="reject" onClick={() => openDialog('reject')}>
            <ThumbDownIcon sx={{ mr: 1 }} fontSize="small" color="error" /> Reject Application
          </MenuItem>,
        ]}
      </Menu>

      {/* View Dialog */}
      <Dialog open={dialog === 'view'} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>User Details</DialogTitle>
        <DialogContent dividers>
          {selectedUser && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[
                ['Name',      `${selectedUser.firstName} ${selectedUser.lastName}`],
                ['Email',     selectedUser.email],
                ['Phone',     selectedUser.phone || '—'],
                ['Role',      ROLE_LABEL[selectedUser.role] || selectedUser.role],
                ['Business',  selectedUser.businessName || '—'],
                ['Account',   selectedUser.isActive === false ? 'Suspended' : 'Active'],
                ['Approval',  selectedUser.approvalStatus || 'N/A'],
                ['Verified',  selectedUser.isVerified ? 'Yes' : 'No'],
                ['Joined',    new Date(selectedUser.createdAt).toLocaleString()],
              ].map(([label, val]) => (
                <Box key={label} sx={{ display: 'flex', gap: 1 }}>
                  <Typography sx={{ minWidth: 110, fontWeight: 600, color: '#555', fontSize: 14 }}>{label}:</Typography>
                  <Typography sx={{ fontSize: 14 }}>{val}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions><Button onClick={closeDialog}>Close</Button></DialogActions>
      </Dialog>

      {/* Suspend/Activate Dialog */}
      <Dialog open={dialog === 'suspend'} onClose={closeDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{selectedUser?.isActive === false ? 'Activate User' : 'Suspend User'}</DialogTitle>
        <DialogContent>
          {actionMsg
            ? <Alert severity={actionMsg.type}>{actionMsg.text}</Alert>
            : <Typography>
                {selectedUser?.isActive === false
                  ? `Reactivate ${selectedUser?.email}?`
                  : `Suspend ${selectedUser?.email}? They will lose access immediately.`}
              </Typography>}
        </DialogContent>
        {!actionMsg && (
          <DialogActions>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button
              onClick={handleStatusToggle}
              color={selectedUser?.isActive === false ? 'success' : 'warning'}
              variant="contained" disabled={actionLoading}
            >
              {actionLoading ? 'Processing…' : selectedUser?.isActive === false ? 'Activate' : 'Suspend'}
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={dialog === 'approve'} onClose={closeDialog} maxWidth="xs" fullWidth>
        <DialogTitle>✅ Approve Application</DialogTitle>
        <DialogContent>
          {actionMsg
            ? <Alert severity={actionMsg.type}>{actionMsg.text}</Alert>
            : <Typography>Approve <strong>{selectedUser?.email}</strong> as a {ROLE_LABEL[selectedUser?.role]}?</Typography>}
        </DialogContent>
        {!actionMsg && (
          <DialogActions>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button variant="contained" color="success" disabled={actionLoading}
              onClick={() => handleApproval('approved')}>
              {actionLoading ? 'Approving…' : 'Approve'}
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={dialog === 'reject'} onClose={closeDialog} maxWidth="xs" fullWidth>
        <DialogTitle>❌ Reject Application</DialogTitle>
        <DialogContent>
          {actionMsg
            ? <Alert severity={actionMsg.type}>{actionMsg.text}</Alert>
            : <>
                <Typography sx={{ mb: 2 }}>
                  Reject <strong>{selectedUser?.email}</strong>'s application?
                </Typography>
                <TextField fullWidth multiline rows={3}
                  label="Reason (optional)"
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />
              </>}
        </DialogContent>
        {!actionMsg && (
          <DialogActions>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button variant="contained" color="error" disabled={actionLoading}
              onClick={() => handleApproval('rejected')}>
              {actionLoading ? 'Rejecting…' : 'Reject'}
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────

const UserManagement = () => {
  const [tab, setTab]             = useState(0);
  const [pendingCount, setPending] = useState(0);
  const [refreshKey, setRefresh]  = useState(0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">User Management</Typography>
        <Button size="small" variant="outlined" onClick={() => setRefresh(k => k + 1)}>
          🔄 Refresh
        </Button>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 3, borderBottom: '1px solid #e0e0e0' }}
      >
        <Tab label="All Users" />
        <Tab
          label={
            <Badge badgeContent={pendingCount} color="warning" max={99}>
              <Box sx={{ pr: pendingCount > 0 ? 1.5 : 0 }}>Pending Approvals</Box>
            </Badge>
          }
        />
      </Tabs>

      {tab === 0 && <AllUsers refreshSignal={refreshKey} />}
      {tab === 1 && (
        <PendingApprovals
          refreshSignal={refreshKey}
          onCountChange={setPending}
        />
      )}
    </Box>
  );
};

export default UserManagement;
