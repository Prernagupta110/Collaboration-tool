async function createRoom() {
    const passwordField = document.getElementById('newroom-input');
    const password = passwordField.value;

    // add logic here for optional password rules
    if (password.trim() === '') {
    }

    let initialDocContents = null
    try {
        initialDocContents = await getInputFileContents()
    }
    catch (err) {
        alert(err)
        return
    }

    const requestData = {
        password: password,
        contents: initialDocContents,
    };

    const response = await fetch('/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })

    if (response.redirected) {
        window.location.href = response.url;
    }
}

async function joinRoom() {
    const tokenInput = document.getElementById('joinroom-input').value;

    window.location.href = `room/${tokenInput}`;
}

async function getInputFileContents() {
    return new Promise((resolve, reject) => {
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];

        if (!file) {
            resolve("")  // no file = empty doc
        }

        if (!file.name.endsWith('.txt')) {
            reject("Please upload a .txt file");
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            const content = e.target.result;
            resolve(content);
        };
        reader.onerror = function (error) {
            reject(error);
        };
        reader.readAsText(file);
    });
}