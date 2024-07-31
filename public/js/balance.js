(() => {
    if (!window.app) window.app = {};

    window.app.registerBalance = () => {
        window.app.renderTransactions('balance-transaction-list');
        window.app.renderTransactions('balance-vouchers-list', 7, window.app.vouchers);

        // Calculate revenue
        window.app.revenue = 0;
        for (var t of window.app.payments) {
            window.app.revenue += Number(t.amount);
        }

        // Calculate paid amount
        window.app.paid = 0;
        for (var p of window.app.vouchers) {
            window.app.paid -= Number(p.amount);
        }

        // Calculate general balance
        window.app.genBalance = { amount: window.app.paid + window.app.revenue };

        document.getElementById('balance-genbalance').innerHTML = `₱${window.app.genBalance.amount}`;
        document.getElementById('balance-revenue').innerHTML = `₱${window.app.revenue}`;
        document.getElementById('balance-paid').innerHTML = `₱${Math.abs(window.app.paid)}`;

        // For home
        window.app.renderTransactions();
        document.getElementById('home-genbalance').innerText = "₱" + window.app.genBalance.amount || 0;
        document.getElementById('home-payments').innerText = window.app.payments.length || 0;
        document.getElementById('home-students').innerText = window.app.students.length || 0;

        // See how much each fund has based on departments
        for (var department of window.app.departments) {
            var amount = window.app.payments.filter(p => p.payable == department.payableID)
            if (amount.length > 0) {
                amount = amount.reduce((a, b) => a + Number(b.amount), 0);
            } else {
                amount = 0;
            }
            if (!window.app.allocations) window.app.allocations = [];
            window.app.allocations.push({ name: department.name, amount });
        }
    };

    window.app.updateBalance = window.app.registerBalance;
})();