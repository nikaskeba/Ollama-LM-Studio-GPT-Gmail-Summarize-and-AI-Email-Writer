let allSummaries = [];  // To store all summaries globally

// Function to display summaries
function displaySummaries(data) {
    $('#summaryResults').empty();
    data.forEach(function(item) {
        const sanitizedSubjectId = sanitizeId(item.subject);
        let unsubscribeHtml = item.unsubscribe_link ? `<a href="${item.unsubscribe_link}" target="_blank" class="btn btn-warning">Unsubscribe</a>` : '';

        $('#summaryResults').append(`
            <div class="card mb-3" id="email-${sanitizedSubjectId}" data-account="${item.account}">
                <div class="card-body">
                    <h5 class="card-title">[${item.account}] ${item.subject}</h5>
                    <span class="text-muted small">From: ${item.from_email}</span><br>
                    <span class="text-muted small">Received: ${item.received_date}</span>
                    <!-- Hidden input for system role -->
<input type="hidden" id="systemRole" value="Rewrite this message in a professional tone.">
                    <p class="card-text">${item.summary}</p>
                    ${unsubscribeHtml}
                    <button class="btn btn-danger ms-2 delete-email-btn" data-email-id="${item.email_id}">Delete Email</button>
                    <button class="btn btn-secondary mt-2" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${sanitizedSubjectId}" aria-expanded="false" aria-controls="collapse${sanitizedSubjectId}">
                        Show Original Email
                    </button>
                    <div class="collapse mt-2" id="collapse${sanitizedSubjectId}">
                    
                        <div class="card card-body">
                            <pre>${item.original_body}</pre>
                        </div>
                    </div>
                </div>
            </div>
        `);
    });

    $('.delete-email-btn').on('click', function() {
        const emailId = $(this).data('email-id');
        const account = $(this).closest('.card').data('account');
        deleteEmail(emailId, account);
    });
}

// Function to delete an email
function deleteEmail(emailId, account) {
    $.ajax({
        url: '/delete_email',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ email_id: emailId, account: account }),
        success: function(response) {
            if (response.success) {
                $(`[data-email-id="${emailId}"]`).closest('.card').remove();
                allSummaries = allSummaries.filter(summary => summary.email_id !== emailId);
            } else {
                alert('Error deleting email.');
            }
        },
        error: function() {
            alert('Error deleting email.');
        }
    });
}

// Function to load existing emails from summaries.json
function loadSummaries() {
    $.get("/load_summaries", function(data) {
        allSummaries = data;
        displaySummaries(allSummaries);
        populateEmailFilter(allSummaries);
    });
}

// Function to populate the email filter dropdown
function populateEmailFilter(data) {
    const accounts = [...new Set(data.map(item => item.account))];
    const filterSelect = $("#emailFilter");
    filterSelect.empty();
    filterSelect.append('<option value="all">All accounts</option>');
    accounts.forEach(account => {
        filterSelect.append(`<option value="${account}">${account}</option>`);
    });
}

// Load existing summaries on page load
$(document).ready(function() {
    loadSummaries();
    $("#emailFilter").on("change", filterEmails);
    $('#fetchEmailsBtn').on('click', fetchLatestEmails);
});