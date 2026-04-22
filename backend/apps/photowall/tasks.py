from celery import shared_task


@shared_task
def celery_heartbeat():
    """Tâche légère pour valider Celery / beat (à remplacer par du métier)."""
    return "ok"
