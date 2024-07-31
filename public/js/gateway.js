(() => {
    if (!window.app) window.app = {
        transactions: [],
        students: [],
        parents: [],
        payments: [],
        allocations: [],
        allocationBalance: [],
        vouchers: [],
        balanceData: [],
        balanceHistory: [],
        users: []
    };

    window.ws = new WebSocket(`ws://${window.location.host}/api/gateway`);

    window.ws.onopen = () => {
        console.log('Connected to gateway');
    };

    window.loaded = false;

    window.ws.onmessage = (msg) => {
        var data = JSON.parse(msg.data);

        if (window.loaded) {
            if (data.success === false)  {
                toastr["error"](data.message);
                return;
            } else {
                toastr["success"]("Updated entry.");
            }
        }

        var capitalize = (s) => {
            return s.charAt(0).toUpperCase() + s.slice(1);
        }

        switch (data.action.trim()) {
            case 'user':
                window.app.user = data.data;
                document.getElementById('main-username').innerText = data.data.name;
                document.getElementById('main-role').innerText = capitalize(data.data.role);
                document.getElementById('mobile-username').innerText = data.data.name;
                document.getElementById('mobile-role').innerText = capitalize(data.data.role);
                
                document.getElementById('main-date').innerText = window.app.getDate();
                document.getElementById('main-name').innerText.replace('Super Admin', data.data.name);
                if (window.location.pathname == '/home') {
                    document.getElementById('main-title').innerText = `${window.app.getTimeIntroduction()}, ${window.app.user.name} 👋`;
                }
                break;
            case 'load':
                window.app.schoolYears = data.data.schoolYears || [];
                window.app.transactions = data.data.transactions || [];
                window.app.students = data.data.students || [];
                window.app.parents = data.data.parents || [];
                window.app.payments = data.data.payments || [];
                window.app.departments = data.data.departments || [];
                window.app.vouchers = data.data.vouchers || [];
                window.app.users = data.data.users || [];
                window.app.genBalance = { amount: 0 };
                window.app.payables = data.data.payables || [];
                window.app.sections = data.data.sections || [];
                window.app.scholarships = data.data.scholarships || [];
            
                window.loaded = true;
                toastr["success"]("All information loaded.");
                break;
            case 'updateTransactions':
                window.app.transactions = data.data;
                window.app.updateBalance();
                window.app.renderTransactions();
                break;
            case 'updateStudents':
                window.app.students = data.data;
                window.app.renderStudents();
                break;
            case 'updateParents':
                window.app.parents = data.data;
                window.app.renderParents();
                break;
            case 'updatePayments':
                var oldPayments = window.app.payments;
                window.app.payments = data.data;

                if (oldPayments.length != window.app.payments.length) {
                    window.app.generateReceipt(window.app.payments[window.app.payments.length - 1]);
                }

                window.app.updateBalance();
                window.app.renderPayments();
                window.app.renderDepartments();
                break;
            case 'updateDepartments':
                console.log(data.data); 
                window.app.departments = data.data;
                window.app.renderDepartments();
                break;
            case 'updateAllocationBalance':
                window.app.allocationBalance = data.data;
                window.app.renderAllocationBalance();
                break;
            case 'updateVouchers':
                var oldVouchers = window.app.vouchers;
                window.app.vouchers = data.data;

                if (oldVouchers.length != window.app.vouchers.length) {
                    window.app.generateVoucherReceipt(window.app.vouchers[window.app.vouchers.length - 1]);
                }
                
                window.app.updateBalance();
                window.app.renderVouchers();
                break;
            case 'updateBalanceData':
                window.app.balanceData = data.data;
                window.app.renderBalanceData();
                break;
            case 'updateBalanceHistory':
                window.app.balanceHistory = data.data;
                window.app.renderBalanceHistory();
                break;
            case 'updateUsers':
                window.app.users = data.data;
                window.app.renderUsers();
                break;
            case 'updatePayables':
                window.app.payables = data.data;
                window.app.renderPayables();
                break;
            case 'updateSections':
                window.app.sections = data.data;
                break;
            case 'updateScholarships':
                window.app.scholarships = data.data;
                break;
            default:
                console.error('Unknown action received: ', data.action);
        }

        window.app.renderAll(); // Ensure that all data is updated
        window.app.registerPermissions();
    };

    window.app.renderAll = () => {
        window.app.registerPermissions();
        window.app.renderTransactions();
        window.app.renderHome();
        window.app.renderStudents();
        window.app.renderParents();
        window.app.renderPayments();
        window.app.renderDepartments();
        window.app.renderVouchers();
        window.app.renderUsers();
        window.app.registerBalance();
        window.app.renderPayables();
    }
})();
