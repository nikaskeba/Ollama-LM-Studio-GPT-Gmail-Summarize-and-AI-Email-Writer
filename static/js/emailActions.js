let allSummaries = [];  // Global variable to store all summaries

// Function to fetch the latest emails and update the display
function fetchLatestEmails() {
    console.log("Fetching latest emails...");  // Debugging line
    $('#fetchEmailsBtn').prop('disabled', true).text('Fetching...');  // Disable the button while fetching

    $.get("/fetch_latest_emails", function(data) {
        if (data.length > 0) {
            console.log("Fetched new emails:", data);  // Debugging line
            alert("Fetched " + data.length + " new emails!");
            allSummaries = allSummaries.concat(data);  // Add new emails to allSummaries
            displaySummaries(allSummaries);  // Display all summaries
            populateEmailFilter(allSummaries);  // Re-populate the filter dropdown in case new accounts were added
        } else {
            console.log("No new emails were found.");  // Debugging line
            alert("No new emails were found.");
        }
        $('#fetchEmailsBtn').prop('disabled', false).text('Fetch Latest Emails');
    }).fail(function() {
        console.error("Error fetching latest emails.");  // Debugging line
        alert("Error fetching emails.");
        $('#fetchEmailsBtn').prop('disabled', false).text('Fetch Latest Emails');
    });
}

// Function to delete an email
function deleteEmail(emailId, account) {
    console.log("Attempting to delete email:", emailId, "from account:", account);  // Debugging line

    $.ajax({
        url: '/delete_email',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ email_id: emailId, account: account }),
        success: function(response) {
            if (response.success) {
                console.log('Email deleted successfully:', emailId);  // Debugging line
                // Remove the email from the displayed list
                $(`[data-email-id="${emailId}"]`).closest('.card').remove();

                // Remove the email from the global allSummaries array
                allSummaries = allSummaries.filter(summary => summary.email_id !== emailId);

                alert('Email deleted successfully!');
            } else {
                console.error('Error deleting email:', response);  // Debugging line
                alert('Error deleting email.');
            }
        },
        error: function() {
            console.error('Error deleting email from the server.');  // Debugging line
            alert('Error deleting email.');
        }
    });
}

// Attach delete event handlers after displaying emails
function attachDeleteEmailHandlers() {
    $('.delete-email-btn').on('click', function() {
        const emailId = String($(this).data('email-id'));  // Ensure emailId is a string
        const account = $(this).closest('.card').data('account');
        console.log("Delete clicked for email:", emailId, "account:", account);
        deleteEmail(emailId, account);  // Ensure deleteEmail receives a string
    });
}

// Load existing summaries on page load
$(document).ready(function() {
    console.log("Page loaded, initializing...");  // Debugging line
    $.get("/load_summaries", function(data) {
        console.log("Summaries loaded:", data);  // Debugging line
        allSummaries = data;  // Store all summaries globally
        displaySummaries(allSummaries);  // Display all summaries initially
        populateEmailFilter(allSummaries);  // Populate the filter dropdown
    }).fail(function() {
        console.error("Failed to load summaries.");  // Debugging line
    });

    // Add event listener for fetching new emails
    $('#fetchEmailsBtn').on('click', fetchLatestEmails);
});