let allSummaries = [];  // Ensure this is a global variable

document.getElementById('fetchEmailsBtn').addEventListener('click', function() {
    fetch('/fetch_latest_emails')
        .then(response => response.json())
        .then(data => {
            allSummaries = data;  // Store summaries globally
            displaySummaries(allSummaries);
            populateEmailFilter([...new Set(allSummaries.map(email => email.account))]);
        })
        .catch(error => console.error('Error fetching emails:', error));
});