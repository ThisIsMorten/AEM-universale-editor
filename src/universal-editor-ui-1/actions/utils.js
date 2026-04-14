/* 
* <license header>
*/

/* This file exposes some common utilities for your actions */

/**
 *
 * Returns a log ready string of the action input parameters.
 * The `Authorization` header content will be replaced by '<hidden>'.
 *
 * @param {object} params action input parameters.
 *
 * @returns {string}
 *
 */
function stringParameters (params) {
  // hide authorization token without overriding params
  let headers = params.__ow_headers || {}
  if (headers.authorization) {
    headers = { ...headers, authorization: '<hidden>' }
  }
  return JSON.stringify({ ...params, __ow_headers: headers })
}

/**
 *
 * Returns the list of missing keys giving an object and its required keys.
 * A parameter is missing if its value is undefined or ''.
 * A value of 0 or null is not considered as missing.
 *
 * @param {object} obj object to check.
 * @param {array} required list of required keys.
 *        Each element can be multi level deep using a '.' separator e.g. 'myRequiredObj.myRequiredKey'
 *
 * @returns {array}
 * @private
 */
function getMissingKeys (obj, required) {
  return required.filter(r => {
    const splits = r.split('.')
    const last = splits[splits.length - 1]
    const traverse = splits.slice(0, -1).reduce((tObj, split) => { tObj = (tObj[split] || {}); return tObj }, obj)
    return traverse[last] === undefined || traverse[last] === '' // missing default params are empty string
  })
}

/**
 *
 * Returns the list of missing keys giving an object and its required keys.
 * A parameter is missing if its value is undefined or ''.
 * A value of 0 or null is not considered as missing.
 *
 * @param {object} params action input parameters.
 * @param {array} requiredHeaders list of required input headers.
 * @param {array} requiredParams list of required input parameters.
 *        Each element can be multi level deep using a '.' separator e.g. 'myRequiredObj.myRequiredKey'.
 *
 * @returns {string} if the return value is not null, then it holds an error message describing the missing inputs.
 *
 */
function checkMissingRequestInputs (params, requiredParams = [], requiredHeaders = []) {
  let errorMessage = null

  // input headers are always lowercase
  requiredHeaders = requiredHeaders.map(h => h.toLowerCase())
  // check for missing headers
  const missingHeaders = getMissingKeys(params.__ow_headers || {}, requiredHeaders)
  if (missingHeaders.length > 0) {
    errorMessage = `missing header(s) '${missingHeaders}'`
  }

  // check for missing parameters
  const missingParams = getMissingKeys(params, requiredParams)
  if (missingParams.length > 0) {
    if (errorMessage) {
      errorMessage += ' and '
    } else {
      errorMessage = ''
    }
    errorMessage += `missing parameter(s) '${missingParams}'`
  }

  return errorMessage
}

/**
 *
 * Extracts the bearer token string from the Authorization header in the request parameters.
 *
 * @param {object} params action input parameters.
 *
 * @returns {string|undefined} the token string or undefined if not set in request headers.
 *
 */
function getBearerToken (params) {
  if (params.__ow_headers &&
      params.__ow_headers.authorization &&
      params.__ow_headers.authorization.startsWith('Bearer ')) {
    return params.__ow_headers.authorization.substring('Bearer '.length)
  }
  return undefined
}
/**
 *
 * Returns an error response object and attempts to log.info the status code and error message
 *
 * @param {number} statusCode the error status code.
 *        e.g. 400
 * @param {string} message the error message.
 *        e.g. 'missing xyz parameter'
 * @param {*} [logger] an optional logger instance object with an `info` method
 *        e.g. `new require('@adobe/aio-sdk').Core.Logger('name')`
 *
 * @returns {object} the error object, ready to be returned from the action main's function.
 *
 */
function errorResponse (statusCode, message, logger) {
  if (logger && typeof logger.info === 'function') {
    logger.info(`${statusCode}: ${message}`)
  }
  return {
    error: {
      statusCode,
      body: {
        error: message
      }
    }
  }
}

const removeHeader = (html) => {
  return html.replace(/(<header[^>]*>)[\s\S]*?(<\/header>)/i, '$1$2');
};

const removeFooter = (html) => {
  return html.replace(/(<footer[^>]*>)[\s\S]*?(<\/footer>)/i, '$1$2');
};

// takes an array of domains from Adobe Cloud and returns the first non-deleted one.
const getValidDomain = (domains) => {
  if(!!domains && domains.length > 0){
    const validDomains = domains.filter(domainObject => {
      return domainObject.deleted === false
    })
    if (validDomains.length > 0) {
      return domains[0].domainName;
    }
  }
  return '';
}

// removes /content/my-site-name from a string
const getPageWithoutSiteRoot = (inputPath) => {
  const match = inputPath.match(/^\/content\/[^/]+(\/.+)/);
  if (match && match[1]) {
    return match[1].replace(/^\//, '');
  }
  return inputPath;
};
const paramsToRemove = ['devMode','ext']
const removeSpecifiedQueryParams = (url) => {
  const [path, queryString] = url.split('?');
  if (!queryString) return url;

  const searchParams = new URLSearchParams(queryString);
  paramsToRemove.forEach(param => searchParams.delete(param));

  const newQuery = searchParams.toString();
  return newQuery ? `${path}?${newQuery}` : path;
};

const getFormattedCorrectPagePath = (inputUrl) => {
  // remove /content/... prefix
  let urlPart = getPageWithoutSiteRoot(inputUrl);

  // remove only the AEM params
  urlPart = removeSpecifiedQueryParams(urlPart);

  // split into path & query
  const [path, query] = urlPart.split('?');

  // if it’s the index page, return only the query (or empty)
  if (path === 'index.html' || path === 'index') {
    return query ? `?${query}` : '';
  }

  // strip .html from the end of the path
  const cleanedPath = path.replace(/\.html$/, '');

  // recombine
  return query ? `${cleanedPath}?${query}` : cleanedPath;
};

module.exports = {
  errorResponse,
  getBearerToken,
  stringParameters,
  checkMissingRequestInputs,
  removeHeader,
  removeFooter,
  getFormattedCorrectPagePath,
  getValidDomain
}
