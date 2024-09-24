// Function to populate the email filter dropdown
function populateEmailFilter(data) {
    const accounts = [...new Set(data.map(item => item.account))];  // Get unique email accounts
    const filterSelect = $("#emailFilter");

    console.log("Populating email filter with accounts:", accounts);  // Debugging line
    filterSelect.empty();
    filterSelect.append('<option value="all">All accounts</option>');
    accounts.forEach(account => {
        filterSelect.append(`<option value="${account}">${account}</option>`);
    });

    // Add event listener for filtering emails
    filterSelect.on("change", filterEmails);
}

// Function to filter displayed emails based on the selected account
function filterEmails() {
    const selectedAccount = $("#emailFilter").val();
    console.log("Filtering emails by account:", selectedAccount);  // Debugging line

    if (selectedAccount === "all") {
        displaySummaries(allSummaries);  // Display all emails if "All accounts" is selected
    } else {
        const filteredSummaries = allSummaries.filter(item => item.account === selectedAccount);
        displaySummaries(filteredSummaries);  // Display only emails from the selected account
    }
}