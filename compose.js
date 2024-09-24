// Function to send composed email
function sendEmail(recipient, subject, body) {
    $.ajax({
        url: '/send_email',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ to: recipient, subject: subject, body: body }),
        success: function(response) {
            if (response.success) {
                alert('Email sent successfully!');
            } else {
                alert('Error sending email.');
            }
        },
        error: function() {
            alert('Error sending email.');
        }
    });
}

// Handle email form submission
$('#composeEmailForm').on('submit', function(e) {
    e.preventDefault();
    const recipient = $('#recipientEmail').val();
    const subject = $('#emailSubject').val();
    const body = $('#emailBody').val();
    sendEmail(recipient, subject, body);
});