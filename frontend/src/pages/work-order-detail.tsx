import { CONFIG } from 'src/config-global';

import { WorkOrderDetailView } from 'src/sections/work-order/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Work Order Detail - ${CONFIG.appName}`}</title>

      <WorkOrderDetailView />
    </>
  );
}
