const db = require('../apis/database');

const handler = async (ws, req) => {
  const user = req.user;

  // Send user
  ws.send(JSON.stringify({
    action: 'user',
    data: user
  }));

  try {
    var allData = await db.getData(user);
  } catch (err) {
    console.error(err);
    ws.send(JSON.stringify({ success: false, message: err.message }));
    return;

  };

  // First time load
  ws.send(JSON.stringify({
    action: 'load',
    data: allData
  }));

  // Handle different gets and sets (then return new data)
  ws.on('message', async (msg) => {
    const { action, data } = JSON.parse(msg);
    let response;

    try {
      switch (action) {
        case 'getTransactions':
          response = await db.getTransactions(user, data.period);
          break;
        case 'getStudents':
          response = await db.getStudents(user);
          break;
        case 'addStudent':
          response = await db.addStudent(user, data.id, data.name, data.LRN, data.parentID, data.gradeID, data.sectionID, data.scholarshipID, data.schoolyrID);
          break;
        case 'getParents':
          response = await db.getParents(user);
          break;
        case 'addParent':
          response = await db.addParent(user, data.id, data.name, data.address, data.relationship, data.contact, data.notes);
          break;
        case 'getPayments':
          response = await db.getPayments(user);
          break;
        case 'addPayment':
          response = await db.addPayment(user, data.id, data.or_no, data.amount, data.parentID, data.studentID, data.departmentData, data.year);
          break;
        case 'getAllocations':
          response = await db.getAllocations(user);
          break;
        case 'getAllocationBalance':
          response = await db.getAllocationBalance(user);
          break;
        case 'addAllocation':
          response = await db.addAllocation(user, data.id, data.payableID, data.name, data.percentage, data.notes, data.balance);
          break;
        case 'getVouchers':
          response = await db.getVouchers(user);
          break;
        case 'addVoucher':
          console.log(data);
          response = await db.addVoucher(user, data.id, data.name, data.requestor, data.amount, data.voucherno, data.allocationID, data.notes);
          break;
        case 'getBalanceData':
          response = await db.getBalanceData(user);
          break;
        case 'getBalanceHistory':
          response = await db.getBalanceHistory(user);
          break;
        case 'getUsers':
          response = await db.getUsers(user);
          break;
        case 'addUser':
          response = await db.addUser(user, data.id, data.name, data.password, data.role);
          break;
        case 'getDepartments':
          response = await db.getAllocations(user);
          break;
        case 'addDepartment':
          response = await db.addAllocation(user, data.id, data.payableID, data.name, data.percentage, data.notes);
          break;
        case 'getPayables':
          response = await db.getPayables(user);
          break;
        case 'addPayable':
          response = await db.addPayable(user, data[0], data[1], data[2], data[3], data[4], data[4].year);
          break;
        case 'getSections':
          response = await db.getSections(user);
          break;
        case 'addSection':
          response = await db.addSection(user, data.id, data.class, data.gradeID);
          break;
        case 'getScholarships':
          response = await db.getScholarships(user);
          break;
        case 'addScholarship':
          response = await db.addScholarship(user, data.id, data.name, data.amount, data.notes);
          break;
        case 'impStudents':
          response = await db.importStudents(user, data);
          break;
        case 'impParents':
          response = await db.importParents(user, data);
          break;
        default:
          response = { success: false, message: 'Unknown action' };
      }
    } catch (err) {
      response = { success: false, message: err.message };
    }

    // Here, update based on action
    var subsection;

    if ((action.startsWith('add') || action.startsWith('imp')) && response.success != false) {
      subsection = action.substring(3);
      subsection += (action.startsWith('imp')) ? '' : 's';

      console.log(`update${subsection}`);

      ws.send(JSON.stringify({
        action: `update${subsection}`.trim(),
        data: response
      }));
    } else {
      ws.send(JSON.stringify(response));
    }
  });
};

module.exports = handler;
