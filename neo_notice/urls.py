from django.urls import path, include

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("notices", views.get_notices, name="notices"),
    path("login", views.views_login, name = "login"),
    path("logout", views.views_logout, name = "logout"),
    path("signup", views.views_signup, name = "signup")
]
