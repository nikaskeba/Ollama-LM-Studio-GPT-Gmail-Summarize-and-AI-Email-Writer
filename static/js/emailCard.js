function displaySummaries(data) {
    const summaryContainer = document.getElementById('summaryResults');
    summaryContainer.innerHTML = '';

    data.forEach(item => {
        const card = document.createElement('div');
        card.classList.add('card', 'mb-3');
        card.innerHTML = `
            <div class="card-body">
                <h5 class="card-title">[${item.account}] ${item.subject}</h5>
                <span class="text-muted small">From: ${item.from_email}</span><br>
                <span class="text-muted small">Received: ${item.received_date}</span>
                <p class="card-text">${item.summary}</p>
                <a href="${item.unsubscribe_link}" target="_blank" class="btn btn-warning">Unsubscribe</a>
                <button class="btn btn-danger ms-2 delete-email-btn" data-email-id="${item.email_id}">Delete Email</button>
                <button class="btn btn-secondary mt-2" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${item.email_id}" aria-expanded="false" aria-controls="collapse${item.email_id}">
                    Show Original Emailx
                </button>
                <div class="collapse mt-2" id="collapse${item.email_id}">
                    <div class="card card-body">
                        <pre>${item.original_body}</pre>
                    </div>
                </div>
            </div>
        `;

        summaryContainer.appendChild(card);
    });
}