import pytest


@pytest.fixture
def api_client():
    from rest_framework.test import APIClient

    return APIClient()


@pytest.fixture(autouse=True)
def _celery_eager_settings(settings):
    # Évite toute dépendance Redis/Celery pendant les tests.
    settings.CELERY_TASK_ALWAYS_EAGER = True
    settings.CELERY_TASK_EAGER_PROPAGATES = True
    settings.CELERY_RESULT_BACKEND = "cache+memory://"
    settings.CELERY_BROKER_URL = "memory://"


@pytest.fixture(autouse=True)
def _test_cache_settings(settings):
    # Évite Redis pendant les tests (ratelimit + cache API).
    settings.CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "pytest",
        }
    }

    settings.CHANNEL_LAYERS = {
        "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}
    }

