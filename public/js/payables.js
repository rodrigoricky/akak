(() => {
    if (!window.app) window.app = {};

    window.app.updatePayables = () => {
        var payables = {
            "Student Publication": document.querySelector("#payables-student-publication").value,
            "Student Organization": document.querySelector("#payables-student-organization").value,
            "Annual/Miscellaneous": document.querySelector("#payables-annual-miscellanous").value,
            "Janitorial Clerks & Trainers": document.querySelector("#payables-janitorial-clerks-trainors").value,
            "School Development Fund": document.querySelector("#payables-school-development-fund").value,
        }

        console.log(payables);

        // Check if the values add up to 100
        var total = 0;
        for (var key in payables) {
            total += parseInt(payables[key]);
        }

        if (isNaN(total)) {
            return toastr["error"]("Please enter valid numbers.");
        }

        var payableArray = [];
        for (var key in payables) {
            payableArray.push({ name: key, amount: payables[key], year: document.querySelector("#payables-year").value });
        }

        console.log(payableArray);

        window.ws.send(JSON.stringify({ action: 'addPayable', data: payableArray }));
    }

    const turnUnique = (arr) => [...new Set(arr)];

    window.app.updateYears = (id = 'payables-year') => {
        if (!window.app.schoolYears) return 0;

        var years = turnUnique([
            ...window.app.schoolYears.map((year) => year.schoolyr),
            ...window.app.students.map((student) => student.schoolyrID),
        ]);
        
        var select = document.querySelector("#" + id);
        var selected = select.value;

        while (select.firstChild) {
            select.removeChild(select.lastChild);
        }

        years.forEach((year) => {
            var option = document.createElement("option");
            option.value = year;
            option.innerText = year;
            select.appendChild(option);
        });

        if (selected) {
            select.value = selected;
        }

        if (id == 'payables-year') {
            window.app.updateYears('print-year');
        }
    }

    window.app.renderPayables = (updateYears = true) => {
        if (updateYears) {
            if (window.app.updateYears() == 0) return;
        }

        var year = document.querySelector("#payables-year").value || window.app.schoolYears[0];

        // find each payable Object based on the year
        var thisYearData = window.app.payables.filter((payable) => payable.year == year);
        thisYearData = Object.fromEntries(thisYearData.map((payable) => [payable.name, payable]));

        document.getElementById('payables-student-publication').value = thisYearData["Student Publication"]?.amount || 0;
        document.getElementById('payables-student-organization').value = thisYearData["Student Organization"]?.amount || 0;
        document.getElementById('payables-annual-miscellanous').value = thisYearData["Annual/Miscellaneous"]?.amount || 0;
        document.getElementById('payables-janitorial-clerks-trainors').value = thisYearData["Janitorial Clerks & Trainers"]?.amount || 0;
        document.getElementById('payables-school-development-fund').value = thisYearData["School Development Fund"]?.amount || 0;

        // Add payables names to vouches-add-name select
        const payablesWithYear = window.app.payables.filter((payable) => payable.year == year);

        const select = document.querySelector("#vouchers-add-name");
        select.innerHTML = "";
        payablesWithYear.forEach(department => {
            const option = document.createElement("option");
            option.value = department.name;
            option.innerText = department.name;
            select.appendChild(option);
        });
        // and to vouchers-edit-name select
        const selectEdit = document.querySelector("#vouchers-edit-name");
        selectEdit.innerHTML = "";
        payablesWithYear.forEach(department => {
            const option = document.createElement("option");
            option.value = department.name;
            option.innerText = department.name;
            selectEdit.appendChild(option);
        });
    }

    document.querySelector("#payables-year").onchange = (event) => {
        var value = event.target.value;
        window.app.renderPayables(false);

        // Change year on dropdown
        document.querySelector("#payables-year").value = value;
    }
})();