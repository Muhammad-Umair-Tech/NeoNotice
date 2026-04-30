from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    def __str__(self):
        return f"{self.id}. {self.username}"

class Notice(models.Model):
    creator = models.ForeignKey(User, null=True, on_delete=models.SET_NULL, related_name="notices")
    body = models.TextField(max_length=1000)
    posted_at = models.DateTimeField(auto_now_add=True)
    is_live = models.BooleanField(default=True)

    def __str__(self):
        body_to_show = self.body if len(self.body) < 20 else f"{self.body[:20]}..."
        return f"\"{body_to_show}\" by {self.creator} at {self.posted_at}"

