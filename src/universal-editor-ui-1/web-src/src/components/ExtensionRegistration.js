/*
 * <license header>
 */

import { Text } from "@adobe/react-spectrum";
import { register } from "@adobe/uix-guest";
import { extensionId } from "./Constants";
import metadata from '../../../../app-metadata.json';

const bc = new BroadcastChannel('si-bridge');
function ExtensionRegistration() {
  const init = async () => {
    const guestConnection = await register({
      id: extensionId,
      metadata,
      debug: false,
      methods: {
        rightPanel: {
          addRails() {
            return [
              {
                'id': 'siteimprove',
                'header': 'Siteimprove',
                'icon': 'PublishCheck',
                'url': '/#/siteimprove-rail'
              },
            ];
          },
        },
        events: {
          listen: (eventName, data) => {
            // console.log(`Extension registered to listen to event: ${eventName}. The event data: ${JSON.stringify(data)}`);
            // posts message to other iframe, received in SiteImproveRail
            bc.postMessage({ eventName, data });
          }
        },
      },
    });
  };
  init().catch(console.error);

  return <Text>IFrame for integration with Host (AEM)...</Text>
}

export default ExtensionRegistration;
