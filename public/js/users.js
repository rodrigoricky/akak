(() => {
    if (!window.app) window.app = {};

    window.app.users = [];

    window.app.updateUsers = () => {
        window.ws.send(JSON.stringify({ action: 'getUsers' }));
    }

    window.app.addUser = (user) => {
        window.ws.send(JSON.stringify({ action: 'addUser', data: user }));
        closeModal();
    };

    window.app.editUser = (user) => {
        window.ws.send(JSON.stringify({ action: 'addUser', data: user }));
        closeModal();
    }

    window.app.showEditUser = (i) => {
        window.app.selectedUser = window.app.users[i];
        if (!window.app.selectedUser) return;

        if (window.app.selectedUser.role == 'Super Admin') {
            return toastr["error"]("You cannot edit yourself.");
        }

        document.querySelector("#users-edit").style.display = "flex";
        document.querySelector("#users-overlay").classList.remove("hidden");

        document.querySelector("#users-edit-name").value = window.app.selectedUser.name;
        document.querySelector("#users-edit-password").value = window.app.selectedUser.password;
        document.querySelector("#users-edit-role").value = window.app.selectedUser.role;
        document.querySelector("#users-edit-btn-final").setAttribute("data-id", window.app.selectedUser.id);
    }

    window.app.showAddUser = () => {
        document.querySelector("#users-add").style.display = "flex";
        document.querySelector("#users-overlay").classList.remove("hidden");
    }

    const closeModal = () => {
        document.querySelector("#users-add").style.display = "none";
        document.querySelector("#users-edit").style.display = "none";
        document.querySelector("#users-overlay").classList.add("hidden");
    }

    document.addEventListener("DOMContentLoaded", () => {
        document.querySelector("#users-add-btn").addEventListener("click", window.app.showAddUser);
        document.querySelector("#users-cancel").addEventListener("click", closeModal);
        document.querySelector("#users-cancel-edit").addEventListener("click", closeModal);

        document.querySelector("#users-add-btn-final").addEventListener("click", () => {
            const name = document.querySelector("#users-add-name").value;
            const password = document.querySelector("#users-add-password").value;
            const role = document.querySelector("#users-add-role").value;
            const user = { name, password, role };

            window.app.addUser(user);
        });

        document.querySelector("#users-edit-btn-final").addEventListener("click", (event) => {
            const id = window.app.selectedUser.id;
            const name = document.querySelector("#users-edit-name").value;
            const password = document.querySelector("#users-edit-password").value;
            const role = document.querySelector("#users-edit-role").value;
            const user = { id, name, password, role };

            window.app.editUser(user);
        });

        window.app.renderUsers = function () {
            // Clear
            var tableHead = document.getElementById('users-list-head') || document.getElementById('pages-users').querySelectorAll("tbody")[0];;
            document.getElementById('users-list').innerHTML = tableHead.innerHTML;

            const users = window.app.users;
            const tableBody = document.createElement("tbody");
            tableBody.classList.add("bg-white", "divide-y", "divide-gray-200");

            users.forEach((user, i) => {
                const row = document.createElement("tr");
                const idCell = document.createElement("td");
                const nameCell = document.createElement("td");
                const roleCell = document.createElement("td");
                const actionCell = document.createElement("td");
                const editButton = document.createElement("button");

                idCell.classList.add("px-6", "py-4", "whitespace-nowrap", "text-sm", "text-gray-500");
                idCell.textContent = user.id;

                nameCell.classList.add("px-6", "py-4", "whitespace-nowrap", "text-sm", "text-gray-900");
                nameCell.textContent = user.name;

                roleCell.classList.add("px-6", "py-4", "whitespace-nowrap", "text-sm", "text-gray-900");
                roleCell.textContent = user.role;

                actionCell.classList.add("px-6", "py-4", "whitespace-nowrap", "text-right", "text-sm", "font-medium");
                editButton.classList.add("text-indigo-600", "hover:text-indigo-900");
                editButton.textContent = "Edit";
                editButton.addEventListener("click", () => window.app.showEditUser(i));
                actionCell.appendChild(editButton);

                row.appendChild(idCell);
                row.appendChild(nameCell);
                row.appendChild(roleCell);
                row.appendChild(actionCell);
                tableBody.appendChild(row);
            });

            document.querySelector("#users-list").appendChild(tableBody);
            window.app.users = users;

            // Search
            const searchInput = document.getElementById('search-users');
            searchInput.addEventListener('input', function() {
                console.log('searching', this.value);
                const filterBy = document.getElementById('users-filter-by');
                const tableRows = document.querySelectorAll('#users-list tbody tr');
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
        }
    });
})();