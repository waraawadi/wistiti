from django.urls import path

from .consumers import PhotoWallConsumer

websocket_urlpatterns = [
    path("ws/photowall/<slug:slug>/", PhotoWallConsumer.as_asgi()),
]
