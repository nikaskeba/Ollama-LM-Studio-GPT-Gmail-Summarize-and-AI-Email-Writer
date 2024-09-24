// Function to populate the email filter dropdown
function populateEmailFilter(accounts) {
    const filterSelect = document.createElement('select');
    filterSelect.classList.add('form-select');
    filterSelect.id = 'emailFilter';
    
    filterSelect.innerHTML = `<option value="all">All accounts</option>`;
    accounts.forEach(account => {
        filterSelect.innerHTML += `<option value="${account}">${account}</option>`;
    });

    document.getElementById('email-filter-container').appendChild(filterSelect);

    // Add event listener for filtering
    filterSelect.addEventListener('change', filterEmails);  // Ensure this calls the filterEmails function
}

// Define the filterEmails function to handle email filtering
function filterEmails() {
    const selectedAccount = document.getElementById('emailFilter').value;
    if (selectedAccount === 'all') {
        displaySummaries(allSummaries);  // Display all emails if "All accounts" is selected
    } else {
        const filteredSummaries = allSummaries.filter(email => email.account === selectedAccount);
        displaySummaries(filteredSummaries);  // Display filtered emails
    }
}