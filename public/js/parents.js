(() => {
    if (!window.app) window.app = {};

    window.app.parents = []; // Store parents data
    window.app.parentTitleHook = new Function();

    // Function to update parents data
    window.app.updateParents = () => {
        window.ws.send(JSON.stringify({ action: 'getParents' }));
    }

    // Function to add a new parent
    window.app.addParent = (parent) => {
        window.ws.send(JSON.stringify({ action: 'addParent', data: parent }));

        closeModal();
    };

    window.app.editParent = (parent) => {
        console.log(parent)

        window.ws.send(JSON.stringify({ action: 'addParent', data: parent }));

        closeModal();
    }

    window.app.showEditParent = (i) => {
        window.app.parent = window.app.parents[i];
        if (!window.app.parent) return;

        console.log(window.app.parent);

        document.querySelector("#parents-edit").style.display = "flex";
        document.querySelector("#parents-overlay").classList.remove("hidden");

        document.querySelector("#parents-edit-first-name").value = window.app.parent.name.split(' ')[0];
        document.querySelector("#parents-edit-last-name").value = window.app.parent.name.split(' ')[1];
        document.querySelector("#parents-edit-address").value = window.app.parent.address;
        document.querySelector("#parents-edit-relationship").value = window.app.parent.relationship;
        document.querySelector("#parents-edit-contact").value = window.app.parent.contact;
        document.querySelector("#parents-edit-notes").value = window.app.parent.notes;
    }

    const closeModal = () => {
        document.querySelector("#parents-add").style.display = "none";
        document.querySelector("#parents-edit").style.display = "none";
        document.querySelector("#parents-main").style.display = "";
        document.querySelector("#parents-overlay").classList.add("hidden");
    };


    // Function to render parents list
    window.app.renderParents = () => {
        var tableHead = document.getElementById('parents-list-head') || document.getElementById('pages-parents').querySelectorAll("tbody")[0];;
        document.getElementById('parents-list').innerHTML = tableHead.innerHTML;

        // Render each parent as a card just like the students above with payment status
        window.app.parents.forEach((parent, index) => {
            const card = document.getElementById('parents-list');
            const status = window.app.getParentPaymentStatus(parent.name);
            const { amountToPay, amountPaid } = window.app.getParentPaymentInfo(parent.name);
            const remainingBalance = amountToPay - amountPaid;
            const color = status == " Paid" ? "#038303" : status == "Unpaid" ? "#830703" : "#7d7d7d";

            card.innerHTML += `
            <tbody class="bg-white divide-y divide-gray-200">
            <tr>
            <td
            class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
            ${parent.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            ${parent.address}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            ${parent.relationship}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${parent.contact}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            <div style="height: 20px; width: ${status == ' Paid' ? '80' : '115'}px; padding-left: 5px; background-color: ${color}; color: white; border-radius: 8px; font-weight: 500; display: flex;">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:20px;">
                ${
                    status == " Paid" ? 
                    `<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />` :
                    `<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />`
                }
            </svg>
            ${status} ${status == " Paid" ? "" : `(₱${remainingBalance})`}
            </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <a onclick='window.app.showEditParent(${index})' class="text-blue-600 hover:text-blue-900">Edit</a>
            </td>
            </tr>
            </tbody>
            `;
        });

        // // Render each parent as a card
        // window.app.parents.forEach((parent, index) => {
        //     const card = document.getElementById('parents-list');

        //     // Editable fields
        //     card.innerHTML += `
        //     <tbody class="bg-white divide-y divide-gray-200">
        //     <tr>
        //     <td
        //     class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        //     ${parent.name}</td>
        //     <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        //     ${parent.address}</td>
        //     <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        //     ${parent.relationship}</td>
        //     <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${parent.contact}
        //     </td>
        //     <td
        //     class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        //     <a onclick='window.app.showEditParent(${window.app.parents.indexOf(parent)})' class="text-blue-600 hover:text-blue-900">Edit</a>
        //     </td>
        //     </tr>
        //     </tbody>    
        //     `;
        // });
        
    };

    // Function to handle form submission
    document.querySelector("#parents-add-btn-final").onclick = (e) => {
        e.preventDefault();
        const newParent = {
            name: `${document.querySelector("#parents-add-first-name").value} ${document.querySelector("#parents-add-last-name").value}`,
            address: document.querySelector("#parents-add-address").value,
            relationship: document.querySelector("#parents-add-relationship").value,
            contact: document.querySelector("#parents-add-contact").value,
            notes: document.querySelector("#parents-add-notes").value,
        };
        window.app.addParent(newParent);
    };

    // Handle edit form submission
    document.querySelector("#parents-edit-btn-final").onclick = (e) => {
        e.preventDefault();
        const editedParent = {
            id: window.app.parents[window.app.parents.indexOf(window.app.parent)].id,
            name: `${document.querySelector("#parents-edit-first-name").value} ${document.querySelector("#parents-edit-last-name").value}`,
            address: document.querySelector("#parents-edit-address").value,
            relationship: document.querySelector("#parents-edit-relationship").value,
            contact: document.querySelector("#parents-edit-contact").value,
            notes: document.querySelector("#parents-edit-notes").value,
        };
        window.app.editParent(editedParent);
    };

    // Cancel buttons
    document.querySelectorAll("#parents-cancel, #parents-cancel-edit").forEach((button) => {
        button.onclick = closeModal;
    });

    document.querySelector("#parents-add-btn").onclick = () => {
        document.querySelector("#parents-add").style.display = "flex";
        document.querySelector("#parents-overlay").classList.remove("hidden");
    };

    // Search
    document.addEventListener("DOMContentLoaded", () => {
        const searchInput = document.getElementById('search-parents');
        searchInput.addEventListener('input', function () {
            const filterBy = document.getElementById('parents-filter-by');
            const tableRows = document.querySelectorAll('#parents-list tbody tr');
            const searchTerm = this.value.toLowerCase();
            const filter = filterBy.value;
            console.log('searching', filter, searchTerm);
            tableRows.forEach(row => {
                const value = row.querySelector(`td:nth-child(${filter})`)?.innerHTML?.toLowerCase();
                if (!value) return;
                if (searchTerm == 'paid' && value.includes('unpaid')) {
                    row.style.display = 'none';
                } else if (value.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    });

    // Import parents button
    document.querySelector("#parents-import").onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            var text = e.target.result;

            // Excel may have an extra line at the end
            if (text.endsWith("\n")) {
                text = text.slice(0, -1);
            }

            const rows = text.split("\n").map(row => row.split(","));

            // Validate headers
            const headers = rows[0];
            if (headers[0] !== "Name" || headers[1] !== "Address" || headers[2] !== "Relationship" || headers[3] !== "Contact" || headers[4] !== "Notes") {
                return toastr["error"]("Invalid CSV file");
            }

            // Remove headers
            rows.shift();

            // Validate rows
            const parents = [];
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                if (row.length !== 5) {
                    return toastr["error"]("Invalid CSV file");
                }

                const parent = {
                    name: row[0],
                    address: row[1],
                    relationship: row[2],
                    contact: row[3],
                    notes: row[4]
                };

                parents.push(parent);
            }

            // Make every parent param a string
            parents.forEach(parent => {
                parent.name = String(parent.name);
                parent.address = String(parent.address);
                parent.relationship = String(parent.relationship);
                parent.contact = String(parent.contact);
                parent.notes = String(parent.notes);
            });

            // Send to server
            window.ws.send(JSON.stringify({ action: 'impParents', data: parents }));
        };
        reader.readAsText(file);
    };

    // Export parents
    document.querySelector("#parents-export").onclick = () => {
        // Define headers
        const headers = [
            "Name",
            "Address",
            "Relationship",
            "Contact",
            "Notes"
        ];

        // Map parent data to rows
        const rows = window.app.parents.map(parent => [
            parent.name,
            parent.address,
            parent.relationship,
            parent.contact,
            parent.notes
        ]);

        // Combine headers and rows
        const csvContent = "data:text/csv;charset=utf-8," +
            headers.join(",") + "\n" +
            rows.map(e => e.join(",")).join("\n");

        // Create download link
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "parents.csv");
        document.body.appendChild(link);

        // Trigger download
        link.click();
    };
})();