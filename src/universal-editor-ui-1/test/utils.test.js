/* 
* <license header>
*/

const utils = require('./../actions/utils.js')

test('interface', () => {
  expect(typeof utils.errorResponse).toBe('function')
  expect(typeof utils.stringParameters).toBe('function')
  expect(typeof utils.checkMissingRequestInputs).toBe('function')
  expect(typeof utils.getBearerToken).toBe('function')
})

describe('errorResponse', () => {
  test('(400, errorMessage)', () => {
    const res = utils.errorResponse(400, 'errorMessage')
    expect(res).toEqual({
      error: {
        statusCode: 400,
        body: { error: 'errorMessage' }
      }
    })
  })

  test('(400, errorMessage, logger)', () => {
    const logger = {
      info: jest.fn()
    }
    const res = utils.errorResponse(400, 'errorMessage', logger)
    expect(logger.info).toHaveBeenCalledWith('400: errorMessage')
    expect(res).toEqual({
      error: {
        statusCode: 400,
        body: { error: 'errorMessage' }
      }
    })
  })
})

describe('stringParameters', () => {
  test('no auth header', () => {
    const params = {
      a: 1, b: 2, __ow_headers: { 'x-api-key': 'fake-api-key' }
    }
    expect(utils.stringParameters(params)).toEqual(JSON.stringify(params))
  })
  test('with auth header', () => {
    const params = {
      a: 1, b: 2, __ow_headers: { 'x-api-key': 'fake-api-key', authorization: 'secret' }
    }
    expect(utils.stringParameters(params)).toEqual(expect.stringContaining('"authorization":"<hidden>"'))
    expect(utils.stringParameters(params)).not.toEqual(expect.stringContaining('secret'))
  })
})

describe('checkMissingRequestInputs', () => {
  test('({ a: 1, b: 2 }, [a])', () => {
    expect(utils.checkMissingRequestInputs({ a: 1, b: 2 }, ['a'])).toEqual(null)
  })
  test('({ a: 1 }, [a, b])', () => {
    expect(utils.checkMissingRequestInputs({ a: 1 }, ['a', 'b'])).toEqual('missing parameter(s) \'b\'')
  })
  test('({ a: { b: { c: 1 } }, f: { g: 2 } }, [a.b.c, f.g.h.i])', () => {
    expect(utils.checkMissingRequestInputs({ a: { b: { c: 1 } }, f: { g: 2 } }, ['a.b.c', 'f.g.h.i'])).toEqual('missing parameter(s) \'f.g.h.i\'')
  })
  test('({ a: { b: { c: 1 } }, f: { g: 2 } }, [a.b.c, f.g.h])', () => {
    expect(utils.checkMissingRequestInputs({ a: { b: { c: 1 } }, f: { g: 2 } }, ['a.b.c', 'f'])).toEqual(null)
  })
  test('({ a: 1, __ow_headers: { h: 1, i: 2 } }, undefined, [h])', () => {
    expect(utils.checkMissingRequestInputs({ a: 1, __ow_headers: { h: 1, i: 2 } }, undefined, ['h'])).toEqual(null)
  })
  test('({ a: 1, __ow_headers: { f: 2 } }, [a], [h, i])', () => {
    expect(utils.checkMissingRequestInputs({ a: 1, __ow_headers: { f: 2 } }, ['a'], ['h', 'i'])).toEqual('missing header(s) \'h,i\'')
  })
  test('({ c: 1, __ow_headers: { f: 2 } }, [a, b], [h, i])', () => {
    expect(utils.checkMissingRequestInputs({ c: 1 }, ['a', 'b'], ['h', 'i'])).toEqual('missing header(s) \'h,i\' and missing parameter(s) \'a,b\'')
  })
  test('({ a: 0 }, [a])', () => {
    expect(utils.checkMissingRequestInputs({ a: 0 }, ['a'])).toEqual(null)
  })
  test('({ a: null }, [a])', () => {
    expect(utils.checkMissingRequestInputs({ a: null }, ['a'])).toEqual(null)
  })
  test('({ a: \'\' }, [a])', () => {
    expect(utils.checkMissingRequestInputs({ a: '' }, ['a'])).toEqual('missing parameter(s) \'a\'')
  })
  test('({ a: undefined }, [a])', () => {
    expect(utils.checkMissingRequestInputs({ a: undefined }, ['a'])).toEqual('missing parameter(s) \'a\'')
  })
})

describe('getBearerToken', () => {
  test('({})', () => {
    expect(utils.getBearerToken({})).toEqual(undefined)
  })
  test('({ authorization: Bearer fake, __ow_headers: {} })', () => {
    expect(utils.getBearerToken({ authorization: 'Bearer fake', __ow_headers: {} })).toEqual(undefined)
  })
  test('({ authorization: Bearer fake, __ow_headers: { authorization: fake } })', () => {
    expect(utils.getBearerToken({ authorization: 'Bearer fake', __ow_headers: { authorization: 'fake' } })).toEqual(undefined)
  })
  test('({ __ow_headers: { authorization: Bearerfake} })', () => {
    expect(utils.getBearerToken({ __ow_headers: { authorization: 'Bearerfake' } })).toEqual(undefined)
  })
  test('({ __ow_headers: { authorization: Bearer fake} })', () => {
    expect(utils.getBearerToken({ __ow_headers: { authorization: 'Bearer fake' } })).toEqual('fake')
  })
  test('({ __ow_headers: { authorization: Bearer fake Bearer fake} })', () => {
    expect(utils.getBearerToken({ __ow_headers: { authorization: 'Bearer fake Bearer fake' } })).toEqual('fake Bearer fake')
  })
})

describe('removeHeader', () => {
  test('when given a HTML string with a header in it, it removes the inner content and returns the rest', () => {
    const exampleHTML = '<div><header>aaaa</header></div>';
    const expectedResult = '<div><header></header></div>';

    expect(utils.removeHeader(exampleHTML)).toEqual(expectedResult);

    const exampleHTML2 = '<div><header>aaaa</header></div>';
    const expectedResult2 = '<div><header></header></div>';

    expect(utils.removeHeader(exampleHTML2)).toEqual(expectedResult2);
  });
});

describe('removeFooter', () => {
  test('when given a HTML string with a footer in it, it removes the inner content and returns the rest', () => {
    const exampleHTML = '<div><footer>bbbb</footer></div>';
    const expectedResult = '<div><footer></footer></div>';

    expect(utils.removeFooter(exampleHTML)).toEqual(expectedResult);

    const exampleHTML2 = `
      <div>
        <footer>
          bbbb
        </footer>
      </div>
    `;
    const expectedResult2 = `
      <div>
        <footer></footer>
      </div>
    `;

    expect(utils.removeFooter(exampleHTML2)).toEqual(expectedResult2);
  });
});

describe('getFormattedCorrectPagePath',()=>{
  test('when given a url which ends in .html, it removes it',()=>{
    const testUrl = '/content/my-base-site/my-page.html'

    const result = utils.getFormattedCorrectPagePath(testUrl);

    expect(result).toEqual('my-page')
  })
  test('when given a url, it removes the base url off it',()=>{
    const testUrl = '/content/my-base-sit-two/my-page'

    const result = utils.getFormattedCorrectPagePath(testUrl);

    expect(result).toEqual('my-page')
  })
  test('when given a url with AEM get request params, it removes them',()=>{
    let testUrl = '/content/my-base-site/my-page.html?devMode=true&ext=https://my-aem-extensions.com'
    let result = utils.getFormattedCorrectPagePath(testUrl);
    expect(result).toEqual('my-page')

    testUrl = '/content/my-base-site/my-page.html?cheese=true&ext=https://my-aem-extensions.com&name=jack'
    result = utils.getFormattedCorrectPagePath(testUrl);
    expect(result).toEqual('my-page?cheese=true&name=jack')
  })
  test('when given the index page, it returns blank',()=>{
    let testUrl = '/content/my-base-site/index.html'
    let result = utils.getFormattedCorrectPagePath(testUrl);
    expect(result).toEqual('')

    testUrl = '/content/my-base-site/index.html?test=aaaa'
    result = utils.getFormattedCorrectPagePath(testUrl);
    expect(result).toEqual('?test=aaaa')
  })
  test('when given the child of the index page, it returns the correct url',()=>{
    const testUrl = '/content/my-base-site/index/my-test-base/my-test-child.html'

    const result = utils.getFormattedCorrectPagePath(testUrl);

    expect(result).toEqual('index/my-test-base/my-test-child')
  })
})
