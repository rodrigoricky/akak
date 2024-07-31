(() => {
    window.onload = () => {
        if (window.location.pathname !== '/login') return;
        document.getElementById('submit').addEventListener('click', () => {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            if (username === '' || password === 'x') {
                alert('Please fill in all fields');
                return;
            }
            fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            })
                .then(res => {
                    if (res.status === 200) {
                        window.location.href = '/';
                    } else {
                        alert('Invalid username or password');
                    }
                })
                .catch(err => console.error(err));
        });
    }
})();