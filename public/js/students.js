(() => {
    if (!window.app) window.app = {};

    window.app.students = [];

    const closeModal = () => {
        document.querySelector("#students-add").style.display = "none";
        document.querySelector("#students-edit").style.display = "none";
        document.querySelector("#students-main").style.display = "";
        document.querySelector("#students-overlay").classList.add("hidden");
    };

    window.app.updateStudents = () => {
        window.ws.send(JSON.stringify({ action: 'getStudents' }));
    }

    window.app.addStudent = (student) => {
        window.ws.send(JSON.stringify({ action: 'addStudent', data: student }));
        closeModal();
    };

    window.app.editStudent = (student) => {
        window.ws.send(JSON.stringify({ action: 'addStudent', data: student }));
        closeModal();
    }

    window.app.showEditStudent = (i) => {
        window.app.student = window.app.students[i];

        console.log(window.app.student);
        if (!window.app.student) return;

        document.querySelector("#students-edit").style.display = "flex";
        document.querySelector("#students-overlay").classList.remove("hidden");

        document.querySelector("#students-edit-first-name").value = window.app.student.name.split(' ')[0];
        document.querySelector("#students-edit-last-name").value = window.app.student.name.split(' ')[1];
        document.querySelector("#students-edit-LRN").value = window.app.student.LRN;
        document.querySelector("#students-edit-parentID").value = window.app.parentIDToName(Number(window.app.student.parentID));
        document.querySelector("#students-edit-gradeID").value = window.app.student.gradeID;
        document.querySelector("#students-edit-sectionID").value = window.app.student.sectionID;
        document.querySelector("#students-edit-scholarshipID").value = window.app.student.scholarshipID;
        document.querySelector("#students-edit-schoolyrID").value = window.app.student.schoolyrID;
    }

    // Function to render  list
    window.app.renderStudents = () => {
        var tableHead = document.getElementById('students-list-head') || document.getElementById('pages-students').querySelectorAll("tbody")[0];;
        document.getElementById('students-list').innerHTML = tableHead.innerHTML;

        window.app.students.forEach((student, index) => {
            const card = document.getElementById('students-list');
            const status = window.app.getStudentPaymentStatus(student.name);
            const { amountToPay, amountPaid } = window.app.getStudentPaymentInfo(student.name);
            const color = status == " Paid" ? "#038303" : status == "Unpaid" ? "#830703" : "#7d7d7d";

            // Editable fields
            card.innerHTML += `
            <tbody class="bg-white divide-y divide-gray-200">
            <tr>
            <td
            class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
            ${student.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            ${student.LRN}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            ${window.app.parentIDToName(Number(student.parentID))}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${student.gradeID}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${window.app.sectionIDToName(Number(student.sectionID))}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${student.scholarshipID == '' ? 'None' : student.scholarshipID}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${student.schoolyrID}
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
            ${status}  ${status == " Paid" ? '' : `(₱${amountToPay - amountPaid})`}
            </div>
            </td>
            <td
            class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <a onclick='window.app.showEditStudent(${window.app.students.indexOf(student)})' class="text-blue-600 hover:text-blue-900">Edit</a>
            </td>
            </tr>
            </tbody>    
            `;
        });

        window.app.registerStudentsAutoComplete();
    };

    // Function to handle form submission
    document.querySelector("#students-add-btn-final").onclick = (e) => {
        e.preventDefault();

        var parent = window.app.parentNameToID(document.querySelector("#students-add-parentID").value);
        if (!parent) return toastr["error"]("Parent not found");

        const newStudent = {
            name: `${document.querySelector("#students-add-first-name").value} ${document.querySelector("#students-add-last-name").value}`,
            LRN: document.querySelector("#students-add-LRN").value,
            parentID: parent,
            gradeID: document.querySelector("#students-add-gradeID").value,
            sectionID: document.querySelector("#students-add-sectionID").value,
            scholarshipID: document.querySelector("#students-add-scholarshipID").value,
            schoolyrID: document.querySelector("#students-add-schoolyrID").value,
        }

        // Add section if it doesn't exist (don't need to re-query the server until page refresh)
        if (!window.app.sections.find(section => section.class === newStudent.sectionID)){
            window.app.sections.push({
                class: newStudent.sectionID, 
                id: window.app.sections.length + 1, 
                gradeID: newStudent.gradeID
            });
        }

        if (newStudent.LRN.length !== 12 || isNaN(newStudent.LRN)) return toastr["error"]("Invalid LRN");

        window.app.addStudent(newStudent);
    };

    // Handle edit form submission
    document.querySelector("#students-edit-btn-final").onclick = (e) => {
        e.preventDefault();

        // Convert parent name to ID
        const parent = window.app.parentNameToID(document.querySelector("#students-edit-parentID").value);
        if (!parent) return toastr["error"]("Parent not found");

        const editedStudent = {
            id: window.app.students[window.app.students.indexOf(window.app.student)].id,
            name: `${document.querySelector("#students-edit-first-name").value} ${document.querySelector("#students-edit-last-name").value}`,
            LRN: document.querySelector("#students-edit-LRN").value,
            parentID: parent,
            gradeID: document.querySelector("#students-edit-gradeID").value,
            sectionID: document.querySelector("#students-edit-sectionID").value,
            scholarshipID: document.querySelector("#students-edit-scholarshipID").value,
            schoolyrID: document.querySelector("#students-edit-schoolyrID").value,
        }
        if (editedStudent.LRN.length !== 12 || isNaN(editedStudent.LRN)) return toastr["error"]("Invalid LRN");
        window.app.editStudent(editedStudent);
    };

    // Cancel buttons
    document.querySelectorAll("#students-cancel, #students-cancel-edit").forEach((button) => {
        button.onclick = closeModal;
    });

    document.querySelector("#students-add-btn").onclick = () => {
        document.querySelector("#students-add").style.display = "flex";
        document.querySelector("#students-overlay").classList.remove("hidden");
    };


    window.app.registerStudentsAutoComplete = () => {
        const auto = new autoComplete({
            data: {
                src: async () => window.app.parents.map(parent => parent.name),
            },
            selector: "#students-edit-parentID",
            placeHolder: "Search for a parent",
            resultItem: {
                highlight: true
            },
            events: {
                input: {
                    selection: (event) => {
                        const selection = event.detail.selection.value;
                        auto.input.value = selection;
                    }
                }
            }
        });

        const autoAdd = new autoComplete({
            data: {
                src: async () => window.app.parents.map(parent => parent.name),
            },
            selector: "#students-add-parentID",
            placeHolder: "Search for a parent",
            resultItem: {
                highlight: true
            },
            events: {
                input: {
                    selection: (event) => {
                        const selection = event.detail.selection.value;
                        autoAdd.input.value = selection;
                    }
                }
            }
        });

        // remove duplicates from array
        const turnUnique = (arr) => [...new Set(arr)];

        const autoSections = new autoComplete({
            data: {
                src: async () => turnUnique([
                    ...window.app.sections.map(s => s.class),
                ]),
            },
            selector: "#students-add-sectionID",
            placeHolder: "Search for a section",
            resultItem: {
                highlight: true
            },
            events: {
                input: {
                    selection: (event) => {
                        const selection = event.detail.selection.value;
                        autoSections.input.value = selection;
                    }
                }
            }
        });

        const autoGrades = new autoComplete({
            data: {
                src: async () => turnUnique(window.app.students.map(student => student.gradeID)),
            },
            selector: "#students-add-gradeID",
            placeHolder: "Search for a grade",
            resultItem: {
                highlight: true
            },
            events: {
                input: {
                    selection: (event) => {
                        const selection = event.detail.selection.value;
                        autoGrades.input.value = selection;
                    }
                }
            }
        });

        const autoSchoolYear = new autoComplete({
            data: {
                src: async () => turnUnique(window.app.schoolYears.map(year => year.schoolyr)),
            },
            selector: "#students-add-schoolyrID",
            placeHolder: "Search for a school year",
            resultItem: {
                highlight: true
            },
            events: {
                input: {
                    selection: (event) => {
                        const selection = event.detail.selection.value;
                        autoSchoolYear.input.value = selection;
                    }
                }
            }
        });

        // make it for edit
        const autoSectionsEdit = new autoComplete({
            data: {
                src: async () => turnUnique([
                    ...window.app.sections.map(s => s.class),
                ]),
            },
            selector: "#students-edit-sectionID",
            placeHolder: "Search for a section",
            resultItem: {
                highlight: true
            },
            events: {
                input: {
                    selection: (event) => {
                        const selection = event.detail.selection.value;
                        autoSectionsEdit.input.value = selection;
                    }
                }
            }
        });

        const autoGradesEdit = new autoComplete({
            data: {
                src: async () => turnUnique(window.app.students.map(student => student.gradeID)),
            },
            selector: "#students-edit-gradeID",
            placeHolder: "Search for a grade",
            resultItem: {
                highlight: true
            },
            events: {
                input: {
                    selection: (event) => {
                        const selection = event.detail.selection.value;
                        autoGradesEdit.input.value = selection;
                    }
                }
            }
        });

        const autoSchoolYearEdit = new autoComplete({
            data: {
                src: async () => turnUnique(window.app.students.map(student => student.schoolyrID)),
            },
            selector: "#students-edit-schoolyrID",
            placeHolder: "Search for a school year",
            resultItem: {
                highlight: true
            },
            events: {
                input: {
                    selection: (event) => {
                        const selection = event.detail.selection.value;
                        autoSchoolYearEdit.input.value = selection;
                    }
                }
            }
        });

        // Scholarships
        const autoScholarships = new autoComplete({
            data: {
                src: async () => turnUnique([
                    ...window.app.scholarships.map(s => s.name),
                ]),
            },
            selector: "#students-add-scholarshipID",
            placeHolder: "Search for a scholarship",
            resultItem: {
                highlight: true
            },
            events: {
                input: {
                    selection: (event) => {
                        const selection = event.detail.selection.value;
                        autoScholarships.input.value = selection;
                    }
                }
            }
        });

        const autoScholarshipsEdit = new autoComplete({
            data: {
                src: async () => turnUnique([
                    ...window.app.scholarships.map(s => s.name),
                ]),
            },
            selector: "#students-edit-scholarshipID",
            placeHolder: "Search for a scholarship",
            resultItem: {
                highlight: true
            },
            events: {
                input: {
                    selection: (event) => {
                        const selection = event.detail.selection.value;
                        autoScholarshipsEdit.input.value = selection;
                    }
                }
            }
        });
    }

    // Export as CSV
    document.querySelector("#students-export").onclick = () => {
        // Define headers
        const headers = [
            "Name",
            "LRN",
            "Parent",
            "Grade",
            "Section",
            "Scholarship",
            "Year",
            "Paid"
        ];

        // Map student data to rows
        const rows = window.app.students.map(student => [
            student.name,
            student.LRN,
            window.app.parentIDToName(Number(student.parentID)),
            student.gradeID,
            student.sectionID,
            student.scholarshipID,
            student.schoolyrID,
            window.app.getStudentPaymentStatus(student.name).slice(1)
        ]);

        for (let i = 0; i < rows.length; i++) {
            rows[i]
        }

        // Combine headers and rows
        const csvContent = "data:text/csv;charset=utf-8," +
            headers.join(",") + "\n" +
            rows.map(e => e.join(",")).join("\n");

        // Create download link
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "students.csv");
        document.body.appendChild(link);

        // Trigger download
        link.click();
    };

    // Import CSV (it will be in the same format as the export, but use error handling)
    document.querySelector("#students-import").onchange = (e) => {
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
                // Validate headers
                const headers = rows[0];
                if (headers[0].trim() !== "Name") {
            return toastr["error"]('Invalid Name')
            } else if(headers[1].trim() !== "LRN") {
            return toastr["error"]('Invalid LRN')
            } else if(headers[2].trim() !== "Parent"){
            return toastr["error"]('Invalid Parent')
            } else if(headers[3].trim() !== "Grade"){
            return toastr["error"]("Invalid Grade")
            } else if(headers[4].trim() !== "Section"){
            return toastr["error"]('Invalid Section')
            } else if(headers[5].trim() !== "Scholarship"){
            return toastr["error"]('Invalid Scholar')
            } else if(headers[6].trim() !== "Year"){
                return toastr["error"]('Invalid Year')
            } else if(headers[7].trim() !== "Paid") {
                return toastr["error"]('Invalid Paid')
                }
    

            // Remove headers
            rows.shift();

            // Validate rows
            const students = [];
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                if (row.length !== 8) {
                    return toastr["error"]("Invalid CSV file");
                }

                const student = {
                    name: row[0],
                    LRN: row[1],
                    parentID: window.app.parentNameToID(row[2]),
                    gradeID: row[3],
                    sectionID: row[4],
                    scholarshipID: row[5],
                    schoolyrID: row[6]
                };

                // Validate parent ID
                if (!student.parentID) {
                    return toastr["error"]("Invalid parent in row " + (i + 1));
                }

                if(window.app.doesLRNExistInSchoolYear(student.LRN, student.schoolyrID)) {
                    const lastName = student.name.split(' ').slice(-1);
                    if(existingLRNs.length < 3) {
                     existingLRNs.push(lastName);
                    } else if(existingLRNs.length === 3) {
                     existingLRNs.push('etc.');
                    }
                 } 
        
                        students.push(student);
                   }
        
               if(existingLRNs.length > 0) {
                return toastr["error"](`${existingLRNs.join(', ')} have existing data`);
               }

            // Make every student param a string
            students.forEach(student => {
                student.LRN = String(student.LRN);
                student.gradeID = String(student.gradeID);
                student.sectionID = String(student.sectionID);
                student.scholarshipID = String(student.scholarshipID);
                student.schoolyrID = String(student.schoolyrID);
                student.parentID = String(student.parentID);
                student.name = String(student.name);
            });

            // Send to server
            window.ws.send(JSON.stringify({ action: 'impStudents', data: students }));
        };
        reader.readAsText(file);
    };

    // Search
    document.addEventListener("DOMContentLoaded", () => {
        const searchInput = document.getElementById('search-students');
        searchInput.addEventListener('input', function () {
            const filterBy = document.getElementById('students-filter-by');
            const tableRows = document.querySelectorAll('#students-list tbody tr');
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
})();