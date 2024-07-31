(() => {
    // nobody else needs these functions so they are not in window.app
    document.addEventListener('DOMContentLoaded', () => {
        const printButton = document.getElementById('print-print');
        const reportTypeSelect = document.getElementById('print-report-type');

        reportTypeSelect.addEventListener('change', () => {
            const reportType = reportTypeSelect.value;
            document.getElementById('print-students-options').style.display = reportType === 'students' ? 'block' : 'none';
            document.getElementById('print-vouchers-options').style.display = reportType === 'vouchers' ? 'block' : 'none';
            document.getElementById('print-balance-options').style.display = reportType === 'balance' ? 'block' : 'none';
        });

        printButton.addEventListener('click', () => {
            const reportType = reportTypeSelect.value;

            if (reportType === 'students') {
                const schoolYear = document.getElementById('print-year').value;
                const section = document.getElementById('print-section').value;
                const gradeLevel = document.getElementById('print-grade').value;
                const transactions = filterTransactions(schoolYear, section, gradeLevel);
                const formattedData = formatData(transactions, reportType);
                generatePDF(formattedData);
            } else if (reportType === 'vouchers') {
                const fromDate = document.getElementById('print-vouchers-from-date').value;
                const toDate = document.getElementById('print-vouchers-to-date').value;
                const vouchers = filterVouchers(fromDate, toDate);
                const formattedData = formatData(vouchers, reportType);
                generatePDF(formattedData);
            } else if (reportType === 'balance') {
                const fromDate = document.getElementById('print-balance-from-date').value;
                const toDate = document.getElementById('print-balance-to-date').value;
                const balanceTransactions = filterBalanceTransactions(fromDate, toDate);
                const formattedData = formatData(balanceTransactions, reportType);
                generatePDF(formattedData);
            }
        });
    });

    function filterTransactions(schoolYear, section, gradeLevel) {
        return window.app.payments.filter(payment => {
            const parent = window.app.parents.find(parent => String(parent.id) == payment.parentID) || { id: -1 };

            let student = window.app.students.find(student => student.parentID == String(parent.id));

            student = window.app.students.find(student => String(student.id) == payment.studentID) || student;

            if (!student) return false;

            return payment.year === schoolYear &&
                (!section || student.sectionID == section) &&
                (!gradeLevel || student.schoolyrID === gradeLevel);
        });
    }

    function filterVouchers(fromDate, toDate) {
        const fromTimestamp = new Date(fromDate).toISOString();
        const toTimestamp = new Date(toDate).toISOString();
        return window.app.vouchers.filter(voucher => {
            return voucher.timestamp >= fromTimestamp && voucher.timestamp <= toTimestamp;
        });
    }

    function filterBalanceTransactions(fromDate, toDate) {
        const fromTimestamp = new Date(fromDate).toISOString();
        const toTimestamp = new Date(toDate).toISOString();
        return window.app.transactions.filter(transaction => {
            return transaction.timestamp >= fromTimestamp && transaction.timestamp <= toTimestamp;
        });
    }

    function formatData(data, reportType) {
        if (reportType === 'students') {
            return data.map(transaction => {
                let student;
                let parent;
                if (transaction.studentID != null && transaction.studentID != "-1") {
                    student = window.app.students.find(student => String(student.id) == transaction.studentID);
                } else {
                    parent = window.app.parents.find(parent => String(parent.id) == transaction.parentID);
                    student = window.app.students.find(student => student.parentID == String(parent.id));
                }

                if (!student) return {
                    name: 'Unknown',
                    gradeLevel: 'Unknown',
                    section: 'Unknown',
                    amountPaid: transaction.amount
                };

                return {
                    name: student.name,
                    gradeLevel: student.gradeID,
                    section: student.sectionID,
                    amountPaid: transaction.amount
                };
            });
        } else if (reportType === 'vouchers') {
            return data.map(voucher => {
                return {
                    voucherNumber: String(voucher.id),
                    amount: voucher.amount,
                    date: voucher.timestamp
                };
            });
        } else if (reportType === 'balance') {
            var thisBalance = 0; 
            return data.map(transaction => {
                thisBalance += Number(transaction.amount);
                return {
                    date: transaction.timestamp,
                    amount: transaction.amount,
                    balance: thisBalance
                };
            });
        }
    }

    function generatePDF(data) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const reportType = document.getElementById('print-report-type').value;

        let yPosition = 10;

        if (reportType === 'students') {
            doc.text('NAME', 10, yPosition);
            doc.text('GRADE LEVEL', 60, yPosition);
            doc.text('SECTION', 110, yPosition);
            doc.text('AMOUNT PAID', 160, yPosition);

            yPosition += 10;

            data.forEach(item => {
                doc.text(item.name, 10, yPosition);
                doc.text(item.gradeLevel, 60, yPosition);
                doc.text(item.section, 110, yPosition);
                doc.text(item.amountPaid, 160, yPosition);
                yPosition += 10;
            });
        } else if (reportType === 'vouchers') {
            doc.text('VOUCHER #', 10, yPosition);
            doc.text('AMOUNT', 60, yPosition);
            doc.text('DATE', 110, yPosition);

            yPosition += 10;

            data.forEach(item => {
                doc.text(item.voucherNumber, 10, yPosition);
                doc.text(item.amount, 60, yPosition);
                doc.text(window.app.formatTimestamp(item.date), 110, yPosition);
                yPosition += 10;
            });
        } else if (reportType === 'balance') {
            doc.text('DATE', 10, yPosition);
            doc.text('AMOUNT', 90, yPosition);
            doc.text('BALANCE', 140, yPosition);

            yPosition += 10;

            data.forEach(item => {
                doc.text(window.app.formatTimestamp(item.date), 10, yPosition);
                doc.text(item.amount, 90, yPosition);
                doc.text(String(item.balance), 140, yPosition);
                yPosition += 10;
            });
        }

        const time = window.app.getDate();
        doc.text(`Generated On: ${time} | Generated By ${window.app.user.name}`, 10, yPosition + 10);

        doc.save('Transactions.PDF');
    }
})();
