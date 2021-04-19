let db;
const request = indexedDB.open('tracker', 1);

// Creates "new_transaction" table
request.onupgradeneeded = (event) => {
    const db = event.target.result;
    db.createObjectStore('new_transaction', { autoIncrement: true });
}

// Uploads data on valid entry
request.onsuccess = (event) => {
    db = event.target.result;

    if (navigator.onLine) {
        uploadData();
    }
}

request.onerror = (event) => {
    console.log(event.target.errorCode);
}

const saveRecord = (record) => {
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const transactionObjectStore = transaction.objectStore('new_transaction');
    transactionObjectStore.add(record);
}

const uploadData = () => {
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const transactionObjectStore = transaction.objectStore('new_transaction');
    const getAll = transactionObjectStore.getAll();

    getAll.onsuccess = () => {
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    const transaction = db.transaction(['new_transaction'], 'readwrite');
                    const transactionObjectStore = transaction.objectStore('new_transaction');
                    transactionObjectStore.clear();

                    console.log('Transactions have been uploaded live to the server. All items synced.');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    }
}

// Listens for an online connection. Uploads data if there is a stable connection
window.addEventListener('online', () => {
    console.log('Connection re-established. Syncing items.')
    uploadData();
});