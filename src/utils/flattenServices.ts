export function flattenServices(cases: any[] = []) {
  const allServices: any[] = [];
  cases.forEach((caseObj) => {
    if (Array.isArray(caseObj.services)) {
      caseObj.services.forEach((service: any) => {
        allServices.push({
          ...service,
          parentCase: {
            _id: caseObj._id,
            ownerName: caseObj.ownerName,
            clientName: caseObj.clientName,
            unitName: caseObj.unitName,
            franchiseAddress: caseObj.franchiseAddress,
            stateHead: caseObj.stateHead,
            authorizedPerson: caseObj.authorizedPerson,
            overallStatus: caseObj.overallStatus,
            caseName: caseObj.caseName, // Add caseName if needed
            remark: caseObj.remark,     // Add remark if needed
          },
        });
      });
    }
  });
  return allServices;
}