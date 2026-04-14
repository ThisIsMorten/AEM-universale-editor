const fetch = require('node-fetch')
const { Core } = require('@adobe/aio-sdk')
const { errorResponse, stringParameters, checkMissingRequestInputs, getValidDomain } = require('../utils')

async function getAccessToken(envVars) {
  const url = 'https://ims-na1.adobelogin.com/ims/token/v3';

  const { API_KEY, CLIENT_SECRET } = envVars

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: API_KEY,
    client_secret: CLIENT_SECRET,
    scope: 'AdobeID,openid,read_organizations,additional_info.projectedProductContext,additional_info.roles,adobeio_api,read_client_secret,manage_client_secrets,read_pc.dma_aem_ams'
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Request failed with status ${res.status}: ${errText}`);
  }

  const data = await res.json();

  return data.access_token;
}

async function fetchDomains(envVars, accessToken, programId ) {
  const url = `https://cloudmanager.adobe.io/api/program/${programId}/domains`;

  const { ORG_ID, API_KEY } = envVars;

  const headers = {
    'x-gw-ims-org-id': ORG_ID,
    'x-api-key': API_KEY,
    'Content-Type': 'text/plain',
    'Authorization': `Bearer ${accessToken}`
  };

  const res = await fetch(url, {
    method: 'GET',
    headers: headers
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Request failed: ${res.status} - ${errText}`);
  }

  const data = await res.json();

  return data;
}

// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  const { ORG_ID, API_KEY, CLIENT_SECRET } = params;

  const envVars = {
    ORG_ID,
    API_KEY,
    CLIENT_SECRET
  }

  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {
    // 'info' is the default level if not set
    logger.info('Calling the main action')

    // log parameters, only if params.LOG_LEVEL === 'debug'
    logger.debug(stringParameters(params))

    // check for missing request input parameters and headers
    const requiredParams = ['programId']
    const requiredHeaders = []
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
    if (errorMessage) {
      // return and log client errors
      return errorResponse(400, errorMessage, logger)
    }

    const programId = params.programId;

    const accessToken = await getAccessToken(envVars);

    const domains = await fetchDomains(envVars, accessToken, programId);
    logger.debug(`domains: ${JSON.stringify(domains)}`)

    const publishDomain = getValidDomain(domains);

    logger.debug(`returning publishDomain: ${publishDomain}`)

    const response = {
      statusCode: 200,
      body: {
        publishDomain
      }
    }

    // log the response status code
    logger.info(`${response.statusCode}: successful request`)
    return response
  } catch (error) {
    logger.error(error)
    // return with 500, generic server error so client doesn't know
    return errorResponse(500, 'server error', logger)
  }
}
exports.main = main