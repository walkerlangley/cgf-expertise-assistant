# Google Cloud Function that integrates with expertise.com

## Setup Instructions

### Pre-requisites
 1. API.AI account: [https://api.ai](https://api.ai)
 2. Google Cloud project: [https://console.cloud.google.com/project](https://console.cloud.google.com/project)

See the developer guide and release notes at [https://developers.google.com/actions/](https://developers.google.com/actions/) for more details.

### Steps (from the Google docs)
1. Create a new agent in API.AI [https://api.ai](https://api.ai).
1. Deploy this app to your preferred hosting environment
 (we recommend [Google Cloud Functions](https://cloud.google.com/functions/docs/tutorials/http)).
1. Set the "Fulfillment" webhook URL to the hosting URL.
1. In any relevant intents, enable the Fulfillment for the response.
1. Build out your agent and business logic by adding function handlers for API.AI actions.
1. For each API.AI action, set a new key/value pair on the actionMap, reflecting
 the action name and corresponding function handler on the actionMap in **index.js**.
1. Make sure all domains are turned off.
1. Enable Actions on Google in the Integrations.
1. Provide an invocation name for the action.
1. Authorize and preview the action in the [web simulator](https://developers.google.com/actions/tools/web-simulator).

For more detailed information on deployment, see the [documentation](https://developers.google.com/actions/samples/).

## License
See LICENSE.md.

