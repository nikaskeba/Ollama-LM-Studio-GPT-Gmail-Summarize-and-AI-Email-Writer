from flask import Flask, render_template, jsonify, request
from email.mime.text import MIMEText
import smtplib
from email_service import get_last_10_emails, delete_email_from_gmail, extract_unsubscribe_link
from summarizer import summarize_with_llm
from utils import load_existing_summaries, save_summaries, load_email_credentials, email_exists
from rewriteMessage import rewrite_with_llm  # Import the rewrite function
from bs4 import BeautifulSoup
import re
app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")
    # Add the rewrite message route
    # Route to handle rewriting email content with LLM
@app.route('/rewrite_email', methods=['POST'])
def rewrite_email():
    data = request.get_json()  # Get the request data
    message = data.get('message')  # Get the original email body
    role = data.get('role')  # Get the role (e.g., "Rewrite in professional tone")

    if not message or not role:
        return jsonify({"error": "Message and role are required"}), 400

    # Call the LLM to rewrite the message
    rewritten_message = rewrite_with_llm(message, role)

    return jsonify({"rewritten_message": rewritten_message})  # Return the rewritten content
@app.route('/rewrite_message', methods=['POST'])
def rewrite_message():
    data = request.get_json()
    print(f"Received data: {data}")  # Debugging line to check incoming data

    message = data.get('message')
    role = data.get('role')

    if not message or not role:
        print(f"Missing data: message={message}, role={role}")  # Debugging line
        return jsonify({"error": "Message and role are required"}), 400

    # Call LLM to rewrite message
    rewritten_message = rewrite_with_llm(message, role)

    return jsonify({"rewritten_message": rewritten_message})
@app.route("/load_emails", methods=["GET"])
def load_emails():
    emails = load_email_credentials()  # Load email credentials from JSON
    return jsonify(emails)
@app.route("/load_summaries", methods=["GET"])
def load_summaries():
    summaries = load_existing_summaries()  # Load existing summaries from the JSON file
    return jsonify(summaries)

@app.route("/fetch_latest_emails", methods=["GET"])
def fetch_latest_emails():
    emails = load_email_credentials()  # Load email credentials
    all_summaries = load_existing_summaries()  # Load existing summaries from summaries.json

    new_summaries = []  # List to hold newly fetched and summarized emails

    for email_account in emails:
        email = email_account['email']
        password = email_account['password']

        # Fetch the last 5 emails from the email account without summarizing them
        latest_summaries = get_last_10_emails(email, password)[:5]

        for summary in latest_summaries:
            summary["account"] = email  # Add account information to the summary

            # Check if the email already exists in summaries.json
            if not email_exists(all_summaries, summary["email_id"]):
                # If the email does not exist, it's a new email, summarize it
                llm_summary = summarize_with_llm(summary['subject'], summary['original_body'])
                summary['summary'] = llm_summary  # Update the summary with the LLM result

                # Append the new summary to the new_summaries list
                new_summaries.append(summary)
                # Also append it to all_summaries to be saved
                all_summaries.append(summary)

    # Save the updated summaries (including new emails) back to summaries.json
    save_summaries(all_summaries)

    # Return the new summaries (those that were not in summaries.json), already sorted by date in get_last_10_emails
    return jsonify(new_summaries)

@app.route("/delete_email", methods=["POST"])
def delete_email():
    email_id = request.json.get('email_id')
    account = request.json.get('account')  # Added to get the account info

    # Load existing summaries
    all_summaries = load_existing_summaries()

    # Find the email details by email_id
    email_to_delete = next((email for email in all_summaries if email["email_id"] == email_id), None)

    if not email_to_delete:
        return jsonify({"error": "Email not found."}), 404

    # Find the corresponding account credentials
    email_credentials = load_email_credentials()
    account_credentials = next((cred for cred in email_credentials if cred["email"] == account), None)

    if not account_credentials:
        return jsonify({"error": "Account credentials not found."}), 404

    # Attempt to delete the email from Gmail
    if delete_email_from_gmail(account_credentials["email"], account_credentials["password"], email_id):
        # If Gmail deletion is successful, remove it from summaries.json
        updated_summaries = [summary for summary in all_summaries if summary["email_id"] != email_id]
        save_summaries(updated_summaries)
        return jsonify({"success": True, "message": "Email deleted successfully."})
    else:
        return jsonify({"error": "Failed to delete the email from Gmail."}), 500


@app.route("/send_email", methods=["POST"])
def send_email():
    data = request.get_json()
    sender_email = data.get('sender')  # The email account selected by the user
    recipient_email = data.get('recipient')
    subject = data.get('subject')
    body = data.get('body')

    if not sender_email or not recipient_email or not subject or not body:
        return jsonify({"error": "All fields are required"}), 400

    # Find the sender email's credentials (email and password)
    email_credentials = load_email_credentials()
    sender_credentials = next((cred for cred in email_credentials if cred["email"] == sender_email), None)

    if not sender_credentials:
        return jsonify({"error": "Sender email not found"}), 404

    try:
        sender_password = sender_credentials['password']  # Get password (was 'app_password' before)

        # Create the email message
        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = sender_email
        msg['To'] = recipient_email

        # Send the email using Gmail SMTP
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, recipient_email, msg.as_string())
        server.quit()

        return jsonify({"success": True, "message": "Email sent successfully!"}), 200
    except KeyError:
        return jsonify({"error": "Invalid credentials structure, missing 'password'"}), 500
    except Exception as e:
        print(f"Failed to send email: {e}")
        return jsonify({"error": "Failed to send email"}), 500

# Existing routes and send_email logic ...
if __name__ == "__main__":
    app.run(debug=True, port=5001)