$(document).ready(function() {
    // Load email credentials from the server and populate the "Send From" dropdown
    $.get("/load_emails", function(data) {
        const senderEmailSelect = $('#senderEmail');
        data.forEach(account => {
            senderEmailSelect.append(new Option(account.email, account.email));
        });
    });

    // Handle the "AI Rewrite" button click
    $('#aiRewriteBtn').on('click', function(e) {
        e.preventDefault();  // Prevent the default behavior of the button (form submission)

        const emailBody = $('#emailBody').val();  // Get the current message content
        const systemRole = "Rewrite this message in a the tone best fitting to the context.";  // Set the system role directly

        // Log the values to verify they are retrieved properly
        console.log("emailBody:", emailBody);
        console.log("systemRole:", systemRole);

        // Check if message is empty
        if (!emailBody) {
            alert('Message content is required.');
            return;
        }

        // Perform a POST request to rewrite the message using AI
        $.ajax({
            url: '/rewrite_message',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ message: emailBody, role: systemRole }),  // Send the fixed system role
            success: function(response) {
                // Update the message field with the rewritten content
                $('#emailBody').val(response.rewritten_message);
            },
            error: function(error) {
                console.error('Error rewriting message:', error);
                alert('Failed to rewrite message. Please try again.');
            }
        });
    });

    // Handle the submit event of the compose email form (unchanged)
   $('#composeEmailForm').on('submit', function(e) {
        e.preventDefault();  // Prevent the form from submitting the traditional way

        const senderEmail = $('#senderEmail').val();  // Get the selected sender email
        const recipientEmail = $('#recipientEmail').val();
        const emailSubject = $('#emailSubject').val();
        const emailBody = $('#emailBody').val();

        // Perform a POST request to send the email
        $.ajax({
            url: '/send_email',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                sender: senderEmail,  // Pass the sender email
                recipient: recipientEmail,
                subject: emailSubject,
                body: emailBody
            }),
            success: function(response) {
                // Update status
                $('#emailStatus').html('<div class="alert alert-success">Email sent successfully!</div>');
            },
            error: function(error) {
                // Update status
                $('#emailStatus').html('<div class="alert alert-danger">Failed to send email. Please try again.');
                console.error('Error sending email:', error);
            }
        });
    });

    // Handle "Respond" button click to populate the Compose Email form (unchanged)
    $('.respond-email-btn').on('click', function() {
        const fromEmail = $(this).data('from-email');  // Get sender's email
        const emailSubject = $(this).data('subject');  // Get the subject
        const emailSummary = $(this).data('summary');  // Get the summary

        // Populate the Compose Email form fields
        $('#recipientEmail').val(fromEmail);
        $('#emailSubject').val(`RE: ${emailSubject}`);
        $('#emailBody').val(`\n\n${emailSummary}`);

        // Switch to the Compose Email tab
        $('#compose-tab').tab('show');  // Bootstrap method to switch tabs
    });
});