import type { WorkOrderStatus } from 'src/api';

import { Label } from 'src/components/label';

import { STATUS_META } from './work-order-meta';

// ----------------------------------------------------------------------

export function WorkOrderStatusLabel({ status }: { status: WorkOrderStatus }) {
  const meta = STATUS_META[status];

  return <Label color={meta.color}>{meta.label}</Label>;
}
