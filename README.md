# AEM-Siteimprove Extension

## Setup

### This is an Adobe app builder application
https://developer.adobe.com/uix/docs/guides/get-access/
https://developer.adobe.com/uix/docs/guides/local-environment/

## App Builder Environment Details

### Apis
Cloud Manager
I/O Management API

### Credentials
OAuth Server-to-Server Credentials

Scopes:
Cloud Manager: openid, AdobeID, read_organizations, additional_info.projectedProductContext, read_pc.dma_aem_ams
I/O Management API: AdobeID, openid, read_organizations, additional_info.projectedProductContext, additional_info.roles, adobeio_api, read_client_secret, manage_client_secrets

Product Profiles (Service: Cloud Manager):
AEM Managed Services
Cloud Manager - Business Owner Role
Cloud Manager - Deployment Manager Role
Cloud Manager - Developer Role
Cloud Manager - Program Manager Role
Business Owner - Cloud Service
Deployment Manager - Cloud Service
Program Manager - Cloud Service
Developer - Cloud Service
Integrations - Cloud Service

Populate .env in the root of this repo with the Credentials:
```
API_KEY=
CLIENT_SECRET=
ORG_ID=
```

### Set up terminal env
```
aio console project select xxxx
aio console workspace select xxxx
aio app use -m
```

- Populate the `.env` file in the project root and fill it as shown [below](#env)

## Local Dev
- nodejs version: 22.14.0
- npm version: 10.9.2
- npm install
- `aio app run` to start your local Dev server
- App will run on `localhost:9080` by default
- Go to the UE interface of your instance, for example:
- https://author-p130788-e1275641.adobeaemcloud.com/ui#/@ensemble/aem/universal-editor/canvas/
- Then input in the test site
- https://author-p130788-e1275641.adobeaemcloud.com/content/ue-test-site/index.html
- this will open::
- https://author-p130788-e1275641.adobeaemcloud.com/ui#/@ensemble/aem/universal-editor/canvas/author-p130788-e1275641.adobeaemcloud.com/content/ue-test-site/index.html
- In the terminal, open the link: https://experience.adobe.com/aem/extension-manager/preview/some-big-keyxxxxxxxxx
- and input the above url into the box, this should open up the following type of url (it just appends dev mode and the url to the end as GET params):
- https://author-p130788-e1275641.adobeaemcloud.com/ui#/@ensemble/aem/universal-editor/canvas/author-p130788-e1275641.adobeaemcloud.com/content/ue-test-site/index.html?devMode=true&ext=https://localhost:9080
- ensure you allow localhost:9080 to run within chrome!
- ensure you allow popups within the window!

By default the UI will be served locally but actions will be deployed and served from Adobe I/O Runtime. To start a local serverless stack and also run your actions locally use the `aio app run --local` option.

## Test & Coverage

- Run `aio app test` to run unit tests for ui and actions
- Run `aio app test --e2e` to run e2e tests

## Deploy & Cleanup

- `aio app deploy` to build and deploy all actions on Runtime and static files to CDN
- `aio app undeploy` to undeploy the app

## Config

### `.env`

You can generate this file using the command `aio app use`. 

```bash
# This file must **not** be committed to source control

## please provide your Adobe I/O Runtime credentials
# AIO_RUNTIME_AUTH=
# AIO_RUNTIME_NAMESPACE=
```

### `app.config.yaml`

- Main configuration file that defines an application's implementation. 
- More information on this file, application configuration, and extension configuration 
  can be found [here](https://developer.adobe.com/app-builder/docs/guides/appbuilder-configuration/#appconfigyaml)

#### Action Dependencies

- You have two options to resolve your actions' dependencies:

  1. **Packaged action file**: Add your action's dependencies to the root
   `package.json` and install them using `npm install`. Then set the `function`
   field in `app.config.yaml` to point to the **entry file** of your action
   folder. We will use `webpack` to package your code and dependencies into a
   single minified js file. The action will then be deployed as a single file.
   Use this method if you want to reduce the size of your actions.

  2. **Zipped action folder**: In the folder containing the action code add a
     `package.json` with the action's dependencies. Then set the `function`
     field in `app.config.yaml` to point to the **folder** of that action. We will
     install the required dependencies within that directory and zip the folder
     before deploying it as a zipped action. Use this method if you want to keep
     your action's dependencies separated.

## Debugging in VS Code

While running your local server (`aio app run`), both UI and actions can be debugged, to do so open the vscode debugger
and select the debugging configuration called `WebAndActions`.
Alternatively, there are also debug configs for only UI and each separate action.

## Typescript support for UI

To use typescript use `.tsx` extension for react components and add a `tsconfig.json` 
and make sure you have the below config added
```
 {
  "compilerOptions": {
      "jsx": "react"
    }
  } 
```

## Notes
- When opening the extension for the first time, you must sign into Siteimprove. Clicking the extension should open a new window for signing in, which will close automatically once completed.
- If you remain signed in, the extension will display previous results. At the top, it will indicate that it is rechecking—unless the last check was more than 24 hours ago.
- For Accessibility and Policy issues, there is a 'Highlight' button. However, if the issues are in a non-editable section (e.g., the footer), clicking 'Highlight' will have no visible effect. No error will be shown.