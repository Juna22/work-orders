import type { WorkOrder, WorkOrderStatus } from 'src/api';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import LinearProgress from '@mui/material/LinearProgress';

import { useRole } from 'src/auth';
import { listWorkOrders, getErrorMessage } from 'src/api';
import { DashboardContent } from 'src/layouts/dashboard';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { CreateWorkOrderDialog } from '../work-order-dialogs';
import { WorkOrderStatusLabel } from '../work-order-status-label';
import { woCode, fDateOrDash, STATUS_META, STATUS_OPTIONS } from '../work-order-meta';

// ----------------------------------------------------------------------

export function WorkOrderListView() {
  const { user } = useRole();
  const router = useRouter();

  const [items, setItems] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | WorkOrderStatus>('ALL');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listWorkOrders());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const query = search.trim().toLowerCase();
  const filtered = items.filter(
    (wo) =>
      (status === 'ALL' || wo.status === status) &&
      (!query || `${woCode(wo.id)} ${wo.title}`.toLowerCase().includes(query))
  );

  const lastPage = Math.max(0, Math.ceil(filtered.length / rowsPerPage) - 1);
  const currentPage = Math.min(page, lastPage);
  const rows = filtered.slice(currentPage * rowsPerPage, currentPage * rowsPerPage + rowsPerPage);

  return (
    <DashboardContent>
      <Box sx={{ mb: 5, display: 'flex', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Work Orders
        </Typography>

        {/* Only the Admin creates work orders (same rule is enforced by the API). */}
        {user.role === 'ADMIN' && (
          <Button
            variant="contained"
            color="inherit"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => setCreating(true)}
          >
            New Work Order
          </Button>
        )}
      </Box>

      <Card>
        <Box sx={{ p: 2.5, gap: 2, display: 'flex', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            label="Search code or title"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 240 }}
          />
          <TextField
            select
            size="small"
            label="Status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as 'ALL' | WorkOrderStatus);
              setPage(0);
            }}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="ALL">All statuses</MenuItem>
            {STATUS_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {STATUS_META[option].label}
              </MenuItem>
            ))}
          </TextField>
          <Button color="inherit" onClick={load} disabled={loading}>
            Refresh
          </Button>
        </Box>

        {loading && <LinearProgress />}
        {error && (
          <Alert severity="error" sx={{ mx: 2.5, mb: 2 }}>
            {error}
          </Alert>
        )}

        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  <TableCell>No</TableCell>
                  <TableCell>WO Number</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Mechanic</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.map((wo, index) => (
                  <TableRow
                    hover
                    key={wo.id}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => router.push(`/work-orders/${wo.id}`)}
                  >
                    <TableCell>{currentPage * rowsPerPage + index + 1}</TableCell>
                    <TableCell>{woCode(wo.id)}</TableCell>
                    <TableCell>{wo.title}</TableCell>
                    <TableCell>{wo.mechanic?.name ?? '-'}</TableCell>
                    <TableCell>{fDateOrDash(wo.startDate)}</TableCell>
                    <TableCell>{fDateOrDash(wo.endDate)}</TableCell>
                    <TableCell>
                      <WorkOrderStatusLabel status={wo.status} />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        aria-label="View detail"
                        component={RouterLink}
                        href={`/work-orders/${wo.id}`}
                        onClick={(event: React.MouseEvent) => event.stopPropagation()}
                      >
                        <Iconify icon="solar:eye-bold" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}

                {!loading && !error && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {items.length === 0
                          ? 'No work orders yet.'
                          : 'No work orders match your filters.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>

        <TablePagination
          component="div"
          page={currentPage}
          count={filtered.length}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </Card>

      {creating && (
        <CreateWorkOrderDialog
          onClose={() => setCreating(false)}
          onDone={(created) => {
            setCreating(false);
            router.push(`/work-orders/${created.id}`);
          }}
        />
      )}
    </DashboardContent>
  );
}
