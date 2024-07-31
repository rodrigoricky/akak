(() => {
    if (!window.app) window.app = {};

    window.app.vouchers = [];

    window.app.updateVouchers = () => {
        window.ws.send(JSON.stringify({ action: 'getVouchers' }));
    }

    window.app.addVoucher = (voucher) => {
        window.ws.send(JSON.stringify({ action: 'addVoucher', data: voucher }));
        closeModal();
    };

    window.app.editVoucher = (voucher) => {
        window.ws.send(JSON.stringify({ action: 'addVoucher', data: voucher }));
        closeModal();
    }

    window.app.showEditVoucher = (i) => {
        window.app.voucher = window.app.vouchers[i];

        if (!window.app.voucher) return;

        document.querySelector("#vouchers-edit").style.display = "flex";
        document.querySelector("#vouchers-overlay").classList.remove("hidden");

        document.querySelector("#vouchers-edit-timestamp").value = window.app.formatTimestamp(window.app.voucher.timestamp);
        document.querySelector("#vouchers-edit-requestor").value = window.app.voucher.requestor;
        document.querySelector("#vouchers-edit-amount").value = window.app.voucher.amount;
        document.querySelector("#vouchers-edit-voucherno").value = window.app.voucher.voucherno;
        document.querySelector("#vouchers-edit-allocationID").value = window.app.voucher.allocationID;
        document.querySelector("#vouchers-edit-notes").value = window.app.voucher.notes;

        // Put selected as name for vouchers-edit-name dropdown
        var dropdown = document.querySelector("#vouchers-edit-name");
        var options = dropdown.options;
        for (var opt, j = 0; opt = options[j]; j++) {
            if (opt.value == window.app.voucher.name) {
                dropdown.selectedIndex = j;
                break;
            }
        }
    }

    const closeModal = () => {
        document.querySelector("#vouchers-add").style.display = "none";
        document.querySelector("#vouchers-edit").style.display = "none";
        document.querySelector("#vouchers-main").style.display = "";
        document.querySelector("#vouchers-overlay").classList.add("hidden");
    };

    window.app.renderVouchers = () => {
        var tableHead = document.getElementById('vouchers-list-head') || document.getElementById('pages-vouchers').querySelectorAll("tbody")[0];;
        document.getElementById('vouchers-list').innerHTML = tableHead.innerHTML;

        window.app.vouchers.forEach((voucher, index) => {
            const card = document.getElementById('vouchers-list');

            card.innerHTML += `
            <tbody class="bg-white divide-y divide-gray-200">
            <tr>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${window.app.formatTimestamp(voucher.timestamp)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${voucher.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${voucher.requestor}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${voucher.amount}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${voucher.voucherno}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${voucher.notes}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <a onclick='window.app.showEditVoucher(${window.app.vouchers.indexOf(voucher)})' class="text-blue-600 hover:text-blue-900">Edit</a>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <a onclick='window.app.generateVoucherReceipt(window.app.vouchers[${window.app.vouchers.indexOf(voucher)}], true)' class="text-blue-600 hover:text-blue-900">Print</a>
            </td>
            </tr>
            </tbody>    
            `;
        });
    };

    document.querySelector("#vouchers-add-btn-final").onclick = (e) => {
        e.preventDefault();
        const newVoucher = {
            timestamp: document.querySelector("#vouchers-add-timestamp").value,
            name: document.querySelector("#vouchers-add-name").value,
            requestor: document.querySelector("#vouchers-add-requestor").value,
            amount: document.querySelector("#vouchers-add-amount").value,
            voucherno: document.querySelector("#vouchers-add-voucherno").value,
            allocationID: document.querySelector("#vouchers-add-allocationID").value,
            notes: document.querySelector("#vouchers-add-notes").value,
        }
        window.app.addVoucher(newVoucher);
    };

    document.querySelector("#vouchers-edit-btn-final").onclick = (e) => {
        e.preventDefault();
        const editedVoucher = {
            id: window.app.vouchers[window.app.vouchers.indexOf(window.app.voucher)].id,
            timestamp: document.querySelector("#vouchers-edit-timestamp").value,
            name: document.querySelector("#vouchers-edit-name").value,
            requestor: document.querySelector("#vouchers-edit-requestor").value,
            amount: document.querySelector("#vouchers-edit-amount").value,
            voucherno: document.querySelector("#vouchers-edit-voucherno").value,
            allocationID: document.querySelector("#vouchers-edit-allocationID").value,
            notes: document.querySelector("#vouchers-edit-notes").value,
        }
        window.app.editVoucher(editedVoucher);
    };

    // Cancel buttons
    document.querySelectorAll("#vouchers-cancel, #vouchers-cancel-edit").forEach((button) => {
        button.onclick = closeModal;
    });

    document.querySelector("#vouchers-add-btn").onclick = () => {
        document.querySelector("#vouchers-add").style.display = "flex";
        document.querySelector("#vouchers-overlay").classList.remove("hidden");
    };

    // Search
    document.addEventListener("DOMContentLoaded", () => {
        const searchInput = document.getElementById('search-vouchers');
        searchInput.addEventListener('input', function () {
            const filterBy = document.getElementById('vouchers-filter-by');
            const tableRows = document.querySelectorAll('#vouchers-list tbody tr');
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

    const autoAddRequester = new autoComplete({
        data: {
            src: async () => window.app.departments.map(department => department.name),
        },
        open: function() {
            $("ul.ui-menu").width( $(this).innerWidth() );
        },
        selector: "#vouchers-add-requestor",
        placeHolder: "Search for a requester",
        resultItem: {
            highlight: true
        },
        events: {
            input: {
                selection: (event) => {
                    const selection = event.detail.selection.value;
                    autoAddRequester.input.value = selection;
                }
            }
        }
    });

    const autoEditRequester = new autoComplete({
        data: {
            src: async () => window.app.departments.map(department => department.name),
        },
        selector: "#vouchers-edit-requestor",
        placeHolder: "Search for a requester",
        resultItem: {
            highlight: true
        },
        events: {
            input: {
                selection: (event) => {
                    const selection = event.detail.selection.value;
                    autoEditRequester.input.value = selection;
                }
            }
        }
    });

    // doc.text(`Voucher Receipt`, 105, 10, null, null, 'center');
    // doc.text(`Voucher No: ${voucher.voucherno}`, 10, 20);
    // doc.text(`Timestamp: ${window.app.formatTimestamp(voucher.timestamp)}`, 10, 30);
    // doc.text(`Name: ${voucher.name}`, 10, 40);
    // doc.text(`Requestor: ${voucher.requestor}`, 10, 50);
    // doc.text(`Amount: ${voucher.amount}`, 10, 60);
    // doc.text(`Notes: ${voucher.notes}`, 10, 70);

    window.app.generateVoucherReceipt = (voucher, autoDownload = false) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');

        const img = new Image();
        img.src = '/img/voucherReceipt.png'; 

        img.onload = () => {
            // Draw the image
            doc.addImage(img, 'PNG', -2, 0, 212, 140);

            // Add the text
            doc.setFontSize(10);

            doc.text(`${window.app.formatTimestamp(voucher.timestamp)}`, 172, 5.65);

            doc.setFontSize(15);

            doc.text("voucher.notesvoucher.notesvoucher.notesvoucher.notesvoucher.notesvoucher.notesvoucher.notesvoucher.notesvoucher.notesvoucher.notesvoucher.notes", 38.735, 23.0716667, {
                align: 'left',
                maxWidth: 160
            });

            doc.text(`${voucher.requestor}`, 23.735, 23.0716667 + 46, {
                align: 'left',
                maxWidth: 160
            });

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
                "onclick": () => doc.save(`Voucher-Receipt-${voucher.id}.PDF`)
            }

            if (autoDownload) {
                doc.save(`Voucher-Receipt-${voucher.id}.PDF`);
            } else {
                toastr["success"]("Receipt generated. Click to download.");
            }

            toastr.options = oldOptions;
        };

        img.onerror = (error) => {
            console.error('Error loading the image', error);
        };
    }
})();
