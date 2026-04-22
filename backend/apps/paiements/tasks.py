from celery import shared_task
from django.core.mail import send_mail


@shared_task
def send_payment_confirmation_email(to_email: str, plan_name: str, expires_at_iso: str):
    send_mail(
        subject=f"Paiement confirmé — {plan_name}",
        message=f"Votre plan {plan_name} est activé jusqu'au {expires_at_iso}.",
        from_email=None,
        recipient_list=[to_email],
        fail_silently=True,
    )
    return "ok"

