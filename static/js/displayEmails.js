// Function to sanitize subject for HTML ID usage
function sanitizeId(subject) {
    return subject.replace(/[^a-zA-Z0-9]/g, '_');
}

function escapeHtmlAttribute(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Function to display summaries
function displaySummaries(data) {
    // Sort the emails by received_date in descending order (newest to oldest)
    data.sort((a, b) => new Date(b.received_date) - new Date(a.received_date));

    console.log("Displaying summaries:", data);  // Debugging line
    $('#summaryResults').empty();  // Clear existing summaries
    data.forEach(function(item) {
        let sanitizedSubjectId = sanitizeId(item.subject);

        // Check if unsubscribe link exists in the original email body
        let unsubscribeHtml = '';
        if (item.unsubscribe_link) {
            unsubscribeHtml = `<a href="${item.unsubscribe_link}" target="_blank" class="btn btn-warning">
                <img src="/static/icons/unsubscribe.svg" alt="Unsubscribe" style="width: 20px; height: 20px;">
            </a>`;
        }

        // Escape HTML special characters for attributes
        const escapedFromEmail = escapeHtmlAttribute(item.from_email);
        const escapedSubject = escapeHtmlAttribute(item.subject);
        const escapedSummary = escapeHtmlAttribute(item.summary);
        const escapedOriginalBody = escapeHtmlAttribute(item.original_body);  // Escape original body
        const escapedToEmail = escapeHtmlAttribute(item.account);  // Account is the email it was sent to

        // Render each email summary with icons for actions
        $('#summaryResults').append(`
            <div class="card mb-3" id="email-${sanitizedSubjectId}" data-account="${escapedToEmail}">
                <div class="card-body">
                    <h5 class="card-title">[${escapedToEmail}] ${escapedSubject}</h5>
                    <span class="text-muted small">From: ${escapedFromEmail}</span><br>
                    <span class="text-muted small">To: ${escapedToEmail}</span><br>
                    <span class="text-muted small">Received: ${item.received_date}</span>
                    <p class="card-text">${escapedSummary}</p>
                    <button class="btn btn-primary respond-email-btn" 
                        data-from-email="${escapedFromEmail}" 
                        data-subject="${escapedSubject}" 
                        data-original-body="${escapedOriginalBody}"  
                        data-to-email="${escapedToEmail}">
                        <img src="/static/icons/reply.svg" alt="Reply" style="width: 20px; height: 20px;">
                    </button>
                    ${unsubscribeHtml}  <!-- Display the unsubscribe button if link exists -->
                    <button class="btn btn-danger ms-2 delete-email-btn" data-email-id="${item.email_id}">
                        <img src="/static/icons/delete.svg" alt="Delete" style="width: 20px; height: 20px;">
                    </button>
                    <button class="btn btn-secondary" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${sanitizedSubjectId}" aria-expanded="false" aria-controls="collapse${sanitizedSubjectId}">
                        <img src="/static/icons/expand.svg" alt="Expand" style="width: 20px; height: 20px;">
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

    // Attach event listeners to delete buttons after rendering
    attachDeleteEmailHandlers();

    // Attach event listeners to respond buttons after rendering
    attachRespondButtonListeners();  // Ensure this is called after emails are rendered
}

// Function to attach event listeners to "Respond" buttons
function attachRespondButtonListeners() {
    $('.respond-email-btn').on('click', function() {
        const fromEmailRaw = $(this).data('from-email');  // Get raw "From" field (may contain display name)
        const fromEmail = extractEmailAddress(fromEmailRaw);  // Extract the email address
        const emailSubject = $(this).data('subject');  // Get the subject
        const originalBody = $(this).data('original-body');  // Get the original email body
        const toEmail = $(this).data('to-email');  // Get the "to" email (your account)

        // Log for debugging
        console.log("Original Body:", originalBody);

        // Call the backend to rewrite the message with LLM
        $.ajax({
            url: '/rewrite_email',  // New API endpoint for rewriting email
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ message: originalBody, role: "Respond to this email in a tone best fitting to the context in the format, Dear (who most likely we are replying to), body, Best Regards, (recpient)" }),  // Send message and role
            success: function(response) {
                const rewrittenMessage = response.rewritten_message;  // Get the rewritten content

                // Populate the Compose Email form fields with the rewritten message
                $('#recipientEmail').val(fromEmail);  // Use the extracted email address
                $('#emailSubject').val(`RE: ${emailSubject}`);
                $('#emailBody').val(`${rewrittenMessage}`);  // Set the rewritten message in the Message field

                // Automatically select the "Send From" email based on the "to" email
                $('#senderEmail').val(toEmail);

                // Switch to the Compose Email tab
                $('#compose-tab').tab('show');  // Bootstrap method to switch tabs
            },
            error: function(error) {
                console.error('Error rewriting message:', error);
                alert('Failed to rewrite message. Please try again.');
            }
        });
    });
}

// Utility function to extract the email address from a string like "Name <email@example.com>"
function extractEmailAddress(rawEmail) {
    const emailRegex = /(?:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
    const match = rawEmail.match(emailRegex);
    return match ? match[0] : rawEmail;  // Return the matched email or fallback to raw input
}