// NOT USED // NOT USED // NOT USED //

const store = require('data-store')({ path: process.cwd() + '/data/permissions.json' })

// Save a change request
async function saveChangeRequest(user, action, data) {
  const changeRequest = {
    id: Date.now(),
    user,
    action,
    data,
    approved: false
  };
  store.union('requests', changeRequest);
  return { success: true, message: 'Change request saved for approval' };
}

// Get a change request by ID
async function getChangeRequest(id) {
  const requests = store.get('requests', []) || [];
  return requests.find(req => req.id === id);
}

// Get all change requests
async function getChangeRequests() {
  return store.get('requests', []) || [];
}

// Approve a change request
async function approveChangeRequest(id) {
  let requests = store.get('requests', []) || [];
  const requestIndex = requests.findIndex(req => req.id === id);
  if (requestIndex !== -1) {
    requests[requestIndex].approved = true;
    store.set('requests', requests);
    return { success: true, message: 'Change request approved' };
  } else {
    return { success: false, message: 'Change request not found' };
  }
}

// Delete a change request
async function deleteChangeRequest(id) {
  let requests = store.get('requests', []) || [];
  requests = requests.filter(req => req.id !== id);
  store.set('requests', requests);
  return { success: true, message: 'Change request deleted' };
}

module.exports = {
  saveChangeRequest,
  getChangeRequest,
  getChangeRequests,
  approveChangeRequest,
  deleteChangeRequest
};
