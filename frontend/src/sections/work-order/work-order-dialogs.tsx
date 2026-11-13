import type { User, WorkOrder } from 'src/api';

import dayjs from 'dayjs';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import {
  assignMechanic,
  updateWorkOrder,
  createWorkOrder,
  approveSparepart,
  requestSparepart,
  completeWorkOrder,
  getErrorMessage,
} from 'src/api';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const LOCAL_FORMAT = 'YYYY-MM-DDTHH:mm'; // what <input type="datetime-local"> expects

const toLocalInput = (iso: string | null | undefined) =>
  iso ? dayjs(iso).format(LOCAL_FORMAT) : '';

const toIso = (local: string) => new Date(local).toISOString();

type DoneHandler = (workOrder: WorkOrder, message: string) => void;

// ----------------------------------------------------------------------

type FormDialogProps = {
  title: string;
  submitLabel: string;
  canSubmit: boolean;
  onClose: () => void;
  /** Should call the API and then tell the parent it is done. Throw to show an error. */
  onSubmit: () => Promise<void>;
  children: React.ReactNode;
};

/** Shared dialog shell: busy state, inline error, cancel/submit buttons. */
function FormDialog({
  title,
  submitLabel,
  canSubmit,
  onClose,
  onSubmit,
  children,
}: FormDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      await onSubmit();
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Dialog open fullWidth maxWidth="sm" onClose={busy ? undefined : onClose}>
      <DialogTitle>{title}</DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {children}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button color="inherit" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={busy || !canSubmit}>
          {busy ? 'Saving...' : submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ----------------------------------------------------------------------

export function CreateWorkOrderDialog({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: DoneHandler;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  return (
    <FormDialog
      title="New Work Order"
      submitLabel="Create"
      canSubmit={!!title.trim()}
      onClose={onClose}
      onSubmit={async () => {
        const created = await createWorkOrder({
          title: title.trim(),
          description: description.trim() || undefined,
        });
        onDone(created, 'Work order created');
      }}
    >
      <TextField
        autoFocus
        required
        label="Title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <TextField
        multiline
        minRows={3}
        label="Description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
    </FormDialog>
  );
}

// ----------------------------------------------------------------------

export function AssignDialog({
  workOrder,
  mechanics,
  onClose,
  onDone,
}: {
  workOrder: WorkOrder;
  mechanics: User[];
  onClose: () => void;
  onDone: DoneHandler;
}) {
  const [mechanicId, setMechanicId] = useState('');

  return (
    <FormDialog
      title="Assign Mechanic"
      submitLabel="Assign"
      canSubmit={!!mechanicId}
      onClose={onClose}
      onSubmit={async () => {
        const updated = await assignMechanic(workOrder.id, mechanicId);
        onDone(updated, 'Mechanic assigned');
      }}
    >
      <TextField
        select
        required
        label="Mechanic"
        value={mechanicId}
        onChange={(event) => setMechanicId(event.target.value)}
      >
        {mechanics.map((mechanic) => (
          <MenuItem key={mechanic.id} value={mechanic.id}>
            {mechanic.name}
          </MenuItem>
        ))}
      </TextField>
    </FormDialog>
  );
}

// ----------------------------------------------------------------------

export function UpdateDialog({
  workOrder,
  onClose,
  onDone,
}: {
  workOrder: WorkOrder;
  onClose: () => void;
  onDone: DoneHandler;
}) {
  const [title, setTitle] = useState(workOrder.title);
  const [description, setDescription] = useState(workOrder.description ?? '');
  const [startDate, setStartDate] = useState(toLocalInput(workOrder.startDate));

  return (
    <FormDialog
      title="Update Work Order"
      submitLabel="Save"
      canSubmit={!!title.trim()}
      onClose={onClose}
      onSubmit={async () => {
        const updated = await updateWorkOrder(workOrder.id, {
          title: title.trim(),
          description,
          startDate: startDate ? toIso(startDate) : undefined,
        });
        onDone(updated, 'Work order updated');
      }}
    >
      <TextField
        required
        label="Title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <TextField
        multiline
        minRows={3}
        label="Description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
      <TextField
        type="datetime-local"
        label="Start date (optional)"
        value={startDate}
        onChange={(event) => setStartDate(event.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
      />
    </FormDialog>
  );
}

// ----------------------------------------------------------------------

type ItemRow = { key: number; name: string; qty: string };

export function SparepartDialog({
  workOrder,
  onClose,
  onDone,
}: {
  workOrder: WorkOrder;
  onClose: () => void;
  onDone: DoneHandler;
}) {
  const [rows, setRows] = useState<ItemRow[]>([{ key: 0, name: '', qty: '1' }]);
  const [nextKey, setNextKey] = useState(1);

  const patchRow = (key: number, patch: Partial<ItemRow>) =>
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  const items = rows.map((row) => ({ name: row.name.trim(), qty: Number(row.qty) }));
  const valid = items.length > 0 && items.every((i) => i.name && Number.isInteger(i.qty) && i.qty >= 1);

  return (
    <FormDialog
      title="Request Sparepart"
      submitLabel="Send request"
      canSubmit={valid}
      onClose={onClose}
      onSubmit={async () => {
        const updated = await requestSparepart(workOrder.id, items);
        onDone(updated, 'Sparepart request sent');
      }}
    >
      {rows.map((row) => (
        <Box key={row.key} sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
          <TextField
            required
            fullWidth
            label="Sparepart name"
            value={row.name}
            onChange={(event) => patchRow(row.key, { name: event.target.value })}
          />
          <TextField
            required
            type="number"
            label="Qty"
            value={row.qty}
            onChange={(event) => patchRow(row.key, { qty: event.target.value })}
            slotProps={{ htmlInput: { min: 1 } }}
            sx={{ width: 110 }}
          />
          <IconButton
            aria-label="Remove item"
            disabled={rows.length === 1}
            onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
          >
            <Iconify icon="mingcute:close-line" />
          </IconButton>
        </Box>
      ))}

      <Button
        color="inherit"
        startIcon={<Iconify icon="mingcute:add-line" />}
        sx={{ alignSelf: 'flex-start' }}
        onClick={() => {
          setRows((prev) => [...prev, { key: nextKey, name: '', qty: '1' }]);
          setNextKey((prev) => prev + 1);
        }}
      >
        Add item
      </Button>
    </FormDialog>
  );
}

// ----------------------------------------------------------------------

export function ApproveDialog({
  requestId,
  onClose,
  onDone,
}: {
  requestId: string;
  onClose: () => void;
  onDone: DoneHandler;
}) {
  const [note, setNote] = useState('');

  return (
    <FormDialog
      title="Approve Sparepart Request"
      submitLabel="Approve"
      canSubmit
      onClose={onClose}
      onSubmit={async () => {
        const updated = await approveSparepart(requestId, note.trim() || undefined);
        onDone(updated, 'Sparepart request approved');
      }}
    >
      <TextField
        multiline
        minRows={2}
        label="Approval note (optional)"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
    </FormDialog>
  );
}

// ----------------------------------------------------------------------

export function CompleteDialog({
  workOrder,
  onClose,
  onDone,
}: {
  workOrder: WorkOrder;
  onClose: () => void;
  onDone: DoneHandler;
}) {
  const [endDate, setEndDate] = useState(dayjs().format(LOCAL_FORMAT));

  return (
    <FormDialog
      title="Complete Work Order"
      submitLabel="Complete"
      canSubmit={!!endDate}
      onClose={onClose}
      onSubmit={async () => {
        const updated = await completeWorkOrder(workOrder.id, toIso(endDate));
        onDone(updated, 'Work order completed');
      }}
    >
      <TextField
        required
        type="datetime-local"
        label="End date"
        value={endDate}
        onChange={(event) => setEndDate(event.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
      />
    </FormDialog>
  );
}
