(() => {
    if (!window.app) window.app = {};

    window.app.payments = [];

    const closeModal = () => {
        document.querySelector("#payments-add").style.display = "none";
        document.querySelector("#payments-edit").style.display = "none";
        document.querySelector("#payments-main").style.display = "";
        document.querySelector("#payments-overlay").classList.add("hidden");
        document.querySelector("#payments-add-studentID-pre").classList.add("hidden");
        document.querySelector("#payments-add-studentID").classList.remove("hidden");
        document.querySelector("#payments-add-parentID-pre").classList.add("hidden");
        document.querySelector("#payments-add-parentID").classList.remove("hidden");
    };

    window.app.updatePayments = () => {
        window.ws.send(JSON.stringify({ action: 'getPayments' }));
    }

    window.app.addPayment = (payment) => {
        window.ws.send(JSON.stringify({ action: 'addPayment', data: payment }));
        closeModal();
    };

    window.app.editPayment = (payment) => {
        window.ws.send(JSON.stringify({ action: 'addPayment', data: payment }));
        window.app.renderHome();
        closeModal();
    }

    window.app.showEditPayment = (i) => {
        window.app.payment = window.app.payments[i];

        if (!window.app.payment) return;

        var parent = window.app.parentIDToName(window.app.payment.parentID);
        if (!parent) parent = "";

        var student = window.app.studentIDToName(window.app.payment.studentID);
        if (!student) student = "";

        if (parent == "" && student == "") return toastr["error"]("Parent and student not found");

        document.querySelector("#payments-edit").style.display = "flex";
        document.querySelector("#payments-overlay").classList.remove("hidden");

        document.querySelector("#payments-edit-timestamp").value = window.app.formatTimestamp(window.app.payment.timestamp);
        document.querySelector("#payments-edit-amount").value = window.app.payment.amount;
        document.querySelector("#payments-edit-parentID").value = parent;
        document.querySelector("#payments-edit-studentID").value = student;
        document.querySelector("#payments-edit-or_no").value = window.app.payment.or_no;

        // Add amount parent need to pay
        var { amountToPay, amountPaid, parent } = window.app.getParentPaymentInfo(parent);
        if (parent) {
            var parentLabel = document.querySelector("#payments-edit-amount-label");
            var maxAmountPayable = amountToPay - amountPaid;
            parentLabel.innerText = `Amount (Max: ₱${maxAmountPayable})`;
        }
    }

    window.app.renderPayments = () => {
        window.app.renderHome();
        window.app.renderTransactions();
        window.app.registerPaymentsAutoComplete();

        var tableHead = document.getElementById('payments-list-head') || document.getElementById('pages-payments').querySelectorAll("tbody")[0];;
        document.getElementById('payments-list').innerHTML = tableHead.innerHTML;

        console.log(window.app.payments);

        window.app.payments.forEach((payment, index) => {
            const card = document.getElementById('payments-list');

            card.innerHTML += `
            <tbody class="bg-white divide-y divide-gray-200">
            <tr>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${window.app.formatTimestamp(payment.timestamp)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${payment.id}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${payment.amount}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${window.app.parentIDToName(Number(payment.parentID))}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <a onclick='window.app.showEditPayment(${window.app.payments.indexOf(payment)})' class="text-blue-600 hover:text-blue-900">Edit</a>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <a onclick='window.app.generateReceipt(window.app.payments[${window.app.payments.indexOf(payment)}], true)' class="text-blue-600 hover:text-blue-900">Print</a>
            </td>
            </td>
            </tr>
            </tbody>
            `;
        });

        // Clear the form
        document.querySelector("#payments-add-timestamp").value = "";
        document.querySelector("#payments-add-amount").value = "";
        document.querySelector("#payments-add-parentID").value = "";
        document.querySelector("#payments-add-studentID").value = "";
        document.querySelector("#payments-add-or_no").value = "";
        document.querySelector("#payments-add-payable").value = "";
        document.querySelector("#payments-add-year").value = "";
    };

    function calculateDistribution(newPayment) {
        // #region 
        // Calculate payable allocations to departments
        const year = document.querySelector("#payments-add-year").value || window.app.schoolYears[0].schoolyr;
        newPayment.year = year;
        const percentages = [];

        // Turn p ayables to objects
        const yearPayables = window.app.payables.filter(payable => payable.year == year);

        const total = yearPayables.reduce((a, b) => a + Number(b.amount), 0);
        console.log(total);
        for (var payable of yearPayables) {
            console.log(payable);
            const departments = window.app.departments.filter(department => department.payableID == payable.name);

            percentages.push({ payable: payable.name, departments, percentage: Number(payable.amount) / total });
        }

        // Calculate department allocation
        for (var percentage of percentages) {
            for (var department of percentage.departments) {
                console
                var departmentAmount = Number(newPayment.amount) * percentage.percentage;
                var balance = Number(departmentAmount) * (Number(department.percentage) / 100);
                var addingBalance = String(balance.toFixed(2));
                balance = department.balance ? Number(department.balance) + balance : balance;
                newPayment.departmentData.push({ ...department, balance: String(balance.toFixed(2)), addingBalance });
            }
        }

        console.log(percentages, newPayment.departmentData);

        return newPayment;
        // #endregion
    }

    document.querySelector("#payments-add-btn-final").onclick = (e) => {
        e.preventDefault();

        const year = document.querySelector("#payments-add-year").value || window.app.schoolYears[0].schoolyr;

        var parent = window.app.parentNameToID(document.querySelector("#payments-add-parentID").value);
        if (!parent) parent = -1;

        var student = window.app.studentNameToID(document.querySelector("#payments-add-studentID").value);
        if (!student) student = -1;

        if (student == -1) {
            if (parent == -1) return toastr["error"]("Parent not found");

            var children = window.app.students.filter(student => student.parentID == parent);

            if (children.length == 0) return toastr["error"]("No children found for this parent");

            const { amountToPay, amountPaid } = window.app.getParentPaymentInfo(window.app.parentIDToName(parent));

            if (amountPaid >= amountToPay) return toastr["error"]("This parent has already paid for this year");

            console.log(`Amount to pay: ${amountToPay}, Amount paid: ${amountPaid}`)
        } else {
            if (parent == -1) {
                parent = window.app.students.find(student => student.id == student).parentID;
                if (!parent) return toastr["error"]("Parent not found");
            }
        }

        var newPayment = {
            timestamp: document.querySelector("#payments-add-timestamp").value,
            amount: document.querySelector("#payments-add-amount").value,
            parentID: parent,
            studentID: student,
            or_no: document.querySelector("#payments-add-or_no").value,
            payable: document.querySelector("#payments-add-payable").value.split("‎")[0],
            departmentData: [],
        }

        // make sure it's not over max amount payable
        const { amountToPay, amountPaid } = window.app.getParentPaymentInfo(window.app.parentIDToName(parent));
        if (newPayment.amount > amountToPay) return toastr["error"]("The amount paid is already over the max amount payable");

        if (document.querySelector("#payments-add-autofill").checked) {
            newPayment.or_no = window.app.payments.length + 1;
            document.querySelector("#payments-add-autofill").checked = false;
            document.querySelector("#payments-add-or_no").value = "";
        }

        if (isNaN(Number(newPayment.amount))) return toastr["error"]("Please enter a valid amount");
        if (isNaN(Number(newPayment.or_no))) return toastr["error"]("Please enter a valid receipt number");

        newPayment = calculateDistribution(newPayment);

        console.log(newPayment);
        return;

        // Update departments locally
        window.app.departments = window.app.departments.map(department => {
            const newDepartment = newPayment.departmentData.find(d => d.id == department.id);
            if (newDepartment) {
                return newDepartment;
            }
            return department;
        });

        window.app.addPayment(newPayment);
    };

    document.querySelector("#payments-edit-btn-final").onclick = (e) => {
        e.preventDefault();

        var parent = window.app.parentNameToID(document.querySelector("#payments-edit-parentID").value);
        if (!parent) parent = window.app.payment.parentID || "";

        var student = window.app.studentNameToID(document.querySelector("#payments-edit-studentID").value);
        if (!student) student = window.app.payment.studentID || "";

        if (parent == "" && student == "") return toastr["error"]("Parent and student not found");

        var editedPayment = {
            id: window.app.payments[window.app.payments.indexOf(window.app.payment)].id,
            amount: document.querySelector("#payments-edit-amount").value,
            parentID: parent,
            studentID: student,
            or_no: document.querySelector("#payments-edit-or_no").value,
            departmentData: [],
        }

        // make sure it's not over max amount payable
        const { amountToPay, amountPaid } = window.app.getParentPaymentInfo(window.app.parentIDToName(parent));
        if (editedPayment.amount > amountToPay) return toastr["error"]("The amount paid is already over the max amount payable");

        if (isNaN(Number(editedPayment.amount))) return toastr["error"]("Please enter a valid amount");

        editedPayment = calculateDistribution(editedPayment);

        // Update departments locally
        window.app.departments = window.app.departments.map(department => {
            const newDepartment = editedPayment.departmentData.find(d => d.id == department.id);
            if (newDepartment) {
                return newDepartment;
            }
            return department;
        });

        window.app.editPayment(editedPayment);
    };

    // Cancel buttons
    document.querySelectorAll("#payments-cancel, #payments-cancel-edit").forEach((button) => {
        button.onclick = closeModal;
    });

    document.querySelector("#payments-add-btn").onclick = () => {
        document.querySelector("#payments-add").style.display = "flex";
        document.querySelector("#payments-overlay").classList.remove("hidden");
    };

    window.app.registerPaymentsAutoComplete = () => {
        const autoAddParent = new autoComplete({
            data: {
                src: async () => window.app.parents.map(parent => parent.name),
            },
            selector: "#payments-add-parentID",
            placeHolder: "Search for a parent",
            resultItem: {
                highlight: true
            },
            events: {
                input: {
                    selection: (event) => {
                        const selection = event.detail.selection.value;
                        autoAddParent.input.value = selection;

                        if (window.app.parents.find(parent => parent.name.toLowerCase() == selection.toLowerCase())) {
                            var pre = document.querySelector("#payments-add-studentID-pre");
                            var box = document.querySelector("#payments-add-studentID");

                            box.classList.add("hidden");
                            pre.classList.remove("hidden");

                            var commaSeparated = window.app.students.filter(student => student.parentID == window.app.parentNameToID(selection)).map(student => student.name).join(", ");
                            if (commaSeparated.endsWith(", ")) commaSeparated = commaSeparated.slice(0, -2);
                            if (commaSeparated == "") commaSeparated = "No children found";
                            pre.innerText = commaSeparated;
                        } else {
                            pre.classList.add("hidden");
                            box.classList.remove("hidden");
                        }

                        // Add amount parent need to pay
                        var { amountToPay, amountPaid, parent } = window.app.getParentPaymentInfo(selection);
                        if (parent) {
                            var parentLabel = document.querySelector("#payments-add-amount-label");
                            var maxAmountPayable = amountToPay - amountPaid;
                            parentLabel.innerText = `Amount (Max: ₱${maxAmountPayable})`;
                        }
                    }
                }
            }
        });
        document.querySelector("#payments-add-studentID").oninput = (e) => {
            var pre = document.querySelector("#payments-add-studentID-pre");
            var box = document.querySelector("#payments-add-studentID");

            if (window.app.students.find(student => student.name.toLowerCase() == e.target.value.toLowerCase())) {
                box.classList.add("hidden");
                pre.classList.remove("hidden");

                var commaSeparated = window.app.students.filter(student => student.name.toLowerCase() == e.target.value.toLowerCase()).map(student => student.name).join(", ");
                if (commaSeparated.endsWith(", ")) commaSeparated = commaSeparated.slice(0, -2);
                if (commaSeparated == "") commaSeparated = "No children found";
                pre.innerText = commaSeparated;
            } else {
                pre.classList.add("hidden");
                box.classList.remove("hidden");
            }
        }

        const autoEditParent = new autoComplete({
            data: {
                src: async () => window.app.parents.map(parent => parent.name),
            },
            selector: "#payments-edit-parentID",
            placeHolder: "Search for a parent",
            resultItem: {
                highlight: true
            },
            events: {
                input: {
                    selection: (event) => {
                        const selection = event.detail.selection.value;
                        autoEditParent.input.value = selection;

                        // Add amount parent need to pay
                        var { amountToPay, amountPaid, parent } = window.app.getParentPaymentInfo(selection);
                        if (parent) {
                            var parentLabel = document.querySelector("#payments-edit-amount-label");
                            var maxAmountPayable = amountToPay - amountPaid;
                            parentLabel.innerText = `Amount (Max: ₱${maxAmountPayable})`;
                        }
                    }
                }
            }
        });

        const autoAddStudent = new autoComplete({
            data: {
                src: async () => window.app.students.map(student => student.name),
            },
            selector: "#payments-add-studentID",
            placeHolder: "Search for a student",
            resultItem: {
                highlight: true
            },
            events: {
                input: {
                    selection: (event) => {
                        const selection = event.detail.selection.value;
                        autoAddStudent.input.value = selection;

                        var parent = window.app.parents.find(parent => parent.id == window.app.students.find(student => student.name == selection).parentID);
                        if (!parent) return;

                        var pre = document.querySelector("#payments-add-parentID-pre");
                        var box = document.querySelector("#payments-add-parentID");

                        box.classList.add("hidden");
                        pre.classList.remove("hidden");

                        pre.innerText = parent.name;
                        box.value = parent.name;
                    }
                }
            }
        });

        const autoEditStudent = new autoComplete({
            data: {
                src: async () => window.app.students.map(student => student.name),
            },
            selector: "#payments-edit-studentID",
            placeHolder: "Search for a student",
            resultItem: {
                highlight: true
            },
            events: {
                input: {
                    selection: (event) => {
                        const selection = event.detail.selection.value;
                        autoEditStudent.input.value = selection;
                    }
                }
            }
        });

        const autoAddPayable = new autoComplete({
            data: {
                src: async () => Object.keys(window.app.payables).map(payable => `${payable}‎ (₱${window.app.payables[payable]})`),
            },
            selector: "#payments-add-payable",
            placeHolder: "Search for a payable",
            resultItem: {
                highlight: true
            },
            events: {
                input: {
                    selection: (event) => {
                        const selection = event.detail.selection.value;
                        const name = selection.split("‎")[0];
                        console.log(name);
                        const amount = window.app.payables[name];

                        autoAddPayable.input.value = selection;
                        document.querySelector("#payments-add-amount").value = amount;
                    }
                }
            }
        });

        const autoAddYear = new autoComplete({
            data: {
                src: async () => window.app.schoolYears.map(parent => parent.schoolyr),
            },
            selector: "#payments-add-year",
            placeHolder: "Search for a year",
            resultItem: {
                highlight: true
            },
            events: {
                input: {
                    selection: (event) => {
                        const selection = event.detail.selection.value;
                        autoAddYear.input.value = selection;
                    }
                }
            }
        });
    }

    // Search
    document.addEventListener("DOMContentLoaded", () => {
        const searchInput = document.getElementById('search-payments');
        searchInput.addEventListener('input', function () {
            const filterBy = document.getElementById('payments-filter-by');
            const tableRows = document.querySelectorAll('#payments-list tbody tr');
            const searchTerm = this.value.toLowerCase();
            const filter = filterBy.value;

            // Grade Level Filter
            if (filter == "5") {
                // Select all rows in the table body
                const rows = document.querySelectorAll('#payments-list tbody tr');

                rows.forEach(row => {
                    const studentNameCell = row.querySelector('td:nth-child(4)');
                    if (studentNameCell) {
                        const studentName = studentNameCell.textContent.trim();
                        const students = window.app.students.filter(student => {
                            var parent = window.app.parents.find(parent => parent.name.toLowerCase() == studentName.toLowerCase());
                            if (!parent) return false;
                            return student.parentID == String(parent.id);
                        });

                        // Check if this student's name should be filtered out
                        const shouldHide = students.findIndex(student => searchTerm.includes(student.gradeID)) == -1;

                        if (shouldHide) {
                            row.style.display = 'none';
                        } else {
                            row.style.display = '';
                        }
                    }
                });

                return;
            }


            tableRows.forEach(row => {
                const value = row.querySelector(`td:nth-child(${filter})`)?.textContent?.toLowerCase();
                if (!value) return;

                if (value.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    });

    document.querySelector("#payments-add-autofill").onchange = (e) => {
        if (e.target.checked) {
            document.querySelector("#payments-add-or_no").value = window.app.payments.length + 1;
        } else {
            document.querySelector("#payments-add-or_no").value = "";
        }
    }

    window.app.generateReceipt = (payment, autoDownload = false) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'letter'); // HAR: changed from 'a4' to 'letter'
        var student = window.app.students.find(student => student.id == payment.studentID);
        const parent = window.app.parents.find(parent => parent.id == payment.parentID);

        if (!student) {
            student = window.app.students.find(student => student.parentID == payment.parentID) || { sectionID: "" };
        }

        const year = document.querySelector("#payments-add-year").value || window.app.schoolYears[0].schoolyr;

        // Load and add the image to the PDF
        // const img = new Image();
        // img.src = '/img/paymentReceipt.png'; // Update this path to the correct location
	console.log('Available Fonts:', doc.getFontList());
	// Add receipt texts
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(10);

	// doc.text(String(payment.or_no || payment.id), x, y,); FOR O.R. #
	doc.text("SALES INVOICE", 65, 10); // SALES INVOICE text
	doc.text("SALES INVOICE", 175, 10);
	doc.text(parent.name, 17, 38); // Parent name on first page of receipt
	doc.text(parent.name, 124, 38); // Parent name on second page of receipt
	doc.text(window.app.formatTimestamp(payment.timestamp), 70, 38); // Date (timestamp) of payment on first page of receipt
	doc.text(window.app.formatTimestamp(payment.timestamp), 178, 38); // Date (timestamp) of payment on second pageof receipt
	doc.text(student.LRN, 17, 42); // LRN 1st page
	doc.text(student.LRN, 124, 42); // LRN 2nd page
	doc.text(year, 17, 46); // SY 1st page
	doc.text(year, 124, 46); // SY 2nd page
	doc.text(student.sectionID, 70, 42); // Section 1st page
	doc.text(student.sectionID, 178, 42); //Section 2nd page
	doc.text(student.gradeID, 70, 46); // Year 1st page
	doc.text(student.gradeID, 178, 46); // Year 2nd page

	// delete this part

        // Manually calculate departmentData based on amount, it does not exist in the payment object
        payment.departmentData = [];
        const percentages = [];

        // Turn payables to objects
        const yearPayables = window.app.payables.filter(payable => payable.year == year);

        const total = yearPayables.reduce((a, b) => a + Number(b.amount), 0);
        console.log('TOTAL:', total);

        for (var payable of yearPayables) {
		console.log(payable);
                const departments = window.app.departments.filter(department => department.payableID == payable.name);
                percentages.push({ payable: payable.name, departments, percentage: Number(payable.amount) / total });
        }

        doc.setFontSize(10); // HAR Changed from 12 to 10

	// Set values to align payment info
        var startY = 55;
	const startX = 20;
	var itemY = 64;

	// Particulars
	doc.text("=".repeat(40), (startX - 5), startY);
	doc.text("PARTICULARS", startX, startY + 3);
	doc.text("=".repeat(40), (startX- 5), startY + 6);

        Object.entries(percentages).forEach(([key, value]) => {
        	itemY += 7;
		console.log('itemY:', itemY);
		doc.text((key + 1), startX, itemY);
		doc.text(value.payable, (startX + 10), itemY);

		// Department name
        	doc.text((payment.amount * value.percentage).toFixed(2), (startX + 70), itemY, { align: "right" }); // Amount 
        });

        // Total
	doc.text("=".repeat(40), (startX - 5), (itemY + 10) );
	doc.text("=".repeat(40), (startX + 102), (itemY + 10) );
	doc.text('TOTAL', startX, (itemY + 13));
	doc.text('TOTAL', (startX + 105), (itemY + 13) );
	doc.text('PHP ' + (Number(payment.amount).toFixed(2)), (startX + 70), (itemY + 13), { align: "right" }) ;
	doc.text('PHP ' + (Number(payment.amount).toFixed(2)), (startX + 178), (itemY + 13), { align: "right" }) ;
	doc.text("=".repeat(40), (startX - 5), (itemY + 16)) ;
	doc.text("=".repeat(40), (startX + 102), (itemY + 16) );

	// Save the PDF
	var oldOptions = toastr.options;
        toastr.options = {
        	"closeButton": true,
                "debug": false,
                "newestOnTop": false,
                "progressBar": false,
                "positionClass": "toast-top-right",
                "preventDuplicates": false,
                "showDuration": "300",
                "hideDuration": "1000",
                "timeOut": "10000",
                "extendedTimeOut": "1000",
                "showEasing": "swing",
                "hideEasing": "linear",
                "showMethod": "fadeIn",
                "hideMethod": "fadeOut",
                "onclick": () => doc.save(`Receipt-${payment.or_no}.PDF`)
	}

	if (autoDownload) {
                doc.save(`Receipt-${payment.or_no}.PDF`); // ricky
        } else {
                toastr["success"]("Receipt generated. Click to download.");
        }

        toastr.options = oldOptions;
	// delete the upper part
    };

})();
