let db;

// Create a new db request for a 'budget' database.
const request = indexedDB.open('BudgetDB', 1);

request.onupgradeneeded = function (e) {
  // console.log('Upgrade needed in IndexDB');

  // const { oldVersion } = e;
  // const newVersion = e.newVersion || db.version;

  // console.log(`DB Updated from version ${oldVersion} to ${newVersion}`);

  db = e.target.result;
  db.createObjectStore('BudgetStore', { autoIncrement: true });

  // db.createObjectStore();
  // if (db.objectStoreNames.length === 0) {
  //   db.createObjectStore('BudgetStore', { autoIncrement: true });
  // }
};

request.onsuccess = function(e) {
  db = e.target.result;
  
  // check if app is online before reading from db
  if (navigator.onLine) {
      console.log('Backend online!');
      checkDatabase();
  }
};


request.onerror = function (e) {
  // log error here
  console.log(`Something went wrong! ${e.target.errorCode}`);
};

function saveRecord(record) {
  console.log('save record invoked');
  // this is actually where we save the data while we're offline
  const transaction = db.transaction(['BudgetStore'], 'readwrite');
  const budgetObjectStore = transaction.objectStore('BudgetStore');

  // Add record to your store with add method
  budgetObjectStore.add(record);

}

function checkDatabase() {
  console.log('check db invoked');

  // Open a transaction on BudgetStore db
  let transaction = db.transaction(['BudgetStore'], 'readwrite');

  // access BudgetStore object
  const budgetObjectStore = transaction.objectStore('BudgetStore');

  // get all records from store and set to a variable
  const getAll = budgetObjectStore.getAll();
  
  getAll.onsuccess = function () {
    
    // check to see if we have result/data inside of indexedDB, send data to the api server; in other words, if somebody enters  while we're offline, that should have been saved to indexedDB and then when we come online, this function checkDatabase should be called and it's gonna check to see if there's anything they enter while offline. Then it will make a fetch request to this endpoint api/transaction/bulk
    if(getAll.result.length > 0) {
      fetch('api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then((result) => {
          // if successful, open a transaction on pending db
          // access pending object store
          // clear all items in store

          // if our return is not emppty
          if (result.length !== 0) {
            // open another transaction to BudgetStore with the ability to read and write
            transaction = db.transaction(['BudgetStore'], 'readwrite');
            // assign the current store to a variable
            const currentBudgetObjectStore = transaction.objectStore('BudgetStore');

            // clear existing entries because our bulk add was successful
            currentBudgetObjectStore.clear();
            console.log('Clearing store!');
          }

        })

    }
  }
}


// Listen for app coming back online
window.addEventListener('online', checkDatabase);