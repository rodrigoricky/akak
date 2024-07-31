const mysql = require('mysql2/promise');

// Create MySQL connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root2',
  password: 'TCNHS-Spta-2024',
  database: 'school_accounting',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper function to check permissions
function checkPermission(user, allowedRoles) {
  if (!allowedRoles.includes(user.role.toLowerCase())) {
    throw new Error('Permission denied');
  }
}

// Function to check if values are valid
function checkValues(data) {
  for (const key in data) {
    const value = data[key];
    switch (key) {
      case 'id':
        if (value !== undefined && isNaN(Number(value))) {
          throw new Error(`Invalid value for ${key}: ${value}`);
        }
        break;
      case 'parentID':
      case 'studentID':
      case 'allocationID':
      case 'or_no':
        if (isNaN(value)) {
          throw new Error(`Invalid value for ${key}: ${value}`);
        }
        break;
      case 'payableID':
      case 'name':
      case 'address':
      case 'relationship':
      case 'contact':
      case 'role':
      case 'amount':
      case 'percentage':
      case 'class':
      case 'schoolyr':
      case 'timestamp':
      case 'requestor':
      case 'voucherno':
      case 'password':
      case 'sectionID':
      case 'gradeID':
      case 'schoolyrID':
        if (typeof value !== 'string') {
          throw new Error(`Invalid value for ${key}: ${value}`);
        }

        if (value.length === 0) {
          throw new Error(`Empty value for ${key}`);
        }
        break;
      case 'LRN':
        if (value.length !== 12 || isNaN(Number(value))) {
          throw new Error(`LRN must be 12 numbers long`);
        }
        break;
     // default:
        //throw new Error(`Unknown key: ${key}`);
    }
  }
}

// Function to get data
async function getData(user) {
  checkPermission(user, ['super admin', 'granted viewer', 'auditor', 'treasurer', 'officer', 'user']);

  const conn = await pool.getConnection();
  try {
    const [transactions, students, parents, payments, allocations, allocationBalances, vouchers, users, genBalance, payables, schoolYears, sections, scholarships] = await Promise.all([
      getPayments(user, conn),
      getStudents(user, conn),
      getParents(user, conn),
      getPayments(user, conn),
      getAllocations(user, conn),
      getAllocationBalance(user, conn),
      getVouchers(user, conn),
      getUsers(user, conn),
      getGenBalance(user, conn),
      getPayables(user, conn),
      getSchoolYears(user, conn),
      getSections(user, conn),
      getScholarships(user, conn)
    ]);

    return {
      transactions,
      students,
      parents,
      payments,
      departments: allocations,
      allocationBalances,
      vouchers,
      users,
      genBalance,
      payables,
      schoolYears,
      sections,
      scholarships
    };
  } catch (err) {
    throw err;
  } finally {
    conn.release();
  }
}

// Function to get transactions
async function getTransactions(user, period, conn = null) {
  checkPermission(user, ['super admin', 'granted viewer', 'auditor', 'treasurer', 'officer', 'user']);

  if (!conn) {
    conn = await pool.getConnection();
  }

  try {
    const query = `SELECT * FROM payments WHERE timestamp >= DATE_SUB(CURDATE(), INTERVAL 1 ${period.toUpperCase()})`;
    const [rows] = await conn.query(query);
    return rows;
  } catch (err) {
    throw err;
  } finally {
    if (!conn) {
      conn.release();
    }
  }
}

// Function to get students
async function getStudents(user, conn = null) {
  checkPermission(user, ['super admin', 'granted viewer', 'auditor', 'treasurer', 'officer', 'user']);

  if (!conn) {
    conn = await pool.getConnection();
  }

  try {
    const query = 'SELECT * FROM student';
    const [rows] = await conn.query(query);
    return rows;
  } catch (err) {
    throw err;
  } finally {
    if (!conn) {
      conn.release();
    }
  }
}

// Function to add student
async function addStudent(user, id, name, LRN, parentID, gradeID, sectionID, scholarshipID, schoolyrID) {
  checkPermission(user, ['super admin', 'user']);

  // Check values
  checkValues({ id, name, LRN, parentID, gradeID, sectionID, scholarshipID, schoolyrID });

  const conn = await pool.getConnection();
  try {
    var sections = await getSections(user, conn);
    var section = sections.find(section => section.class.toLowerCase() === sectionID.toLowerCase()); 

    if (!section) {
      sections = await addSection(user, sections.length + 1, sectionID, gradeID);
      section = sections.find(section => section.class.toLowerCase() === sectionID.toLowerCase());
      console.log('Added section', section);
    }

    sectionID = String(section.id);

    const query = `
      INSERT INTO student (id, name, LRN, parentID, gradeID, sectionID, scholarshipID, schoolyrID)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      name = VALUES(name), 
      parentID = VALUES(parentID), 
      gradeID = VALUES(gradeID), 
      sectionID = VALUES(sectionID), 
      scholarshipID = VALUES(scholarshipID), 
      schoolyrID = VALUES(schoolyrID),
      LRN = VALUES(LRN)
    `;
    await conn.query(query, [id, name, LRN, parentID, gradeID, sectionID, scholarshipID, schoolyrID]);
    
    const students = await getStudents(user, conn);
    return students;
  } catch (err) {
    throw err;
  } finally {
    conn.release();
  }
}

// Function to get parents
async function getParents(user, conn = null) {
  checkPermission(user, ['super admin', 'granted viewer', 'auditor', 'treasurer', 'officer', 'user']);

  if (!conn) {
    conn = await pool.getConnection();
  }

  try {
    const query = 'SELECT * FROM parent';
    const [rows] = await conn.query(query);
    return rows;
  } catch (err) {
    throw err;
  } finally {
    if (!conn) {
      conn.release();
    }
  }
}

// Function to add parent
async function addParent(user, id, name, address, relationship, contact, notes) {
  checkPermission(user, ['super admin', 'user']);

  // Check values
  checkValues({ id, name, address, relationship, contact, notes });

  const conn = await pool.getConnection();
  try {
    const query = `
      INSERT INTO parent (id, name, address, relationship, contact, notes)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      address = VALUES(address), 
      relationship = VALUES(relationship), 
      contact = VALUES(contact), 
      notes = VALUES(notes),
      name = VALUES(name)
    `;
    await conn.query(query, [id, name, address, relationship, contact, notes]);
    
    const parents = await getParents(user, conn);
    return parents;
  } catch (err) {
    throw err;
  } finally {
    conn.release();
  }
}

// Function to get payments
async function getPayments(user, conn = null) {
  checkPermission(user, ['super admin', 'granted viewer', 'auditor', 'treasurer', 'officer', 'user']);

  if (!conn) {
    conn = await pool.getConnection();
  }

  try {
    const query = 'SELECT * FROM payments';
    const [rows] = await conn.query(query);
    return rows;
  } catch (err) {
    throw err;
  } finally {
    if (!conn) {
      conn.release();
    }
  }
}

// Function to add payment
async function addPayment(user, id, or_no, amount, parentID, studentID, departmentData, year) {
  checkPermission(user, ['super admin', 'user', 'officer']);

  // Check values
  checkValues({ id, or_no, amount, parentID, studentID });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const query = `
      INSERT INTO payments (id, or_no, amount, parentID, studentID, year)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      amount = VALUES(amount), 
      parentID = VALUES(parentID), 
      studentID = VALUES(studentID),
      timestamp = CURRENT_TIMESTAMP,
      or_no = VALUES(or_no),
      year = VALUES(year)
    `;
    await conn.query(query, [id, or_no, amount, parentID, studentID, year]);

    const updateGenBalance = 'INSERT INTO genbalance (allocationID, amount) VALUES (1, ?) ON DUPLICATE KEY UPDATE amount = VALUES(amount)';
    await conn.query(updateGenBalance, [amount]);

    await conn.commit();

    const promises = [];
    const alloPromises = [];

    // Update department balances
    for (const department of departmentData) {
      promises.push(addAllocation(user, department.id, department.payableID, department.name, department.percentage, department.notes, department.balance));
    }
    await Promise.all(promises);

    // Update allocation balances
    for (const department of departmentData) {
      alloPromises.push(addAllocationBalance(user, null, department.id, department.addingBalance));
    }
    await Promise.all(alloPromises);
    
    const payments = await getPayments(user, conn);
    return payments;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// Function to get allocations
async function getAllocations(user, conn = null) {
  checkPermission(user, ['super admin', 'granted viewer', 'auditor', 'treasurer', 'officer', 'user']);

  if (!conn) {
    conn = await pool.getConnection();
  }

  try {
    const query = 'SELECT * FROM allocation';
    const [rows] = await conn.query(query);
    return rows;
  } catch (err) {
    throw err;
  } finally {
    if (!conn) {
      conn.release();
    }
  }
}

// Function to get allocation balance
async function getAllocationBalance(user, conn = null) {
  checkPermission(user, ['super admin', 'granted viewer', 'auditor', 'treasurer', 'officer', 'user']);

  if (!conn) {
    conn = await pool.getConnection();
  }

  try {
    const query = 'SELECT * FROM allobalance';
    const [rows] = await conn.query(query);
    return rows;
  } catch (err) {
    throw err;
  } finally {
    if (!conn) {
      conn.release();
    }
  }
}

// Function to add allocation balance
async function addAllocationBalance(user, id, allocationID, amount) {
  checkPermission(user, ['super admin']);

  // Check values
  checkValues({ allocationID, amount });

  const conn = await pool.getConnection();
  try {
    const query = `
      INSERT INTO allobalance (allocationID, amount)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE 
      amount = VALUES(amount), 
      allocationID = VALUES(allocationID)
    `;
    await conn.query(query, [allocationID, amount]);
    
    const allocationBalances = await getAllocationBalance(user, conn);
    return allocationBalances;
  } catch (err) {
    throw err;
  } finally {
    conn.release();
  }
}


// Function to get vouchers
async function getVouchers(user, conn = null) {
  checkPermission(user, ['super admin', 'granted viewer', 'auditor', 'treasurer', 'officer', 'user']);

  if (!conn) {
    conn = await pool.getConnection();
  }

  try {
    const query = 'SELECT * FROM vouchers';
    const [rows] = await conn.query(query);
    return rows;
  } catch (err) {
    throw err;
  } finally {
    if (!conn) {
      conn.release();
    }
  }
}

// Function to add voucher
async function addVoucher(user, id, name, requestor, amount, voucherno, allocationID, notes) {
  checkPermission(user, ['super admin', 'user', 'officer']);

  // Check values
  checkValues({ id, name, requestor, amount, voucherno, allocationID, notes });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const query = `
      INSERT INTO vouchers (id, name, requestor, amount, voucherno, allocationID, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      requestor = VALUES(requestor),
      amount = VALUES(amount),
      voucherno = VALUES(voucherno),
      allocationID = VALUES(allocationID),
      notes = VALUES(notes)
    `;
    await conn.query(query, [id, name, requestor, amount, voucherno, allocationID, notes]);

    const updateGenBalance = 'INSERT INTO genbalance (allocationID, amount) VALUES (1, -?) ON DUPLICATE KEY UPDATE amount = VALUES(amount)';
    await conn.query(updateGenBalance, [amount]);

    await conn.commit();
    
    const vouchers = await getVouchers(user, conn);
    return vouchers;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// Function to get users
async function getUsers(user, conn = null) {
  if (user.role.toLowerCase() != 'super admin') {
    return [];
  }

  checkPermission(user, ['super admin', 'granted viewer', 'auditor', 'treasurer', 'officer', 'user']);

  if (!conn) {
    conn = await pool.getConnection();
  }

  try {
    const query = 'SELECT * FROM users';
    const [rows] = await conn.query(query);
    return rows;
  } catch (err) {
    throw err;
  } finally {
    if (!conn) {
      conn.release();
    }
  }
}

// Function to add user
async function addUser(user, id, name, password, role) {
  checkPermission(user, ['super admin']);

  // Check values
  checkValues({ id, name, role, password });

  const conn = await pool.getConnection();
  try {
    const query = `
      INSERT INTO users (id, name, role, password)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      name = VALUES(name), 
      role = VALUES(role),
      password = VALUES(password)
    `;
    await conn.query(query, [id, name, role, password]);
    
    const users = await getUsers(user, conn);
    return users;
  } catch (err) {
    throw err;
  } finally {
    conn.release();
  }
}

// Function to get general balance
async function getGenBalance(user, conn = null) {
  checkPermission(user, ['super admin', 'granted viewer', 'auditor', 'treasurer', 'officer', 'user']);

  if (!conn) {
    conn = await pool.getConnection();
  }

  try {
    const query = 'SELECT * FROM genbalance';
    const [rows] = await conn.query(query);
    return rows[0] || { amount: 0 };
  } catch (err) {
    throw err;
  } finally {
    if (!conn) {
      conn.release();
    }
  }
}

async function loginUser(username, password) {
  const conn = await pool.getConnection();
  try {
    const query = 'SELECT * FROM users WHERE name = ? AND password = ?';
    const [rows] = await conn.query(query, [username, password]);
    if (rows.length === 0) {
      return { success: false, message: 'Invalid username or password' };
    } else {
      return { success: true, user: rows[0] };
    }
  } catch (err) {
    return { success: false, message: err.message };
  } finally {
    conn.release();
  }
}

async function addAllocation(user, id, payableID, name, percentage, notes, balance="0") {
  checkPermission(user, ['super admin']);

  // Check values
  checkValues({ id, payableID, name, percentage, notes });

  if (typeof balance == 'string' && isNaN(Number(balance))) {
    throw new Error(`Invalid value for balance: ${balance}`);
  }

  balance = String(balance);

  const conn = await pool.getConnection();
  try {
    const query = `
      INSERT INTO allocation (id, payableID, name, percentage, notes, balance)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      name = VALUES(name), 
      percentage = VALUES(percentage), 
      notes = VALUES(notes),
      payableID = VALUES(payableID),
      balance = VALUES(balance)
    `;
    await conn.query(query, [id, payableID, name, percentage, notes, balance]);
    
    const allocations = await getAllocations(user, conn);
    return allocations;
  } catch (err) {
    throw err;
  } finally {
    conn.release();
  }
}

async function getPayables(user, conn = null) {
  checkPermission(user, ['super admin', 'granted viewer', 'auditor', 'treasurer', 'officer', 'user']);

  if (!conn) {
    conn = await pool.getConnection();
  }

  try {
    const query = 'SELECT * FROM payables';
    const [rows] = await conn.query(query);
    return rows;
  } catch (err) {
    throw err;
  } finally {
    if (!conn) {
      conn.release();
    }
  }
}

/*
Student Publication - 90
Student Organization - 60
Annual/Miscellanous - 95
Janitorial Clerks & Trainors - 295
School Development Fund - 100
*/
async function addPayable(user, sp, so, am, jt, sf, year) {
  checkPermission(user, ['super admin']);

  const conn = await pool.getConnection();
  try {
    // Clear payables
    const clearQuery = 'DELETE FROM payables WHERE year = ?';

    await conn.query(clearQuery, [year]);
    
    const query = `
      INSERT INTO payables (name, amount, year)
      VALUES 
        ('Student Publication', ?, ?),
        ('Student Organization', ?, ?),
        ('Annual/Miscellaneous', ?, ?),
        ('Janitorial Clerks & Trainers', ?, ?),
        ('School Development Fund', ?, ?)
      ON DUPLICATE KEY UPDATE 
        amount = VALUES(amount),
        year = VALUES(year) 
    `;
    await conn.query(query, [sp.amount, year, so.amount, year, am.amount, year, jt.amount, year, sf.amount, year]);
    
    const payables = await getPayables(user, conn);

    // Remove duplicates but keep diffrent years
    const uniquePayables = [];

    for (const payable of payables) {
      if (!uniquePayables.find(p => p.name === payable.name)) {
        uniquePayables.push(payable);
      }
    }

    return payables;
  } catch (err) {
    throw err;
  } finally {
    conn.release();
  }

}

async function getSchoolYears(user, conn = null) {
  checkPermission(user, ['super admin', 'granted viewer', 'auditor', 'treasurer', 'officer', 'user']);

  if (!conn) {
    conn = await pool.getConnection();
  }

  try {
    const query = 'SELECT * FROM schoolyr';
    const [rows] = await conn.query(query);
    return rows;
  } catch (err) {
    throw err;
  } finally {
    if (!conn) {
      conn.release();
    }
  }
}


async function doesLRNExistInSchoolYear(LRN, schoolyrID) {
	return new Promise((resolve, reject)  => {
	const query = 'SELECT * FROM student WHERE LRN = ? AND schoolyrID = ?';
	conn.query(query, [LRN, schoolyrID], (error, results) => {
		if(error) {
			reject(error);
		} else {
			resolve(results.length > 0);
		}
	  });
 	});
}

async function importStudents(user, students) {
  checkPermission(user, ['super admin']);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const query = `
      INSERT INTO student (id, name, LRN, parentID, gradeID, sectionID, scholarshipID, schoolyrID)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      name = VALUES(name), 
      parentID = VALUES(parentID), 
      gradeID = VALUES(gradeID), 
      sectionID = VALUES(sectionID), 
      scholarshipID = VALUES(scholarshipID), 
      schoolyrID = VALUES(schoolyrID),
      LRN = VALUES(LRN)
    `;

    for (const student of students) {
      await conn.query(query, [student.id, student.name, student.LRN, student.parentID, student.gradeID, student.sectionID, student.scholarshipID, student.schoolyrID]);
    }

    await conn.commit();

    const updatedStudents = await getStudents(user, conn);
    return updatedStudents;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function importParents(user, parents) {
  checkPermission(user, ['super admin']);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const query = `
      INSERT INTO parent (id, name, address, relationship, contact, notes)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      address = VALUES(address), 
      relationship = VALUES(relationship), 
      contact = VALUES(contact), 
      notes = VALUES(notes),
      name = VALUES(name)
    `;

    for (const parent of parents) {
      await conn.query(query, [parent.id, parent.name, parent.address, parent.relationship, parent.contact, parent.notes]);
    }

    await conn.commit();

    const updatedParents = await getParents(user, conn);
    return updatedParents;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function getSections(user, conn = null) {
  checkPermission(user, ['super admin', 'granted viewer', 'auditor', 'treasurer', 'officer', 'user']);

  if (!conn) {
    conn = await pool.getConnection();
  }

  try {
    const query = 'SELECT * FROM section';
    const [rows] = await conn.query(query);
    return rows;
  } catch (err) {
    throw err;
  } finally {
    if (!conn) {
      conn.release();
    }
  }
}

// id PK, class, gradeID
async function addSection(user, id, _class, gradeID) {
  checkPermission(user, ['super admin']);

  // Check values
  checkValues({ id, _class, gradeID });

  const conn = await pool.getConnection();
  try {
    const query = `
      INSERT INTO section (id, class, gradeID)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      class = VALUES(class), 
      gradeID = VALUES(gradeID)
    `;
    await conn.query(query, [id, _class, gradeID]);
    
    const sections = await getSections(user, conn);
    return sections;
  } catch (err) {
    throw err;
  } finally {
    conn.release();
  }
}

// id,name,amount,notes
async function addScholarship(user, id, name, amount, notes) {
  checkPermission(user, ['super admin']);

  // Check values
  checkValues({ id, name, amount, notes });

  const conn = await pool.getConnection();
  try {
    const query = `
      INSERT INTO scholar (id, name, amount, notes)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      name = VALUES(name), 
      amount = VALUES(amount), 
      notes = VALUES(notes)
    `;
    await conn.query(query, [id, name, amount, notes]);
    
    const scholarships = await getScholarships(user, conn);
    return scholarships;
  } catch (err) {
    throw err;
  } finally {
    conn.release();
  }
}

async function getScholarships(user, conn = null) {
  checkPermission(user, ['super admin', 'granted viewer', 'auditor', 'treasurer', 'officer', 'user']);

  if (!conn) {
    conn = await pool.getConnection();
  }

  try {
    const query = 'SELECT * FROM scholar';
    const [rows] = await conn.query(query);
    return rows;
  } catch (err) {
    throw err;
  } finally {
    if (!conn) {
      conn.release();
    }
  }
}

module.exports = {
  getData,
  getTransactions,
  getStudents,
  addStudent,
  getParents,
  addParent,
  getPayments,
  addPayment,
  getAllocations,
  getAllocationBalance,
  doesLRNExistInSchoolYear,
  addAllocationBalance,
  addAllocation,
  getVouchers,
  addVoucher,
  getUsers,
  addUser,
  getGenBalance,
  loginUser,
  getPayables,
  addPayable,
  getSchoolYears,
  importStudents,
  importParents,
  getSections,
  addSection,
  getScholarships,
  addScholarship,
};
