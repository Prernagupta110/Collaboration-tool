async function deleteRoom() {
    const passwordField = document.getElementById('delete-input');
    const password = passwordField.value;

    if (password.trim() === '') {
        // add logic here for optional password rules
    }

    const token = window.location.pathname.split('/').at(-1);

    const requestData = {
        password: password,
        token: token
    };

    const response = await fetch('/delete', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })

    if (response.redirected) {
        window.location.href = response.url;
    }
}

