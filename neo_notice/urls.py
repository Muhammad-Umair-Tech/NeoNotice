from django.urls import path, include

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("notices", views.get_notices, name="notices")
]
