/* 
* <license header>
*/

const {getValidDomain} = require('./../actions/utils.js')

describe('getValidDomain()', () => {
  test('when given a set of domains, it returns domains which are not deleted and are most recent', () => {
    const testDomains = [
      {
        "deleted":false,
        "id":1410233,
        "domainName":"sandbox-recordedfuture.ensemble.com",
        "programId":130788,
        "createdAt":1748634117543,
        "updatedAt":1748634117543,
        "acmeValidationStatus":"NOT_VERIFIED",
        "adobeValidationStatus":"NOT_VERIFIED",
        "acmeValidationToken":"30b3e5d68675d740dbd9c3a2268b0918.cm-verify.adobe.com",
        "adobeValidationToken":"adobe-aem-verification=ec56f014-cd83-444d-aea3-6e88b209c757"
      },
      {
        deleted: true,
        id: 1396671,
        domainName: 'forms2.service.yukon.ca',
        programId: 125405,
        createdAt: 1734465892017,
        updatedAt: 1734644662209,
        acmeValidationStatus: 'VERIFIED',
        adobeValidationStatus: 'NOT_VERIFIED',
        acmeValidationToken: '906fbb62c8f3fb4073d649ed717f277c.cm-verify.adobe.com',
        adobeValidationToken: 'adobe-aem-verification=9a39a5d9-79cf-4e34-a2d1-c24697a7ddd5'
      }]

    const res = getValidDomain(testDomains)
    expect(res).toEqual("sandbox-recordedfuture.ensemble.com")
  })
})