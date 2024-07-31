(() => {
    if (!window.app) window.app = {};

    const ctx = document.getElementById('home-transactions').getContext('2d');
    let transactionsChart;

    window.app.updateChart = function (period) {
        const salesData = [];
        const labels = [];
        const now = new Date();
        const startDate = new Date(now);
        let endDate;
    
        document.getElementById('btn-day').style.backgroundColor = 'rgba(33, 140, 255, 0.4)';
        document.getElementById('btn-week').style.backgroundColor = 'rgba(33, 140, 255, 0.4)';
        document.getElementById('btn-month').style.backgroundColor = 'rgba(33, 140, 255, 0.4)';
        document.getElementById(`btn-${period}`).style.backgroundColor = 'rgba(33, 140, 255, 1)';
    
        switch (period) {
            case 'day':
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(startDate);
                endDate.setHours(24, 0, 0, 0);
                break;
            case 'week':
                startDate.setDate(now.getDate() - 7);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(startDate);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(startDate);
                break;
        }
    
        const dateMap = {};
        window.app.payments.forEach(transaction => {
            const transactionDate = new Date(transaction.timestamp);
            if (transactionDate >= startDate && transactionDate <= now) {
                let key;
                if (period === 'day') {
                    key = transactionDate.getHours();
                } else {
                    key = transactionDate.toDateString();
                }
                dateMap[key] = (dateMap[key] || 0) + Number(transaction.amount);
            }
        });
    
        if (period === 'day') {
            for (let h = 0; h < 24; h++) {
                labels.push(`${h}:00`);
                salesData.push(dateMap[h] || 0);
            }
        } else {
            for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
                const dateString = d.toDateString();
                labels.push(dateString);
                salesData.push(dateMap[dateString] || 0);
            }
        }
    
        if (transactionsChart) {
            transactionsChart.destroy();
        }
    
        transactionsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Sales (₱)',
                    data: salesData,
                    borderColor: 'rgba(33, 140, 255, 1)',
                    backgroundColor: 'rgba(33, 140, 255, 0.2)',
                    fill: true,
                    tension: 0.1,
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                    }
                }
            }
        });
    };
    

    window.app.renderHome = () => {
        window.app.updateChart('week');
        window.app.updateBalance();
        document.getElementById('home-genbalance').innerText = "₱" + window.app.genBalance.amount || 0;
        document.getElementById('home-payments').innerText = window.app.payments.length || 0;
        document.getElementById('home-students').innerText = window.app.students.length || 0;
        // mobile
        document.getElementById('home-students-mobile').innerText = window.app.students.length || 0;
        document.getElementById('home-payments-mobile').innerText = window.app.payments.length || 0;

        // logout
        document.querySelector("#main-name").onclick = () => {
            var dropdown = document.getElementById("main-name-dropdown");
            dropdown.classList.toggle("hidden");
        }
    }

    document.querySelector("#sidebar-home").addEventListener('click', () => {
        window.app.renderHome();
    });

    window.app.registerPermissions = () => {
        var role = window.app.user.role;

        var hideEditElements = () => {
            const links = document.getElementsByTagName('a');
            const allEditElements = Array.from(links).filter(link => link.innerHTML.trim() === 'Edit');
            allEditElements.forEach(element => {
                element.style.display = 'none';
            });
        }

        var hideAddElements = () => {
            var allAddElements = document.querySelectorAll('[id*="-add-"]');
            allAddElements.forEach(element => {
                element.style.display = 'none';
            });
        }

        var hidePage = (page) => {
            var pageElement = document.getElementById(`pages-${page}`);
            if (pageElement) {
                pageElement.style.display = 'none';
            }

            // Mobile
            var mobilePageElement = document.getElementById(`mobile-sidebar-${page}`);
            if (mobilePageElement) {
                mobilePageElement.style.display = 'none';
            }

            var sidebarElement = document.getElementById(`sidebar-${page}`);
            if (sidebarElement) {
                sidebarElement.style.display = 'none';
            }
        }

        var showPage = (page) => {
            var pageElement = document.getElementById(`pages-${page}`);
            if (pageElement) {
                pageElement.style.display = 'block';
            }

            var sidebarElement = document.getElementById(`sidebar-${page}`);
            if (sidebarElement) {
                sidebarElement.style.display = 'block';
            }
        }

        switch (role.toLowerCase()) {
            case 'super admin':
                break;
            case 'granted viewer':
                hideAddElements();
                hideEditElements();
                break;
            case 'treasurer':
                hideEditElements();
                hideAddElements();
                hidePage('users');
                hidePage('students');
                hidePage('parents');
                hidePage('departments');
                hidePage('vouchers');
                hidePage('payments');
                break;
            case 'auditor':
                hidePage('users');
                hideEditElements();
                hideAddElements();
                break;
            case 'officer':
                hidePage('users');
                hidePage('students');
                hidePage('parents');
                hidePage('departments');
                hideAddElements();
                break;
            case 'user':
                console.log('user');
                hidePage('users');
                hideEditElements();
                break;
        }
    }
})();
