import json
from urllib import error, request

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.core.mail.backends.base import BaseEmailBackend
from django.template.loader import render_to_string
from django.utils.html import strip_tags


def send_templated_email(*, subject: str, template_name: str, context: dict, recipient_list: list[str]) -> int:
    text_body = render_to_string(f"emails/{template_name}.txt", context).strip()
    html_body = render_to_string(f"emails/{template_name}.html", context).strip()
    if not text_body:
        text_body = strip_tags(html_body)

    message = EmailMultiAlternatives(
        subject=subject,
        body=f"{text_body}\n",
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=recipient_list,
    )
    message.attach_alternative(html_body, "text/html")
    return message.send(fail_silently=False)


class ResendEmailBackend(BaseEmailBackend):
    api_url = "https://api.resend.com/emails"

    def send_messages(self, email_messages):
        if not email_messages:
            return 0
        if not settings.RESEND_API_KEY:
            if self.fail_silently:
                return 0
            raise ValueError("RESEND_API_KEY is required for ResendEmailBackend.")

        sent_count = 0
        for message in email_messages:
            payload = {
                "from": message.from_email or settings.DEFAULT_FROM_EMAIL,
                "to": list(message.to),
                "subject": message.subject,
                "text": message.body,
            }
            if message.cc:
                payload["cc"] = list(message.cc)
            if message.bcc:
                payload["bcc"] = list(message.bcc)
            html_alternatives = [
                content
                for content, mimetype in getattr(message, "alternatives", [])
                if mimetype == "text/html"
            ]
            if html_alternatives:
                payload["html"] = html_alternatives[-1]

            req = request.Request(
                self.api_url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                method="POST",
            )
            try:
                with request.urlopen(req, timeout=10) as response:
                    if 200 <= response.status < 300:
                        sent_count += 1
                    elif not self.fail_silently:
                        raise ValueError(f"Resend email request failed with status {response.status}.")
            except (error.URLError, TimeoutError, ValueError):
                if not self.fail_silently:
                    raise
        return sent_count
