(() => {
    if (!window.app) window.app = {};

    window.app.parentNameToID = (name) => {
        const parent = window.app.parents.find(parent => parent.name === name);
        if (!parent) return;
        return parent.id;
    }

    window.app.parentIDToName = (id) => {
        if (typeof id === 'string') id = parseInt(id);
        const parent = window.app.parents.find(parent => parent.id === id);
        if (!parent) return;
        console.log(parent);
        return parent.name;
    }

    window.app.studentNameToID = (name) => {
        const student = window.app.students.find(student => student.name === name);
        if (!student) return;
        return student.id;
    }

    window.app.studentIDToName = (id) => {
        if (typeof id === 'string') id = parseInt(id);
        const student = window.app.students.find(student => student.id === id);
        if (!student) return;
        return student.name;
    }

    // Convert timestamp to something more readable
    window.app.formatTimestamp = (mysqlTimestamp) => {
        const date = new Date(mysqlTimestamp);
        
        const pad = (num) => num.toString().padStart(2, '0');
        
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const year = date.getFullYear();
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        const seconds = pad(date.getSeconds());
    
        return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
    }

    window.app.getDate = () => {
        const date = new Date();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    }

    // Get student payment status
    window.app.getStudentPaymentStatus = (studentName) => {
        const student = window.app.students.find(student => student.name.toLowerCase() == studentName.toLowerCase());
        const parent = window.app.parents.find(parent => parent.relationship.includes(studentName) || student.parentID == String(parent.id));
        if (!parent) return "Unpaid";

        const { amountToPay, amountPaid } = window.app.getParentPaymentInfo(parent.name);

        console.log(amountPaid, amountToPay, studentName);

        if (amountPaid >= amountToPay) return " Paid";
        if (amountPaid == 0) return "Unpaid";
        return " Partial";
    }

    // Get student payment info
    window.app.getStudentPaymentInfo = (studentName) => {
        const student = window.app.students.find(student => student.name.toLowerCase() == studentName.toLowerCase());
        const parent = window.app.parents.find(parent => parent.relationship.includes(studentName) || student.parentID == String(parent.id));
        if (!parent) return "Unpaid";

        const { amountToPay, amountPaid } = window.app.getParentPaymentInfo(parent.name);

        return { amountToPay, amountPaid, student };
    }

    // Get parent payment status
    window.app.getParentPaymentStatus = (parentName) => {
        const parent = window.app.parents.find(parent => parent.name.toLowerCase() == parentName.toLowerCase());
        if (!parent) return "Unpaid";

        const { amountToPay, amountPaid } = window.app.getParentPaymentInfo(parentName);

        if (amountPaid >= amountToPay) return " Paid";
        if (amountPaid == 0) return "Unpaid";
        return " Partial";
    }

    // Get amount to pay for a parent
    window.app.getParentPaymentInfo = (parentName) => {
        const parent = window.app.parents.find(parent => parent.name.toLowerCase() == parentName.toLowerCase());
        if (!parent) return "Unpaid";

        const year = document.querySelector("#payables-year").value || window.app.schoolYears[0].schoolyr;

        const amountToPay = window.app.payables
        .filter((payable) => payable.year == year)
        .reduce((a, b) => a + Number(b.amount), 0);

        const amountPaid = window.app.payments
        .filter((payment) => payment.parentID == parent.id && payment.year == year)
        .reduce((a, b) => a + Number(b.amount), 0);

        return { amountToPay, amountPaid, parent };
    }
    

    // Get the time of the day and greet the user
    window.app.getTimeIntroduction = () => {
        const date = new Date();
        const hours = date.getHours();
        if (hours >= 6 && hours < 12) {
            return 'Good Morning';
        } else if (hours >= 12 && hours < 18) {
            return 'Good Afternoon';
        } else {
            return 'Good Evening';
        }
    }
})();