import { CONFIG } from 'src/config-global';

import { WorkOrderListView } from 'src/sections/work-order/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Work Orders - ${CONFIG.appName}`}</title>

      <WorkOrderListView />
    </>
  );
}
