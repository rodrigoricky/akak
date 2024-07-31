(() => {
    if (!window.app) window.app = {};

    // Can be used to add a transaction to the list or used for another list
    window.app.renderTransactions = (listId = 'transaction-list', limit = 7, transactions = window.app.payments) => {
        // Sort transactions by timestamp (latest first)
        transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Get the latest 7 transactions (lucky 7 ig...hah..hah.....:( )
        const latestTransactions = transactions.slice(0, limit);

        const transactionList = document.getElementById(listId);
        transactionList.innerHTML = ''; // Clear existing content

        // Determine prefix based on voucher/payment
        const prefix = listId.includes('transaction') ? '<span style=color:green>+₱</span>' : '<span style=color:red>-₱</span>';

        latestTransactions.forEach((transaction, index) => {
            const transactionItem = document.createElement('div');
            transactionItem.className = 'flex justify-between p-2 border-b border-gray-200';
            if (index === latestTransactions.length - 1) {
            transactionItem.classList.remove('border-b');
            }
            transactionItem.innerHTML = `
            <span>${window.app.formatTimestamp(transaction.timestamp)}</span>
            <span class="font-semibold">${prefix}${transaction.amount}</span>
            `;
            transactionList.appendChild(transactionItem);
        });

        if (listId != 'transaction-list' && transactions.length < limit) return;

        // Show All Transactions
        const showAll = document.createElement('span');
        showAll.className = 'block text-center text-blue-600 hover:text-blue-900 py-2';
        showAll.innerText = 'Show all transactions';
        // Click mobile/desktop sidebar link
        showAll.onclick = () => document.getElementById(
            (document.body.getBoundingClientRect().width > 768 ? '' : 'mobile-')+ 'sidebar-payments'
        ).click();
        transactionList.appendChild(showAll);
    };
})();