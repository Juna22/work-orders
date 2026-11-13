import type { WorkOrder } from 'src/api';
import type { WorkOrderAction } from '../work-order-meta';

import { useParams } from 'react-router';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import LinearProgress from '@mui/material/LinearProgress';

import { useRole } from 'src/auth';
import { RouterLink } from 'src/routes/components';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  getWorkOrder,
  startWorkOrder,
  submitWorkOrder,
  getErrorMessage,
} from 'src/api';

import { Label } from 'src/components/label';

import {
  AssignDialog,
  UpdateDialog,
  ApproveDialog,
  CompleteDialog,
  SparepartDialog,
} from '../work-order-dialogs';
import {
  woCode,
  NEXT_STEP,
  ACTION_LABEL,
  fDateOrDash,
  getPendingRequest,
  getAvailableActions,
} from '../work-order-meta';
import { WorkOrderStatusLabel } from '../work-order-status-label';

// ----------------------------------------------------------------------

type Toast = { message: string; severity: 'success' | 'error' };

// Actions that need a form open a dialog; the other two call the API straight away.
type DialogName = 'assign' | 'update' | 'requestSparepart' | 'approveSparepart' | 'complete';

export function WorkOrderDetailView() {
  const { id } = useParams<{ id: string }>();
  const { user, users } = useRole();

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<DialogName | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setWorkOrder(await getWorkOrder(id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Called by dialogs after a successful API call (they receive the updated work order).
  const handleDone = (updated: WorkOrder, message: string) => {
    setWorkOrder(updated);
    setDialog(null);
    setToast({ message, severity: 'success' });
  };

  // Runs an action that needs no form (submit / start).
  const runDirect = async (call: () => Promise<WorkOrder>, message: string) => {
    setBusy(true);
    try {
      handleDone(await call(), message);
    } catch (err) {
      setToast({ message: getErrorMessage(err), severity: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const handleAction = (action: WorkOrderAction) => {
    if (!workOrder) return;

    switch (action) {
      case 'submit':
        runDirect(() => submitWorkOrder(workOrder.id), 'Work order submitted');
        break;
      case 'start':
        runDirect(() => startWorkOrder(workOrder.id), 'Work order is now being worked on');
        break;
      default:
        setDialog(action);
    }
  };

  const actions = workOrder ? getAvailableActions(workOrder, user) : [];
  const pendingRequest = workOrder ? getPendingRequest(workOrder) : undefined;
  const mechanics = users.filter((u) => u.role === 'MECHANIC');

  return (
    <DashboardContent>
      <Box sx={{ mb: 3 }}>
        <Button color="inherit" component={RouterLink} href="/work-orders">
          ← Back to list
        </Button>
      </Box>

      {loading && <LinearProgress />}

      {error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={load}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {workOrder && (
        <Stack spacing={3}>
          <Box sx={{ gap: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="h4">{workOrder.title}</Typography>
            <WorkOrderStatusLabel status={workOrder.status} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {woCode(workOrder.id)}
            </Typography>
          </Box>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Actions
              </Typography>

              {actions.length > 0 ? (
                <Box sx={{ gap: 1.5, display: 'flex', flexWrap: 'wrap' }}>
                  {actions.map((action) => (
                    <Button
                      key={action}
                      variant="contained"
                      color="inherit"
                      disabled={busy}
                      onClick={() => handleAction(action)}
                    >
                      {ACTION_LABEL[action]}
                    </Button>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {NEXT_STEP[workOrder.status]} No action available for you right now.
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Details
              </Typography>

              <Box
                sx={{
                  gap: 2.5,
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                }}
              >
                <Field label="Description" value={workOrder.description || '-'} wide />
                <Field label="Created by" value={workOrder.creator?.name ?? '-'} />
                <Field label="Assigned mechanic" value={workOrder.mechanic?.name ?? '-'} />
                <Field label="Start date" value={fDateOrDash(workOrder.startDate)} />
                <Field label="End date" value={fDateOrDash(workOrder.endDate)} />
                <Field label="Created at" value={fDateOrDash(workOrder.createdAt)} />
                <Field label="Last updated" value={fDateOrDash(workOrder.updatedAt)} />
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Sparepart Requests
              </Typography>

              {workOrder.sparepartRequests.length === 0 && (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No sparepart requested.
                </Typography>
              )}

              <Stack spacing={3} divider={<Divider flexItem />}>
                {workOrder.sparepartRequests.map((request) => (
                  <Box key={request.id}>
                    <Box sx={{ mb: 1.5, gap: 1.5, display: 'flex', alignItems: 'center' }}>
                      <Label color={request.status === 'APPROVED' ? 'success' : 'warning'}>
                        {request.status === 'APPROVED' ? 'Approved' : 'Pending'}
                      </Label>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Requested by {request.requestedBy?.name ?? '-'} on{' '}
                        {fDateOrDash(request.createdAt)}
                      </Typography>
                    </Box>

                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Item</TableCell>
                          <TableCell align="right">Qty</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {request.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell align="right">{item.qty}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {request.status === 'APPROVED' && (
                      <Typography variant="body2" sx={{ mt: 1.5, color: 'text.secondary' }}>
                        Approved by {request.approvedBy?.name ?? '-'}
                        {request.approvalNote ? ` — ${request.approvalNote}` : ''}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      )}

      {workOrder && dialog === 'assign' && (
        <AssignDialog
          workOrder={workOrder}
          mechanics={mechanics}
          onClose={() => setDialog(null)}
          onDone={handleDone}
        />
      )}
      {workOrder && dialog === 'update' && (
        <UpdateDialog workOrder={workOrder} onClose={() => setDialog(null)} onDone={handleDone} />
      )}
      {workOrder && dialog === 'requestSparepart' && (
        <SparepartDialog
          workOrder={workOrder}
          onClose={() => setDialog(null)}
          onDone={handleDone}
        />
      )}
      {dialog === 'approveSparepart' && pendingRequest && (
        <ApproveDialog
          requestId={pendingRequest.id}
          onClose={() => setDialog(null)}
          onDone={handleDone}
        />
      )}
      {workOrder && dialog === 'complete' && (
        <CompleteDialog
          workOrder={workOrder}
          onClose={() => setDialog(null)}
          onDone={handleDone}
        />
      )}

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast ? (
          <Alert severity={toast.severity} variant="filled" onClose={() => setToast(null)}>
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

function Field({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <Box sx={{ ...(wide && { gridColumn: { md: '1 / -1' } }) }}>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
        {value}
      </Typography>
    </Box>
  );
}
