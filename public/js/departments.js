(() => {
    if (!window.app) window.app = {};

    window.app.departments = [];

    window.app.updateDepartments = () => {
        window.ws.send(JSON.stringify({ action: 'getDepartments' }));
    }

    window.app.addDepartment = (department) => {
        window.ws.send(JSON.stringify({ action: 'addDepartment', data: department }));
        closeModal();
    };

    window.app.editDepartment = (department) => {
        console.log(department)
        window.ws.send(JSON.stringify({ action: 'addDepartment', data: department }));
        closeModal();
    }

    window.app.showEditDepartment = (i) => {
        window.app.department = window.app.departments[i];
        if (!window.app.department) return;

        document.querySelector("#departments-edit").style.display = "flex";
        document.querySelector("#departments-overlay").classList.remove("hidden");

        document.querySelector("#departments-edit-payableID").value = window.app.department.payableID;
        document.querySelector("#departments-edit-name").value = window.app.department.name;
        document.querySelector("#departments-edit-percentage").value = window.app.department.percentage;
        document.querySelector("#departments-edit-notes").value = window.app.department.notes;
    }

    const closeModal = () => {
        document.querySelector("#departments-add").style.display = "none";
        document.querySelector("#departments-edit").style.display = "none";
        document.querySelector("#departments-main").style.display = "";
        document.querySelector("#departments-overlay").classList.add("hidden");
    };

    // Function to render list
    window.app.renderDepartments = () => {
        var tableHead = document.getElementById('departments-list-head') || document.getElementById('pages-allocations').querySelectorAll("tbody")[0];
        document.getElementById('departments-list').innerHTML = tableHead.innerHTML;

        window.app.departments.forEach((department, index) => {
            var amountToDeduct = window.app.vouchers.filter(voucher => voucher.requestor === department.name).reduce((acc, voucher) => acc + parseFloat(voucher.amount), 0);
            department.balance = String(parseFloat(department.balance) - amountToDeduct);

            const card = document.getElementById('departments-list');
            card.innerHTML += `
            <tbody class="bg-white divide-y divide-gray-200">
            <tr>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${department.payableID}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${department.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${department.percentage}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${department.notes}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${department.balance}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <a onclick='window.app.showEditDepartment(${index})' class="text-blue-600 hover:text-blue-900">Edit</a>
            </td>
            </tr>
            </tbody>
            `;
        });

        window.app.registerDepartmentsAutoComplete();
    };

    // Function to handle form submission
    document.querySelector("#departments-add-btn-final").onclick = (e) => {
        e.preventDefault();
        const newDepartment = {
            payableID: document.querySelector("#departments-add-payableID").value,
            name: document.querySelector("#departments-add-name").value,
            percentage: document.querySelector("#departments-add-percentage").value,
            notes: document.querySelector("#departments-add-notes").value,
            balance: "0"
        }
        window.app.addDepartment(newDepartment);
    };

    // Handle edit form submission
    document.querySelector("#departments-edit-btn-final").onclick = (e) => {
        e.preventDefault();
        const editedDepartment = {
            id: window.app.departments[window.app.departments.indexOf(window.app.department)].id,
            payableID: document.querySelector("#departments-edit-payableID").value,
            name: document.querySelector("#departments-edit-name").value,
            percentage: document.querySelector("#departments-edit-percentage").value,
            notes: document.querySelector("#departments-edit-notes").value,
            balance: String(window.app.departments[window.app.departments.indexOf(window.app.department)].balance)
        }
        window.app.editDepartment(editedDepartment);
    };

    // Cancel buttons
    document.querySelectorAll("#departments-cancel, #departments-cancel-edit").forEach((button) => {
        button.onclick = closeModal;
    });

    document.querySelector("#departments-add-btn").onclick = () => {
        document.querySelector("#departments-add").style.display = "flex";
        document.querySelector("#departments-overlay").classList.remove("hidden");
    };

    window.app.registerDepartmentsAutoComplete = () => {
        const autoAddPayable = new autoComplete({
            data: {
                src: async () => window.app.payables.map(payable => payable.name),
            },
            selector: "#departments-add-payableID",
            placeHolder: "Search for a payable",
            resultItem: {
                highlight: true
            },
            events: {
                input: {
                    selection: (event) => {
                        const selection = event.detail.selection.value;
                        autoAddPayable.input.value = selection;
                    }
                }
            }
        });

        const autoEditPayable = new autoComplete({
            data: {
                src: async () => window.app.payables.map(payable => payable.name),
            },
            selector: "#departments-edit-payableID",
            placeHolder: "Search for a payable",
            resultItem: {
                highlight: true
            },
            events: {
                input: {
                    selection: (event) => {
                        const selection = event.detail.selection.value;
                        autoEditPayable.input.value = selection;
                    }
                }
            }
        });
    }

    // Search
    document.addEventListener("DOMContentLoaded", () => {
        const searchInput = document.getElementById('search-departments');
        searchInput.addEventListener('input', function () {
            const filterBy = document.getElementById('departments-filter-by');
            const tableRows = document.querySelectorAll('#departments-list tbody tr');
            const searchTerm = this.value.toLowerCase();
            const filter = filterBy.value;
            console.log('searching', filter, searchTerm);
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
})();
