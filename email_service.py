from datetime import datetime, timedelta
import imaplib
import email
from email.header import decode_header
from bs4 import BeautifulSoup
from utils import remove_blank_lines
import re

def extract_unsubscribe_link(email_body):
    """Extract the unsubscribe link from the email body."""
    soup = BeautifulSoup(email_body, 'html.parser')
    unsubscribe_link = None

    # Look for 'unsubscribe' links in <a> tags
    for a in soup.find_all('a', href=True):
        if 'unsubscribe' in a.text.lower() or 'unsubscribe' in a['href'].lower():
            unsubscribe_link = a['href']
            break

    # If no unsubscribe link in HTML, try plain text
    if not unsubscribe_link:
        match = re.search(r'(https?://[^\s]+)', email_body)
        if match and 'unsubscribe' in match.group(1).lower():
            unsubscribe_link = match.group(1)

    return unsubscribe_link

def get_last_10_emails(username, password):
    """Fetch the last 10 emails from the user's Gmail inbox and return them sorted from newest to oldest."""
    imap = imaplib.IMAP4_SSL("imap.gmail.com")
    imap.login(username, password)
    imap.select("inbox")

    date_since = (datetime.now() - timedelta(days=30)).strftime("%d-%b-%Y")
    status, messages = imap.search(None, f'SINCE {date_since}')
    email_ids = messages[0].split()[-10:]  # Fetch the latest 10 email IDs
    email_ids = email_ids[::-1]  # Reverse to get the newest emails first

    summaries = []

    for email_id in email_ids:
        status, msg_data = imap.fetch(email_id, "(RFC822)")
        for response_part in msg_data:
            if isinstance(response_part, tuple):
                msg = email.message_from_bytes(response_part[1])
                subject, encoding = decode_header(msg["Subject"])[0]
                if isinstance(subject, bytes):
                    subject = subject.decode(encoding if encoding else "utf-8")

                from_, encoding = decode_header(msg.get("From"))[0]
                if isinstance(from_, bytes):
                    from_ = from_.decode(encoding if encoding else "utf-8")

                date_tuple = email.utils.parsedate_tz(msg["Date"])
                if date_tuple:
                    received_date = datetime.fromtimestamp(email.utils.mktime_tz(date_tuple))

                plain_text_body = None
                html_body = None

                if msg.is_multipart():
                    for part in msg.walk():
                        content_type = part.get_content_type()
                        if content_type == "text/plain":
                            plain_text_body = part.get_payload(decode=True).decode('utf-8', errors='replace')
                        elif content_type == "text/html":
                            html_body = part.get_payload(decode=True).decode('utf-8', errors='replace')
                else:
                    plain_text_body = msg.get_payload(decode=True).decode('utf-8', errors='replace') if msg.get_content_type() == "text/plain" else None
                    html_body = msg.get_payload(decode=True).decode('utf-8', errors='replace') if msg.get_content_type() == "text/html" else None

                cleaned_body = remove_blank_lines(plain_text_body or BeautifulSoup(html_body, 'html.parser').get_text() if html_body else '')

                # Extract the unsubscribe link from the email body
                unsubscribe_link = extract_unsubscribe_link(html_body or plain_text_body or '')

                summaries.append({
                    "email_id": email_id.decode(),
                    "from_email": from_,
                    "subject": subject,
                    "original_body": cleaned_body,
                    "received_date": received_date.strftime("%Y-%m-%d %H:%M:%S"),
                    "unsubscribe_link": unsubscribe_link  # Add the unsubscribe link
                })

    # Sort emails from newest to oldest based on 'received_date'
    summaries = sorted(summaries, key=lambda x: x['received_date'], reverse=True)

    imap.logout()
    return summaries

def delete_email_from_gmail(username, password, email_id):
    imap = imaplib.IMAP4_SSL("imap.gmail.com")
    imap.login(username, password)
    imap.select("inbox")

    try:
        status, messages = imap.search(None, f'UID {email_id}')
        email_uids = messages[0].split()

        if email_uids:
            imap.store(email_uids[0], '+FLAGS', '\\Deleted')
            imap.expunge()
            imap.logout()
            return True
        else:
            imap.logout()
            return False
    except Exception as e:
        print(f"Error deleting email from Gmail: {e}")
        imap.logout()
        return False