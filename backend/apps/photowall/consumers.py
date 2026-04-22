import json

from channels.generic.websocket import AsyncWebsocketConsumer


class PhotoWallConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.slug = self.scope["url_route"]["kwargs"]["slug"]
        self.group_name = f"photowall_{self.slug}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def new_media(self, event):
        # event["media"] doit déjà être JSON-serializable
        await self.send(text_data=json.dumps({"type": "new_media", "media": event["media"]}))

